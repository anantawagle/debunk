import subprocess
import json
import tempfile
import shutil
import os
import cv2
from transformers import pipeline
from PIL import Image

# Set this to the full path of your downloaded c2patool.exe
C2PA_TOOL_PATH = r"C:\Users\anant\Downloads\c2patool-v0.26.7-x86_64-pc-windows-msvc\c2patool\c2patool.exe"

detector = pipeline("image-classification", model="Ateeqq/ai-vs-human-image-detector")
text_detector = pipeline("text-classification", model="Hello-SimpleAI/chatgpt-detector-roberta")

AI_LABELS = ["ai", "generated", "artificial", "fake"]

def check_c2pa_metadata(image_path: str):
    try:
        # Run c2patool CLI to get JSON manifest
        result = subprocess.run(
            [C2PA_TOOL_PATH, image_path],
            capture_output=True,
            text=True,
            check=True
        )
        manifest_json = json.loads(result.stdout)
        indicators = []

        # Traverse manifests
        for mid, manifest in manifest_json.get("manifests", {}).items():
            for assertion in manifest.get("assertions", []):
                if assertion.get("label") in ["c2pa.actions", "c2pa.actions.v2"]:
                    for action in assertion.get("data", {}).get("actions", []):
                        description = (action.get("description") or "").lower()
                        source_type = (action.get("digitalSourceType") or "").lower()
                        if action.get("action") == "c2pa.created" or "algorithmic" in source_type or "generative ai" in description:
                            indicators.append({
                                "manifest": mid,
                                "action": action.get("action"),
                                "description": action.get("description"),
                                "source_type": action.get("digitalSourceType")
                            })

        if indicators:
            return True, {"indicators": indicators}

        return False, {"reason": "C2PA present but no AI indicators found"}
    except subprocess.CalledProcessError as e:
        return False, {"reason": f"C2PA CLI error: {e.stderr}"}
    except Exception as e:
        return False, {"reason": f"Unexpected error: {str(e)}"}

def check_with_ml(image_path: str):
    try:
        results = detector(image_path)
        ai_score = 0.0
        for r in results:
            if any(x in r["label"].lower() for x in AI_LABELS):
                ai_score = r["score"]
                break
        return ai_score > 0.7, round(ai_score, 4)
    except Exception as e:
        print(f"ML detection error: {e}")
        return False, 0.0

def analyze_image(image_path: str):
    is_ai_meta, meta_details = check_c2pa_metadata(image_path)
    if is_ai_meta:
        return {
            "is_ai_generated": True,
            "confidence_score": 0.99,
            "model_used": "C2PA",
            "detection_details": json.dumps(meta_details)
        }

    is_ai_ml, ai_prob = check_with_ml(image_path)
    return {
        "is_ai_generated": is_ai_ml,
        "confidence_score": ai_prob if is_ai_ml else 1 - ai_prob,
        "model_used": "ML",
        "detection_details": json.dumps({"note": "No verified AI signature found in metadata"})
    }

def check_with_ml_video(video_path: str):
    cap = cv2.VideoCapture(video_path)
    ai_scores = []
    frame_count = 0
    while cap.isOpened() and frame_count < 10:
        ret, frame = cap.read()
        if not ret:
            break
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image = Image.fromarray(frame_rgb)
        results = detector(image)
        ai_score = 0.0
        for r in results:
            if any(x in r["label"].lower() for x in AI_LABELS):
                ai_score = r["score"]
                break
        ai_scores.append(ai_score)
        frame_count += 1
    cap.release()
    if ai_scores:
        avg_ai_score = sum(ai_scores) / len(ai_scores)
        return avg_ai_score > 0.7, round(avg_ai_score, 4)
    else:
        return False, 0.0

def analyze_video(video_path: str):
    is_ai_meta, meta_details = check_c2pa_metadata(video_path)
    if is_ai_meta:
        return {
            "is_ai_generated": True,
            "confidence_score": 0.99,
            "model_used": "C2PA",
            "detection_details": json.dumps(meta_details)
        }
    is_ai_ml, ai_prob = check_with_ml_video(video_path)
    return {
        "is_ai_generated": is_ai_ml,
        "confidence_score": ai_prob if is_ai_ml else 1 - ai_prob,
        "model_used": "ML",
        "detection_details": json.dumps({"note": "No verified AI signature found in metadata"})
    }

def check_with_ml_text(text: str):
    result = text_detector(text)[0]
    ai_score = result["score"] if result["label"] == "LABEL_1" else 1 - result["score"]
    return ai_score > 0.7, round(ai_score, 4)

def analyze_text(text: str):
    is_ai_ml, ai_prob = check_with_ml_text(text)
    return {
        "is_ai_generated": is_ai_ml,
        "confidence_score": ai_prob if is_ai_ml else 1 - ai_prob,
        "model_used": "ML",
        "detection_details": json.dumps({"note": "Text analysis using AI detection model"})
    }
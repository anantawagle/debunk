import subprocess
import json
import tempfile
import shutil
import os
import cv2
import torch
import torch.nn as nn
from torchvision import transforms
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights
from PIL import Image
from transformers import pipeline

# Path to the trained model
# The workspace structure is:
# debunk-new/
# ├── backend/
# │   └── Ai-Powered-Deepfake-Detection-main/
# │       └── app/services/
# ├── frontend/
# └── model-training/
#     └── DeepfakeDetector-main/
#         └── models/best_model-v3.pt

# Get the directory where this file is located
_current_dir = os.path.dirname(os.path.abspath(__file__))
# Go up to: app/
_app_dir = os.path.dirname(_current_dir)
# Go up to: Ai-Powered-Deepfake-Detection-main/
_backend_root = os.path.dirname(_app_dir)
# Go up to: debunk-new/ (workspace root)
_workspace_root = os.path.dirname(_backend_root)

# Construct path to model
MODEL_PATH = os.path.join(_workspace_root, 'model-training', 'DeepfakeDetector-main', 'models', 'best_model-v3.pt')

# Debug: Print the model path
print(f"[DEBUG] Model path: {MODEL_PATH}")
print(f"[DEBUG] Model exists: {os.path.exists(MODEL_PATH)}")

# Set this to the full path of your downloaded c2patool.exe
C2PA_TOOL_PATH = r"C:\Users\anant\Downloads\c2patool-v0.26.7-x86_64-pc-windows-msvc\c2patool\c2patool.exe"

# Use HuggingFace pipeline for image detection
detector = pipeline("image-classification", model="Ateeqq/ai-vs-human-image-detector")

AI_LABELS = ["ai", "generated", "artificial", "fake", "computer", "synthetic"]
HUMAN_LABELS = ["human", "real", "authentic", "natural", "original", "photo", "photograph", "actual", "genuine", "true", "hum"]

# Minimum confidence threshold for display
MIN_CONFIDENCE_DISPLAY = 80.0

def _format_confidence(score: float) -> float:
    """Format confidence score - convert to percentage"""
    # Convert to percentage if needed (check if already in percentage)
    if score <= 1.0:
        score = score * 100
    return score

# HuggingFace model for primary image detection - local path
HF_MODEL_PATH = os.path.join(_workspace_root, 'model-training', 'DeepfakeDetector-main', 'models', 'huggingface-ai-detector')

# HuggingFace model name for online fallback
HF_MODEL_NAME = "Ateeqq/ai-vs-human-image-detector"

# Lazy-loaded HuggingFace pipeline
_hf_pipeline = None
_hf_model = None
_hf_processor = None

def get_hf_model_and_processor():
    """Get or create the HuggingFace model and processor (lazy loading from local path)"""
    global _hf_model, _hf_processor
    if _hf_model is None or _hf_processor is None:
        try:
            from transformers import AutoModelForImageClassification, AutoProcessor
            
            # Try local path first
            if os.path.exists(HF_MODEL_PATH):
                print(f"[INFO] Loading HuggingFace model from local path: {HF_MODEL_PATH}")
                _hf_model = AutoModelForImageClassification.from_pretrained(HF_MODEL_PATH)
                _hf_processor = AutoProcessor.from_pretrained(HF_MODEL_PATH)
                print(f"[SUCCESS] HuggingFace model loaded from local path")
            else:
                # Fallback to downloading from HuggingFace
                print(f"[WARNING] Local model not found, downloading from HuggingFace...")
                from transformers import pipeline
                global _hf_pipeline
                _hf_pipeline = pipeline("image-classification", model=HF_MODEL_NAME)
                print(f"[SUCCESS] HuggingFace model '{HF_MODEL_NAME}' loaded from online")
        except Exception as e:
            print(f"[ERROR] Failed to load HuggingFace model: {e}")
            _hf_model = None
            _hf_processor = None
    return _hf_model, _hf_processor


def load_custom_model(model_path: str):
    """
    Load the custom trained EfficientNet-B0 model for deepfake detection.
    The model was trained to classify images as FAKE (class 1) or REAL (class 0).
    """
    print(f"[DEBUG] Attempting to load model from: {model_path}")
    
    if not os.path.exists(model_path):
        # Try alternative paths
        alternative_paths = [
            model_path,
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'model-training', 'DeepfakeDetector-main', 'models', 'best_model-v3.pt'),
            os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'model-training', 'DeepfakeDetector-main', 'models', 'best_model-v3.pt'),
            'model-training/DeepfakeDetector-main/models/best_model-v3.pt',
            '../model-training/DeepfakeDetector-main/models/best_model-v3.pt',
            '../../model-training/DeepfakeDetector-main/models/best_model-v3.pt',
            '../../../model-training/DeepfakeDetector-main/models/best_model-v3.pt',
        ]
        
        for alt_path in alternative_paths:
            if os.path.exists(alt_path):
                model_path = alt_path
                print(f"[DEBUG] Found model at alternative path: {model_path}")
                break
        else:
            print(f"[ERROR] Model file not found at: {model_path}")
            print(f"[ERROR] Searched paths: {alternative_paths}")
            raise FileNotFoundError(f"Model file not found: {model_path}")
    
    try:
        # Load EfficientNet-B0 with ImageNet weights as base
        weights = EfficientNet_B0_Weights.IMAGENET1K_V1
        model = efficientnet_b0(weights=weights)
        
        # Replace the classifier with our custom head (same architecture as trained)
        in_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(0.4),
            nn.Linear(in_features, 2)
        )
        
        # Load the trained weights
        model.load_state_dict(torch.load(model_path, map_location='cpu'))
        model.eval()
        
        # Determine device
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model = model.to(device)
        
        print(f"[SUCCESS] Custom model loaded successfully from {model_path}")
        print(f"[INFO] Using device: {device}")
        
        return model, device
    except Exception as e:
        print(f"[ERROR] Error loading custom model: {e}")
        raise

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

# def check_with_ml(image_path: str):
#     try:
#         results = detector(image_path)
#         ai_score = 0.0
#         for r in results:
#             if any(x in r["label"].lower() for x in AI_LABELS):
#                 ai_score = r["score"]
#                 break
#         return ai_score > 0.7, round(ai_score, 4)
#     except Exception as e:
#         print(f"ML detection error: {e}")
#         return False, 0.0

# Custom model is only used for video detection
# Commented out to use only HuggingFace pipeline for images
# LOCAL_MODEL, DEVICE = load_custom_model(MODEL_PATH)

# Placeholder for video detection - will be loaded when needed
LOCAL_MODEL = None
DEVICE = None

# Preprocessing transform (EfficientNet expects 224x224)
preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def check_with_huggingface(image_path: str):
    """
    Check image using the HuggingFace model (Ateeqq/ai-vs-human-image-detector).
    Uses local model if available, otherwise downloads from HuggingFace.
    This is the primary model for image detection.
    Returns (is_ai, confidence_score)
    """
    try:
        model, processor = get_hf_model_and_processor()
        
        print(f"[DEBUG] HuggingFace model: {model is not None}, processor: {processor is not None}")
        
        if model is None or processor is None:
            print("[DEBUG] HuggingFace model not loaded, returning None to use fallback")
            return None, None  # Signal that we should use fallback
        
        # Load and preprocess image
        from PIL import Image
        image = Image.open(image_path).convert("RGB")
        
        # Process image
        inputs = processor(images=image, return_tensors="pt")
        
        # Get predictions
        with torch.no_grad():
            outputs = model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
            probs = probs[0].tolist()
        
        print(f"[DEBUG] Raw model probabilities: {probs}")
        
        # Get all labels
        if hasattr(model, 'config') and hasattr(model.config, 'id2label'):
            id2label = model.config.id2label
            print(f"[DEBUG] Model labels: {id2label}")
        else:
            # Default labels for this model
            id2label = {0: 'ai', 1: 'human'}
        
        # Find AI label score - simplified logic
        # Assume class 0 is AI/Generated, class 1 is Human/Real
        # This is a common convention for AI detection models
        ai_score = probs[0] if len(probs) > 0 else 0.0
        human_score = probs[1] if len(probs) > 1 else 0.0
        
        # Determine which class has higher probability
        is_ai = ai_score > human_score
        # Use the probability of whichever class is more likely
        confidence = max(ai_score, human_score)
        
        print(f"[DEBUG] AI score: {ai_score}, Human score: {human_score}")
        print(f"[DEBUG] Final: is_ai={is_ai}, confidence={confidence}")
        
        return is_ai, round(confidence, 4)
        
    except Exception as e:
        print(f"[ERROR] HuggingFace model detection error: {e}")
        return None, None  # Signal that we should use fallback

def check_with_ml(image_path: str):
    try:
        print(f"[DEBUG] Running detector on: {image_path}")
        results = detector(image_path)
        print(f"[DEBUG] ALL Detector results: {results}")
        
        ai_score = 0.0
        human_score = 0.0
        
        # First, look for both AI and human labels in all results
        for r in results:
            label = r["label"].lower()
            score = r["score"]
            print(f"[DEBUG] Checking label: '{label}', score: {score}")
            
            # Check for AI labels
            if any(x in label for x in AI_LABELS):
                ai_score = max(ai_score, score)
                print(f"[DEBUG] Found AI label match: '{label}', score: {score}")
            
            # Check for human labels
            if any(x in label for x in HUMAN_LABELS):
                human_score = max(human_score, score)
                print(f"[DEBUG] Found human label match: '{label}', score: {score}")
        
        print(f"[DEBUG] Raw AI score: {ai_score}, Raw Human score: {human_score}")
        
        # Determine classification based on which score is higher
        if human_score > ai_score:
            # More likely human - use human score, or default to 100%
            display_score = human_score if human_score > 0 else 1.0
            print(f"[DEBUG] Classification: Human (confidence: {display_score})")
            return False, round(display_score, 4)
        elif ai_score > 0:
            # More likely AI - use AI score
            display_score = ai_score
            print(f"[DEBUG] Classification: AI (confidence: {display_score})")
            return True, round(display_score, 4)
        else:
            # No clear match - default to human with 100% confidence
            print(f"[DEBUG] No clear match, defaulting to Human")
            return False, 1.0  # 100% human confidence
            
    except Exception as e:
        print(f"[ERROR] ML detection error: {e}")
        import traceback
        traceback.print_exc()
        return False, 0.0

def analyze_image(image_path: str):
    """
    Analyze image for AI generation detection.
    
    Priority:
    1. C2PA Metadata check (fast, reliable for AI-generated images with metadata)
    2. HuggingFace model (detector pipeline) - primary for images
    
    Videos use the custom EfficientNet-B0 model.
    """
    print(f"[DEBUG] analyze_image called with path: {image_path}")
    print(f"[DEBUG] File exists: {os.path.exists(image_path)}")
    
    # Step 1: Check C2PA metadata
    is_ai_meta, meta_details = check_c2pa_metadata(image_path)
    print(f"[DEBUG] C2PA check result: is_ai={is_ai_meta}, details={meta_details}")
    if is_ai_meta:
        return {
            "is_ai_generated": True,
            "confidence_score": 0.99,
            "model_used": "C2PA Metadata",
            "detection_details": json.dumps(meta_details)
        }

    # Step 2: Use detector pipeline for ML detection
    print("[DEBUG] Proceeding to ML model check...")
    is_ai_ml, ai_prob = check_with_ml(image_path)
    print(f"[DEBUG] ML model result: is_ai={is_ai_ml}, prob={ai_prob}")
    
    # Always return the ML result, regardless of confidence
    confidence = _format_confidence(ai_prob)
    print(f"[DEBUG] Formatted confidence: {confidence}")
    return {
        "is_ai_generated": is_ai_ml,
        "confidence_score": confidence,
        "model_used": "ML Model",
        "detection_details": json.dumps({"note": "Ateeqq/ai-vs-human-image-detector"})
    }

def check_with_ml_video(video_path: str):
    """
    Analyze video using the HuggingFace pipeline model.
    Extracts frames from the video and analyzes each frame.
    Returns average AI probability across all sampled frames.
    """
    try:
        print(f"[DEBUG] Starting video analysis for: {video_path}")
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            print(f"[ERROR] Could not open video file: {video_path}")
            return False, 0.0
        
        ai_scores = []
        
        # Get video properties
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        print(f"[DEBUG] Video properties - Total frames: {total_frames}, FPS: {fps}")
        
        if total_frames <= 0 or fps <= 0:
            print(f"[ERROR] Invalid video properties")
            cap.release()
            return False, 0.0
        
        # Sample up to 10 frames evenly spaced throughout the video
        num_frames_to_sample = min(10, total_frames)
        frame_indices = [int(i * total_frames / num_frames_to_sample) for i in range(num_frames_to_sample)]
        
        print(f"[DEBUG] Sampling frames at indices: {frame_indices}")
        
        for frame_idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            
            if not ret:
                print(f"[WARN] Could not read frame at index {frame_idx}")
                continue
            
            # Convert BGR to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image = Image.fromarray(frame_rgb)
            
            # Save frame to temp file for HuggingFace pipeline
            import tempfile
            temp_file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
            image.save(temp_file.name)
            temp_file.close()
            
            # Run through HuggingFace detector
            results = detector(temp_file.name)
            print(f"[DEBUG] Frame {frame_idx} detector results: {results}")
            
            # Get AI score
            frame_ai_score = 0.0
            for r in results:
                label = r["label"].lower()
                if any(x in label for x in AI_LABELS):
                    frame_ai_score = r["score"]
                    break
            
            # If no AI label found, use 1 - highest score as human confidence
            if frame_ai_score == 0.0 and results:
                frame_ai_score = 1.0 - results[0]["score"]
            
            ai_scores.append(frame_ai_score)
            print(f"[DEBUG] Frame {frame_idx}: AI probability = {frame_ai_score:.4f}")
            
            # Clean up temp file
            try:
                os.unlink(temp_file.name)
            except:
                pass
        
        cap.release()
        
        if ai_scores:
            avg_ai_score = sum(ai_scores) / len(ai_scores)
            print(f"[DEBUG] Average AI probability: {avg_ai_score:.4f}")
            return avg_ai_score > 0.5, round(avg_ai_score, 4)
        else:
            print(f"[WARN] No frames could be analyzed")
            return False, 0.0
            
    except Exception as e:
        print(f"[ERROR] Video ML detection error: {e}")
        return False, 0.0

def analyze_video(video_path: str):
    """
    Analyze video for deepfake detection.
    Process:
    1. First check C2PA metadata for AI indicators
    2. If no metadata found, analyze frames using custom trained model
    Uses the same EfficientNet-B0 model as image detection.
    """
    # Step 1: Check C2PA metadata (extract first frame for metadata check)
    try:
        # Try to extract a frame for C2PA metadata check
        cap = cv2.VideoCapture(video_path)
        if cap.isOpened():
            ret, frame = cap.read()
            if ret:
                # Save frame temporarily for C2PA check
                temp_frame_path = video_path + '.jpg'
                cv2.imwrite(temp_frame_path, frame)
                
                is_ai_meta, meta_details = check_c2pa_metadata(temp_frame_path)
                
                # Clean up temp file
                if os.path.exists(temp_frame_path):
                    os.remove(temp_frame_path)
                
                if is_ai_meta:
                    cap.release()
                    return {
                        "is_ai_generated": True,
                        "confidence_score": 0.99,
                        "model_used": "C2PA Metadata",
                        "detection_details": json.dumps(meta_details)
                    }
            cap.release()
    except Exception as e:
        print(f"[WARN] C2PA metadata check failed: {e}")
    
    # Step 2: Analyze video frames using custom model
    try:
        is_ai_ml, ai_prob = check_with_ml_video(video_path)
        confidence = _format_confidence(ai_prob if is_ai_ml else 1 - ai_prob)
        return {
            "is_ai_generated": is_ai_ml,
            "confidence_score": confidence,
            "model_used": "ML Model",
            "detection_details": json.dumps({"note": "Video analysis (10 frames sampled)"})
        }
    except Exception as e:
        print(f"[ERROR] Video analysis failed: {e}")
        confidence = _format_confidence(0.5)
        return {
            "is_ai_generated": False,
            "confidence_score": confidence,
            "model_used": "ML Model",
            "detection_details": json.dumps({"error": str(e)})
        }

# Text detection functions are commented out
# def check_with_ml_text(text: str):
#     result = text_detector(text)[0]
#     ai_score = result["score"] if result["label"] == "LABEL_1" else 1 - result["score"]
#     return ai_score > 0.7, round(ai_score, 4)

# def analyze_text(text: str):
#     is_ai_ml, ai_prob = check_with_ml_text(text)
#     return {
#         "is_ai_generated": is_ai_ml,
#         "confidence_score": ai_prob if is_ai_ml else 1 - ai_prob,
#         "model_used": "ML",
#         "detection_details": json.dumps({"note": "Text analysis using AI detection model"})
#     }
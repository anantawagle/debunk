"""
Script to download HuggingFace model and save it locally.
Run this once to download the model - it will work offline afterwards.
"""
from huggingface_hub import snapshot_download
import os

# Model to download
MODEL_NAME = "Ateeqq/ai-vs-human-image-detector"

# Local path to save model
SAVE_DIR = os.path.join(os.path.dirname(__file__), "models", "huggingface-ai-detector")

def download_model():
    print(f"Downloading model: {MODEL_NAME}")
    print(f"Saving to: {SAVE_DIR}")
    
    # Create directory if it doesn't exist
    os.makedirs(SAVE_DIR, exist_ok=True)
    
    # Download complete model files using snapshot_download
    print("Downloading all model files...")
    snapshot_download(
        repo_id=MODEL_NAME,
        local_dir=SAVE_DIR,
        local_dir_use_symlinks=False  # Don't use symlinks, actually download files
    )
    
    print(f"\nModel downloaded successfully!")
    print(f"Model location: {SAVE_DIR}")
    
    # List downloaded files
    print("\nDownloaded files:")
    for f in os.listdir(SAVE_DIR):
        fpath = os.path.join(SAVE_DIR, f)
        size = os.path.getsize(fpath) / (1024 * 1024)  # MB
        print(f"  - {f} ({size:.2f} MB)")
    
    print("\nYou can now use this model offline!")

if __name__ == "__main__":
    download_model()

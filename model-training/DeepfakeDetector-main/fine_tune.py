"""
Fine-tuning script for Deepfake Detection Model
Loads the pre-trained model and continues training on a new dataset
for improved accuracy on domain-specific data.
"""

import os
import yaml
import torch
import pytorch_lightning as pl
from torch.utils.data import DataLoader
from torchvision import transforms
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights

from datasets.hybrid_loader import HybridDeepfakeDataset
from lightning_modules.detector import DeepfakeDetector
from pytorch_lightning.callbacks import ModelCheckpoint, EarlyStopping

# === Load YAML config ===
with open("config.yaml") as f:
    cfg = yaml.safe_load(f)

# Set defaults for missing config values
cfg.setdefault("lr", 0.0001)
cfg.setdefault("batch_size", 4)
cfg.setdefault("num_epochs", 10)
cfg.setdefault("fine_tune_lr", 0.00001)
cfg.setdefault("early_stopping_patience", 3)
cfg.setdefault("monitor_metric", "val_loss")
cfg.setdefault("log_every_n_steps", 1)

# === Transforms ===
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

# === Dataset Paths ===
train_sources = [(p, None) for p in cfg["train_paths"]]
val_sources = [(p, None) for p in cfg["val_paths"]]

# Debug: Print the actual paths being used
import os
print("\n=== Debug Info ===")
print(f"Current directory: {os.getcwd()}")
for p in cfg["train_paths"]:
    full_path = os.path.abspath(p)
    print(f"Train path: {full_path}")
    print(f"  Exists: {os.path.exists(full_path)}")
    if os.path.exists(full_path):
        print(f"  Contents: {os.listdir(full_path)}")
for p in cfg["val_paths"]:
    full_path = os.path.abspath(p)
    print(f"Val path: {full_path}")
    print(f"  Exists: {os.path.exists(full_path)}")
    if os.path.exists(full_path):
        print(f"  Contents: {os.listdir(full_path)}")
print("=== End Debug ===\n")

# === Datasets & Loaders ===
train_dataset = HybridDeepfakeDataset(train_sources, transform=transform)
val_dataset = HybridDeepfakeDataset(val_sources, transform=transform)

# Limit dataset size for faster training (use subset)
max_train_samples = cfg.get("max_train_samples", None)  # None means use all
max_val_samples = cfg.get("max_val_samples", None)

if max_train_samples and len(train_dataset) > max_train_samples:
    print(f"Limiting training set from {len(train_dataset)} to {max_train_samples} samples")
    train_dataset.image_paths = train_dataset.image_paths[:max_train_samples]
    train_dataset.labels = train_dataset.labels[:max_train_samples]

if max_val_samples and len(val_dataset) > max_val_samples:
    print(f"Limiting validation set from {len(val_dataset)} to {max_val_samples} samples")
    val_dataset.image_paths = val_dataset.image_paths[:max_val_samples]
    val_dataset.labels = val_dataset.labels[:max_val_samples]

train_loader = DataLoader(train_dataset, batch_size=cfg["batch_size"], shuffle=True, num_workers=0)
val_loader = DataLoader(val_dataset, batch_size=cfg["batch_size"], shuffle=False, num_workers=0)

print(f"Training samples: {len(train_dataset)}")
print(f"Validation samples: {len(val_dataset)}")

# === Load Pre-trained Model ===
MODEL_PATH = "models/best_model-v3.pt"

# Check if pre-trained model exists
if os.path.exists(MODEL_PATH):
    print(f"Loading pre-trained model from: {MODEL_PATH}")
    
    # Load the checkpoint
    checkpoint = torch.load(MODEL_PATH, map_location='cpu')
    
    # Create the base model architecture
    weights = EfficientNet_B0_Weights.IMAGENET1K_V1
    backbone = efficientnet_b0(weights=weights)
    features = backbone.classifier[1].in_features
    backbone.classifier = torch.nn.Sequential(
        torch.nn.Dropout(0.4),
        torch.nn.Linear(features, 2)
    )
    
    # Create the Lightning model
    model = DeepfakeDetector(backbone, lr=cfg["lr"])
    
    # Try to load the state dict
    try:
        # Check if it's a Lightning checkpoint with 'state_dict'
        if 'state_dict' in checkpoint:
            model.load_state_dict(checkpoint['state_dict'])
        else:
            # It's a plain state dict
            model.load_state_dict(checkpoint)
        print("✓ Pre-trained weights loaded successfully!")
    except Exception as e:
        print(f"⚠ Could not load weights directly: {e}")
        print("⚠ Training from scratch with ImageNet pre-trained weights...")
        
        # Fall back to ImageNet pre-trained weights
        model = DeepfakeDetector(backbone, lr=cfg["lr"])
else:
    print(f"⚠ Pre-trained model not found at: {MODEL_PATH}")
    print("⚠ Training from scratch with ImageNet pre-trained weights...")
    
    # Create model with ImageNet pre-trained weights
    weights = EfficientNet_B0_Weights.IMAGENET1K_V1
    backbone = efficientnet_b0(weights=weights)
    features = backbone.classifier[1].in_features
    backbone.classifier = torch.nn.Sequential(
        torch.nn.Dropout(0.4),
        torch.nn.Linear(features, 2)
    )
    model = DeepfakeDetector(backbone, lr=cfg["lr"])

# === Fine-tuning Configuration ===
# Lower learning rate for fine-tuning to avoid catastrophic forgetting
fine_tune_lr = float(cfg.get("fine_tune_lr", 1e-5))  # 10x lower than default
print(f"Using fine-tuning learning rate: {fine_tune_lr}")

# Update the learning rate
model.lr = fine_tune_lr
model.configure_optimizers()

# === Callbacks ===
checkpoint = ModelCheckpoint(
    monitor=cfg.get("monitor_metric", "val_loss"),
    dirpath="models",
    filename="fine_tuned_model",
    save_top_k=1,
    mode="min",
    save_weights_only=False
)

early_stop = EarlyStopping(
    monitor=cfg.get("monitor_metric", "val_loss"),
    patience=cfg.get("early_stopping_patience", 3),
    mode="min"
)

# === Trainer ===
trainer = pl.Trainer(
    max_epochs=cfg["num_epochs"],
    accelerator="gpu" if torch.cuda.is_available() else "cpu",
    callbacks=[checkpoint, early_stop],
    enable_progress_bar=True,
    log_every_n_steps=cfg.get("log_every_n_steps", 1)
)

# === Start Fine-tuning ===
print("\n" + "="*50)
print("Starting Fine-tuning...")
print("="*50)

trainer.fit(model, train_loader, val_loader)

print("\n" + "="*50)
print("Fine-tuning Complete!")
print(f"Model saved to: {checkpoint.best_model_path}")
print("="*50)

"""
Training script for fine-tuning the detection model.

This script trains the full pipeline (backbone + fusion head) on a
labelled dataset of real and AI-generated images.

Usage::

    python scripts/train.py \\
        --data-dir ./dataset \\
        --epochs 20 \\
        --batch-size 32 \\
        --lr 1e-4 \\
        --output checkpoints/best.pt

Dataset layout::

    dataset/
    ├── real/
    │   ├── img001.jpg
    │   └── ...
    └── ai/
        ├── img001.jpg
        └── ...

The handcrafted feature vector is pre-extracted and cached to disk
so that each epoch only needs a forward pass through the backbone.
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config import BACKBONE, DEVICE, INPUT_SIZE, IMAGENET_MEAN, IMAGENET_STD
from models.backbone import Backbone
from models.fusion import FeatureFusion
from pipeline.extractor import FeatureExtractor

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(message)s")
log = logging.getLogger("train")


# -----------------------------------------------------------------------
# Dataset
# -----------------------------------------------------------------------

class ImageDataset(Dataset):
    """Simple image folder dataset with two classes: real=0, ai=1."""

    TRANSFORM = transforms.Compose([
        transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])

    def __init__(self, data_dir: Path, extractor: FeatureExtractor, cache_path: Path | None = None) -> None:
        self.samples: list[tuple[Path, int]] = []
        self.extractor = extractor
        self.cache: dict[str, list[float]] = {}

        if cache_path and cache_path.is_file():
            log.info("Loading cached features from %s", cache_path)
            self.cache = json.loads(cache_path.read_text())

        for label, cls_name in enumerate(["real", "ai"]):
            cls_dir = data_dir / cls_name
            if not cls_dir.is_dir():
                continue
            for img_path in sorted(cls_dir.iterdir()):
                if img_path.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"):
                    self.samples.append((img_path, label))

        log.info("Found %d images (%d real, %d ai)",
                 len(self.samples),
                 sum(1 for _, l in self.samples if l == 0),
                 sum(1 for _, l in self.samples if l == 1))

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int):
        path, label = self.samples[idx]
        key = str(path)

        # Load image
        from PIL import Image
        pil = Image.open(path).convert("RGB")

        # Tensor for backbone
        tensor = self.TRANSFORM(pil)

        # Handcrafted features (with caching)
        if key in self.cache:
            hc = torch.tensor(self.cache[key], dtype=torch.float32)
        else:
            import cv2
            img_bgr = cv2.cvtColor(np.array(pil)[:, :, ::-1].copy(), cv2.COLOR_RGB2BGR)
            hc_vec, _ = self.extractor(img_bgr, path.read_bytes() if path.suffix.lower() in (".jpg", ".jpeg") else None)
            hc = torch.tensor(hc_vec, dtype=torch.float32)
            self.cache[key] = hc.tolist()

        return tensor, hc, torch.tensor(label, dtype=torch.long)


# -----------------------------------------------------------------------
# Training
# -----------------------------------------------------------------------

def train(args: argparse.Namespace) -> None:
    data_dir = Path(args.data_dir)
    cache_path = Path(args.cache_dir) / "features_cache.json" if args.cache_dir else None

    if cache_path:
        cache_path.parent.mkdir(parents=True, exist_ok=True)

    extractor = FeatureExtractor()
    dataset = ImageDataset(data_dir, extractor, cache_path)

    # Save cache
    if cache_path and dataset.cache:
        cache_path.write_text(json.dumps(dataset.cache))
        log.info("Saved feature cache (%d entries)", len(dataset.cache))

    loader = DataLoader(dataset, batch_size=args.batch_size, shuffle=True, num_workers=0)

    # Models
    backbone = Backbone(BACKBONE)
    fusion = FeatureFusion(
        dl_dim=backbone.embed_dim,
        hc_dim=extractor.feature_dim,
    ).to(DEVICE)

    # Optimiser — lower LR for backbone, higher for fusion head
    param_groups = [
        {"params": backbone.parameters(), "lr": args.lr * 0.1},
        {"params": fusion.parameters(), "lr": args.lr},
    ]
    optimizer = optim.AdamW(param_groups, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)
    criterion = nn.CrossEntropyLoss()

    best_acc = 0.0

    for epoch in range(args.epochs):
        backbone.train()
        fusion.train()
        total_loss = 0.0
        correct = 0
        total = 0

        for tensors, hc_feats, labels in loader:
            tensors = tensors.to(DEVICE)
            hc_feats = hc_feats.to(DEVICE)
            labels = labels.to(DEVICE)

            dl_logits, dl_embed = backbone(tensors)
            fused_logits = fusion(dl_embed, hc_feats)

            loss = criterion(fused_logits, labels)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * tensors.size(0)
            preds = fused_logits.argmax(dim=1)
            correct += (preds == labels).sum().item()
            total += tensors.size(0)

        scheduler.step()

        avg_loss = total_loss / total
        acc = correct / total * 100
        log.info("Epoch %d/%d  loss=%.4f  acc=%.1f%%", epoch + 1, args.epochs, avg_loss, acc)

        if acc > best_acc:
            best_acc = acc
            ckpt_path = Path(args.output)
            ckpt_path.parent.mkdir(parents=True, exist_ok=True)
            torch.save({
                "backbone": backbone.state_dict(),
                "fusion": fusion.state_dict(),
                "accuracy": acc,
                "epoch": epoch,
            }, str(ckpt_path))
            log.info("Saved best model → %s (acc=%.1f%%)", ckpt_path, acc)

    log.info("Training complete.  Best accuracy: %.1f%%", best_acc)


# -----------------------------------------------------------------------
# CLI
# -----------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Fine-tune Unmask AI detector")
    parser.add_argument("--data-dir", required=True, help="Root of the image dataset")
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--output", default="checkpoints/best.pt")
    parser.add_argument("--cache-dir", default=None, help="Directory to cache extracted features")
    train(parser.parse_args())


if __name__ == "__main__":
    main()

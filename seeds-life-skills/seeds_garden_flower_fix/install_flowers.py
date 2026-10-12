"""Replace only the 24 flower PNG assets; preserve app code and Firestore data."""
from pathlib import Path
import shutil
root=Path.cwd()
source=Path(__file__).resolve().parent / "assets" / "garden"
target=root / "assets" / "garden"
if not (root / "app" / "garden.jsx").exists() or not (root / "components" / "GardenFlowerAssets.js").exists():
    raise SystemExit("Run from the seeds-life-skills folder after the original garden installer.")
if len(list(source.glob("*.png"))) != 24:
    raise SystemExit("Expected 24 flower images. No changes made.")
target.mkdir(parents=True,exist_ok=True)
for image in source.glob("*.png"):
    shutil.copy2(image,target/image.name)
print("Replaced 24 flower images. Garden code and Firestore data unchanged.")

from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Image.open(root / "assets" / "source" / "sky-canyon-continuous.png").convert("RGB")

# 상·하단이 이어지도록 처음부터 그린 원본을 변형 없이 사용한다.
source.save(root / "assets" / "backgrounds" / "sky-canyon.png", quality=95, optimize=True)

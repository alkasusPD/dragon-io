from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

root = Path(__file__).resolve().parents[1]
output = root / "assets" / "sprites" / "dragon-shadow.png"

shadow = Image.new("RGBA", (128, 64), (0, 0, 0, 0))
draw = ImageDraw.Draw(shadow)
draw.ellipse((18, 22, 110, 48), fill=(0, 0, 0, 150))
shadow = shadow.filter(ImageFilter.GaussianBlur(7))
shadow.save(output, optimize=True)

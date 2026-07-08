from collections import deque
from pathlib import Path
from PIL import Image

SOURCES = {
    "dragon-ignis.png": Path("/Users/monoverse/.codex/generated_images/019f318c-f1da-7082-8507-25ad2363acbc/exec-d375b6ca-97ac-4f89-bfc2-92741744d14a.png"),
    "dragon-lumina.png": Path("/Users/monoverse/.codex/generated_images/019f318c-f1da-7082-8507-25ad2363acbc/exec-85a87720-a25e-4bf5-ba6d-46272be6d1a8.png"),
    "dragon-voltis.png": Path("/Users/monoverse/.codex/generated_images/019f318c-f1da-7082-8507-25ad2363acbc/exec-77c9e43a-f969-4c67-aa59-c60e9210df71.png"),
    "dragon-venora.png": Path("/Users/monoverse/.codex/generated_images/019f318c-f1da-7082-8507-25ad2363acbc/exec-74cfa88f-165d-486e-a616-db0821490d02.png"),
}
OUT = Path("/Users/monoverse/Documents/dragon/Flight/assets/sprites")

def remove_checkerboard(image: Image.Image) -> Image.Image:
    rgb = image.convert("RGB")
    w, h = rgb.size
    pixels = rgb.load()
    candidate = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y]
            if min(r, g, b) > 205 and max(r, g, b) - min(r, g, b) < 20:
                candidate[y * w + x] = 1

    outside = bytearray(w * h)
    queue = deque()
    for x in range(w):
        queue.extend(((x, 0), (x, h - 1)))
    for y in range(h):
        queue.extend(((0, y), (w - 1, y)))
    while queue:
        x, y = queue.popleft()
        i = y * w + x
        if outside[i] or not candidate[i]:
            continue
        outside[i] = 1
        if x: queue.append((x - 1, y))
        if x + 1 < w: queue.append((x + 1, y))
        if y: queue.append((x, y - 1))
        if y + 1 < h: queue.append((x, y + 1))

    rgba = rgb.convert("RGBA")
    out = rgba.load()
    for y in range(h):
        for x in range(w):
            if outside[y * w + x]:
                out[x, y] = (0, 0, 0, 0)
    return rgba

for filename, source in SOURCES.items():
    image = remove_checkerboard(Image.open(source))
    cell = image.width // 12
    top = (image.height - cell) // 2
    image = image.crop((0, top, cell * 12, top + cell))
    image = image.resize((3072, 256), Image.Resampling.LANCZOS)
    image.save(OUT / filename, optimize=True)
    print(filename, image.size, image.getbbox())

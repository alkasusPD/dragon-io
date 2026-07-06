from pathlib import Path
from collections import deque
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

def normalize(source: str, output: str) -> None:
    image = Image.open(ROOT / source).convert("RGBA")
    width, height = image.size
    alpha = image.getchannel("A")
    mask = bytearray(1 if value > 40 else 0 for value in alpha.getdata())
    components = []

    # 생성 이미지의 가상 그리드를 믿지 않고 서로 연결된 실루엣을 직접 찾는다.
    for start in range(width * height):
        if not mask[start]:
            continue
        mask[start] = 0
        queue = deque([start])
        min_x = max_x = start % width
        min_y = max_y = start // width
        area = 0
        while queue:
            index = queue.popleft()
            x, y = index % width, index // width
            area += 1
            min_x, max_x = min(min_x, x), max(max_x, x)
            min_y, max_y = min(min_y, y), max(max_y, y)
            for neighbor in (index - 1, index + 1, index - width, index + width):
                if 0 <= neighbor < width * height and mask[neighbor]:
                    nx = neighbor % width
                    if abs(nx - x) <= 1:
                        mask[neighbor] = 0
                        queue.append(neighbor)
        if area > 1000:
            components.append((min_x, min_y, max_x + 1, max_y + 1, area))

    if len(components) != 12:
        raise RuntimeError(f"Expected 12 sprite silhouettes, found {len(components)}")
    top_row = sorted(
        (box for box in components if (box[1] + box[3]) / 2 < height / 2),
        key=lambda box: (box[0] + box[2]) / 2,
    )
    bottom_row = sorted(
        (box for box in components if (box[1] + box[3]) / 2 >= height / 2),
        key=lambda box: (box[0] + box[2]) / 2,
    )
    if len(top_row) != 6 or len(bottom_row) != 6:
        raise RuntimeError(f"Expected two rows of 6 sprites, found {len(top_row)} and {len(bottom_row)}")
    components = top_row + bottom_row

    max_w = max(box[2] - box[0] for box in components)
    max_h = max(box[3] - box[1] for box in components)
    scale = min(232 / max_w, 232 / max_h)
    frames = []
    for left, top, right, bottom, _ in components:
        sprite = image.crop((left, top, right, bottom))
        sprite = sprite.resize(
            (round(sprite.width * scale), round(sprite.height * scale)),
            Image.Resampling.LANCZOS,
        )
        cell = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
        cell.alpha_composite(sprite, ((256 - sprite.width) // 2, (256 - sprite.height) // 2))
        frames.append(cell)

    # 반투명 보간은 외곽선이 점멸하므로 사용하지 않는다.
    # 생성된 12개의 완전 불투명 핵심 자세를 그대로 정렬한다.
    sheet = Image.new("RGBA", (256 * 12, 256), (0, 0, 0, 0))
    for frame, current in enumerate(frames):
        sheet.alpha_composite(current, (frame * 256, 0))
    sheet.save(ROOT / output, optimize=True)

normalize("assets/source/player-sheet-12-alpha.png", "assets/sprites/dragon-red.png")
normalize("assets/source/enemy-sheet-12-alpha.png", "assets/sprites/wyvern-blue.png")

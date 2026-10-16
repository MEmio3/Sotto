from pathlib import Path
from PIL import Image, ImageDraw
import re, shutil

root = Path(__file__).resolve().parents[1]
assets = root / 'src' / 'assets'
assets.mkdir(parents=True, exist_ok=True)
font = root / 'node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2'
shutil.copyfile(font, assets / 'manrope.woff2')
shutil.copyfile(root / 'node_modules/@fontsource-variable/manrope/LICENSE', assets / 'MANROPE-LICENSE.txt')
image = Image.new('RGBA', (256, 256), (247, 248, 245, 255))
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((3, 3, 252, 252), radius=62, fill=(25, 26, 25, 255))
for i, height in enumerate([36, 80, 124, 80, 36]):
    x = 64 + 28 * i
    draw.rounded_rectangle((x, 128-height//2, x+12, 128+height//2), radius=6, fill=(247, 248, 245, 255))
image.save(assets / 'icon.png')
image.save(assets / 'icon.ico', sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
image.resize((32, 32), Image.Resampling.LANCZOS).save(assets / 'tray.png')
# Commit the requested black-and-white palette, including secondary surfaces.
for name in ['styles.css', 'hud.css']:
    file = root / 'src' / name
    def grey(match):
        value = match.group(1)
        if len(value) not in (6, 8): return match.group(0)
        r, g, b = (int(value[i:i+2], 16) for i in (0,2,4))
        y = round(.2126*r + .7152*g + .0722*b)
        return '#' + f'{y:02x}'*3 + value[6:]
    file.write_text(re.sub(r'#([0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?)\b', grey, file.read_text(encoding='utf-8')), encoding='utf-8')
print('Bundled font, icon and monochrome assets ready.')

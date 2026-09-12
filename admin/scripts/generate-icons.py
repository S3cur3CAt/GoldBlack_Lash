import os
from PIL import Image, ImageDraw, ImageFilter, ImageOps

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
logo_path = os.path.join(base_dir, 'src', 'assets', 'logo.png')
build_dir = os.path.join(base_dir, 'build')
os.makedirs(build_dir, exist_ok=True)

print(f"Loading source logo: {logo_path}")
src_img = Image.open(logo_path).convert('RGBA')

# Target canvas size
SIZE = 1024
RADIUS = 210  # ~20% squircle radius for modern macOS and Windows app icons
BORDER_WIDTH = 26  # Elegant gold border width at 1024x1024

# Create square crop of source image
w, h = src_img.size
min_dim = min(w, h)
left = (w - min_dim) // 2
top = (h - min_dim) // 2
square_logo = src_img.crop((left, top, left + min_dim, top + min_dim)).resize((SIZE, SIZE), Image.Resampling.LANCZOS)

# Create 4x supersampled mask for ultra-crisp rounded corners
SS = 4
ss_size = SIZE * SS
ss_radius = RADIUS * SS

# 1. Supersampled alpha mask for the outer rounded rect
mask_ss = Image.new('L', (ss_size, ss_size), 0)
draw_ss = ImageDraw.Draw(mask_ss)
draw_ss.rounded_rectangle([(0, 0), (ss_size - 1, ss_size - 1)], radius=ss_radius, fill=255)
alpha_mask = mask_ss.resize((SIZE, SIZE), Image.Resampling.LANCZOS)

# 2. Golden border gradient
border_img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
border_draw = ImageDraw.Draw(border_img)

for y in range(SIZE):
    for x in range(SIZE):
        factor = (x + y) / (2.0 * SIZE)
        if factor < 0.5:
            t = factor / 0.5
            r = int(245 * (1 - t) + 212 * t)
            g = int(215 * (1 - t) + 175 * t)
            b = int(110 * (1 - t) + 55 * t)
        else:
            t = (factor - 0.5) / 0.5
            r = int(212 * (1 - t) + 160 * t)
            g = int(175 * (1 - t) + 115 * t)
            b = int(55 * (1 - t) + 15 * t)
        border_draw.point((x, y), fill=(r, g, b, 255))

# Create inner mask for the logo content (inset by BORDER_WIDTH)
inner_ss_mask = Image.new('L', (ss_size, ss_size), 0)
inner_draw_ss = ImageDraw.Draw(inner_ss_mask)
inner_ss_inset = BORDER_WIDTH * SS
inner_ss_radius = max(10, ss_radius - inner_ss_inset)
inner_draw_ss.rounded_rectangle(
    [(inner_ss_inset, inner_ss_inset), (ss_size - 1 - inner_ss_inset, ss_size - 1 - inner_ss_inset)],
    radius=inner_ss_radius,
    fill=255
)
inner_alpha_mask = inner_ss_mask.resize((SIZE, SIZE), Image.Resampling.LANCZOS)

# Create final composite icon
final_icon = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))

# Paste border clipped to outer mask
border_clipped = Image.composite(border_img, Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0)), alpha_mask)
final_icon.paste(border_clipped, (0, 0), border_clipped)

# Paste logo content clipped to inner mask
logo_content = Image.composite(square_logo, Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0)), inner_alpha_mask)
final_icon.paste(logo_content, (0, 0), logo_content)

# Apply final outer mask
final_icon.putalpha(alpha_mask)

# Save master PNG
png_path = os.path.join(build_dir, 'icon.png')
final_icon.save(png_path, 'PNG')
print(f"[OK] Saved master PNG: {png_path} ({SIZE}x{SIZE})")

# Save ICO file with all standard Windows sizes
ico_path = os.path.join(build_dir, 'icon.ico')
final_icon.save(
    ico_path,
    format='ICO',
    sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
)
print(f"[OK] Saved Windows ICO: {ico_path}")

# Save ICNS file for macOS
icns_path = os.path.join(build_dir, 'icon.icns')
final_icon.save(icns_path, format='ICNS')
print(f"[OK] Saved macOS ICNS: {icns_path}")

# Also copy icon.png to admin/public/icon.png and admin/src/assets/icon.png
pub_icon = os.path.join(base_dir, 'public', 'icon.png')
final_icon.save(pub_icon, 'PNG')
src_icon = os.path.join(base_dir, 'src', 'assets', 'icon.png')
final_icon.save(src_icon, 'PNG')
print("[OK] Updated icons in public/ and src/assets/")

#!/usr/bin/env python3
"""
Create PWA icons with classic frog green background and larger Tapo.
"""

from PIL import Image
import os

def replace_background_and_scale(input_path, output_sizes, frog_green=(34, 197, 94)):
    """
    Replace background with frog green and create multiple icon sizes.

    Args:
        input_path: Path to source image (tapo.png)
        output_sizes: Dict of {filename: size} for output icons
        frog_green: RGB tuple for frog green color (default: #22c55e)
    """
    print(f"Loading source image: {input_path}")
    img = Image.open(input_path).convert('RGBA')

    # Get image data
    pixels = img.load()
    width, height = img.size

    # Identify the background color (sample from corners)
    bg_samples = [
        pixels[0, 0],
        pixels[width-1, 0],
        pixels[0, height-1],
        pixels[width-1, height-1]
    ]

    # Use most common corner color as background reference
    # For beige background, we'll target colors similar to it
    print("Replacing beige background with frog green...")

    # Sample the background color from corners
    corner_colors = [
        pixels[5, 5],
        pixels[width-6, 5],
        pixels[5, height-6],
        pixels[width-6, height-6]
    ]
    # Use average of corners as background reference
    bg_r = sum(c[0] for c in corner_colors) // 4
    bg_g = sum(c[1] for c in corner_colors) // 4
    bg_b = sum(c[2] for c in corner_colors) // 4
    print(f"Detected background color: RGB({bg_r}, {bg_g}, {bg_b})")

    # Create new image with frog green background
    new_img = Image.new('RGBA', (width, height), (*frog_green, 255))
    new_pixels = new_img.load()

    # Copy non-background pixels
    # Use color distance threshold from detected background
    threshold = 50  # Adjust sensitivity
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]

            # Calculate color distance from background
            color_dist = ((r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2) ** 0.5

            # Keep pixels that are significantly different from background
            if color_dist > threshold:
                new_pixels[x, y] = (r, g, b, a)
            else:
                # Replace background with frog green
                new_pixels[x, y] = (*frog_green, 255)

    # Now scale up Tapo by finding the bounding box and expanding
    # Find bounds of non-green content
    bbox = new_img.getbbox()
    if bbox:
        print(f"Original Tapo bounds: {bbox}")

        # Crop to Tapo
        tapo_img = new_img.crop(bbox)

        # Calculate new size - make Tapo take up 85% of canvas
        tapo_w, tapo_h = tapo_img.size
        aspect = tapo_w / tapo_h

        target_coverage = 0.85  # Tapo takes up 85% of icon
        if aspect > 1:
            new_tapo_w = int(width * target_coverage)
            new_tapo_h = int(new_tapo_w / aspect)
        else:
            new_tapo_h = int(height * target_coverage)
            new_tapo_w = int(new_tapo_h * aspect)

        # Resize Tapo
        tapo_scaled = tapo_img.resize((new_tapo_w, new_tapo_h), Image.LANCZOS)

        # Center on green background
        final_img = Image.new('RGBA', (width, height), (*frog_green, 255))
        paste_x = (width - new_tapo_w) // 2
        paste_y = (height - new_tapo_h) // 2
        final_img.paste(tapo_scaled, (paste_x, paste_y), tapo_scaled)

        print(f"Scaled Tapo to: {new_tapo_w}x{new_tapo_h} (coverage: {target_coverage*100}%)")
    else:
        final_img = new_img

    # Generate all icon sizes
    print("\nGenerating icon sizes:")
    for filename, size in output_sizes.items():
        if size == (width, height):
            # Save original size directly
            output_path = f'assets/{filename}'
            final_img.save(output_path, 'PNG')
            print(f"  ✓ {filename} ({size[0]}x{size[1]})")
        else:
            # Resize for smaller icons
            resized = final_img.resize(size, Image.LANCZOS)
            output_path = f'assets/{filename}'
            resized.save(output_path, 'PNG')
            print(f"  ✓ {filename} ({size[0]}x{size[1]})")

def main():
    assets_dir = '/home/user/FROGGLE/assets'

    # Frog green from theme color #22c55e
    frog_green = (34, 197, 94)

    # Define all icon sizes needed
    icon_sizes = {
        'tapo-icon-180.png': (180, 180),    # Apple touch icon
        'tapo-icon-192.png': (192, 192),    # PWA standard
        'tapo-icon-512.png': (512, 512),    # PWA large
        'tapo.png': (512, 512),             # Manifest icon
        'tapo-icon.png': (32, 32),          # Favicon
    }

    print("Creating PWA icons with classic frog green background...")
    print(f"Frog green color: RGB{frog_green} (#{frog_green[0]:02x}{frog_green[1]:02x}{frog_green[2]:02x})")
    print()

    # Use tapo.png as source (baby tadpole with beige background)
    source_image = f'{assets_dir}/tapo.png'

    replace_background_and_scale(source_image, icon_sizes, frog_green)

    print("\n✓ Done! All PWA icons created with frog green background.")

if __name__ == '__main__':
    main()

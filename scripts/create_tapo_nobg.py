#!/usr/bin/env python3
"""
Create Tapo image with transparent background (no background).
"""

from PIL import Image
from collections import deque

def create_transparent_background(input_path, output_path):
    """
    Remove background from Tapo image and make it transparent.

    Args:
        input_path: Path to source image (tapo.png)
        output_path: Path to save transparent version
    """
    print(f"Loading source image: {input_path}")
    img = Image.open(input_path).convert('RGBA')

    # Get image data
    pixels = img.load()
    width, height = img.size

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

    # Create new image with transparent background
    new_img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    new_pixels = new_img.load()

    # Use flood fill to mark true background
    print("Detecting background with flood fill...")
    is_background = {}

    # Start flood fill from all 4 corners
    queue = deque([(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)])
    visited = set()

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited or x < 0 or x >= width or y < 0 or y >= height:
            continue

        visited.add((x, y))
        r, g, b, a = pixels[x, y]

        # Calculate distance from detected background color
        color_dist = ((r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2) ** 0.5

        # If close to background color, mark as background and continue flood
        if color_dist < 30:
            is_background[(x, y)] = True
            # Add neighbors to queue
            for nx, ny in [(x+1,y), (x-1,y), (x,y+1), (x,y-1)]:
                if (nx, ny) not in visited:
                    queue.append((nx, ny))

    print(f"Marked {len(is_background)} background pixels")

    # Now process all pixels
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]

            if (x, y) in is_background:
                # True background - make transparent
                new_pixels[x, y] = (0, 0, 0, 0)
            else:
                # Part of character - keep original
                new_pixels[x, y] = (r, g, b, a)

    # Save the transparent version
    new_img.save(output_path, 'PNG')
    print(f"✓ Saved transparent version to: {output_path}")

def main():
    assets_dir = '/home/user/FROGGLE/assets'

    # Use tapo.png as source
    source_image = f'{assets_dir}/tapo.png'
    output_image = f'{assets_dir}/tapo-nobg.png'

    print("Creating Tapo with transparent background...")
    create_transparent_background(source_image, output_image)
    print("\n✓ Done! Tapo image with transparent background created.")

if __name__ == '__main__':
    main()

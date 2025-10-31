#!/usr/bin/env python3
"""
Remove background from new Tapo image while preserving eye whites and diaper.
"""

from PIL import Image
from collections import deque
import sys

def remove_background_preserve_details(input_path, output_path):
    """
    Remove background from Tapo image while carefully preserving white details.

    Args:
        input_path: Path to source image
        output_path: Path to save transparent version
    """
    print(f"Loading image: {input_path}")
    img = Image.open(input_path).convert('RGBA')

    pixels = img.load()
    width, height = img.size

    print(f"Image size: {width}x{height}")

    # Sample corners to detect background color
    corner_samples = [
        pixels[5, 5],
        pixels[width-6, 5],
        pixels[5, height-6],
        pixels[width-6, height-6]
    ]

    # Calculate average background color
    bg_r = sum(c[0] for c in corner_samples) // 4
    bg_g = sum(c[1] for c in corner_samples) // 4
    bg_b = sum(c[2] for c in corner_samples) // 4

    print(f"Detected background color: RGB({bg_r}, {bg_g}, {bg_b})")

    # Create new image with transparent background
    new_img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    new_pixels = new_img.load()

    # Use flood fill from corners to mark background
    print("Detecting background with flood fill...")
    is_background = set()

    # Start flood fill from all 4 corners
    queue = deque([(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)])
    visited = set()

    # Threshold for background detection - more permissive
    bg_threshold = 40

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited or x < 0 or x >= width or y < 0 or y >= height:
            continue

        visited.add((x, y))
        r, g, b, a = pixels[x, y]

        # Calculate distance from detected background color
        color_dist = ((r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2) ** 0.5

        # If close to background color, mark as background and continue flood
        if color_dist < bg_threshold:
            is_background.add((x, y))
            # Add neighbors to queue
            for nx, ny in [(x+1,y), (x-1,y), (x,y+1), (x,y-1)]:
                if (nx, ny) not in visited:
                    queue.append((nx, ny))

    print(f"Marked {len(is_background)} background pixels")

    # Process all pixels
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]

            if (x, y) in is_background:
                # Background - make transparent
                new_pixels[x, y] = (0, 0, 0, 0)
            else:
                # Part of character - preserve original
                # Keep whites (eyes, diaper) by not modifying them
                new_pixels[x, y] = (r, g, b, a)

    # Save the result
    new_img.save(output_path, 'PNG')
    print(f"✓ Saved transparent version to: {output_path}")

    # Show stats
    total_pixels = width * height
    bg_pixels = len(is_background)
    fg_pixels = total_pixels - bg_pixels
    print(f"Background pixels: {bg_pixels} ({bg_pixels/total_pixels*100:.1f}%)")
    print(f"Foreground pixels: {fg_pixels} ({fg_pixels/total_pixels*100:.1f}%)")

def main():
    input_file = 'assets/tapo-nobg.png'
    output_file = 'assets/tapo-nobg-clean.png'

    print("Removing background from Tapo image...")
    print("(Preserving eye whites and diaper)")
    print()

    remove_background_preserve_details(input_file, output_file)

    print("\n✓ Done! New clean Tapo image created.")
    print(f"Moving {output_file} to {input_file}")

    # Move the clean version to replace the original
    import shutil
    shutil.move(output_file, input_file)
    print("✓ Replaced original with clean version")

if __name__ == '__main__':
    main()

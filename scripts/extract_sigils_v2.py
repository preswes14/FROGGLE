#!/usr/bin/env python3
"""
Extract individual sigils from SIGILS 2 combined image.
Uses contour detection to find each sigil precisely.
"""

from PIL import Image
import os
import sys

# Increase recursion limit for flood fill
sys.setrecursionlimit(50000)

# Source image path
SOURCE_IMAGE = '/home/user/FROGGLE/7AF757F9-47F8-4F1C-B385-E92E398588FE.png'

# Sigil names in order (left to right, top to bottom)
SIGIL_NAMES = [
    'attack', 'shield', 'heal', 'grapple', 'alpha',  # top row
    'ghost', 'd20', 'star', 'asterisk', 'expand'      # bottom row
]

def find_all_objects(img, threshold=200):
    """Find all distinct objects (sigils) in the image using flood fill."""
    gray = img.convert('L')
    pixels = gray.load()
    width, height = img.size

    visited = set()
    objects = []

    def flood_fill_iterative(start_x, start_y):
        """Find bounds of connected dark region using iterative approach."""
        stack = [(start_x, start_y)]
        min_x, min_y = start_x, start_y
        max_x, max_y = start_x, start_y
        pixel_count = 0

        while stack:
            x, y = stack.pop()
            if (x, y) in visited:
                continue
            if x < 0 or x >= width or y < 0 or y >= height:
                continue
            if pixels[x, y] >= threshold:
                continue

            visited.add((x, y))
            pixel_count += 1
            min_x = min(min_x, x)
            max_x = max(max_x, x)
            min_y = min(min_y, y)
            max_y = max(max_y, y)

            # Add 8-connected neighbors
            stack.extend([
                (x+1, y), (x-1, y), (x, y+1), (x, y-1),
                (x+1, y+1), (x+1, y-1), (x-1, y+1), (x-1, y-1)
            ])

        return (min_x, min_y, max_x, max_y, pixel_count)

    # Scan for dark pixels that start new objects
    for y in range(height):
        for x in range(width):
            if (x, y) not in visited and pixels[x, y] < threshold:
                bounds = flood_fill_iterative(x, y)
                # Only keep objects of reasonable size (not noise)
                obj_width = bounds[2] - bounds[0]
                obj_height = bounds[3] - bounds[1]
                pixel_count = bounds[4]
                if obj_width > 40 and obj_height > 40 and pixel_count > 500:
                    objects.append(bounds[:4])

    return objects

def make_background_transparent(img):
    """Convert white/near-white pixels to transparent."""
    img = img.convert('RGBA')
    data = img.getdata()
    new_data = []

    for item in data:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    return img

def main():
    output_dir = '/home/user/FROGGLE/assets/sigils'
    os.makedirs(output_dir, exist_ok=True)

    print("Loading SIGILS 2 image...")
    source_img = Image.open(SOURCE_IMAGE).convert('RGBA')
    print(f"Image size: {source_img.size}")
    print()

    print("Finding sigil objects...")
    objects = find_all_objects(source_img)
    print(f"Found {len(objects)} objects")

    # Sort objects: first by row (y position), then by column (x position)
    # Group into rows first (objects with similar y center)
    objects_with_center = [(obj, (obj[0] + obj[2]) / 2, (obj[1] + obj[3]) / 2) for obj in objects]

    # Sort by y center to find rows
    objects_with_center.sort(key=lambda x: x[2])

    # Split into two rows (top 5 and bottom 5)
    mid_y = source_img.size[1] / 2
    top_row = [o for o in objects_with_center if o[2] < mid_y]
    bottom_row = [o for o in objects_with_center if o[2] >= mid_y]

    # Sort each row by x position
    top_row.sort(key=lambda x: x[1])
    bottom_row.sort(key=lambda x: x[1])

    sorted_objects = [o[0] for o in top_row] + [o[0] for o in bottom_row]

    print(f"Top row: {len(top_row)} objects, Bottom row: {len(bottom_row)} objects")
    print()

    if len(sorted_objects) != 10:
        print(f"WARNING: Expected 10 sigils, found {len(sorted_objects)}")
        print("Object bounds:")
        for i, obj in enumerate(sorted_objects):
            print(f"  {i}: {obj}")
        print()

    print("Extracting sigils...")
    print()

    for i, (bounds, name) in enumerate(zip(sorted_objects, SIGIL_NAMES)):
        min_x, min_y, max_x, max_y = bounds

        # Add padding
        padding = 10
        min_x = max(0, min_x - padding)
        min_y = max(0, min_y - padding)
        max_x = min(source_img.size[0], max_x + padding)
        max_y = min(source_img.size[1], max_y + padding)

        # Crop the sigil
        sigil = source_img.crop((min_x, min_y, max_x + 1, max_y + 1))

        # Make background transparent
        sigil = make_background_transparent(sigil)

        # Save
        output_path = os.path.join(output_dir, f"{name}.png")
        sigil.save(output_path)

        print(f"  {name:12} ({sigil.size[0]:3}x{sigil.size[1]:3}) -> {output_path}")

    print()
    print("Done! All sigils extracted fresh from SIGILS 2.")

if __name__ == '__main__':
    main()

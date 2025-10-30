#!/usr/bin/env python3
"""
Extract individual sigils from the two new sigil images.
Properly crops each sigil and removes white background.
"""

from PIL import Image
import os

# Sigil definitions: (filename, sigil_name, row_image, position_index)
SIGILS = [
    # From IMG_6243.png (top row)
    ('IMG_6243.png', 'attack', 0),
    ('IMG_6243.png', 'shield', 1),
    ('IMG_6243.png', 'heal', 2),
    ('IMG_6243.png', 'grapple', 3),
    ('IMG_6243.png', 'alpha', 4),
    # From IMG_6244.png (bottom row)
    ('IMG_6244.png', 'ghost', 0),
    ('IMG_6244.png', 'd20', 1),
    ('IMG_6244.png', 'star', 2),
    ('IMG_6244.png', 'asterisk', 3),
    ('IMG_6244.png', 'expand', 4),
]

def find_sigil_bounds(img):
    """Find the bounding box of non-white pixels in the image."""
    gray = img.convert('L')
    pixels = gray.load()
    width, height = img.size

    min_x, min_y = width, height
    max_x, max_y = 0, 0

    for y in range(height):
        for x in range(width):
            # If pixel is dark (not light gray or white), it's part of the sigil
            # Using lower threshold to ignore watermarks and light gray pixels
            if pixels[x, y] < 200:  # threshold for "not white or light gray"
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)

    return (min_x, min_y, max_x + 1, max_y + 1)

def make_background_transparent(img):
    """Convert white/near-white pixels to transparent."""
    img = img.convert('RGBA')
    data = img.getdata()
    new_data = []

    for item in data:
        # If pixel is close to white, make it transparent
        if item[0] > 245 and item[1] > 245 and item[2] > 245:
            new_data.append((255, 255, 255, 0))  # Transparent
        else:
            new_data.append(item)

    img.putdata(new_data)
    return img

def extract_sigil(source_img, position, num_sigils=5):
    """Extract a single sigil from its position in the row."""
    width, height = source_img.size

    # Calculate the width of each sigil cell
    cell_width = width // num_sigils

    # Add margin to avoid catching parts of adjacent sigils
    margin = cell_width * 0.10

    # Calculate cell boundaries
    x_start = int(position * cell_width + margin)
    x_end = int((position + 1) * cell_width - margin)
    y_start = int(margin)
    y_end = int(height - margin)

    # Crop to cell
    cell = source_img.crop((x_start, y_start, x_end, y_end))

    # Find tight bounds around the actual sigil
    bounds = find_sigil_bounds(cell)

    # Crop to the actual sigil with minimal padding
    padding = 3
    sigil = cell.crop((
        max(0, bounds[0] - padding),
        max(0, bounds[1] - padding),
        min(cell.size[0], bounds[2] + padding),
        min(cell.size[1], bounds[3] + padding)
    ))

    # Make background transparent
    sigil = make_background_transparent(sigil)

    return sigil

def main():
    output_dir = '/home/user/FROGGLE/assets/sigils'
    os.makedirs(output_dir, exist_ok=True)

    print("Extracting sigils from new images...")
    print()

    # Cache loaded images
    loaded_images = {}

    for source_file, name, position in SIGILS:
        # Load source image if not already loaded
        if source_file not in loaded_images:
            img_path = f'/home/user/FROGGLE/{source_file}'
            loaded_images[source_file] = Image.open(img_path).convert('RGBA')

        source_img = loaded_images[source_file]

        # Extract the sigil
        sigil = extract_sigil(source_img, position)

        # Save the sigil
        output_path = os.path.join(output_dir, f"{name}.png")
        sigil.save(output_path)

        print(f"✓ Saved {name:12} ({sigil.size[0]:3}x{sigil.size[1]:3}) to {output_path}")

    print()
    print("Done! All sigils extracted successfully.")

if __name__ == '__main__':
    main()

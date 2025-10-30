#!/usr/bin/env python3
"""
Extract individual sigils from the master sigil sheet.
Isolates each sigil, crops it, and saves with transparent background.
"""

from PIL import Image
import os

# Sigil names in order (left to right, top to bottom)
SIGIL_NAMES = [
    # Top row
    'Attack', 'Shield', 'Heal', 'Grapple', 'Alpha',
    # Bottom row
    'Ghost', 'D20', 'Star', 'Asterisk', 'Expand'
]

def extract_sigils(input_path, output_dir):
    """Extract sigils from the master sheet and save individually."""

    # Load the image
    img = Image.open(input_path).convert('RGBA')
    width, height = img.size

    print(f"Image size: {width}x{height}")

    # The sigils are arranged in a 2x5 grid
    # Calculate grid dimensions
    rows = 2
    cols = 5

    # Estimate cell size (with some padding)
    cell_width = width // cols
    cell_height = height // rows

    print(f"Estimated cell size: {cell_width}x{cell_height}")

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Extract each sigil
    for idx, name in enumerate(SIGIL_NAMES):
        row = idx // cols
        col = idx % cols

        # Calculate approximate cell position
        x = col * cell_width
        y = row * cell_height

        # Crop the cell (we'll auto-crop the actual sigil content later)
        cell = img.crop((x, y, x + cell_width, y + cell_height))

        # Find the bounding box of non-white pixels
        # Convert to grayscale for easier thresholding
        gray = cell.convert('L')
        pixels = gray.load()

        # Find bounds
        min_x, min_y = cell_width, cell_height
        max_x, max_y = 0, 0

        for py in range(cell_height):
            for px in range(cell_width):
                # If pixel is dark (not white), it's part of the sigil
                if pixels[px, py] < 250:  # threshold for "not white"
                    min_x = min(min_x, px)
                    max_x = max(max_x, px)
                    min_y = min(min_y, py)
                    max_y = max(max_y, py)

        # Add small padding
        padding = 5
        min_x = max(0, min_x - padding)
        min_y = max(0, min_y - padding)
        max_x = min(cell_width, max_x + padding)
        max_y = min(cell_height, max_y + padding)

        # Crop to the actual sigil bounds
        sigil = cell.crop((min_x, min_y, max_x, max_y))

        # Convert white background to transparent
        data = sigil.getdata()
        new_data = []
        for item in data:
            # If pixel is close to white, make it transparent
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                new_data.append((255, 255, 255, 0))  # Transparent
            else:
                new_data.append(item)

        sigil.putdata(new_data)

        # Save the sigil
        output_path = os.path.join(output_dir, f"{name.lower()}.png")
        sigil.save(output_path)
        print(f"✓ Saved {name} ({sigil.size[0]}x{sigil.size[1]}) to {output_path}")

if __name__ == '__main__':
    input_file = '/home/user/FROGGLE/6720A659-122D-4462-85FC-9302CF2CFD9F.png'
    output_directory = '/home/user/FROGGLE/assets/sigils'

    print("Extracting sigils from master sheet...")
    extract_sigils(input_file, output_directory)
    print("\nDone! All sigils extracted successfully.")

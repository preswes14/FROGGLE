#!/usr/bin/env python3
"""
Crop NPC faces from neutral encounter images for post-combat reactions.
"""

from PIL import Image
import os

def crop_and_save(input_path, output_path, crop_box):
    """Crop an image and save it."""
    img = Image.open(input_path)
    cropped = img.crop(crop_box)
    cropped.save(output_path)
    print(f"✓ Saved {output_path} ({cropped.size[0]}x{cropped.size[1]})")

def main():
    assets_dir = '/home/user/FROGGLE/assets/neutrals'
    reactions_dir = '/home/user/FROGGLE/assets/reactions'
    os.makedirs(reactions_dir, exist_ok=True)

    print("Cropping NPC face reactions...")
    print()

    # Prince (worried/anxious face from prince1)
    # The hooded figure's face area
    crop_and_save(
        f'{assets_dir}/prince1.png',
        f'{reactions_dir}/prince-worried.png',
        (200, 150, 450, 400)  # Adjusted to capture the hooded face
    )

    # Prince (happy faces from prince2 wedding)
    # The two people's faces
    crop_and_save(
        f'{assets_dir}/prince2.png',
        f'{reactions_dir}/prince-happy.png',
        (150, 100, 550, 350)  # Captures both happy faces
    )

    # Shopkeeper (Death reveal from shopkeeper2)
    crop_and_save(
        f'{assets_dir}/shopkeeper2.png',
        f'{reactions_dir}/shopkeeper-death.png',
        (200, 100, 500, 400)  # Death's skull face
    )

    # Wizard (from wizard1 or wizard2)
    crop_and_save(
        f'{assets_dir}/wizard1.png',
        f'{reactions_dir}/wizard-face.png',
        (150, 150, 450, 450)  # Wizard's face/figure
    )

    # Ghost boys (from ghost1)
    crop_and_save(
        f'{assets_dir}/ghost1.png',
        f'{reactions_dir}/ghost-boys.png',
        (120, 50, 580, 380)  # The two ghost boys with faces
    )

    print()
    print("Done! All NPC face reactions created.")

if __name__ == '__main__':
    main()

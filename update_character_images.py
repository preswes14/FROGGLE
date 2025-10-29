#!/usr/bin/env python3
"""
Update Froggle9.0.html with character images from characterimages file
"""
import re

# Read the characterimages file
print("Reading character images...")
with open('characterimages', 'r') as f:
    content = f.read()

# Parse character data
sections = re.split(r'\[([^\]]+)\]', content)
characters = {}
for i in range(1, len(sections), 2):
    if i+1 < len(sections):
        name = sections[i].strip()
        data = sections[i+1].strip()
        if data:
            characters[name] = data
            print(f"  Found {name}: {len(data)} bytes")

# Read the HTML file
print("\nReading Froggle9.0.html...")
with open('Froggle9.0.html', 'r') as f:
    html = f.read()

# Build the new HERO_IMAGES object with pixel versions
print("\nBuilding HERO_IMAGES object...")
hero_images = f"""// Hero images (base64 encoded PNG)
const HERO_IMAGES = {{
warrior: '{characters.get('Warrior_Pixel', '')}',
tank: '{characters.get('Tank_Pixel', '')}',
mage: '{characters.get('Mage_Pixel', '')}',
healer: '{characters.get('Healer_Pixel', '')}',
tapo: '{characters.get('Tapo', '')}'
}};

// Hero portrait images for selection screen
const HERO_PORTRAITS = {{
warrior: '{characters.get('Warrior_Portrait', '')}',
tank: '{characters.get('Tank_Portrait', '')}',
mage: '{characters.get('Mage_Portrait', '')}',
healer: '{characters.get('Healer_Portrait', '')}',
tapo: '{characters.get('Tapo', '')}'
}};"""

# Replace the old HERO_IMAGES section
pattern = r'// Hero images \(base64 encoded PNG\)[\s\S]*?};'
html = re.sub(pattern, hero_images, html, count=1)

# Write the updated HTML
print("\nWriting updated Froggle9.0.html...")
with open('Froggle9.0.html', 'w') as f:
    f.write(html)

print("✅ Successfully updated character images!")
print(f"   Total size increase: ~{sum(len(v) for v in characters.values()) / 1024 / 1024:.1f} MB")

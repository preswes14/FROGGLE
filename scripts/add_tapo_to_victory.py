#!/usr/bin/env python3
"""
Add jumping Tapo sprite to the Floor 20 victory screen
"""
from PIL import Image

# Load the images
victory_screen = Image.open('/home/user/FROGGLE/assets/victory-room.png')
tapo = Image.open('/home/user/FROGGLE/assets/tapo-nobg.png')

# Get dimensions
victory_width, victory_height = victory_screen.size
tapo_width, tapo_height = tapo.size

# Scale Tapo to be appropriately sized (about 40% of victory screen height)
target_height = int(victory_height * 0.4)
scale_factor = target_height / tapo_height
new_tapo_width = int(tapo_width * scale_factor)
new_tapo_height = int(tapo_height * scale_factor)

# Resize Tapo with high quality
tapo_resized = tapo.resize((new_tapo_width, new_tapo_height), Image.Resampling.LANCZOS)

# Position Tapo on the left side, slightly up from center to suggest jumping
# Place it in the empty space on the left
x_position = int(victory_width * 0.15)  # 15% from left edge
y_position = int(victory_height * 0.35)  # 35% from top (upper-mid for jumping effect)

# Create a copy of the victory screen to preserve original
result = victory_screen.copy()

# Composite Tapo onto the victory screen (RGBA so transparency is preserved)
result.paste(tapo_resized, (x_position, y_position), tapo_resized)

# Save the result
result.save('/home/user/FROGGLE/assets/victory-room.png')
print(f"Successfully added Tapo to victory screen!")
print(f"Tapo size: {new_tapo_width}x{new_tapo_height}")
print(f"Position: ({x_position}, {y_position})")

import base64
import re
import os

# Read the HTML file
with open('Froggle9.0.html', 'r') as f:
    html = f.read()

# Function to convert image to base64
def img_to_base64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

# Replace main images
images = {
    'assets/title-screen.png': 'title-screen.png',
    'assets/hero-select.png': 'hero-select.png',
    'assets/tapo.png': 'tapo.png'
}

for path, name in images.items():
    if os.path.exists(path):
        b64 = img_to_base64(path)
        html = html.replace(f'src="{path}"', f'src="data:image/png;base64,{b64}"')
        print(f"Embedded {name}")

# Replace neutral images
neutral_dir = 'assets/neutrals/'
if os.path.exists(neutral_dir):
    for filename in os.listdir(neutral_dir):
        if filename.endswith('.png'):
            path = os.path.join(neutral_dir, filename)
            b64 = img_to_base64(path)
            html = html.replace(f'src="{path}"', f'src="data:image/png;base64,{b64}"')
            print(f"Embedded {filename}")

# Write mobile version
with open('Froggle9.0_Mobile.html', 'w') as f:
    f.write(html)

print("\n✅ Created Froggle9.0_Mobile.html with all images embedded!")
print(f"File size: {len(html) / 1024 / 1024:.2f} MB")

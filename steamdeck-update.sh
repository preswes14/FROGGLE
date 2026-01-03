#!/bin/bash
# FROGGLE Steam Deck Updater
# Downloads the latest AppImage from GitHub
#
# Usage: ./steamdeck-update.sh [--run]
#   --run  Launch FROGGLE after downloading

set -e

REPO="preswes14/FROGGLE"
INSTALL_DIR="$HOME/Games/FROGGLE"
APPIMAGE_NAME="FROGGLE.AppImage"

echo "=== FROGGLE Steam Deck Updater ==="

# Create install directory if it doesn't exist
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Get the download URL for the latest AppImage
echo "Checking for latest version..."
DOWNLOAD_URL=$(curl -s "https://api.github.com/repos/$REPO/releases/tags/latest" | grep "browser_download_url.*AppImage" | head -1 | cut -d '"' -f 4)

if [ -z "$DOWNLOAD_URL" ]; then
    echo "Error: Could not find AppImage download URL"
    echo "The GitHub Actions build may still be running (takes ~5 min after push)."
    echo "Check: https://github.com/$REPO/actions"
    exit 1
fi

echo "Downloading latest FROGGLE..."
curl -L --progress-bar -o "$APPIMAGE_NAME.tmp" "$DOWNLOAD_URL"
mv "$APPIMAGE_NAME.tmp" "$APPIMAGE_NAME"

# Make it executable
chmod +x "$APPIMAGE_NAME"

echo ""
echo "=== Update complete! ==="
echo ""
echo "FROGGLE is ready at: $INSTALL_DIR/$APPIMAGE_NAME"
echo ""

# Run if --run flag was passed
if [ "$1" = "--run" ]; then
    echo "Launching FROGGLE..."
    exec "./$APPIMAGE_NAME"
fi

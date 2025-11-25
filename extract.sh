#!/bin/bash
# ===== FROGGLE EXTRACTION SCRIPT =====
# Extracts modular source files from the monolithic index.html
#
# Based on the line numbers documented in CLAUDE.md:
# | Section | Lines |
# |---------|-------|
# | CSS | 1-1650 |
# | Constants | 1650-2400 |
# | SoundFX | 2575-2870 |
# | Game State S | 2875-3020 |
# | Save/Load | 3250-3550 |
# | Combat | 4750-6460 |
# | Level Up | 6745-6900 |
# | Neutrals | 7400-9100 |
# | The Pond | 9130-9380 |
# | Death Screen | 9385-9550 |
# | Win/Victory | 9857-10050 |
# | Ribbleton | 10066-10140 |
# | Settings | 10140-10400 |
# | Controller | 10700-11200 |

set -e

echo "🐸 FROGGLE Extraction Script"
echo "============================="

# Check if index.html exists
if [ ! -f "index.html" ]; then
    echo "Error: index.html not found"
    exit 1
fi

mkdir -p src build

# Get the line number where <script> starts
SCRIPT_START=$(grep -n "^<script>$" index.html | head -1 | cut -d: -f1)
SCRIPT_END=$(grep -n "^</script>$" index.html | tail -1 | cut -d: -f1)

echo "Script tag found at lines $SCRIPT_START to $SCRIPT_END"

# Extract HTML template (before <script>)
echo "→ Extracting HTML template..."
head -n $SCRIPT_START index.html > build/template_head.html
# Remove the <script> line from template_head
head -n $((SCRIPT_START - 1)) index.html > build/template_head.html

# Extract closing HTML (after </script>)
echo "→ Extracting closing HTML..."
tail -n +$SCRIPT_END index.html > build/template_foot.html

# Extract the entire JavaScript content
JS_START=$((SCRIPT_START + 1))
JS_END=$((SCRIPT_END - 1))
echo "→ Extracting JavaScript (lines $JS_START to $JS_END)..."
sed -n "${JS_START},${JS_END}p" index.html > build/all_js.txt

# Count total JS lines
TOTAL_LINES=$(wc -l < build/all_js.txt)
echo "Total JavaScript lines: $TOTAL_LINES"

# Now extract sections based on content markers
# We'll use grep to find section boundaries more reliably

echo ""
echo "→ Extracting modules based on content markers..."

# Constants (version through animation timings)
# Find "// ===== VERSION CHECK =====" to "// ===== SOUND EFFECTS SYSTEM"
echo "  + constants.js"
sed -n '/^\/\/ ===== VERSION CHECK =====/,/^\/\/ ===== SOUND EFFECTS SYSTEM/p' build/all_js.txt | head -n -1 > src/constants.js

# SoundFX
echo "  + sounds.js"
sed -n '/^\/\/ ===== SOUND EFFECTS SYSTEM/,/^\/\/ ===== GAME STATE =====/p' build/all_js.txt | head -n -1 > src/sounds.js

# State (includes helpers, toast, tooltips, save/load)
echo "  + state.js"
sed -n '/^\/\/ ===== GAME STATE =====/,/^\/\/ ===== NEUTRAL DECK SYSTEM =====/p' build/all_js.txt | head -n -1 > src/state.js

# Neutrals (includes neutral deck through all 9 encounters)
echo "  + neutrals.js"
sed -n '/^\/\/ ===== NEUTRAL DECK SYSTEM =====/,/^\/\/ ===== THE POND/p' build/all_js.txt | head -n -1 > src/neutrals.js

# Screens (Pond, Death, Win, Title sequences)
echo "  + screens.js"
sed -n '/^\/\/ ===== THE POND/,/^\/\/ ===== DEBUG MODE =====/p' build/all_js.txt | head -n -1 > src/screens.js

# Settings and Debug
echo "  + settings.js"
sed -n '/^\/\/ ===== DEBUG MODE =====/,/^\/\/ ===== GAMEPAD CONTROLLER/p' build/all_js.txt | head -n -1 > src/settings.js

# Controller
echo "  + controller.js"
sed -n '/^\/\/ ===== GAMEPAD CONTROLLER/,/^\/\/ ===== INITIALIZATION =====/p' build/all_js.txt | head -n -1 > src/controller.js

# Main/Init (everything after controller to end)
echo "  + main.js"
sed -n '/^\/\/ ===== INITIALIZATION =====/,$p' build/all_js.txt > src/main.js

echo ""
echo "✓ Extraction complete!"
echo ""
echo "Extracted modules:"
for f in src/*.js; do
    if [ -f "$f" ]; then
        lines=$(wc -l < "$f")
        echo "  $(basename $f): $lines lines"
    fi
done

echo ""
echo "Next steps:"
echo "1. Review extracted modules in src/"
echo "2. Run ./build.sh to rebuild index.html from modules"
echo "3. Test the rebuilt index.html in a browser"

#!/bin/bash
# ===== FROGGLE BUILD SCRIPT =====
# Concatenates modular source files back into a single index.html
#
# Usage: ./build.sh
#
# This script takes the HTML template and concatenates all JS modules
# in the correct dependency order to produce the final index.html

set -e

echo "🐸 FROGGLE Build Script"
echo "======================="

# Check if we're in the right directory
if [ ! -d "src" ]; then
    echo "Error: Must run from FROGGLE root directory (no src/ found)"
    exit 1
fi

mkdir -p build

# Check if templates exist, if not extract them
if [ ! -f "build/template_head.html" ] || [ ! -f "build/template_foot.html" ]; then
    echo "→ Extracting HTML templates from index.html..."
    SCRIPT_START=$(grep -n "^<script>$" index.html | head -1 | cut -d: -f1)
    SCRIPT_END=$(grep -n "^</script>$" index.html | tail -1 | cut -d: -f1)

    head -n $((SCRIPT_START - 1)) index.html > build/template_head.html
    tail -n +$((SCRIPT_END+1)) index.html > build/template_foot.html
    echo "  ✓ Templates extracted"
fi

# Concatenate JS modules in dependency order
echo "→ Concatenating JavaScript modules..."

# Clear combined.js
> build/combined.js

# Module concatenation order (dependencies first)
# Order based on actual code structure and dependencies
MODULES=(
    "src/constants.js"      # Version, HERO_IMAGES, DEATH_QUOTES, H, E, SIGIL_*, ANIMATION_TIMINGS
    "src/sounds.js"         # SoundFX system
    "src/state.js"          # Game state S, upd(), animations, toast, save/load
    "src/combat.js"         # Floor management, combat system, render(), level up
    "src/neutrals.js"       # Neutral deck, title/hero select, tutorials, neutral encounters
    "src/screens.js"        # The Pond, Death screen, Champions, Pedestal, Win, Ribbleton hub
    "src/settings.js"       # Debug, Settings, FAQ
    "src/controller.js"     # GamepadController (Steam Deck support)
    "src/main.js"           # Init and window.onload
)

for module in "${MODULES[@]}"; do
    if [ -f "$module" ]; then
        lines=$(wc -l < "$module")
        echo "  + $module ($lines lines)"
        cat "$module" >> build/combined.js
        echo "" >> build/combined.js
    else
        echo "  ! Missing: $module (skipped)"
    fi
done

# Assemble final index.html
echo "→ Assembling index.html..."

# Combine: HTML head + <script> + JS + </script> + HTML foot
cat build/template_head.html > build/index.html.new
echo "<script>" >> build/index.html.new
cat build/combined.js >> build/index.html.new
echo "</script>" >> build/index.html.new
cat build/template_foot.html >> build/index.html.new

# Backup and replace
if [ -f "index.html" ]; then
    cp index.html index.html.backup
fi
mv build/index.html.new index.html

# Count final lines
TOTAL=$(wc -l < index.html)

echo ""
echo "✓ Build complete!"
echo "  index.html: $TOTAL lines"
echo ""
echo "To test: Open index.html in a browser"
echo "To revert: cp index.html.backup index.html"

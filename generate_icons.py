#!/usr/bin/env python3
"""
LUME App Icon Generator
Generates app icons with a lightning bolt (Zap) design for the LUME desktop application.
"""

import os
from PIL import Image, ImageDraw
import sys

# LUME brand colors
ORANGE = "#FF6B35"
DARK_BG = "#1A1A1A"
WHITE = "#FFFFFF"

def create_lightning_bolt_path(width, height, padding=20):
    """Create a lightning bolt path for the given dimensions."""
    # Calculate lightning bolt coordinates with padding
    w, h = width - 2 * padding, height - 2 * padding
    x_offset, y_offset = padding, padding
    
    # Lightning bolt shape (roughly based on Lucide's Zap icon)
    points = [
        (x_offset + w * 0.6, y_offset),              # Top right
        (x_offset + w * 0.2, y_offset + h * 0.45),  # Middle left
        (x_offset + w * 0.45, y_offset + h * 0.45), # Middle center
        (x_offset + w * 0.4, y_offset + h),         # Bottom left
        (x_offset + w * 0.8, y_offset + h * 0.55),  # Middle right
        (x_offset + w * 0.55, y_offset + h * 0.55), # Middle center right
    ]
    
    return points

def create_icon(size, output_path, background=True):
    """Create a single icon of the specified size."""
    # Create image with transparent or dark background
    if background:
        img = Image.new('RGBA', (size, size), DARK_BG)
    else:
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    
    draw = ImageDraw.Draw(img)
    
    # Add background circle if requested
    if background:
        # Draw a subtle circular background
        circle_padding = size // 8
        draw.ellipse(
            [circle_padding, circle_padding, size - circle_padding, size - circle_padding],
            fill=DARK_BG,
            outline=ORANGE,
            width=max(1, size // 64)
        )
    
    # Draw lightning bolt
    padding = size // 6
    lightning_points = create_lightning_bolt_path(size, size, padding)
    
    # Draw the lightning bolt
    draw.polygon(lightning_points, fill=ORANGE, outline=WHITE, width=max(1, size // 128))
    
    # Save the image
    img.save(output_path, format='PNG')
    print(f"Created: {output_path} ({size}x{size})")

def create_ico_file(sizes, output_path):
    """Create a Windows ICO file with multiple sizes."""
    images = []
    for size in sizes:
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Draw lightning bolt
        padding = size // 6
        lightning_points = create_lightning_bolt_path(size, size, padding)
        draw.polygon(lightning_points, fill=ORANGE, outline=WHITE, width=max(1, size // 128))
        
        images.append(img)
    
    # Save as ICO
    images[0].save(output_path, format='ICO', sizes=[(img.width, img.height) for img in images])
    print(f"Created: {output_path} (ICO with sizes: {sizes})")

def create_icns_file(output_path):
    """Create a macOS ICNS file."""
    # For ICNS, we'll create a high-res PNG and let the system convert it
    # This is a simplified approach - for production, you'd want to use iconutil
    size = 1024
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw lightning bolt
    padding = size // 6
    lightning_points = create_lightning_bolt_path(size, size, padding)
    draw.polygon(lightning_points, fill=ORANGE, outline=WHITE, width=size // 128)
    
    # Save as PNG (we'll rename to .icns)
    png_path = output_path.replace('.icns', '.png')
    img.save(png_path, format='PNG')
    
    # Rename to .icns (this is a simplified approach)
    os.rename(png_path, output_path)
    print(f"Created: {output_path} (simplified ICNS)")

def main():
    """Generate all required app icons."""
    # Define the icon directory
    icon_dir = "/Volumes/Olson/GITSTUFF/LUME/src/lume_desk/src-tauri/icons"
    
    if not os.path.exists(icon_dir):
        print(f"Error: Icon directory not found: {icon_dir}")
        return
    
    print("🔄 Generating LUME app icons with lightning bolt design...")
    print(f"📁 Output directory: {icon_dir}")
    print(f"🎨 Primary color: {ORANGE}")
    
    # Create backup directory
    backup_dir = os.path.join(icon_dir, "backup_original")
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
        print(f"📦 Created backup directory: {backup_dir}")
    
    # Backup existing icons
    for file in os.listdir(icon_dir):
        if file.endswith(('.png', '.ico', '.icns')) and not os.path.isdir(os.path.join(icon_dir, file)):
            src = os.path.join(icon_dir, file)
            dst = os.path.join(backup_dir, file)
            if not os.path.exists(dst):
                os.rename(src, dst)
                print(f"📦 Backed up: {file}")
    
    # Generate PNG icons
    png_sizes = [32, 128, 256, 512, 1024]
    for size in png_sizes:
        create_icon(size, os.path.join(icon_dir, f"{size}x{size}.png"), background=False)
    
    # Create specific named files
    create_icon(128, os.path.join(icon_dir, "128x128@2x.png"), background=False)
    create_icon(512, os.path.join(icon_dir, "icon.png"), background=False)
    
    # Create Windows icons for Square logos (Microsoft Store)
    square_sizes = [
        (30, "Square30x30Logo.png"),
        (44, "Square44x44Logo.png"), 
        (71, "Square71x71Logo.png"),
        (89, "Square89x89Logo.png"),
        (107, "Square107x107Logo.png"),
        (142, "Square142x142Logo.png"),
        (150, "Square150x150Logo.png"),
        (284, "Square284x284Logo.png"),
        (310, "Square310x310Logo.png"),
        (50, "StoreLogo.png")
    ]
    
    for size, filename in square_sizes:
        create_icon(size, os.path.join(icon_dir, filename), background=True)
    
    # Create ICO file for Windows
    create_ico_file([16, 32, 48, 256], os.path.join(icon_dir, "icon.ico"))
    
    # Create ICNS file for macOS
    create_icns_file(os.path.join(icon_dir, "icon.icns"))
    
    print("\n✅ Icon generation complete!")
    print("\n📋 Generated files:")
    for file in sorted(os.listdir(icon_dir)):
        if not os.path.isdir(os.path.join(icon_dir, file)):
            print(f"   • {file}")
    
    print(f"\n🔄 To apply changes:")
    print(f"   1. The icons are already in the correct location")
    print(f"   2. Rebuild the Tauri app: cd /Volumes/Olson/GITSTUFF/LUME/src/lume_desk && npm run tauri build")
    print(f"   3. Original icons backed up in: {backup_dir}")

if __name__ == "__main__":
    # Check if PIL is available
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("❌ Error: Pillow (PIL) is required to generate icons.")
        print("📦 Install with: pip install Pillow")
        sys.exit(1)
    
    main()

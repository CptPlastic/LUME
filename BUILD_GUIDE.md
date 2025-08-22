# LUME Desktop Controller - Build & Installation Guide

## Overview

The LUME Desktop Controller is a Tauri-based desktop application that provides a unified interface for controlling ESP32-based firework and lighting controllers. This guide covers building the application from source and creating installable packages for macOS.

## Prerequisites

### Required Software

#### All Platforms

1. **Node.js** (v18 or later)

   **macOS:**
   ```bash
   # Install via Homebrew (recommended)
   brew install node
   
   # Verify installation
   node --version
   npm --version
   ```

   **Windows:**
   ```powershell
   # Download from nodejs.org or use Chocolatey
   choco install nodejs
   
   # Or use winget
   winget install OpenJS.NodeJS
   
   # Verify installation
   node --version
   npm --version
   ```

   **Linux (Ubuntu/Debian):**
   ```bash
   # Install via package manager
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Or using snap
   sudo snap install node --classic
   
   # Verify installation
   node --version
   npm --version
   ```

2. **Rust** (latest stable)

   **All Platforms:**
   ```bash
   # Install Rust via rustup
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env  # Linux/macOS
   # Or restart terminal on Windows
   
   # Verify installation
   rustc --version
   cargo --version
   ```

3. **Tauri CLI**

   **All Platforms:**
   ```bash
   # Install Tauri CLI globally
   npm install -g @tauri-apps/cli
   
   # Verify installation
   tauri --version
   ```

#### Platform-Specific Dependencies

**macOS:**
```bash
# Xcode Command Line Tools
xcode-select --install
```

**Windows:**
```powershell
# Visual Studio Build Tools (choose one)
# Option 1: Visual Studio Community (recommended)
# Download from: https://visualstudio.microsoft.com/vs/community/

# Option 2: Build Tools only
# Download from: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

# Required components:
# - MSVC v143 compiler toolset
# - Windows 10/11 SDK
# - CMake tools for Visual Studio
```

**Linux (Ubuntu/Debian):**
```bash
# Install system dependencies
sudo apt update
sudo apt install -y \
    libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libxdo-dev
```

**Linux (Fedora):**
```bash
# Install system dependencies
sudo dnf install -y \
    webkit2gtk4.0-devel \
    openssl-devel \
    curl \
    wget \
    file \
    libappindicator-gtk3-devel \
    librsvg2-devel \
    libxdo-devel
sudo dnf groupinstall -y "C Development Tools and Libraries"
```

**Linux (Arch):**
```bash
# Install system dependencies
sudo pacman -S --needed \
    webkit2gtk \
    base-devel \
    curl \
    wget \
    file \
    openssl \
    appmenu-gtk-module \
    gtk3 \
    libappindicator-gtk3 \
    librsvg \
    libvips \
    xdotool
```

### System Requirements

#### macOS
- **Version**: 10.15 (Catalina) or later
- **Architecture**: Apple Silicon (ARM64) or Intel (x86_64)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space for build dependencies

#### Windows
- **Version**: Windows 10 (1903) or later
- **Architecture**: x86_64 (64-bit)
- **Tools**: Visual Studio Build Tools or Visual Studio Community
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 3GB free space for build dependencies

#### Linux
- **Distributions**: Ubuntu 18.04+, Debian 10+, Fedora 32+, Arch Linux
- **Architecture**: x86_64 (64-bit)
- **Dependencies**: GTK3, WebKit2GTK, libappindicator
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 2GB free space for build dependencies

## Project Structure

```
LUME/
├── src/lume_desk/              # Desktop application root
│   ├── src/                    # React frontend source
│   │   ├── components/         # React components
│   │   ├── services/          # API services
│   │   ├── store/             # State management
│   │   └── types/             # TypeScript definitions
│   ├── src-tauri/             # Rust backend source
│   │   ├── src/               # Rust source files
│   │   ├── Cargo.toml         # Rust dependencies
│   │   └── tauri.conf.json    # Tauri configuration
│   ├── package.json           # Node.js dependencies
│   └── dist/                  # Built frontend assets
└── src/                       # ESP32 firmware source
    ├── lighting_controller/    # Lighting controller firmware
    └── firework_controller/    # Firework controller firmware
```

## Building from Source

### 1. Clone the Repository

```bash
git clone https://github.com/CptPlastic/LUME.git
cd LUME/src/lume_desk
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# This will install all frontend dependencies including:
# - React 18.3.1
# - TypeScript 5.6.3
# - Vite 7.1.2
# - Zustand (state management)
# - Axios (HTTP client)
# - TailwindCSS (styling)
```

### 3. Development Build

For development and testing:

```bash
# Start development server
tauri dev

# This will:
# 1. Build the React frontend with Vite
# 2. Compile the Rust backend
# 3. Launch the desktop app in debug mode
# 4. Enable hot-reload for frontend changes
```

The development app will open automatically. You can make changes to the frontend code and see them reflected immediately.

### 4. Production Build

For creating distributable packages:

#### Build for Current Platform

```bash
# Build for your current platform
tauri build

# This creates platform-specific packages:
# - macOS: .app bundle and .dmg installer
# - Windows: .msi installer and .exe
# - Linux: .deb, .rpm, and .appimage packages
```

#### Cross-Platform Builds

**Note:** Cross-compilation has limitations. It's recommended to build on the target platform for best results.

**Build for macOS (on macOS):**
```bash
# Create both app bundle and DMG
tauri build --bundles app dmg

# Output:
# - src-tauri/target/release/bundle/macos/LUME Desktop Controller.app
# - src-tauri/target/release/bundle/dmg/LUME Desktop Controller_1.2.0_aarch64.dmg (Apple Silicon)
# - src-tauri/target/release/bundle/dmg/LUME Desktop Controller_1.2.0_x64.dmg (Intel)
```

**Build for Windows (on Windows):**
```powershell
# Create MSI installer and portable EXE
tauri build --bundles msi nsis

# Output:
# - src-tauri/target/release/bundle/msi/LUME Desktop Controller_1.2.0_x64_en-US.msi
# - src-tauri/target/release/bundle/nsis/LUME Desktop Controller_1.2.0_x64-setup.exe
```

**Build for Linux (on Linux):**
```bash
# Create multiple package formats
tauri build --bundles deb rpm appimage

# Output:
# - src-tauri/target/release/bundle/deb/lume-desktop-controller_1.2.0_amd64.deb
# - src-tauri/target/release/bundle/rpm/lume-desktop-controller-1.2.0-1.x86_64.rpm
# - src-tauri/target/release/bundle/appimage/lume-desktop-controller_1.2.0_amd64.AppImage
```

#### Build Configuration

Configure build targets in `src-tauri/tauri.conf.json`:

```json
{
  "bundle": {
    "targets": {
      "macOS": ["app", "dmg"],
      "windows": ["msi", "nsis"],
      "linux": ["deb", "rpm", "appimage"]
    }
  }
}
```

## Build Output

After a successful build, you'll find platform-specific files:

### macOS

**App Bundle:**
- **Path**: `src-tauri/target/release/bundle/macos/LUME Desktop Controller.app`
- **Type**: Native macOS application bundle
- **Use**: Direct installation to `/Applications` folder

**DMG Installer:**
- **Path**: `src-tauri/target/release/bundle/dmg/LUME Desktop Controller_1.2.0_aarch64.dmg`
- **Type**: Disk image installer
- **Use**: Distribution and easy installation

### Windows

**MSI Installer:**
- **Path**: `src-tauri/target/release/bundle/msi/LUME Desktop Controller_1.2.0_x64_en-US.msi`
- **Type**: Windows Installer package
- **Use**: Professional installation with Add/Remove Programs integration

**NSIS Installer:**
- **Path**: `src-tauri/target/release/bundle/nsis/LUME Desktop Controller_1.2.0_x64-setup.exe`
- **Type**: NSIS-based setup executable
- **Use**: Custom installation wizard

**Portable Executable:**
- **Path**: `src-tauri/target/release/lume-desktop-controller.exe`
- **Type**: Standalone executable
- **Use**: No installation required, run directly

### Linux

**Debian Package:**
- **Path**: `src-tauri/target/release/bundle/deb/lume-desktop-controller_1.2.0_amd64.deb`
- **Type**: Debian/Ubuntu package
- **Install**: `sudo dpkg -i lume-desktop-controller_1.2.0_amd64.deb`

**RPM Package:**
- **Path**: `src-tauri/target/release/bundle/rpm/lume-desktop-controller-1.2.0-1.x86_64.rpm`
- **Type**: RedHat/Fedora package
- **Install**: `sudo rpm -i lume-desktop-controller-1.2.0-1.x86_64.rpm`

**AppImage:**
- **Path**: `src-tauri/target/release/bundle/appimage/lume-desktop-controller_1.2.0_amd64.AppImage`
- **Type**: Portable Linux application
- **Use**: `chmod +x *.AppImage && ./lume-desktop-controller_1.2.0_amd64.AppImage`

## Installation Methods

### macOS Installation

#### Method 1: DMG Installer (Recommended)

1. **Mount the DMG**:
   ```bash
   open "src-tauri/target/release/bundle/dmg/LUME Desktop Controller_1.2.0_aarch64.dmg"
   ```

2. **Install the App**:
   - Drag "LUME Desktop Controller" to the Applications folder
   - The app will be available in Launchpad and Applications

#### Method 2: Direct App Installation

```bash
# Copy app bundle to Applications
cp -r "src-tauri/target/release/bundle/macos/LUME Desktop Controller.app" /Applications/
```

### Windows Installation

#### Method 1: MSI Installer (Recommended)

1. **Run the MSI installer**:
   ```powershell
   # Double-click the MSI file or run via command line
   msiexec /i "LUME Desktop Controller_1.2.0_x64_en-US.msi"
   ```

2. **Follow installation wizard**:
   - Choose installation directory (default: `C:\Program Files\LUME Desktop Controller`)
   - App will be available in Start Menu and Desktop (optional)

#### Method 2: NSIS Installer

```powershell
# Run the NSIS setup executable
.\LUME Desktop Controller_1.2.0_x64-setup.exe
```

#### Method 3: Portable Executable

```powershell
# No installation required - run directly
.\lume-desktop-controller.exe
```

### Linux Installation

#### Ubuntu/Debian (DEB Package)

```bash
# Install the DEB package
sudo dpkg -i lume-desktop-controller_1.2.0_amd64.deb

# If dependencies are missing, fix them
sudo apt-get install -f

# Launch from applications menu or command line
lume-desktop-controller
```

#### Fedora/RHEL (RPM Package)

```bash
# Install the RPM package
sudo rpm -i lume-desktop-controller-1.2.0-1.x86_64.rpm

# Or using dnf (Fedora)
sudo dnf install lume-desktop-controller-1.2.0-1.x86_64.rpm

# Launch from applications menu or command line
lume-desktop-controller
```

#### Universal (AppImage)

```bash
# Make executable and run
chmod +x lume-desktop-controller_1.2.0_amd64.AppImage
./lume-desktop-controller_1.2.0_amd64.AppImage

# Optional: Integrate with desktop environment
# Copy to /opt and create desktop entry
sudo cp lume-desktop-controller_1.2.0_amd64.AppImage /opt/
# Desktop integration varies by distribution
```

### Development Installation

For testing during development (all platforms):

```bash
# Run directly from build directory
tauri dev

# Or build and run release version
tauri build
# Then run the appropriate executable for your platform
```

## Configuration

### App Configuration

The app configuration is stored in `src-tauri/tauri.conf.json`:

```json
{
  "productName": "LUME Desktop Controller",
  "version": "1.2.0",
  "identifier": "com.lume.desktop-controller",
  "bundle": {
    "active": true,
    "targets": ["app", "dmg"],
    "icon": ["icons/icon.icns"],
    "macOS": {
      "minimumSystemVersion": "10.15"
    }
  }
}
```

### Network Discovery

The app automatically discovers ESP32 controllers using mDNS:
- **Firework Controller**: `lume-firework.local`
- **Lighting Controller**: `lume-lighting.local`

## Troubleshooting

### Common Build Issues

1. **Rust Compilation Errors**:
   ```bash
   # Update Rust toolchain
   rustup update
   
   # Clean build cache
   cargo clean
   ```

2. **Node.js Dependency Issues**:
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Remove node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Tauri CLI Issues**:
   ```bash
   # Reinstall Tauri CLI
   npm uninstall -g @tauri-apps/cli
   npm install -g @tauri-apps/cli
   ```

4. **macOS Code Signing**:
   - For distribution, you may need to sign the app with a Developer ID
   - See [Apple's code signing documentation](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)

### Build Performance

- **First Build**: 5-10 minutes (downloads and compiles dependencies)
- **Incremental Builds**: 30-60 seconds
- **Development Builds**: Near-instant frontend updates with hot-reload

### Memory Usage

- **Build Process**: Up to 4GB RAM during Rust compilation
- **Runtime**: ~50-100MB for the desktop app

## Features Included

The built application includes:

### Firework Controller Interface
- Fire individual channels (1-32)
- Program timing sequences
- Emergency stop functionality
- Real-time status monitoring

### Lighting Controller Interface
- Control 12 individual relays
- 5 pre-programmed effects:
  - Solid (all on/off)
  - Strobe (blinking pattern)
  - Chase (sequential activation)
  - Fade (gradual intensity changes)
  - Random (unpredictable patterns)

### Auto-Discovery
- Automatically finds controllers on the local network
- No manual IP configuration required
- Supports multiple controllers simultaneously

## Version Information

- **Application Version**: 1.2.0
- **Tauri Version**: 2.7.0
- **React Version**: 18.3.1
- **Rust Edition**: 2021
- **Target Architecture**: Apple Silicon (ARM64)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the ESP32 controller documentation
3. Submit issues to the project repository

## License

This project is licensed under the MIT License. See the LICENSE file for details.

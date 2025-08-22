# LUME Desktop Controller - Cross-Platform Installation Guide

## Quick Installation

### For End Users

#### macOS
1. **Download**: Get `LUME Desktop Controller_1.2.0_aarch64.dmg` from releases
2. **Install**: Double-click the `.dmg` file and drag to Applications folder
3. **Launch**: Open from Applications or Launchpad

#### Windows
1. **Download**: Get `LUME Desktop Controller_1.2.0_x64_en-US.msi` from releases
2. **Install**: Double-click the `.msi` file and follow the setup wizard
3. **Launch**: Find "LUME Desktop Controller" in Start Menu

#### Linux
**Ubuntu/Debian:**
1. **Download**: Get `lume-desktop-controller_1.2.0_amd64.deb` from releases
2. **Install**: `sudo dpkg -i lume-desktop-controller_1.2.0_amd64.deb`
3. **Launch**: Find in applications menu or run `lume-desktop-controller`

**Fedora/RHEL:**
1. **Download**: Get `lume-desktop-controller-1.2.0-1.x86_64.rpm` from releases
2. **Install**: `sudo dnf install lume-desktop-controller-1.2.0-1.x86_64.rpm`
3. **Launch**: Find in applications menu or run `lume-desktop-controller`

**Universal (Any Linux):**
1. **Download**: Get `lume-desktop-controller_1.2.0_amd64.AppImage` from releases
2. **Make executable**: `chmod +x lume-desktop-controller_1.2.0_amd64.AppImage`
3. **Launch**: `./lume-desktop-controller_1.2.0_amd64.AppImage`

### First Run (All Platforms)
- The app will automatically discover ESP32 controllers on your network
- Connect your firework or lighting controllers to the same WiFi network
- Controllers appear as "lume-firework.local" and "lume-lighting.local"

### System Requirements

#### macOS
- **Version**: 10.15 (Catalina) or later
- **Architecture**: Apple Silicon (M1/M2) or Intel
- **Network**: WiFi connection (same network as ESP32 controllers)

#### Windows
- **Version**: Windows 10 (1903) or later / Windows 11
- **Architecture**: x86_64 (64-bit)
- **Runtime**: Microsoft Visual C++ Redistributable (usually pre-installed)
- **Network**: WiFi connection (same network as ESP32 controllers)

#### Linux
- **Distributions**: Ubuntu 18.04+, Debian 10+, Fedora 32+, Arch Linux, others
- **Architecture**: x86_64 (64-bit)
- **Dependencies**: GTK3, WebKit2GTK (auto-installed with packages)
- **Network**: WiFi connection (same network as ESP32 controllers)

## Building from Source

### Prerequisites

1. Install development tools:
   ```bash
   # Install Node.js
   brew install node
   
   # Install Rust
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   
   # Install Tauri CLI
   npm install -g @tauri-apps/cli
   
   # Install Xcode Command Line Tools
   xcode-select --install
   ```

### Build Steps

1. **Clone and setup**:
   ```bash
   git clone https://github.com/CptPlastic/LUME.git
   cd LUME/src/lume_desk
   npm install
   ```

2. **Development build** (for testing):
   ```bash
   tauri dev
   ```

3. **Production build** (for distribution):
   ```bash
   tauri build --bundles app dmg
   ```

### Build Output

After building, find your packages in:
- **App**: `src-tauri/target/release/bundle/macos/LUME Desktop Controller.app`
- **DMG**: `src-tauri/target/release/bundle/dmg/LUME Desktop Controller_1.2.0_aarch64.dmg`

## Controller Setup

### ESP32 Controllers

Make sure your ESP32 controllers are:

1. **Flashed with LUME firmware**:
   - Firework controller: `src/firework_controller/firework_controller.ino`
   - Lighting controller: `src/lighting_controller/lighting_controller.ino`

2. **Connected to WiFi**:
   - Same network as your Mac
   - Controllers broadcast as `lume-firework.local` and `lume-lighting.local`

3. **Properly wired**:
   - Firework controller: 32 channels
   - Lighting controller: 12 relays on GPIO pins 2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21

## Features

### Firework Controller
- 🎆 Fire individual channels (1-32)
- ⏱️ Program timing sequences  
- 🛑 Emergency stop
- 📊 Real-time status monitoring

### Lighting Controller  
- 💡 Control 12 individual relays
- ✨ 5 lighting effects (Solid, Strobe, Chase, Fade, Random)
- 🔄 Real-time relay status
- 🎮 Manual override controls

### Auto-Discovery
- 🔍 Finds controllers automatically
- 🌐 No IP configuration needed
- 🔗 Supports multiple controllers

## Troubleshooting

### macOS Issues

**App Won't Launch:**
- Check macOS version (10.15+ required)
- Try right-click → Open if security warning appears
- Allow app in System Preferences → Security & Privacy
- For Apple Silicon Macs, ensure you downloaded the ARM64 version

**"Unidentified Developer" Warning:**
```bash
# If app is blocked, allow it manually
sudo xattr -rd com.apple.quarantine "/Applications/LUME Desktop Controller.app"
```

### Windows Issues

**App Won't Install:**
- Ensure you have administrator privileges
- Install Microsoft Visual C++ Redistributable if missing
- Try running installer as administrator: Right-click → "Run as administrator"

**MSI Installer Issues:**
```powershell
# Repair Windows Installer if needed
msiexec /unregister
msiexec /regserver
```

**App Won't Launch:**
- Check Windows version (Windows 10 1903+ required)
- Ensure .NET Framework 4.7.2+ is installed
- Check Windows Defender hasn't quarantined the app

### Linux Issues

**Package Installation Fails:**

**Ubuntu/Debian:**
```bash
# Fix broken dependencies
sudo apt-get install -f
sudo apt-get update

# Install missing dependencies manually
sudo apt-get install libwebkit2gtk-4.0-37 libgtk-3-0
```

**Fedora:**
```bash
# Install missing dependencies
sudo dnf install webkit2gtk3 gtk3
```

**AppImage Won't Run:**
```bash
# Install FUSE if AppImage fails
sudo apt-get install fuse  # Ubuntu/Debian
sudo dnf install fuse      # Fedora

# Or extract and run directly
./lume-desktop-controller_1.2.0_amd64.AppImage --appimage-extract
./squashfs-root/AppRun
```

### Network Issues (All Platforms)

**Controllers Not Found:**
- Verify ESP32 controllers are powered on and connected to WiFi
- Ensure computer and controllers are on the same network
- Check firewall settings (allow local network discovery)
- Test mDNS resolution:

**macOS/Linux:**
```bash
ping lume-firework.local
ping lume-lighting.local
```

**Windows:**
```powershell
# Install Bonjour Print Services if mDNS fails
# Download from Apple: https://support.apple.com/kb/DL999
ping lume-firework.local
ping lume-lighting.local
```

**Firewall Configuration:**
- **macOS**: System Preferences → Security & Privacy → Firewall → Allow LUME Desktop Controller
- **Windows**: Windows Defender Firewall → Allow an app → Add LUME Desktop Controller
- **Linux**: Configure iptables or ufw to allow local network traffic

## Support

- **Documentation**: See `BUILD_GUIDE.md` for detailed build instructions
- **ESP32 Firmware**: Check individual controller Arduino sketches
- **Issues**: Submit to GitHub repository

---

**Version**: 1.2.0 | **Platform**: macOS (Apple Silicon) | **License**: MIT

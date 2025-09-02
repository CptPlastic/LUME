# LUME Update & Offline Features

This document describes the new version checking, auto-update, and offline mode features added to LUME.

## 🔄 Version Management & Updates

### Automatic Version Checking
- LUME automatically checks for updates when connected to the internet
- Update checks happen on startup and can be manually triggered
- Version comparisons use semantic versioning (semver)
- Update information includes changelog, release date, and download URLs

### Network Mode Detection
LUME automatically detects three network modes:

1. **Online** - Connected to internet (can check for updates)
2. **LUME Network** - Connected to LUME controllers (.local hostnames)
3. **Offline** - No network connectivity

### Auto-Update System
- Uses Tauri's built-in updater when available
- Fallback to manual download for browser/development environments
- Critical updates are highlighted and cannot be dismissed
- Non-critical updates can be deferred

## 🌐 Offline Mode

### Show Building Without Controllers
- Enable offline mode to build shows without connected controllers
- Shows are saved with placeholder controller IDs
- When connecting to LUME network later, you can reassign real controllers

### Benefits
- Work on show programming anywhere
- No dependency on physical hardware during creative process
- Export shows to transfer between locations
- Import shows when controllers become available

### How to Use Offline Mode
1. When no controllers are connected, you'll see an option to "Enable Offline Mode"
2. In offline mode, placeholder controllers (`offline-firework-controller`, `offline-lighting-controller`) are used
3. Shows can be built, saved, and exported normally
4. When connecting to LUME network, reassign controllers to sequences

## 🎛️ Controller Management

### Network-Aware Controller Discovery
- Scans for controllers on startup
- Distinguishes between online and LUME network modes
- Continues to work with existing `.local` hostname resolution

### Controller Types
- **Firework Controllers** (`lume-controller.local`)
- **Lighting Controllers** (`lume-lighting.local`)
- Manual IP entry for non-standard configurations

## ⚙️ Configuration

### Environment Variables
Create a `.env` file in the `src/lume_desk` directory:

```env
# Update service URL (default points to LUME update server)
VITE_UPDATE_URL=https://api.lume-controller.com/updates

# Development mode
VITE_DEV_MODE=false

# Custom controller hostnames
VITE_LUME_CONTROLLER_HOST=lume-controller.local
VITE_LUME_LIGHTING_HOST=lume-lighting.local
```

### Update Server Requirements
The update server should provide a REST API at `/latest` returning:

```json
{
  "version": "1.3.0",
  "releaseDate": "2024-12-15T10:00:00Z",
  "changelog": "Added offline mode and auto-updates",
  "downloadUrl": "https://releases.lume-controller.com/v1.3.0/LUME-1.3.0.dmg",
  "critical": false
}
```

## 🚀 Usage Scenarios

### Scenario 1: Online Development
1. LUME detects internet connection
2. Checks for updates on startup
3. Shows update notification if available
4. Can download and install updates

### Scenario 2: LUME Network Operation
1. Connect to LUME SSID
2. LUME detects `.local` controllers
3. Normal operation with hardware controllers
4. No internet updates (expected behavior)

### Scenario 3: Completely Offline
1. No network connectivity
2. Enable offline mode for show building
3. Create and export shows for later use
4. Transfer shows to LUME network when available

## 📱 User Interface

### Update Notification Component
- Displays network status (Online/LUME Network/Offline)
- Shows available updates with changelog
- One-click update downloads
- Offline mode toggle

### Show Builder Enhancements
- Visual indicators for offline mode
- Warning when no controllers connected
- Placeholder controller assignment
- Seamless export/import workflow

## 🔒 Security Considerations

- Update checks use HTTPS only
- No automatic downloads without user confirmation
- Critical updates are clearly marked
- Offline mode doesn't compromise security

## 🛠️ Development

### New Services
- `VersionService` - Handles version checking and updates
- `UpdateNotification` - React component for UI

### Dependencies Added
- `@tauri-apps/api/updater` - Tauri update functionality
- `@tauri-apps/api/shell` - Shell operations for downloads
- `axios` timeout configurations for network detection

### File Changes
- `ShowBuilder.tsx` - Added offline mode support
- `App.tsx` - Integrated update notifications
- `Cargo.toml` - Added updater and shell plugins
- `tauri.conf.json` - Added required permissions

## 📋 Testing

### Manual Testing Scenarios
1. **Online Updates**: Simulate update server responses
2. **Offline Mode**: Disconnect from network, test show building
3. **LUME Network**: Connect to controllers, verify normal operation
4. **Mixed Mode**: Switch between network modes, verify behavior

### Environment Testing
- Test in Tauri app (native)
- Test in development server (web)
- Test on different platforms (macOS, Windows, Linux)

This implementation provides a robust foundation for LUME's operation in various network conditions while maintaining the professional show programming workflow.
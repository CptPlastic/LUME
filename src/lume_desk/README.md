# 🎆 LUME Desktop Controller

Professional desktop application for controlling LUME ESP32-based firework and lighting systems.

## ✨ Features

- 🖥️ **Native Desktop App** - Built with Tauri for performance and native OS integration
- 🎯 **Multi-Controller Management** - Discover and control multiple ESP32 controllers
- 🛡️ **Safety First** - Emergency stop functionality and connection monitoring
- 🎪 **Real-Time Control** - Live status updates and instant response
- 🎨 **Modern UI** - Dark theme with professional styling
- ⚡ **Quick Testing** - Individual channel testing and rapid fire controls

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Rust (for Tauri)
- LUME ESP32 controllers on network

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run tauri:dev
   ```

### Building for Production

```bash
# Build desktop app for current platform
npm run tauri:build
```

## 🎮 Usage

### 1. Controller Discovery

- Click **"Scan"** to discover ESP32 controllers on your network
- Controllers will appear automatically when detected
- Support for firework controllers, light controllers, and generic ESP32 devices

### 2. Controller Management

- **Connect** to available controllers
- **Set Active** controller for primary control
- **Quick Test** individual channels (firework controllers)
- View real-time connection status and last seen time

### 3. Safety Controls

- **Emergency Stop** button prominently displayed in header
- Confirmation dialogs for destructive actions
- Clear visual feedback for all connection states

## 🏗️ Architecture

- **React 18** + **TypeScript** + **Tailwind CSS**
- **Tauri** desktop framework (Rust backend)
- **Zustand** state management
- **Axios** for ESP32 API communication

## 🔌 ESP32 API Integration

Communicates with LUME ESP32 controllers using REST APIs:
- `POST /channel?id=N` - Fire channel (1-12)
- `POST /emergency/stop` - Emergency stop all channels
- `GET /status` - System status and channel states

## 🛡️ Safety Features

- Emergency stop functionality for all controllers
- Confirmation dialogs for channel firing
- Connection state validation before firing
- Graceful handling of connection failures

---

**⚠️ SAFETY REMINDER**: This application controls pyrotechnic devices. Always follow proper safety procedures.

# LUME Firework Controller API Specification

## Overview

The LUME Firework Controller exposes a RESTful HTTP API for remote control via desktop or web applications. The ESP32 runs a web server on port 80 with full CORS support for cross-origin requests.

**Base URL**: `http://[ESP32_IP_ADDRESS]/`  
**Content-Type**: `application/json`  
**CORS**: Enabled for all origins (`*`)

## Current API Endpoints

### System Information

#### `GET /status`
Get current controller status and system information.

**Response**:
```json
{
  "softwareArea": 1,
  "hardwareArea": 1,
  "maxAreas": 99,
  "showRunning": false,
  "showName": "",
  "uptime": 12345,
  "wifiRSSI": -45
}
```

#### `GET /wifi/info`
Get WiFi connection details.

**Response**:
```json
{
  "ssid": "LODGE_IoT",
  "ip": "192.168.1.100",
  "mac": "AA:BB:CC:DD:EE:FF",
  "rssi": -45,
  "quality": 75
}
```

#### `GET /version`
Get version and build information.

**Response**:
```json
{
  "version": "1.2.0-beta",
  "systemName": "LUME Firework Controller",
  "buildDate": "Aug 11 2025",
  "buildTime": "14:32:15",
  "uptime": 12345,
  "uptimeFormatted": "3h 25m 45s"
}
```

### Control Operations

#### `POST /area?id=N`
Navigate to a specific area (1-99).

**Parameters**:
- `id` (query): Area number (1-99)

**Response**:
```json
{
  "success": true,
  "area": 5
}
```

#### `POST /sync?id=N`
Sync software to current hardware area position.

**Parameters**:
- `id` (query): Current hardware area number (1-99)

**Response**:
```json
{
  "success": true,
  "area": 5
}
```

#### `POST /channel?id=N`
Fire a specific channel in the current area.

**Parameters**:
- `id` (query): Channel number (1-12)

**Response**:
```json
{
  "success": true,
  "channel": 3,
  "area": 5
}
```

#### `POST /button?name=NAME`
Press a control button.

**Parameters**:
- `name` (query): Button name (`AREA_UP`, `AREA_DOWN`, `RAPID_FIRE`, `ALL_FIRE`)

**Response**:
```json
{
  "success": true,
  "button": "AREA_UP"
}
```

#### `POST /emergency/stop`
Emergency stop - immediately set all channels to safe state.

**Response**:
```json
{
  "success": true,
  "message": "Emergency stop activated"
}
```

### Administrative

#### `GET /`
Serves the built-in web interface HTML page.

#### `POST /wifi/reset`
**DISABLED** for safety - returns error.

**Response**:
```json
{
  "error": "WiFi reset disabled - AP mode causes dangerous random firing"
}
```

## Error Responses

All endpoints return appropriate HTTP status codes:
- `200 OK` - Success
- `400 Bad Request` - Invalid parameters
- `404 Not Found` - Endpoint not found
- `500 Internal Server Error` - Server error

Error format:
```json
{
  "error": "Description of error"
}
```

## Suggested API Improvements

### 1. Enhanced Status Endpoint
**Current**: Basic system info  
**Suggested**: Add real-time channel states, button states, interference status

```json
{
  "system": {
    "softwareArea": 1,
    "hardwareArea": 1,
    "maxAreas": 99,
    "uptime": 12345,
    "showRunning": false,
    "showName": ""
  },
  "wifi": {
    "connected": true,
    "ssid": "LODGE_IoT",
    "ip": "192.168.1.100",
    "rssi": -45,
    "channel": 1,
    "power": "MINUS_1dBm",
    "interferenceProtection": true
  },
  "channels": {
    "1": {"state": "HIGH", "gpio": 32, "remote": 1, "remoteChannel": 1},
    "2": {"state": "HIGH", "gpio": 33, "remote": 1, "remoteChannel": 2},
    "3": {"state": "HIGH", "gpio": 25, "remote": 1, "remoteChannel": 3, "wifiSensitive": true}
    // ... all 12 channels
  },
  "buttons": {
    "AREA_UP": {"state": "HIGH", "gpio": 21},
    "AREA_DOWN": {"state": "HIGH", "gpio": 23},
    "RAPID_FIRE": {"state": "HIGH", "gpio": 4},
    "ALL_FIRE": {"state": "HIGH", "gpio": 2}
  },
  "safety": {
    "emergencyStopActive": false,
    "interferenceDetected": false,
    "lastInterferenceEvent": null
  }
}
```

### 2. Batch Operations
**New Endpoint**: `POST /batch`
Execute multiple operations in sequence with rollback on failure.

```json
{
  "operations": [
    {"type": "area", "id": 5},
    {"type": "channel", "id": 1},
    {"type": "delay", "ms": 1000},
    {"type": "channel", "id": 2}
  ]
}
```

### 3. Show/Sequence Management
**New Endpoints**:
- `POST /show/load` - Load a show sequence
- `POST /show/start` - Start loaded show
- `POST /show/pause` - Pause running show
- `POST /show/stop` - Stop and reset show
- `GET /show/status` - Get show playback status

### 4. Configuration Management
**New Endpoints**:
- `GET /config` - Get system configuration
- `POST /config` - Update configuration (non-WiFi settings)
- `GET /config/channels` - Get channel mapping
- `POST /config/channels` - Update channel assignments

### 5. Real-time Updates
**Websocket Support**: For real-time status updates
- Channel state changes
- Area navigation
- Show progress
- Emergency events

### 6. Validation and Safety
**Enhanced Parameter Validation**:
- Range checking (areas 1-99, channels 1-12)
- State validation (can't fire if in emergency stop)
- Sequence validation (logical operation order)

**Safety Interlocks**:
- Maximum firing rate limits
- Cooling down periods
- Interference detection reporting

## Desktop/Web Application Considerations

### Recommended Architecture

#### **Desktop App (Electron/Tauri)**
```
┌─────────────────┐    HTTP API    ┌─────────────┐
│   Desktop UI    │ ──────────────→ │   ESP32     │
│   (React/Vue)   │ ←────────────── │ Controller  │
└─────────────────┘    JSON        └─────────────┘
```

#### **Web App**
```
┌─────────────────┐    HTTP API    ┌─────────────┐
│   Browser UI    │ ──────────────→ │   ESP32     │
│   (React/Vue)   │ ←────────────── │ Controller  │
└─────────────────┘    JSON        └─────────────┘
```

### Key Features for Desktop/Web App

#### **1. Real-time Dashboard**
- Live system status
- Channel state indicators
- WiFi signal strength
- Area navigation
- Emergency stop button

#### **2. Show Designer**
- Drag-and-drop sequence builder
- Timeline interface
- Channel grouping
- Timing controls
- Preview mode

#### **3. Safety Controls**
- Emergency stop (prominent red button)
- System health monitoring
- Interference detection alerts
- Connection status monitoring

#### **4. Configuration Manager**
- WiFi settings (with safety warnings)
- Channel mapping
- Timing parameters
- Safety interlocks

#### **5. Show Management**
- Save/load sequences
- Show library
- Export/import formats
- Version control

## Implementation Priority

### Phase 1: Current API Optimization
1. ✅ **Basic control endpoints** (implemented)
2. 🔄 **Enhanced status endpoint** (add channel/button states)
3. 🔄 **Better error handling** (consistent error format)
4. 🔄 **Parameter validation** (range checking)

### Phase 2: Advanced Features
1. 📋 **Batch operations** (sequence control)
2. 📋 **Show management** (load/save sequences)
3. 📋 **Websocket support** (real-time updates)
4. 📋 **Configuration API** (system settings)

### Phase 3: Safety & Monitoring
1. 📋 **Enhanced safety interlocks**
2. 📋 **Interference monitoring API**
3. 📋 **System health reporting**
4. 📋 **Audit logging**

## Example Client Code

### JavaScript/Node.js
```javascript
class LumeController {
  constructor(ip) {
    this.baseUrl = `http://${ip}`;
  }

  async getStatus() {
    const response = await fetch(`${this.baseUrl}/status`);
    return response.json();
  }

  async setArea(areaId) {
    const response = await fetch(`${this.baseUrl}/area?id=${areaId}`, {
      method: 'POST'
    });
    return response.json();
  }

  async fireChannel(channelId) {
    const response = await fetch(`${this.baseUrl}/channel?id=${channelId}`, {
      method: 'POST'
    });
    return response.json();
  }

  async emergencyStop() {
    const response = await fetch(`${this.baseUrl}/emergency/stop`, {
      method: 'POST'
    });
    return response.json();
  }
}

// Usage
const controller = new LumeController('192.168.1.100');
await controller.setArea(5);
await controller.fireChannel(3);
```

### Python
```python
import requests

class LumeController:
    def __init__(self, ip):
        self.base_url = f"http://{ip}"

    def get_status(self):
        response = requests.get(f"{self.base_url}/status")
        return response.json()

    def set_area(self, area_id):
        response = requests.post(f"{self.base_url}/area", params={"id": area_id})
        return response.json()

    def fire_channel(self, channel_id):
        response = requests.post(f"{self.base_url}/channel", params={"id": channel_id})
        return response.json()

    def emergency_stop(self):
        response = requests.post(f"{self.base_url}/emergency/stop")
        return response.json()

# Usage
controller = LumeController('192.168.1.100')
controller.set_area(5)
controller.fire_channel(3)
```

## Security Considerations

### Current Security
- ✅ **No authentication** (suitable for closed networks)
- ✅ **CORS enabled** (allows cross-origin requests)
- ✅ **WiFi reset disabled** (prevents AP mode safety issues)

### Recommended Enhancements
- 🔄 **API rate limiting** (prevent accidental rapid firing)
- 🔄 **Request validation** (parameter bounds checking)
- 📋 **Basic authentication** (optional, for production use)
- 📋 **HTTPS support** (optional, for sensitive environments)

---

**Next Steps**: Would you like me to implement any of these API improvements, or would you prefer to start with a specific desktop/web application framework?

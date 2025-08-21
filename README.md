<div align="center">

# 🎆 LUME Professional Display Control System

[![Version](https://img.shields.io/badge/version-v1.2.0--beta-blue.svg)](VERSION.md)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Platform](https://img.shields.io/badge/platform-ESP32-orange.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

**Professional Wireless Firework & Lighting Display Control System**

*Safe • Reliable • Remote • Synchronized*

</div>

---

## 🌟 Overview

LUME is a cutting-edge display control system built on ESP32 technology, offering professional-grade wireless control for complex pyrotechnic and lighting displays. Designed with safety as the top priority, LUME provides reliable remote operation through WiFi connectivity and comprehensive interference protection.

### ✨ Key Features

- 🎯 **12-Channel Control** - Full support for 12 independent channels per controller
- 🌐 **WiFi Remote Access** - Web-based control interface  
- 🛡️ **Safety Systems** - Multiple interference protection layers  
- 📡 **433MHz Compatible** - Engineered for radio frequency environments  
- ⚡ **Real-Time Control** - Instant response and status monitoring  
- 🎪 **99 Areas Support** - Organize complex multi-area displays
- 💡 **Dual Control Types** - Firework channels + Lighting effects
- 🎭 **Synchronized Shows** - Coordinate fireworks and lighting together

## 🎮 Controller Types

### 🎆 Firework Controller

Professional pyrotechnic control with BL-1200 radio integration:

- 12 fire channels per area (3 × 4-channel remotes)
- INPUT_PULLUP button simulation
- 433MHz interference protection
- Emergency stop systems

### 💡 Lighting Controller

Professional lighting control with relay switching:

- 12 relay channels per area
- Multiple lighting effects (Solid, Strobe, Chase, Fade, Random)
- Brightness control
- Real-time effect management

## 🔧 System Architecture

```text
┌─────────────────┐    WiFi     ┌─────────────────┐    433MHz    ┌─────────────────┐
│   Web Browser   │◄──────────►│   ESP32 WROOM   │◄───────────►│  BL-1200 Remote │
│  Control Panel  │             │   Controller    │              │  Fire Channels  │
└─────────────────┘             └─────────────────┘              └─────────────────┘
```

**Hardware**: ESP32 WROOM + Bilusocn BL-1200 firework controller  
**Channels**: 12 fire channels per area (3 × 4-channel remotes)  
**Areas**: Support for 99 different display areas  
**Control**: WiFi web interface + serial command interface  
**Safety**: Multiple interference protection systems

## 🚀 Quick Start Guide

### 1. 🚨 SAFETY FIRST - Power-On Sequence

```text
1. Power on ESP32 controller
2. Wait for "WiFi connected!" message in serial monitor
3. ONLY THEN power on the firework remote hardware
4. Access web interface at displayed IP address
```

**⚠️ Critical**: During WiFi connection, GPIO interference can cause random channel firing. Always wait for full system initialization before energizing firework hardware.

### 2. 📡 WiFi Configuration

Edit these lines at the top of `firework_controller.ino`:

```cpp
const char* WIFI_SSID = "your_network_name";     // Your WiFi network
const char* WIFI_PASSWORD = "your_password";     // Your WiFi password
```

### 3. 🌐 Web Interface Access

Once connected, access the control panel at: `http://[IP ADDRESS]`

- Real-time system status
- Area navigation (1-99)
- Individual channel testing
- Emergency stop functionality

## 🔌 Hardware Configuration

### Fire Channels (12 total)

```text
Channel 1:  GPIO 32  (Remote 1, Channel 1) ✅ Working
Channel 2:  GPIO 33  (Remote 1, Channel 2) ✅ Working 
Channel 3:  GPIO 25  (Remote 1, Channel 3) ✅ Working (WiFi protected)
Channel 4:  GPIO 26  (Remote 1, Channel 4) ✅ Working
Channel 5:  GPIO 18  (Remote 2, Channel 1) ✅ Working
Channel 6:  GPIO 5   (Remote 2, Channel 2) ✅ Working (FIXED - boot HIGH required)
Channel 7:  GPIO 13  (Remote 2, Channel 3) ✅ Working
Channel 8:  GPIO 27  (Remote 2, Channel 4) ✅ Working
Channel 9:  GPIO 15  (Remote 3, Channel 1) ✅ Working (FIXED - safe for runtime)
Channel 10: GPIO 17  (Remote 3, Channel 2) ✅ Working
Channel 11: GPIO 22  (Remote 3, Channel 3) ✅ Working
Channel 12: GPIO 19  (Remote 3, Channel 4) ✅ Working
```

#### ✅ PRODUCTION READY CONFIGURATION

- **Channel 6**: Moved from GPIO 14 to GPIO 5 (boot HIGH required)
- **Channel 9**: Moved from GPIO 16 to GPIO 15 (safe for runtime operation)
- **No boot-time firing issues**
- **WiFi interference protection active for Channel 3**

### Control Buttons (4 total)

```text
AREA_UP:    GPIO 21  (Navigate between areas)
AREA_DOWN:  GPIO 23  (Navigate between areas)
RAPID_FIRE: GPIO 4   (Quick sequential firing)
ALL_FIRE:   GPIO 2   (Fire all channels in area)
```

## 💡 Lighting Controller Configuration

### Relay Channels (12 total)

```text
Relay 1:  GPIO 32  (Zone 1) ✅ Working
Relay 2:  GPIO 33  (Zone 2) ✅ Working 
Relay 3:  GPIO 14  (Zone 3) ✅ Working (FIXED - no WiFi sensitivity)
Relay 4:  GPIO 26  (Zone 4) ✅ Working
Relay 5:  GPIO 18  (Zone 5) ✅ Working
Relay 6:  GPIO 5   (Zone 6) ✅ Working
Relay 7:  GPIO 13  (Zone 7) ✅ Working
Relay 8:  GPIO 27  (Zone 8) ✅ Working
Relay 9:  GPIO 15  (Zone 9) ✅ Working
Relay 10: GPIO 17  (Zone 10) ✅ Working
Relay 11: GPIO 22  (Zone 11) ✅ Working
Relay 12: GPIO 19  (Zone 12) ✅ Working
```

### Status LEDs

```text
RED LED:   GPIO 21  (Effect running indicator)
GREEN LED: GPIO 23  (Safe/ready indicator)
```

### Lighting Effects

- **SOLID**: All lights on constantly
- **STROBE**: All lights flash in unison
- **CHASE**: Lights activate in sequence 1→12
- **FADE**: Simulated fade using timed relay patterns
- **RANDOM**: Random relay activation patterns

### Lighting API Endpoints

- `GET /` - Lighting web interface
- `GET /status` - Controller status with relay states
- `POST /area?id=N` - Set lighting area (1-99)
- `POST /relay?id=N&state=ON/OFF` - Control individual relay
- `POST /relay/toggle?id=N` - Toggle relay state
- `POST /all?state=ON/OFF` - Control all relays
- `POST /effect?type=TYPE&interval=MS` - Start lighting effect
- `POST /effect/stop` - Stop current effect
- `POST /emergency/stop` - Emergency all-off

### Lighting Serial Commands

```text
RELAY <1-12> <ON/OFF>  - Control individual relay
ALL <ON/OFF>           - Control all relays
EFFECT <TYPE>          - Start effect (SOLID/STROBE/CHASE/FADE/RANDOM)
STOP                   - Stop current effect
AREA <1-99>           - Set lighting area
STATUS                - Show lighting system status
```

## 🛡️ WiFi Interference Protection

### 433MHz Radio Interference Mitigation

- **WiFi Channel**: Forced to Channel 1 (2412MHz) - away from 433MHz harmonics
- **WiFi Power**: Minimum (-1dBm) to reduce electromagnetic interference
- **Protected Channels**: GPIO 25 (Ch 3) and GPIO 16 (Ch 9) have extra protection
- **Power Saving**: Disabled to prevent GPIO fluctuations

### Connection Process

```text
1. Pre-connection protection applied
2. WiFi power set to minimum
3. Sensitive channels forced to safe state
4. Connection attempted with periodic re-protection
5. Full mitigation confirmed when connected
```

## ⌨️ Serial Commands

Connect via Serial Monitor (115200 baud):

```text
START                    - Test all 12 channels in current area
STOP                     - Emergency stop, set all pins safe
CHANNEL <1-12>          - Test individual channel
BUTTON <BUTTON_NAME>    - Test control button
AREA <1-99>             - Navigate to specific area
SYNC <1-99>             - Sync software to current hardware area
STATUS                  - Show system information
```

## 📡 API Endpoints

### Control Endpoints

- `GET /` - Web interface
- `GET /status` - System status JSON
- `POST /area?id=N` - Set area (1-99)
- `POST /sync?id=N` - Sync hardware area
- `POST /channel?id=N` - Fire channel (1-12)
- `POST /button?name=NAME` - Press control button
- `POST /emergency/stop` - Emergency stop

### Information Endpoints

- `GET /wifi/info` - WiFi connection details
- `GET /version` - Version and build information
- `POST /wifi/reset` - DISABLED for safety

## 🛡️ Safety Features

### Hardware Safety

- **INPUT_PULLUP simulation**: Proper button press simulation without interfering with existing circuits
- **Safe GPIO selection**: Only uses pins safe for ESP32 operation
- **Emergency stop**: Immediate safe state for all channels

### WiFi Safety

- **No AP mode**: Prevents dangerous random firing from captive portal interference
- **Interference monitoring**: Real-time protection during operation
- **Power-on sequence**: Prevents firing during system initialization

### Operational Safety

- **99-area support**: Organized channel management
- **Clear status reporting**: Always know system state
- **Manual override**: Serial commands always available

## 🔧 Troubleshooting

### WiFi Issues

- Check credentials in code
- Ensure 2.4GHz network (not 5GHz)
- Keep ESP32 away from 433MHz radio during connection
- Look for "Pre-connection interference protection applied" message

### Channel Issues

- Use STATUS command to check pin states
- Verify hardware connections match GPIO assignments
- Ensure proper power-on sequence (ESP32 first, then remotes)

### Connection Issues

- Serial monitor shows all system messages
- Web interface requires successful WiFi connection
- IP address displayed in serial output and startup messages

## 💻 Technical Details

### Button Simulation Method

```cpp
pinMode(pin, OUTPUT);     // Prepare to simulate press
digitalWrite(pin, LOW);   // Simulate button pressed
delay(pressTime);         // Hold press duration
pinMode(pin, INPUT_PULLUP); // Return to safe state
```

### Interference Protection Sequence

```cpp
WiFi.setSleep(false);                    // Stable power
WiFi.setTxPower(WIFI_POWER_MINUS_1dBm); // Minimum interference
pinMode(FIRE_CHANNEL_3, INPUT_PULLUP);  // Protect Channel 3
digitalWrite(FIRE_CHANNEL_9, HIGH);     // Force Channel 9 HIGH
```

## 🚀 Development Notes

### Pin Safety Guidelines

- Always use pins from the approved safe list
- Test thoroughly before connecting to firework hardware
- Monitor serial output for interference warnings
- Maintain the power-on sequence for safety

### Code Structure

- `setupWiFi()`: Handles connection with interference protection
- `pressButton()`: Safe button simulation
- `setupAPI()`: Web interface and REST endpoints
- Loop monitoring for stable operation

## 📋 Future Development

### 🎯 Next Phase Priorities

#### Desktop/Web Application Development

- [ ] **Choose framework**: Tauri + React vs. Web App (React/Vue + Vite)
- [ ] **Basic control interface**: Area navigation, channel firing, emergency stop
- [ ] **Real-time status display**: Connection, WiFi strength, channel states
- [ ] **Show designer**: Drag-and-drop sequence builder with timeline
- [ ] **File management**: Save/load shows, export/import sequences

#### ESP32 API Enhancements

- [ ] **Enhanced status endpoint**: Real-time channel/button states, interference status
- [ ] **Parameter validation**: Range checking (areas 1-99, channels 1-12), error messages
- [ ] **Batch operations**: `/batch` endpoint for sequence control with delays
- [ ] **Rate limiting**: Safety intervals between channel fires (100ms minimum)
- [ ] **Configuration API**: System settings, channel mapping, safety parameters

#### Advanced Features (Phase 2)

- [ ] **Websocket support**: Real-time updates for live dashboard
- [ ] **Show playback system**: Load/start/pause/stop sequences
- [ ] **Enhanced safety**: Interference monitoring API, audit logging
- [ ] **Better error handling**: Consistent JSON error format across all endpoints

### 🎯 Immediate Next Steps

1. **Decision point**: Desktop app vs. Web app for primary interface
2. **API Priority**: Which improvements to implement first (recommend enhanced status)
3. **Framework setup**: Initialize chosen application framework
4. **Basic connectivity**: Get app talking to ESP32 current API

### 📝 Development Context

- **Current API**: 9 endpoints functional, CORS enabled, safety-focused
- **Hardware status**: WiFi interference solved, 433MHz compatibility confirmed
- **Safety systems**: All protection mechanisms working, documentation complete
- **Ready for**: External application development and API enhancement

### 🔧 Technical Debt

- Markdown lint errors in documentation files (cosmetic)
- Enhanced status endpoint needs implementation for richer app data
- Batch operations would significantly improve sequence control
- Rate limiting essential for production safety
- **✅ RESOLVED: All pin issues fixed - all 12 channels working safely**

### 📊 Version Management

- [x] **Automatic version detection**: ESP32 displays version on startup ✅
- [x] **Version API endpoint**: `GET /version` returns build info ✅  
- [x] **Version tracking**: VERSION.md maintains release history ✅
- [ ] **Desktop app version sync**: Match app version to ESP32 firmware
- [ ] **Update notifications**: Alert when new firmware available
- [ ] **Git release tags**: Tag each stable version in repository

---

<div align="center">

### ⚠️ CRITICAL SAFETY REMINDER

**Never power firework remote hardware until ESP32 WiFi connection is complete and stable.**

**Always follow proper power-on sequence to prevent accidental firing.**

---

*LUME Firework Controller System - Professional Grade Pyrotechnic Control*

</div>

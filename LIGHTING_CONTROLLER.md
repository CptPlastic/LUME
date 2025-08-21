# 💡 LUME Lighting Controller

## Overview

The LUME Lighting Controller is an ESP32-based system for controlling up to 12 relay-switched lighting zones per area, with support for 99 areas. It's designed to work alongside the LUME Firework Controller for synchronized pyrotechnic and lighting displays.

## Features

- **12 Relay Channels** per area
- **5 Built-in Effects** (Solid, Strobe, Chase, Fade, Random)  
- **99 Area Support** for large installations
- **WiFi Control** with web interface
- **Real-time Status** monitoring
- **Safety Systems** with emergency stop
- **Compatible API** with firework controller

## Quick Start

### 1. Hardware Setup

Connect your relays to the designated GPIO pins:

```text
Relay 1-4:   GPIO 32, 33, 14, 26
Relay 5-8:   GPIO 18, 5, 13, 27  
Relay 9-12:  GPIO 15, 17, 22, 19
Status LEDs: GPIO 21 (Red), 23 (Green)
```

### 2. WiFi Configuration

Edit the WiFi credentials in `lighting_controller.ino`:

```cpp
const char* WIFI_SSID = "your_network_name";
const char* WIFI_PASSWORD = "your_password";
```

### 3. Upload and Connect

1. Upload the sketch to your ESP32
2. Monitor serial output for IP address
3. Access web interface at `http://[IP_ADDRESS]`
4. Or use mDNS: `http://lume-lighting.local`

## Web Interface

The lighting controller provides a comprehensive web interface:

- **System Status** - Area, effect status, WiFi info
- **Quick Actions** - All On/Off, emergency stop
- **Lighting Effects** - Start/stop effects with one click
- **Individual Relays** - Manual control of each relay
- **Real-time Updates** - Live status display

## Serial Commands

Connect via Serial Monitor (115200 baud):

```bash
# Individual relay control
RELAY 1 ON          # Turn on relay 1
RELAY 5 OFF         # Turn off relay 5

# All relay control  
ALL ON              # Turn on all relays
ALL OFF             # Turn off all relays

# Lighting effects
EFFECT SOLID        # All lights on
EFFECT STROBE       # Strobe effect
EFFECT CHASE        # Chase effect
EFFECT FADE         # Fade effect  
EFFECT RANDOM       # Random effect
STOP                # Stop current effect

# Area management
AREA 5              # Switch to area 5
STATUS              # Show system status
```

## API Reference

### Status Endpoint

```http
GET /status
```

Returns system status including relay states:

```json
{
  "area": 1,
  "maxAreas": 99,
  "effectRunning": true,
  "effectName": "Strobe",
  "brightness": 255,
  "uptime": 12345,
  "wifiRSSI": -45,
  "relayStates": [true, false, true, false, ...]
}
```

### Relay Control

```http
POST /relay?id=1&state=ON    # Turn on relay 1
POST /relay?id=5&state=OFF   # Turn off relay 5
POST /relay/toggle?id=3      # Toggle relay 3
```

### All Relay Control

```http
POST /all?state=ON           # Turn on all relays
POST /all?state=OFF          # Turn off all relays
```

### Effect Control

```http
POST /effect?type=STROBE&interval=500   # Start strobe effect
POST /effect?type=CHASE&interval=200    # Start chase effect
POST /effect/stop                       # Stop current effect
```

### Emergency Stop

```http
POST /emergency/stop         # Turn off all relays immediately
```

## Lighting Effects

### SOLID
All relays turn on and stay on. Perfect for general illumination.

### STROBE  
All relays flash in unison. Adjustable interval (default 500ms).

### CHASE
Relays activate in sequence from 1→12, creating a "chase" effect. Adjustable speed (default 200ms).

### FADE
Simulates a fade effect using timed relay patterns. Creates a wave-like lighting pattern.

### RANDOM
Random relay activation creating unpredictable lighting patterns. Great for dynamic effects.

## Safety Features

- **Emergency Stop** - Immediate shutdown of all relays
- **Safe Initialization** - All relays start in OFF state  
- **Status LEDs** - Visual indication of system state
- **WiFi Protection** - Same interference mitigation as firework controller
- **Graceful Shutdown** - Proper cleanup when stopping effects

## Integration with Firework Controller

The lighting controller uses the same API patterns and WiFi configuration as the firework controller, making it easy to:

- Use the same desktop application
- Coordinate shows between multiple controllers
- Share WiFi networks and settings
- Implement synchronized timing

## Troubleshooting

### Relays Not Responding
- Check GPIO connections
- Verify relay board power supply
- Use STATUS command to check relay states
- Test individual relays with RELAY command

### WiFi Issues
- Same troubleshooting as firework controller
- Check credentials in code
- Monitor serial output for connection status
- Ensure 2.4GHz WiFi network

### Effect Issues
- Use STOP command to reset
- Check effect parameters in API calls
- Monitor serial output for error messages
- Verify sufficient power supply for all relays

## Technical Specifications

- **Platform**: ESP32 WROOM
- **GPIO Pins**: 12 relay outputs + 2 status LEDs
- **Power**: 5V recommended for relay board
- **WiFi**: 2.4GHz, WPA2 compatible
- **Memory**: Uses minimal RAM for effect state
- **Response Time**: <50ms for relay switching
- **Max Current**: Depends on relay specifications

## Advanced Usage

### Custom Effects
Modify the effect functions in the code to create custom lighting patterns:

```cpp
void runCustomEffect() {
  // Your custom effect logic here
  if (millis() - lastEffectUpdate >= effectInterval) {
    // Update relay states
    lastEffectUpdate = millis();
  }
}
```

### Multiple Controllers
Deploy multiple lighting controllers for large installations:

- Use different mDNS names (`lume-lighting-1`, `lume-lighting-2`)
- Coordinate via desktop application
- Implement area-based organization
- Synchronize timing across controllers

### Integration Examples
- **Firework Shows**: Coordinate lighting with pyrotechnic sequences
- **Concerts**: Dynamic lighting effects synchronized to music
- **Architecture**: Building illumination with programmable patterns
- **Events**: Custom lighting for weddings, parties, installations

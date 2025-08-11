# LUME Controller RGB LED Wiring Diagram

## RGB LED Status Indicator Wiring

### Components Needed:
- 1x Common Cathode RGB LED (5mm or SMD)
- 3x 220Ω resistors (red-red-brown-gold)
- Jumper wires
- Breadboard (optional)

### ESP32 WROOM Pin Assignments:
```
RGB_RED_PIN   = GPIO 12 (Hardware Pin 14)
RGB_GREEN_PIN = GPIO 5  (Hardware Pin 29) 
RGB_BLUE_PIN  = GPIO 0  (Hardware Pin 25)
```

### Wiring Diagram:
```
ESP32 WROOM                    RGB LED (Common Cathode)
                              
GPIO 12 (Pin 14) ──[220Ω]──── Red Anode    ┐
                                           │
GPIO 5  (Pin 29) ──[220Ω]──── Green Anode  │  RGB LED
                                           │  (top view)
GPIO 0  (Pin 25) ──[220Ω]──── Blue Anode   │
                                           │
GND              ─────────── Common Cathode ┘

Legend:
[220Ω] = 220 ohm resistor
──     = wire connection
```

### Breadboard Layout:
```
ESP32 Side              Breadboard              RGB LED Side
                       
Pin 14 (GPIO 12) ────── Row 1 ──[220Ω]──── Red wire
Pin 29 (GPIO 5)  ────── Row 2 ──[220Ω]──── Green wire  
Pin 25 (GPIO 0)  ────── Row 3 ──[220Ω]──── Blue wire
GND              ────── Row 4 ─────────── Black wire (cathode)
```

### RGB LED Pinout (Common Cathode):
```
Looking at LED from top (flat side = cathode):

    Red   Cathode   Green   Blue
     │       │        │      │
     1       2        3      4
     
Pin 1: Red Anode    (+)
Pin 2: Cathode      (-) Common Ground
Pin 3: Green Anode  (+)  
Pin 4: Blue Anode   (+)
```

### Step-by-Step Wiring:

1. **Connect Resistors:**
   - Red: GPIO 12 → 220Ω resistor → Red LED pin
   - Green: GPIO 5 → 220Ω resistor → Green LED pin
   - Blue: GPIO 0 → 220Ω resistor → Blue LED pin

2. **Connect Ground:**
   - ESP32 GND → LED common cathode (pin 2)

3. **Verify Connections:**
   - Check resistor color codes: Red-Red-Brown-Gold = 220Ω
   - Ensure common cathode goes to ground
   - Double-check GPIO pin numbers

### Status Color Reference:
- 🤍 **White** (R+G+B): Booting up
- 🔵 **Blue** (B only): WiFi AP mode (setup)
- 🟡 **Yellow** (R+G): Connecting to WiFi
- 🟢 **Green** (G only): Connected and ready
- 🔴 **Red** (R only): Armed/Show running
- 🟣 **Purple** (R+B): Error state
- ⚫ **Off**: System powered down

### Important Notes:

⚠️ **Boot Requirements:**
- GPIO 12 must be LOW during boot (LED will be dim red briefly)
- GPIO 5 must be HIGH during boot (LED will be dim green briefly)
- GPIO 0 must be HIGH during boot (LED will be dim blue briefly)
- This is normal behavior and won't affect operation

⚠️ **Safety:**
- Always use 220Ω resistors to prevent LED burnout
- Double-check polarity before powering on
- Common cathode LEDs have the longest pin as cathode

### Testing:
After wiring, upload the code and you should see:
1. White flash during boot
2. Yellow while connecting to WiFi
3. Blue if entering AP mode
4. Green when connected and ready

### Troubleshooting:
- **No light:** Check ground connection and resistors
- **Wrong colors:** Verify anode connections (R/G/B pins)
- **Dim light:** Check if using common anode instead of cathode
- **Flickering:** Ensure stable power supply

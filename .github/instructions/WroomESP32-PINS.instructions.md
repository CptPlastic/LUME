````instructions
---
applyTo: '**/.ino'
---

# ESP32 WROOM Pin Configuration Guide

## LUME Firework Controller Pin Assignments

### GPIO Pin Safety Reference
Pin  	  Pin Label  	  GPIO  	  Safe to use?  	Reason / LUME Usage
4	SENSOR_VP	GPIO36		Input only GPIO, cannot be configured as output
5	SENSOR_VN	GPIO39		Input only GPIO, cannot be configured as output
6	IO34	GPIO34		Input only GPIO, cannot be configured as output
7	IO35	GPIO35		Input only GPIO, cannot be configured as output
8	IO32	GPIO32		SAFE - FIRE_CHANNEL_1 (Remote 1, Ch 1)
9	IO33	GPIO33		SAFE - FIRE_CHANNEL_2 (Remote 1, Ch 2)
10	IO25	GPIO25		SAFE - FIRE_CHANNEL_3 (Remote 1, Ch 3) ⚠️ WiFi sensitive
11	IO26	GPIO26		SAFE - FIRE_CHANNEL_4 (Remote 1, Ch 4)
12	IO27	GPIO27		SAFE - FIRE_CHANNEL_8 (Remote 2, Ch 4)
13	IO14	GPIO14		SAFE - FIRE_CHANNEL_6 (Remote 2, Ch 2)
14	IO12	GPIO12		must be LOW during boot
16	IO13	GPIO13		SAFE - FIRE_CHANNEL_7 (Remote 2, Ch 3)
17	SHD/SD2	GPIO9		Connected to Flash memory
18	SWP/SD3	GPIO10		Connected to Flash memory
19	SCS/CMD	GPIO11		Connected to Flash memory
20	SCK/CLK	GPIO6		Connected to Flash memory
21	SDO/SD0	GPIO7		Connected to Flash memory
22	SDI/SD1	GPIO8		Connected to Flash memory
23	IO15	GPIO15		must be HIGH during boot, prevents startup log if pulled LOW
24	IO2	    GPIO2		SAFE - BUTTON_ALL_FIRE (with boot considerations)
25	IO0	    GPIO0		must be HIGH during boot and LOW for programming
26	IO4	    GPIO4		SAFE - BUTTON_RAPID_FIRE
27	IO16	GPIO16		SAFE - FIRE_CHANNEL_9 (Remote 3, Ch 1) ⚠️ WiFi sensitive
28	IO17	GPIO17		SAFE - FIRE_CHANNEL_10 (Remote 3, Ch 2)
29	IO5	    GPIO5		must be HIGH during boot
30	IO18	GPIO18		SAFE - FIRE_CHANNEL_5 (Remote 2, Ch 1)
31	IO19	GPIO19		SAFE - FIRE_CHANNEL_12 (Remote 3, Ch 4)
33	IO21	GPIO21		SAFE - BUTTON_AREA_UP
34	RXD0	GPIO3		Rx pin, used for flashing and debugging
35	TXD0	GPIO1		Tx pin, used for flashing and debugging
36	IO22	GPIO22		SAFE - FIRE_CHANNEL_11 (Remote 3, Ch 3)
37	IO23	GPIO23		SAFE - BUTTON_AREA_DOWN

## LUME Firework Controller Configuration

### Fire Channels (12 total - 3 remotes × 4 channels each)
```
Remote 1: GPIO 32, 33, 25, 26  (Channels 1-4)
Remote 2: GPIO 18, 14, 13, 27  (Channels 5-8)
Remote 3: GPIO 16, 17, 22, 19  (Channels 9-12)
```

### Control Buttons (4 total)
```
AREA_UP:    GPIO 21  (Hardware area navigation up)
AREA_DOWN:  GPIO 23  (Hardware area navigation down)
RAPID_FIRE: GPIO 4   (Sequential channel firing)
ALL_FIRE:   GPIO 2   (Fire all channels in current area)
```

### WiFi Interference Sensitive Pins
- **GPIO 25 (Channel 3)**: WiFi DAC operations can cause interference
- **GPIO 16 (Channel 9)**: Used for PSRAM on some ESP32 variants, sensitive to WiFi power fluctuations

**Mitigation Applied:**
- WiFi power reduced to minimum (-1dBm)
- WiFi forced to Channel 1 (2412MHz) away from 433MHz harmonics  
- Pre-connection protection with digitalWrite(HIGH) for sensitive pins
- Periodic re-protection during connection process

## Button Simulation Best Practices

When interfacing ESP32 with hardware that has existing physical buttons:

**CORRECT METHOD (INPUT_PULLUP):**
```arduino
// Safe state (button not pressed)
pinMode(pin, INPUT_PULLUP);

// Simulate button press
pinMode(pin, OUTPUT);
digitalWrite(pin, LOW);
delay(pressTime);

// Release button
pinMode(pin, INPUT_PULLUP);
```

**AVOID:**
- Setting pins to OUTPUT HIGH/LOW continuously
- Using digitalWrite(pin, HIGH) for button simulation
- Keeping pins in OUTPUT mode when not actively pressing

**Why INPUT_PULLUP works:**
- Mimics natural button state (not pressed) with internal pull-up resistor
- OUTPUT LOW briefly simulates button press to ground
- Returns to INPUT_PULLUP to release button properly
- Allows physical buttons to work normally when ESP32 is idle

## Safety Considerations

### Power-On Sequence (CRITICAL)
1. **Power ESP32 first** - Allow full WiFi connection and initialization
2. **Wait for "WiFi connected!" message** in serial monitor
3. **ONLY THEN power on firework remote hardware**

**Why**: GPIO interference during WiFi connection can cause random channel firing. The WiFi interference protection is not fully active until connection is complete.

### 433MHz Radio Interference
- Keep ESP32 physically separated from 433MHz radio transmitters
- WiFi 2.4GHz can interfere with 433MHz harmonics (especially 6th harmonic at 2598MHz)
- Minimum WiFi power and Channel 1 selection minimizes interference

### Emergency Procedures
- Serial commands always available for emergency stop
- Web interface emergency stop button immediately sets all pins to safe state
- All channels return to INPUT_PULLUP on any error condition

## Development Notes

### Testing New Pin Assignments
1. Test with LED indicators before connecting to firework hardware
2. Monitor serial output for interference warnings during WiFi connection
3. Verify INPUT_PULLUP safe state behavior
4. Test button simulation timing (recommended 500-1000ms press duration)

### Debugging WiFi Interference
- Use STATUS command to monitor real-time pin states
- Look for "Pre-connection interference protection applied" messages
- Check for "R" indicators during connection (re-protection events)
- Verify WiFi Channel 1 selection and -1dBm power setting

---

**⚠️ CRITICAL**: Always follow proper power-on sequence. Never energize firework hardware until ESP32 WiFi is fully connected and stable.
````
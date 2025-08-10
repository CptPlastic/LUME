# Bilusocn BL-1200 Hardware Integration

This document describes the integration of the ESP32 WROOM module with the Bilusocn BL-1200 firework controller hardware.

## Pin Mapping

- FIRE_CHANNEL_1: GPIO 16
- FIRE_CHANNEL_2: GPIO 17
- FIRE_CHANNEL_3: GPIO 18
- FIRE_CHANNEL_4: GPIO 19
- FIRE_CHANNEL_5: GPIO 21
- FIRE_CHANNEL_6: GPIO 22
- FIRE_CHANNEL_7: GPIO 23
- FIRE_CHANNEL_8: GPIO 25
- FIRE_CHANNEL_9: GPIO 26
- FIRE_CHANNEL_10: GPIO 27
- FIRE_CHANNEL_11: GPIO 32
- FIRE_CHANNEL_12: GPIO 33
- RAPID_ALL_FIRE: GPIO 4
- AREA_MODULATION: GPIO 5

Assign additional ESP32 GPIO pins for "Rapid All Fire" and "Area Modulation" buttons as needed.

## Notes

- Ensure all firework channels are set to HIGH on startup for safety (unpressed state).
- Set RAPID_ALL_FIRE and AREA_MODULATION pins HIGH on startup (unpressed state).
- To simulate a button press, set the corresponding GPIO LOW.
- Document any additional wiring, sensors, or features as you expand the project.

## Next Steps
- Implement firing logic in `firework_controller.ino`
- Add communication (e.g., WiFi, Bluetooth) for remote control
- Add safety checks and status feedback

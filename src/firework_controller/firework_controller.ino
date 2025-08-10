// ESP32 WROOM Firework Controller Firmware
// Target hardware: Bilusocn BL-1200
// Author: CptPlastic
// Date: August 2025

// Pin mapping for BL-1200 integration (12 numbered buttons + special functions)
#define FIRE_CHANNEL_1     16
#define FIRE_CHANNEL_2     17
#define FIRE_CHANNEL_3     18
#define FIRE_CHANNEL_4     19
#define FIRE_CHANNEL_5     21
#define FIRE_CHANNEL_6     22
#define FIRE_CHANNEL_7     23
#define FIRE_CHANNEL_8     25
#define FIRE_CHANNEL_9     26
#define FIRE_CHANNEL_10    27
#define FIRE_CHANNEL_11    32
#define FIRE_CHANNEL_12    33
#define RAPID_ALL_FIRE     4
#define AREA_MODULATION_UP    5
#define AREA_MODULATION_DOWN  15

// Area and channel tracking
#include <Preferences.h>
Preferences prefs;
int currentArea = 1;
const int minArea = 1;
const int maxArea = 99;
const int channelsPerArea = 16; // 4 remotes x 4 channels

void setup() {
  Serial.begin(115200);
  pinMode(FIRE_CHANNEL_1, OUTPUT);
  pinMode(FIRE_CHANNEL_2, OUTPUT);
  pinMode(FIRE_CHANNEL_3, OUTPUT);
  pinMode(FIRE_CHANNEL_4, OUTPUT);
  pinMode(FIRE_CHANNEL_5, OUTPUT);
  pinMode(FIRE_CHANNEL_6, OUTPUT);
  pinMode(FIRE_CHANNEL_7, OUTPUT);
  pinMode(FIRE_CHANNEL_8, OUTPUT);
  pinMode(FIRE_CHANNEL_9, OUTPUT);
  pinMode(FIRE_CHANNEL_10, OUTPUT);
  pinMode(FIRE_CHANNEL_11, OUTPUT);
  pinMode(FIRE_CHANNEL_12, OUTPUT);
  pinMode(RAPID_ALL_FIRE, OUTPUT);
  pinMode(AREA_MODULATION_UP, OUTPUT);
  pinMode(AREA_MODULATION_DOWN, OUTPUT);
  digitalWrite(FIRE_CHANNEL_1, HIGH);
  digitalWrite(FIRE_CHANNEL_2, HIGH);
  digitalWrite(FIRE_CHANNEL_3, HIGH);
  digitalWrite(FIRE_CHANNEL_4, HIGH);
  digitalWrite(FIRE_CHANNEL_5, HIGH);
  digitalWrite(FIRE_CHANNEL_6, HIGH);
  digitalWrite(FIRE_CHANNEL_7, HIGH);
  digitalWrite(FIRE_CHANNEL_8, HIGH);
  digitalWrite(FIRE_CHANNEL_9, HIGH);
  digitalWrite(FIRE_CHANNEL_10, HIGH);
  digitalWrite(FIRE_CHANNEL_11, HIGH);
  digitalWrite(FIRE_CHANNEL_12, HIGH);
  digitalWrite(RAPID_ALL_FIRE, HIGH);
  digitalWrite(AREA_MODULATION_UP, HIGH);
  digitalWrite(AREA_MODULATION_DOWN, HIGH);
  // Load area from NVS
  prefs.begin("firework", false);
  currentArea = prefs.getInt("area", 1);
  Serial.print("Loaded Area: "); Serial.println(currentArea);
}

void pulseButton(int pin, int pulseMs) {
  digitalWrite(pin, LOW);
  delay(pulseMs);
  digitalWrite(pin, HIGH);
}

void loop() {
  int channelDelay = 1000; // ms for channel test
  int areaPulse = 50;      // ms for area modulation

  // Simulate area up
  Serial.print("Area before up: "); Serial.println(currentArea);
  pulseButton(AREA_MODULATION_UP, areaPulse);
  currentArea++;
  if (currentArea > maxArea) currentArea = minArea;
  prefs.putInt("area", currentArea);
  Serial.print("Area after up: "); Serial.println(currentArea);
  delay(500);

  // Simulate area down
  Serial.print("Area before down: "); Serial.println(currentArea);
  pulseButton(AREA_MODULATION_DOWN, areaPulse);
  currentArea--;
  if (currentArea < minArea) currentArea = maxArea;
  prefs.putInt("area", currentArea);
  Serial.print("Area after down: "); Serial.println(currentArea);
  delay(500);

  // Run through all channels for current area
  Serial.print("Testing Area: "); Serial.println(currentArea);
  for (int ch = 1; ch <= 12; ch++) {
    Serial.print("Testing Channel "); Serial.println(ch);
    int pin = 0;
    switch(ch) {
      case 1: pin = FIRE_CHANNEL_1; break;
      case 2: pin = FIRE_CHANNEL_2; break;
      case 3: pin = FIRE_CHANNEL_3; break;
      case 4: pin = FIRE_CHANNEL_4; break;
      case 5: pin = FIRE_CHANNEL_5; break;
      case 6: pin = FIRE_CHANNEL_6; break;
      case 7: pin = FIRE_CHANNEL_7; break;
      case 8: pin = FIRE_CHANNEL_8; break;
      case 9: pin = FIRE_CHANNEL_9; break;
      case 10: pin = FIRE_CHANNEL_10; break;
      case 11: pin = FIRE_CHANNEL_11; break;
      case 12: pin = FIRE_CHANNEL_12; break;
    }
    pulseButton(pin, channelDelay);
  }

  // Rapid All Fire test
  Serial.println("Testing RAPID_ALL_FIRE");
  pulseButton(RAPID_ALL_FIRE, channelDelay);

  delay(2000); // Wait before next loop
}

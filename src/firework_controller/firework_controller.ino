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

void setup() {
  // Initialize firework channels and special buttons as outputs
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
  // Set all channels and special buttons HIGH (unpressed state)
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
}

void loop() {
  // Simulate pressing each button one at a time for testing
  int testDelay = 500; // ms
  Serial.println("Testing FIRE_CHANNEL_1");
  digitalWrite(FIRE_CHANNEL_1, LOW); delay(testDelay); digitalWrite(FIRE_CHANNEL_1, HIGH);
  Serial.println("Testing FIRE_CHANNEL_2");
  digitalWrite(FIRE_CHANNEL_2, LOW); delay(testDelay); digitalWrite(FIRE_CHANNEL_2, HIGH);
  Serial.println("Testing FIRE_CHANNEL_3");
  digitalWrite(FIRE_CHANNEL_3, LOW); delay(testDelay); digitalWrite(FIRE_CHANNEL_3, HIGH);
  Serial.println("Testing FIRE_CHANNEL_4");
  digitalWrite(FIRE_CHANNEL_4, LOW); delay(testDelay); digitalWrite(FIRE_CHANNEL_4, HIGH);
  Serial.println("Testing FIRE_CHANNEL_5");
  digitalWrite(FIRE_CHANNEL_5, LOW); delay(testDelay); digitalWrite(FIRE_CHANNEL_5, HIGH);
  Serial.println("Testing FIRE_CHANNEL_6");
  digitalWrite(FIRE_CHANNEL_6, LOW); delay(testDelay); digitalWrite(FIRE_CHANNEL_6, HIGH);
  Serial.println("Testing FIRE_CHANNEL_7");
  digitalWrite(FIRE_CHANNEL_7, LOW); delay(testDelay); digitalWrite(FIRE_CHANNEL_7, HIGH);
  Serial.println("Testing FIRE_CHANNEL_8");
  digitalWrite(FIRE_CHANNEL_8, LOW); delay(testDelay); digitalWrite(FIRE_CHANNEL_8, HIGH);
  Serial.println("Testing FIRE_CHANNEL_9");
  digitalWrite(FIRE_CHANNEL_9, LOW); delay(testDelay); digitalWrite(FIRE_CHANNEL_9, HIGH);
  Serial.println("Testing FIRE_CHANNEL_10");
  digitalWrite(FIRE_CHANNEL_10, LOW); delay(testDelay); digitalWrite(FIRE_CHANNEL_10, HIGH);
  Serial.println("Testing FIRE_CHANNEL_11");
  digitalWrite(FIRE_CHANNEL_11, LOW); delay(testDelay); digitalWrite(FIRE_CHANNEL_11, HIGH);
  Serial.println("Testing FIRE_CHANNEL_12");
  digitalWrite(FIRE_CHANNEL_12, LOW); delay(testDelay); digitalWrite(FIRE_CHANNEL_12, HIGH);
  Serial.println("Testing RAPID_ALL_FIRE");
  digitalWrite(RAPID_ALL_FIRE, LOW); delay(testDelay); digitalWrite(RAPID_ALL_FIRE, HIGH);
  Serial.println("Testing AREA_MODULATION_UP");
  digitalWrite(AREA_MODULATION_UP, LOW); delay(testDelay); digitalWrite(AREA_MODULATION_UP, HIGH);
  Serial.println("Testing AREA_MODULATION_DOWN");
  digitalWrite(AREA_MODULATION_DOWN, LOW); delay(testDelay); digitalWrite(AREA_MODULATION_DOWN, HIGH);
}

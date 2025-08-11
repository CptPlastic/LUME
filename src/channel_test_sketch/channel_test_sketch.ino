// ESP32 Firework Channel Test Sketch
// Author: CptPlastic
// Date: August 2025
// This sketch tests each fire channel pin one by one for hardware troubleshooting.

#define FIRE_CHANNEL_1     32   // Hardware Pin 8
#define FIRE_CHANNEL_2     33   // Hardware Pin 9
#define FIRE_CHANNEL_3     25   // Hardware Pin 10
#define FIRE_CHANNEL_4     26   // Hardware Pin 11
#define FIRE_CHANNEL_5     18   // Hardware Pin 30 (changed from 23)
#define FIRE_CHANNEL_6     14   // Hardware Pin 13
#define FIRE_CHANNEL_7     13   // Hardware Pin 16
#define FIRE_CHANNEL_8     4    // Hardware Pin 26
#define FIRE_CHANNEL_9     16   // Hardware Pin 27
#define FIRE_CHANNEL_10    17   // Hardware Pin 28
#define FIRE_CHANNEL_11    22   // Hardware Pin 36 (changed from 21)
#define FIRE_CHANNEL_12    19   // Hardware Pin 31

const int fireChannels[12] = {
  FIRE_CHANNEL_1, FIRE_CHANNEL_2, FIRE_CHANNEL_3, FIRE_CHANNEL_4,
  FIRE_CHANNEL_5, FIRE_CHANNEL_6, FIRE_CHANNEL_7, FIRE_CHANNEL_8,
  FIRE_CHANNEL_9, FIRE_CHANNEL_10, FIRE_CHANNEL_11, FIRE_CHANNEL_12
};

bool testActive = false;

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < 12; i++) {
    pinMode(fireChannels[i], INPUT_PULLUP); // Safe state: INPUT with internal pullup
  }
  Serial.println("Firework Channel Test Sketch Ready.");
  Serial.println("Send 'START' to begin test, 'STOP' to halt.");
}

void loop() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.equalsIgnoreCase("START")) {
      testActive = true;
      Serial.println("Test started.");
    } else if (cmd.equalsIgnoreCase("STOP")) {
      testActive = false;
      Serial.println("Test stopped.");
      // Set all pins to INPUT_PULLUP (safe state)
      for (int i = 0; i < 12; i++) {
        pinMode(fireChannels[i], INPUT_PULLUP);
      }
    }
  }

  if (testActive) {
    for (int i = 0; i < 12; i++) {
      Serial.print("Testing Channel "); Serial.println(i+1);
      pinMode(fireChannels[i], OUTPUT);
      digitalWrite(fireChannels[i], LOW); // Pull to ground (simulate button press)
      delay(500); // Hold for 500ms
      pinMode(fireChannels[i], INPUT_PULLUP); // Release to INPUT_PULLUP (button released)
      delay(2000); // Wait before next channel
    }
    Serial.println("Test cycle complete. Restarting...");
    delay(3000);
  }
}

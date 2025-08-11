// ESP32 Firework Controller
// Author: CptPlastic
// Date: August 2025
// This sketch controls fire channels and buttons using INPUT_PULLUP method for 99 areas.

#define FIRE_CHANNEL_1     32   // Hardware Pin 8
#define FIRE_CHANNEL_2     33   // Hardware Pin 9
#define FIRE_CHANNEL_3     25   // Hardware Pin 10
#define FIRE_CHANNEL_4     26   // Hardware Pin 11
#define FIRE_CHANNEL_5     18   // Hardware Pin 30
#define FIRE_CHANNEL_6     14   // Hardware Pin 13
#define FIRE_CHANNEL_7     13   // Hardware Pin 16
#define FIRE_CHANNEL_8     27   // Hardware Pin 12 - SAFE GPIO, no boot issues
#define FIRE_CHANNEL_9     16   // Hardware Pin 27
#define FIRE_CHANNEL_10    17   // Hardware Pin 28
#define FIRE_CHANNEL_11    22   // Hardware Pin 36
#define FIRE_CHANNEL_12    19   // Hardware Pin 31

// Control buttons
#define BUTTON_AREA_UP     21   // Hardware Pin 33
#define BUTTON_AREA_DOWN   23   // Hardware Pin 37  
#define BUTTON_RAPID_FIRE  4    // Hardware Pin 26 - Moved here from dangerous fire channel
#define BUTTON_ALL_FIRE    2    // Hardware Pin 24

// Note: GPIO 15 avoided due to boot requirements
// GPIO 4 moved to control button due to boot firing issue

const int fireChannels[12] = {
  FIRE_CHANNEL_1, FIRE_CHANNEL_2, FIRE_CHANNEL_3, FIRE_CHANNEL_4,
  FIRE_CHANNEL_5, FIRE_CHANNEL_6, FIRE_CHANNEL_7, FIRE_CHANNEL_8,
  FIRE_CHANNEL_9, FIRE_CHANNEL_10, FIRE_CHANNEL_11, FIRE_CHANNEL_12
};

const int controlButtons[4] = {
  BUTTON_AREA_UP, BUTTON_AREA_DOWN, BUTTON_RAPID_FIRE, BUTTON_ALL_FIRE
};

const char* buttonNames[4] = {
  "AREA_UP", "AREA_DOWN", "RAPID_FIRE", "ALL_FIRE"
};

// Area selection variables
int currentArea = 1;
const int maxAreas = 99; // Support for 99 areas, each with 12 fire channels (3 x 4-channel remotes)

// Function to simulate button press using INPUT_PULLUP method
void pressButton(int pin, int pressTime = 500) {
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
  delay(pressTime);
  pinMode(pin, INPUT_PULLUP);
}

void setup() {
  Serial.begin(115200);
  
  // Initialize all fire channel pins to INPUT_PULLUP (safe state)
  for (int i = 0; i < 12; i++) {
    pinMode(fireChannels[i], INPUT_PULLUP);
  }
  
  // Initialize all control button pins to INPUT_PULLUP (safe state)
  for (int i = 0; i < 4; i++) {
    pinMode(controlButtons[i], INPUT_PULLUP);
  }
  
  Serial.println("Firework Controller Ready.");
  Serial.println("Current Area: " + String(currentArea) + " (Max: " + String(maxAreas) + ")");
  Serial.println("Each area has 12 fire channels (3 x 4-channel remotes)");
  Serial.println("Commands: START, STOP, CHANNEL <1-12>, BUTTON <AREA_UP/AREA_DOWN/RAPID_FIRE/ALL_FIRE>, AREA <1-99>");
}

void loop() {
  // Check for serial commands
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    command.toUpperCase();
    
    if (command == "START") {
      testAllChannels();
    } else if (command == "STOP") {
      Serial.println("Test stopped. All pins set to safe state.");
      setAllPinsSafe();
    } else if (command.startsWith("CHANNEL ")) {
      int channel = command.substring(8).toInt();
      if (channel >= 1 && channel <= 12) {
        testSingleChannel(channel);
      } else {
        Serial.println("Invalid channel. Use 1-12.");
      }
    } else if (command.startsWith("BUTTON ")) {
      String buttonName = command.substring(7);
      testControlButton(buttonName);
    } else if (command.startsWith("AREA ")) {
      int area = command.substring(5).toInt();
      if (area >= 1 && area <= maxAreas) {
        setArea(area);
      } else {
        Serial.println("Invalid area. Use 1-" + String(maxAreas) + ".");
      }
    } else {
      Serial.println("Unknown command. Use: START, STOP, CHANNEL <1-12>, BUTTON <AREA_UP/AREA_DOWN/RAPID_FIRE/ALL_FIRE>, AREA <1-99>");
    }
  }
}

void testAllChannels() {
  Serial.println("Starting full channel test cycle for Area " + String(currentArea) + "...");
  Serial.println("Testing all 12 fire channels (3 x 4-channel remotes):");
  for (int i = 0; i < 12; i++) {
    int remoteNum = (i / 4) + 1;  // Remote 1, 2, or 3
    int channelInRemote = (i % 4) + 1;  // Channel 1, 2, 3, or 4 within remote
    Serial.print("Testing Area " + String(currentArea) + " Remote " + String(remoteNum) + " Channel " + String(channelInRemote)); 
    Serial.println(" (Overall Channel " + String(i + 1) + ")");
    pressButton(fireChannels[i], 1000);
    delay(1000); // Wait before next channel
  }
  Serial.println("Channel test cycle complete for Area " + String(currentArea) + ".");
}

void testSingleChannel(int channel) {
  int remoteNum = ((channel - 1) / 4) + 1;  // Remote 1, 2, or 3
  int channelInRemote = ((channel - 1) % 4) + 1;  // Channel 1, 2, 3, or 4 within remote
  Serial.print("Testing Area " + String(currentArea) + " Remote " + String(remoteNum) + " Channel " + String(channelInRemote)); 
  Serial.println(" (Overall Channel " + String(channel) + ")");
  pressButton(fireChannels[channel - 1], 1000);
  Serial.println("Channel test complete.");
}

void testControlButton(String buttonName) {
  for (int i = 0; i < 4; i++) {
    if (buttonName == buttonNames[i]) {
      Serial.print("Testing button: ");
      Serial.println(buttonName);
      
      // Handle area navigation buttons
      if (buttonName == "AREA_UP") {
        pressButton(controlButtons[i], 500);
        currentArea++;
        if (currentArea > maxAreas) currentArea = 1;
        Serial.println("Area changed to: " + String(currentArea));
      } else if (buttonName == "AREA_DOWN") {
        pressButton(controlButtons[i], 500);
        currentArea--;
        if (currentArea < 1) currentArea = maxAreas;
        Serial.println("Area changed to: " + String(currentArea));
      } else {
        pressButton(controlButtons[i], 500);
      }
      
      Serial.println("Button test complete.");
      return;
    }
  }
  Serial.println("Invalid button name. Use: AREA_UP, AREA_DOWN, RAPID_FIRE, ALL_FIRE");
}

void setArea(int area) {
  currentArea = area;
  Serial.println("Area manually set to: " + String(currentArea) + " (of " + String(maxAreas) + " total areas)");
  Serial.println("This area has 12 fire channels organized as 3 x 4-channel remotes");
  Serial.println("Use AREA_UP/AREA_DOWN buttons to navigate between areas, or channels will fire in this area.");
}

void setAllPinsSafe() {
  // Set all pins to INPUT_PULLUP (safe state)
  for (int i = 0; i < 12; i++) {
    pinMode(fireChannels[i], INPUT_PULLUP);
  }
  for (int i = 0; i < 4; i++) {
    pinMode(controlButtons[i], INPUT_PULLUP);
  }
}

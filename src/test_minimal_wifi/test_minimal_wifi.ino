// LUME Firework Controller - MINIMAL WIFI TEST
// This version has WiFi but NO web server to isolate the interference source

#include <WiFi.h>
#include <WiFiManager.h>

// WiFi Configuration
WiFiManager wifiManager;

// Show playback variables
bool showRunning = false;
String currentShowName = "";
unsigned long showStartTime = 0;

#define FIRE_CHANNEL_1     32   // Hardware Pin 8
#define FIRE_CHANNEL_2     33   // Hardware Pin 9
#define FIRE_CHANNEL_3     26   // Hardware Pin 11 - MOVED FROM GPIO 25 (stuck LOW/hardware issue)
#define FIRE_CHANNEL_4     27   // Hardware Pin 12
#define FIRE_CHANNEL_5     18   // Hardware Pin 30
#define FIRE_CHANNEL_6     14   // Hardware Pin 13
#define FIRE_CHANNEL_7     13   // Hardware Pin 16
#define FIRE_CHANNEL_8     16   // Hardware Pin 27
#define FIRE_CHANNEL_9     17   // Hardware Pin 28
#define FIRE_CHANNEL_10    22   // Hardware Pin 36
#define FIRE_CHANNEL_11    19   // Hardware Pin 31
#define FIRE_CHANNEL_12    25   // Hardware Pin 10 - GPIO 25 moved to unused channel

// Control buttons - ORIGINAL WORKING CONFIGURATION
#define BUTTON_AREA_UP     21   // Hardware Pin 33
#define BUTTON_AREA_DOWN   23   // Hardware Pin 37  
#define BUTTON_RAPID_FIRE  4    // Hardware Pin 26 - Moved here from dangerous fire channel
#define BUTTON_ALL_FIRE    2    // Hardware Pin 24

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
int hardwareArea = 1; // Track the actual hardware area position
const int maxAreas = 99; // Support for 99 areas, each with 12 fire channels (3 x 4-channel remotes)

// Function to simulate button press using INPUT_PULLUP method
void pressButton(int pin, int pressTime = 500) {
  Serial.println("DEBUG: pressButton called for pin " + String(pin) + " (" + String(pressTime) + "ms)");
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
  delay(pressTime);
  pinMode(pin, INPUT_PULLUP);
}

void setup() {
  Serial.begin(115200);
  delay(2000); // Give time for serial monitor to connect
  
  Serial.println("=== LUME MINIMAL WIFI TEST ===");
  Serial.println("WiFi enabled but NO web server - testing interference");
  
  // Initialize all fire channel pins to INPUT_PULLUP (safe state)
  Serial.println("Initializing fire channel pins...");
  for (int i = 0; i < 12; i++) {
    pinMode(fireChannels[i], INPUT_PULLUP);
    Serial.println("Channel " + String(i+1) + " (GPIO " + String(fireChannels[i]) + ") set to INPUT_PULLUP");
  }
  
  // Initialize all control button pins to INPUT_PULLUP (safe state)
  Serial.println("Initializing control button pins...");
  for (int i = 0; i < 4; i++) {
    pinMode(controlButtons[i], INPUT_PULLUP);
    Serial.println("Button " + String(buttonNames[i]) + " (GPIO " + String(controlButtons[i]) + ") set to INPUT_PULLUP");
  }
  
  // CRITICAL: Monitor GPIO 25 state before WiFi (now Channel 12)
  Serial.println("=== PRE-WIFI GPIO 25 STATE ===");
  Serial.println("GPIO 25 (Channel 12) state: " + String(digitalRead(FIRE_CHANNEL_12)));
  Serial.println("GPIO 26 (Channel 3) state: " + String(digitalRead(FIRE_CHANNEL_3)));
  
  // Initialize WiFi with captive portal - NO WEB SERVER
  Serial.println("Starting WiFi initialization...");
  setupWiFi();
  
  // CRITICAL: Monitor GPIO 25 state after WiFi (now Channel 12)
  Serial.println("=== POST-WIFI GPIO 25 STATE ===");
  Serial.println("GPIO 25 (Channel 12) state: " + String(digitalRead(FIRE_CHANNEL_12)));
  Serial.println("GPIO 26 (Channel 3) state: " + String(digitalRead(FIRE_CHANNEL_3)));
  
  Serial.println("=== INITIALIZATION COMPLETE ===");
  Serial.println("LUME Firework Controller Ready (MINIMAL WIFI VERSION).");
  Serial.println("NO WEB SERVER - Just WiFi radio active");
  Serial.println("Commands: START, STOP, CHANNEL <1-12>, BUTTON <AREA_UP/AREA_DOWN/RAPID_FIRE/ALL_FIRE>, AREA <1-99>, SYNC <1-99>");
  Serial.println("IP Address: " + WiFi.localIP().toString());
  Serial.println("MONITORING: Channel 3 moved to GPIO 26, problematic GPIO 25 is now Channel 12...");
}

void loop() {
  // NO WEB SERVER - just handle serial commands and monitor WiFi
  
  // Monitor GPIO 25 and 26 state every 5 seconds
  static unsigned long lastCheck = 0;
  if (millis() - lastCheck > 5000) {
    lastCheck = millis();
    Serial.println("GPIO 25 (Channel 12) state: " + String(digitalRead(FIRE_CHANNEL_12)));
    Serial.println("GPIO 26 (Channel 3) state: " + String(digitalRead(FIRE_CHANNEL_3)));
  }
  
  // Check for serial commands
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    command.toUpperCase();
    
    Serial.println("DEBUG: Received command: " + command);
    
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
    } else if (command.startsWith("SYNC ")) {
      int area = command.substring(5).toInt();
      if (area >= 1 && area <= maxAreas) {
        syncHardwareArea(area);
      } else {
        Serial.println("Invalid area. Use 1-" + String(maxAreas) + ".");
      }
    } else if (command == "STATUS") {
      Serial.println("=== STATUS ===");
      Serial.println("Software Area: " + String(currentArea));
      Serial.println("Hardware Area: " + String(hardwareArea));
      Serial.println("Show Running: " + String(showRunning));
      Serial.println("WiFi Status: " + String(WiFi.status()));
      Serial.println("WiFi RSSI: " + String(WiFi.RSSI()));
      Serial.println("Uptime: " + String(millis() / 1000) + " seconds");
      Serial.println("=== PIN STATUS ===");
      for (int i = 0; i < 12; i++) {
        Serial.println("Channel " + String(i+1) + " (GPIO " + String(fireChannels[i]) + "): " + String(digitalRead(fireChannels[i])));
      }
    } else if (command == "WIFI_OFF") {
      Serial.println("Turning OFF WiFi radio...");
      WiFi.mode(WIFI_OFF);
      Serial.println("WiFi radio disabled. Monitor if channel 3 stops firing.");
    } else if (command == "WIFI_ON") {
      Serial.println("Turning ON WiFi radio...");
      setupWiFi();
      Serial.println("WiFi radio re-enabled. Monitor if channel 3 starts firing again.");
    } else {
      Serial.println("Unknown command. Use: START, STOP, CHANNEL <1-12>, BUTTON <AREA_UP/AREA_DOWN/RAPID_FIRE/ALL_FIRE>, AREA <1-99>, SYNC <1-99>, STATUS, WIFI_OFF, WIFI_ON");
    }
  }
  
  // Check WiFi connection status
  if (WiFi.status() != WL_CONNECTED && WiFi.getMode() != WIFI_OFF) {
    Serial.println("WiFi connection lost. Attempting to reconnect...");
    setupWiFi();
  }
  
  delay(100);
}

// WiFi Setup with Captive Portal - NO WEB SERVER
void setupWiFi() {
  String apName = "LUME-MINIMAL-" + String(ESP.getEfuseMac() & 0xFFFF, HEX);
  
  Serial.println("Starting WiFi setup...");
  Serial.println("AP Name: " + apName);
  
  wifiManager.setConfigPortalTimeout(180);
  
  if (!wifiManager.autoConnect(apName.c_str())) {
    Serial.println("Failed to connect and hit timeout");
    ESP.restart();
  }
  
  Serial.println("WiFi connected successfully!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// Rest of the functions (same as before)
void testAllChannels() {
  Serial.println("Starting full channel test cycle for Area " + String(currentArea) + "...");
  for (int i = 0; i < 12; i++) {
    int remoteNum = (i / 4) + 1;
    int channelInRemote = (i % 4) + 1;
    Serial.print("Testing Area " + String(currentArea) + " Remote " + String(remoteNum) + " Channel " + String(channelInRemote)); 
    Serial.println(" (Overall Channel " + String(i + 1) + ")");
    pressButton(fireChannels[i], 1000);
    delay(1000);
  }
  Serial.println("Channel test cycle complete for Area " + String(currentArea) + ".");
}

void testSingleChannel(int channel) {
  int remoteNum = ((channel - 1) / 4) + 1;
  int channelInRemote = ((channel - 1) % 4) + 1;
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
      
      if (buttonName == "AREA_UP") {
        Serial.println("Pressing hardware AREA UP button...");
        pressButton(controlButtons[i], 500);
        hardwareArea++;
        if (hardwareArea > maxAreas) hardwareArea = 1;
        currentArea = hardwareArea;
        Serial.println("Hardware area changed to: " + String(hardwareArea));
      } else if (buttonName == "AREA_DOWN") {
        Serial.println("Pressing hardware AREA DOWN button...");
        pressButton(controlButtons[i], 500);
        hardwareArea--;
        if (hardwareArea < 1) hardwareArea = maxAreas;
        currentArea = hardwareArea;
        Serial.println("Hardware area changed to: " + String(hardwareArea));
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
  if (area == hardwareArea) {
    Serial.println("Already at Area " + String(hardwareArea));
    currentArea = hardwareArea;
    return;
  }
  
  Serial.println("Changing hardware area from " + String(hardwareArea) + " to " + String(area) + "...");
  
  int upSteps = (area - hardwareArea + maxAreas) % maxAreas;
  int downSteps = (hardwareArea - area + maxAreas) % maxAreas;
  
  if (upSteps == 0) upSteps = maxAreas;
  if (downSteps == 0) downSteps = maxAreas;
  
  if (upSteps <= downSteps) {
    Serial.println("Pressing AREA_UP " + String(upSteps) + " times...");
    for (int i = 0; i < upSteps; i++) {
      pressButton(BUTTON_AREA_UP, 200);
      delay(300);
      Serial.print(".");
    }
  } else {
    Serial.println("Pressing AREA_DOWN " + String(downSteps) + " times...");
    for (int i = 0; i < downSteps; i++) {
      pressButton(BUTTON_AREA_DOWN, 200);
      delay(300);
      Serial.print(".");
    }
  }
  
  hardwareArea = area;
  currentArea = area;
  Serial.println();
  Serial.println("Hardware area set to: " + String(hardwareArea));
}

void syncHardwareArea(int area) {
  Serial.println("SYNC: Telling controller that hardware is currently at area " + String(area));
  hardwareArea = area;
  currentArea = area;
  Serial.println("Hardware area tracking synchronized to: " + String(hardwareArea));
}

void setAllPinsSafe() {
  Serial.println("DEBUG: Setting all pins to safe state...");
  for (int i = 0; i < 12; i++) {
    pinMode(fireChannels[i], INPUT_PULLUP);
  }
  for (int i = 0; i < 4; i++) {
    pinMode(controlButtons[i], INPUT_PULLUP);
  }
  Serial.println("DEBUG: All pins set to INPUT_PULLUP (safe state)");
}

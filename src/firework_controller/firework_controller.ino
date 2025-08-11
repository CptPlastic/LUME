// LUME Firework Controller with WiFi API
// Author: CptPlastic
// Date: August 2025
// Version: 1.2.0-beta
// This sketch controls fire channels and buttons using INPUT_PULLUP method for 99 areas.

// =============================================================================
// VERSION INFORMATION
// =============================================================================
const char* FIRMWARE_VERSION = "1.2.0-beta";
const char* BUILD_DATE = __DATE__;
const char* BUILD_TIME = __TIME__;
const char* SYSTEM_NAME = "LUME Firework Controller";

// =============================================================================
// WIFI CONFIGURATION - EDIT THESE SETTINGS
// =============================================================================
// SAFETY: No captive portal - AP mode causes dangerous random channel firing!
// To connect to WiFi, enter your network credentials below:

const char* WIFI_SSID = "LODGE_IoT";         // Enter your WiFi network name here
const char* WIFI_PASSWORD = "Ilovemywife!";     // Enter your WiFi password here

// Leave blank ("") to use saved credentials from previous connections
// Example:
// const char* WIFI_SSID = "YourNetworkName";
// const char* WIFI_PASSWORD = "YourPassword123";

// =============================================================================

#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <WiFiManager.h>
#include <EEPROM.h>

// WiFi Configuration
WiFiManager wifiManager;

// Web Server
WebServer server(80);

// Show playback variables
bool showRunning = false;
String currentShowName = "";
unsigned long showStartTime = 0;

#define FIRE_CHANNEL_1     32   // Hardware Pin 8
#define FIRE_CHANNEL_2     33   // Hardware Pin 9
#define FIRE_CHANNEL_3     25   // Hardware Pin 10 - ORIGINAL WORKING PIN
#define FIRE_CHANNEL_4     26   // Hardware Pin 11
#define FIRE_CHANNEL_5     18   // Hardware Pin 30
#define FIRE_CHANNEL_6     14   // Hardware Pin 13
#define FIRE_CHANNEL_7     13   // Hardware Pin 16
#define FIRE_CHANNEL_8     27   // Hardware Pin 12 - SAFE GPIO, no boot issues
#define FIRE_CHANNEL_9     16   // Hardware Pin 27
#define FIRE_CHANNEL_10    17   // Hardware Pin 28
#define FIRE_CHANNEL_11    22   // Hardware Pin 36
#define FIRE_CHANNEL_12    19   // Hardware Pin 31

// Control buttons - ORIGINAL WORKING CONFIGURATION
#define BUTTON_AREA_UP     21   // Hardware Pin 33
#define BUTTON_AREA_DOWN   23   // Hardware Pin 37  
#define BUTTON_RAPID_FIRE  4    // Hardware Pin 26
#define BUTTON_ALL_FIRE    2    // Hardware Pin 24

// RGB LED functionality removed to prevent any pin conflicts

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

// RGB LED status colors - REMOVED to prevent pin conflicts

// RGB LED function removed to prevent pin conflicts
void setStatusLED_REMOVED() {
  // RGB LED functionality disabled
}

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
  delay(1000); // Allow serial to initialize
  
  // Display version information
  Serial.println();
  Serial.println("=====================================");
  Serial.println(SYSTEM_NAME);
  Serial.print("Version: ");
  Serial.println(FIRMWARE_VERSION);
  Serial.print("Built: ");
  Serial.print(BUILD_DATE);
  Serial.print(" ");
  Serial.println(BUILD_TIME);
  Serial.println("=====================================");
  Serial.println();
  
  // RGB LED functionality removed to prevent pin conflicts
  
  // Initialize all fire channel pins to INPUT_PULLUP (safe state)
  for (int i = 0; i < 12; i++) {
    pinMode(fireChannels[i], INPUT_PULLUP);
  }
  
  // Initialize all control button pins to INPUT_PULLUP (safe state)
  for (int i = 0; i < 4; i++) {
    pinMode(controlButtons[i], INPUT_PULLUP);
  }
  
  // Simple WiFi setup
  Serial.println("Starting WiFi connection...");
  setupWiFi();
  
  // Setup API if WiFi connected
  if (WiFi.status() == WL_CONNECTED) {
    setupAPI();
    Serial.println("WiFi connected successfully!");
    Serial.println("Web interface available at: http://" + WiFi.localIP().toString());
  } else {
    Serial.println("WiFi connection failed - using serial commands only.");
  }
  
  Serial.println("LUME Firework Controller Ready.");
  Serial.println("Current Software Area: " + String(currentArea) + " (Max: " + String(maxAreas) + ")");
  Serial.println("Hardware Area: " + String(hardwareArea) + " (may differ - use SYNC command to align)");
  Serial.println("Each area has 12 fire channels (3 x 4-channel remotes)");
  Serial.println("Commands: START, STOP, CHANNEL <1-12>, BUTTON <AREA_UP/AREA_DOWN/RAPID_FIRE/ALL_FIRE>, AREA <1-99>, SYNC <1-99>, STATUS");
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Web interface: http://" + WiFi.localIP().toString());
  } else {
    Serial.println("WiFi not connected - serial commands only");
  }
}

void loop() {
  // Handle web server requests if WiFi is connected
  if (WiFi.status() == WL_CONNECTED) {
    server.handleClient();
  }
  
  // Check for serial commands
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    command.toUpperCase();
    
    Serial.println("DEBUG: Received serial command: " + command);
    
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
    } else if (command == "RESET_WIFI") {
      Serial.println("SAFETY: WiFi reset disabled - AP mode causes dangerous random firing!");
      Serial.println("To configure WiFi, manually edit WiFi credentials in code and reflash.");
    } else if (command == "STATUS") {
      Serial.println("=== SYSTEM STATUS ===");
      Serial.println("Software Area: " + String(currentArea));
      Serial.println("Hardware Area: " + String(hardwareArea));
      Serial.println("WiFi Status: " + String(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected"));
      if (WiFi.status() == WL_CONNECTED) {
        Serial.println("WiFi SSID: " + WiFi.SSID());
        Serial.println("WiFi IP: " + WiFi.localIP().toString());
        Serial.println("WiFi RSSI: " + String(WiFi.RSSI()) + " dBm");
        Serial.println("Web interface: http://" + WiFi.localIP().toString());
      }
      Serial.println("Uptime: " + String(millis() / 1000) + " seconds");
    } else {
      Serial.println("Unknown command. Use: START, STOP, CHANNEL <1-12>, BUTTON <AREA_UP/AREA_DOWN/RAPID_FIRE/ALL_FIRE>, AREA <1-99>, SYNC <1-99>, STATUS, RESET_WIFI");
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
      
      // Handle area navigation buttons - these change the hardware area selection
      if (buttonName == "AREA_UP") {
        Serial.println("Pressing hardware AREA UP button...");
        pressButton(controlButtons[i], 500);
        hardwareArea++;
        if (hardwareArea > maxAreas) hardwareArea = 1;
        currentArea = hardwareArea; // Keep software in sync
        Serial.println("Hardware area changed to: " + String(hardwareArea));
      } else if (buttonName == "AREA_DOWN") {
        Serial.println("Pressing hardware AREA DOWN button...");
        pressButton(controlButtons[i], 500);
        hardwareArea--;
        if (hardwareArea < 1) hardwareArea = maxAreas;
        currentArea = hardwareArea; // Keep software in sync
        Serial.println("Hardware area changed to: " + String(hardwareArea));
      } else {
        // For RAPID_FIRE and ALL_FIRE, just press the button
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
  
  // Calculate the most efficient path (up or down)
  int upSteps = (area - hardwareArea + maxAreas) % maxAreas;
  int downSteps = (hardwareArea - area + maxAreas) % maxAreas;
  
  if (upSteps == 0) upSteps = maxAreas;
  if (downSteps == 0) downSteps = maxAreas;
  
  if (upSteps <= downSteps) {
    // Go up
    Serial.println("Pressing AREA_UP " + String(upSteps) + " times...");
    for (int i = 0; i < upSteps; i++) {
      pressButton(BUTTON_AREA_UP, 200);
      delay(300); // Wait between presses
      Serial.print(".");
    }
  } else {
    // Go down  
    Serial.println("Pressing AREA_DOWN " + String(downSteps) + " times...");
    for (int i = 0; i < downSteps; i++) {
      pressButton(BUTTON_AREA_DOWN, 200);
      delay(300); // Wait between presses
      Serial.print(".");
    }
  }
  
  hardwareArea = area;
  currentArea = area;
  Serial.println();
  Serial.println("Hardware area set to: " + String(hardwareArea) + " (of " + String(maxAreas) + " total areas)");
  Serial.println("This area has 12 fire channels organized as 3 x 4-channel remotes");
}

void syncHardwareArea(int area) {
  Serial.println("SYNC: Telling controller that hardware is currently at area " + String(area));
  hardwareArea = area;
  currentArea = area;
  Serial.println("Hardware area tracking synchronized to: " + String(hardwareArea));
  Serial.println("Use AREA <n> command to navigate to different areas from this position");
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

// WiFi Setup - Simple and reliable
void setupWiFi() {
  Serial.println("Connecting to WiFi...");
  
  // CRITICAL: Apply interference mitigation BEFORE WiFi connection
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false); // Disable power saving BEFORE connecting
  WiFi.setTxPower(WIFI_POWER_MINUS_1dBm); // Set minimum power BEFORE connecting
  
  // Extra protection for Channel 3 and 9 during connection
  // Channel 9 (GPIO 16) needs extra protection - it's used for PSRAM on some ESP32s
  pinMode(FIRE_CHANNEL_3, INPUT_PULLUP);
  pinMode(FIRE_CHANNEL_9, INPUT_PULLUP);
  digitalWrite(FIRE_CHANNEL_9, HIGH); // Force HIGH on GPIO 16 before WiFi
  
  // Add small delay to let pins stabilize
  delay(100);
  Serial.println("Pre-connection interference protection applied for Channels 3 & 9");
  Serial.println("GPIO 16 (Channel 9) forced HIGH before WiFi connection");
  
  if (strlen(WIFI_SSID) > 0 && strlen(WIFI_PASSWORD) > 0) {
    Serial.println("Using WiFi credentials: " + String(WIFI_SSID));
    // Try to use WiFi Channel 1 (2412 MHz) - furthest from 433MHz harmonics
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD, 1);
  } else {
    Serial.println("Using saved WiFi credentials...");
    WiFi.begin();
  }
  
  // Wait for connection with simple timeout
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
    
    // Re-apply safe state every few attempts during connection
    if (attempts % 5 == 0) {
      pinMode(FIRE_CHANNEL_3, INPUT_PULLUP);
      pinMode(FIRE_CHANNEL_9, INPUT_PULLUP);
      digitalWrite(FIRE_CHANNEL_9, HIGH); // Extra protection for GPIO 16
      Serial.print("R"); // Indicate re-protection applied
    }
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.println("IP address: " + WiFi.localIP().toString());
    Serial.println("Signal strength: " + String(WiFi.RSSI()) + " dBm");
    
    // Confirm all interference mitigation is active
    Serial.println("CRITICAL: All WiFi interference mitigation active");
    Serial.println("WiFi power set to minimum (-1dBm) to avoid 433MHz radio interference");
    Serial.println("WiFi forced to Channel 1 (2412MHz) - away from 433MHz harmonics");
    Serial.println("Channels 3 & 9 protected throughout connection process");
  } else {
    Serial.println("\nWiFi connection failed.");
    Serial.println("Check your credentials at the top of the file.");
  }
}

// API Endpoints Setup
void setupAPI() {
  // CORS headers for all responses
  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) {
      server.sendHeader("Access-Control-Allow-Origin", "*");
      server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
      server.send(200);
    } else {
      server.send(404, "application/json", "{\"error\":\"Not found\"}");
    }
  });
  
  // GET / - Main web interface
  server.on("/", HTTP_GET, []() {
    String html = "<!DOCTYPE html><html><head>";
    html += "<title>LUME Firework Controller</title>";
    html += "<meta charset='UTF-8'>";
    html += "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
    html += "<style>";
    html += "body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a1a; color: #fff; }";
    html += ".container { max-width: 800px; margin: 0 auto; }";
    html += ".header { text-align: center; margin-bottom: 30px; }";
    html += ".status { background: #333; padding: 20px; border-radius: 8px; margin-bottom: 20px; }";
    html += ".section { background: #2a2a2a; padding: 15px; border-radius: 8px; margin-bottom: 15px; }";
    html += ".button { background: #ff6b35; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }";
    html += ".button:hover { background: #ff5722; }";
    html += ".api-list { background: #222; padding: 15px; border-radius: 8px; }";
    html += ".endpoint { font-family: monospace; margin: 5px 0; }";
    html += "h1 { color: #ff6b35; }";
    html += "h2 { color: #ffa726; }";
    html += "</style></head><body>";
    
    html += "<div class='container'>";
    html += "<div class='header'>";
    html += "<h1>🎆 LUME Firework Controller</h1>";
    html += "<p>Professional Firework Display Control System</p>";
    html += "</div>";
    
    html += "<div class='status'>";
    html += "<h2>System Status</h2>";
    html += "<p><strong>Current Area:</strong> " + String(currentArea) + " / " + String(maxAreas) + "</p>";
    html += "<p><strong>Hardware Area:</strong> " + String(hardwareArea) + "</p>";
    html += "<p><strong>WiFi Network:</strong> " + WiFi.SSID() + "</p>";
    html += "<p><strong>IP Address:</strong> " + WiFi.localIP().toString() + "</p>";
    html += "<p><strong>Signal Strength:</strong> " + String(WiFi.RSSI()) + " dBm</p>";
    html += "<p><strong>Uptime:</strong> " + String(millis() / 1000) + " seconds</p>";
    html += "<p><strong>Show Status:</strong> " + String(showRunning ? "🔴 ARMED" : "🟢 READY") + "</p>";
    html += "</div>";
    
    html += "<div class='section'>";
    html += "<h2>Quick Actions</h2>";
    html += "<button class='button' onclick='emergencyStop()'>🛑 EMERGENCY STOP</button>";
    html += "<button class='button' onclick='getStatus()'>📊 Refresh Status</button>";
    html += "<button class='button' onclick='resetWiFi()'>📶 Reset WiFi</button>";
    html += "</div>";
    
    html += "<div class='section'>";
    html += "<h2>Controller Information</h2>";
    html += "<p><strong>Fire Channels:</strong> 12 per area (3 × 4-channel remotes)</p>";
    html += "<p><strong>Total Areas:</strong> 99 areas supported</p>";
    html += "<p><strong>Control Method:</strong> INPUT_PULLUP button simulation</p>";
    html += "<p><strong>Safety Features:</strong> Emergency stop, safe GPIO configuration</p>";
    html += "</div>";
    
    html += "<div class='api-list'>";
    html += "<h2>API Endpoints</h2>";
    html += "<div class='endpoint'>GET /status - Controller status</div>";
    html += "<div class='endpoint'>POST /area?id=N - Set area (1-99)</div>";
    html += "<div class='endpoint'>POST /sync?id=N - Sync hardware area</div>";
    html += "<div class='endpoint'>POST /channel?id=N - Fire channel (1-12)</div>";
    html += "<div class='endpoint'>POST /button?name=NAME - Press button</div>";
    html += "<div class='endpoint'>POST /emergency/stop - Emergency stop</div>";
    html += "<div class='endpoint'>GET /wifi/info - WiFi information</div>";
    html += "<div class='endpoint'>POST /wifi/reset - Reset WiFi settings</div>";
    html += "</div>";
    
    html += "</div>";
    
    html += "<script>";
    html += "function emergencyStop() {";
    html += "  fetch('/emergency/stop', {method: 'POST'})";
    html += "    .then(r => r.json())";
    html += "    .then(d => { alert('Emergency stop activated!'); location.reload(); });";
    html += "}";
    html += "function getStatus() { location.reload(); }";
    html += "function resetWiFi() {";
    html += "  if(confirm('Reset WiFi settings? Device will restart.')) {";
    html += "    fetch('/wifi/reset', {method: 'POST'})";
    html += "      .then(r => r.json())";
    html += "      .then(d => alert('WiFi reset. Device restarting...'));";
    html += "  }";
    html += "}";
    html += "</script>";
    html += "</body></html>";
    
    server.send(200, "text/html", html);
  });
  
  // GET /status - Controller status
  server.on("/status", HTTP_GET, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    StaticJsonDocument<300> doc;
    doc["softwareArea"] = currentArea;
    doc["hardwareArea"] = hardwareArea;
    doc["maxAreas"] = maxAreas;
    doc["showRunning"] = showRunning;
    doc["showName"] = currentShowName;
    doc["uptime"] = millis();
    doc["wifiRSSI"] = WiFi.RSSI();
    
    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
  });
  
  // POST /area/{id} - Set area
  server.on("/area", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    if (server.hasArg("id")) {
      int area = server.arg("id").toInt();
      if (area >= 1 && area <= maxAreas) {
        setArea(area);
        server.send(200, "application/json", "{\"success\":true,\"area\":" + String(area) + "}");
      } else {
        server.send(400, "application/json", "{\"error\":\"Invalid area. Use 1-" + String(maxAreas) + "\"}");
      }
    } else {
      server.send(400, "application/json", "{\"error\":\"Missing area id\"}");
    }
  });
  
  // POST /sync/{id} - Sync hardware area
  server.on("/sync", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    if (server.hasArg("id")) {
      int area = server.arg("id").toInt();
      if (area >= 1 && area <= maxAreas) {
        syncHardwareArea(area);
        server.send(200, "application/json", "{\"success\":true,\"area\":" + String(area) + "}");
      } else {
        server.send(400, "application/json", "{\"error\":\"Invalid area. Use 1-" + String(maxAreas) + "\"}");
      }
    } else {
      server.send(400, "application/json", "{\"error\":\"Missing area id\"}");
    }
  });
  
  // POST /channel/{id} - Fire single channel
  server.on("/channel", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    if (server.hasArg("id")) {
      int channel = server.arg("id").toInt();
      if (channel >= 1 && channel <= 12) {
        testSingleChannel(channel);
        server.send(200, "application/json", "{\"success\":true,\"channel\":" + String(channel) + ",\"area\":" + String(currentArea) + "}");
      } else {
        server.send(400, "application/json", "{\"error\":\"Invalid channel. Use 1-12\"}");
      }
    } else {
      server.send(400, "application/json", "{\"error\":\"Missing channel id\"}");
    }
  });
  
  // POST /button/{name} - Press control button
  server.on("/button", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    if (server.hasArg("name")) {
      String buttonName = server.arg("name");
      buttonName.toUpperCase();
      testControlButton(buttonName);
      server.send(200, "application/json", "{\"success\":true,\"button\":\"" + buttonName + "\"}");
    } else {
      server.send(400, "application/json", "{\"error\":\"Missing button name\"}");
    }
  });
  
  // POST /emergency/stop - Emergency stop
  server.on("/emergency/stop", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    setAllPinsSafe();
    showRunning = false;
    currentShowName = "";
    // RGB LED functionality removed
    server.send(200, "application/json", "{\"success\":true,\"message\":\"Emergency stop activated\"}");
  });
  
  // POST /wifi/reset - DISABLED for safety
  server.on("/wifi/reset", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(400, "application/json", "{\"error\":\"WiFi reset disabled - AP mode causes dangerous random firing\"}");
  });
  
  // GET /wifi/info - WiFi information
  server.on("/wifi/info", HTTP_GET, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    StaticJsonDocument<200> doc;
    doc["ssid"] = WiFi.SSID();
    doc["ip"] = WiFi.localIP().toString();
    doc["mac"] = WiFi.macAddress();
    doc["rssi"] = WiFi.RSSI();
    doc["quality"] = map(WiFi.RSSI(), -100, -50, 0, 100);
    
    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
  });

  // GET /version - Version and build information
  server.on("/version", HTTP_GET, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    
    StaticJsonDocument<300> doc;
    doc["version"] = FIRMWARE_VERSION;
    doc["systemName"] = SYSTEM_NAME;
    doc["buildDate"] = BUILD_DATE;
    doc["buildTime"] = BUILD_TIME;
    doc["uptime"] = millis() / 1000;
    doc["uptimeFormatted"] = String(millis() / 3600000) + "h " + String((millis() / 60000) % 60) + "m " + String((millis() / 1000) % 60) + "s";
    
    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
  });
  
  server.begin();
  Serial.println("HTTP server started");
}

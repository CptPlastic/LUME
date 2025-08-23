// LUME Lighting Controller with WiFi API
// Author: CptPlastic
// Date: August 2025
// Version: 1.0.0-beta
// This sketch controls lighting relays for synchronized lighting effects with fireworks.

// =============================================================================
// VERSION INFORMATION
// =============================================================================
const char* FIRMWARE_VERSION = "1.0.0-beta";
const char* BUILD_DATE = __DATE__;
const char* BUILD_TIME = __TIME__;
const char* SYSTEM_NAME = "LUME Lighting Controller";

// =============================================================================
// WIFI CONFIGURATION - EDIT THESE SETTINGS
// =============================================================================
// SAFETY: No captive portal - AP mode causes interference issues!
// To connect to WiFi, enter your network credentials below:

const char* WIFI_SSID = "LUME";         // Enter your WiFi network name here
const char* WIFI_PASSWORD = "DOXW7TBD";     // Enter your WiFi password here

// Leave blank ("") to use saved credentials from previous connections
// Example:
// const char* WIFI_SSID = "YourNetworkName";
// const char* WIFI_PASSWORD = "YourPassword123";

// =============================================================================

// RELAY PIN ASSIGNMENTS - SAFE ESP32 GPIO PINS FOR LIGHTING CONTROL
// Using same proven GPIO pins as firework controller for reliability
// =============================================================================

#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <WiFiManager.h>
#include <EEPROM.h>
#include <ESPmDNS.h>

// WiFi Configuration
WiFiManager wifiManager;

// Web Server
WebServer server(80);

// Lighting effect variables
bool effectRunning = false;
String currentEffectName = "";
unsigned long effectStartTime = 0;
int currentBrightness = 255; // 0-255 brightness level

// Relay pin definitions - using safe ESP32 GPIO pins
#define RELAY_1     32   // Hardware Pin 8
#define RELAY_2     33   // Hardware Pin 9
#define RELAY_3     14   // Hardware Pin - ALTERNATIVE: GPIO 14 (no WiFi sensitivity)
#define RELAY_4     26   // Hardware Pin 11
#define RELAY_5     18   // Hardware Pin 30
#define RELAY_6     5    // Hardware Pin 13 - Safe GPIO
#define RELAY_7     13   // Hardware Pin 16
#define RELAY_8     27   // Hardware Pin 12
#define RELAY_9     15   // Hardware Pin 27 - Safe GPIO
#define RELAY_10    17   // Hardware Pin 28
#define RELAY_11    22   // Hardware Pin 36
#define RELAY_12    19   // Hardware Pin 31

// Status LED pins (optional)
#define STATUS_LED_RED    21   // Hardware Pin 33
#define STATUS_LED_GREEN  23   // Hardware Pin 37

const int relayPins[12] = {
  RELAY_1, RELAY_2, RELAY_3, RELAY_4,
  RELAY_5, RELAY_6, RELAY_7, RELAY_8,
  RELAY_9, RELAY_10, RELAY_11, RELAY_12
};

// Relay states
bool relayStates[12] = {false};

// Area selection variables
int currentArea = 1;
const int maxAreas = 99; // Support for 99 areas, each with 12 lighting zones

// Lighting effect types
enum EffectType {
  EFFECT_SOLID,
  EFFECT_STROBE,
  EFFECT_FADE,
  EFFECT_CHASE,
  EFFECT_RANDOM,
  EFFECT_CUSTOM
};

// Current effect settings
EffectType currentEffect = EFFECT_SOLID;
unsigned long effectInterval = 1000; // milliseconds
unsigned long lastEffectUpdate = 0;
int effectStep = 0;

// Selective relay effects - NEW
bool selectiveMode = false;
bool selectedRelays[12] = {false}; // Track which relays are selected for effects

// Status LED functions
void setStatusLED(bool red, bool green) {
  digitalWrite(STATUS_LED_RED, red ? HIGH : LOW);
  digitalWrite(STATUS_LED_GREEN, green ? HIGH : LOW);
}

// Relay control functions
void setRelay(int relay, bool state) {
  if (relay >= 1 && relay <= 12) {
    digitalWrite(relayPins[relay - 1], state ? HIGH : LOW);
    relayStates[relay - 1] = state;
    Serial.println("Relay " + String(relay) + " set to " + String(state ? "ON" : "OFF"));
  }
}

void setAllRelays(bool state) {
  for (int i = 0; i < 12; i++) {
    digitalWrite(relayPins[i], state ? HIGH : LOW);
    relayStates[i] = state;
  }
}

// NEW: Set only selected relays
void setSelectedRelays(bool state) {
  for (int i = 0; i < 12; i++) {
    if (selectedRelays[i]) {
      digitalWrite(relayPins[i], state ? HIGH : LOW);
      relayStates[i] = state;
    }
  }
}

// NEW: Clear relay selection
void clearSelectedRelays() {
  for (int i = 0; i < 12; i++) {
    selectedRelays[i] = false;
  }
  selectiveMode = false;
}

void setAllRelaysSafe() {
  Serial.println("Setting all relays to safe state (OFF)");
  for (int i = 0; i < 12; i++) {
    digitalWrite(relayPins[i], LOW);
    relayStates[i] = false;
  }
  effectRunning = false;
  currentEffectName = "";
  setStatusLED(false, true); // Green = safe
}

// Lighting effect functions
void runStrobeEffect() {
  if (millis() - lastEffectUpdate >= effectInterval) {
    if (selectiveMode) {
      // Toggle only selected relays
      bool newState = !relayStates[0]; // Use first relay as reference
      for (int i = 0; i < 12; i++) {
        if (selectedRelays[i]) {
          setSelectedRelays(newState);
          break; // All selected relays get the same state
        }
      }
    } else {
      setAllRelays(!relayStates[0]); // Toggle all relays
    }
    lastEffectUpdate = millis();
  }
}

void runChaseEffect() {
  if (millis() - lastEffectUpdate >= effectInterval) {
    if (selectiveMode) {
      // Chase only among selected relays
      setAllRelays(false); // Turn off all first
      int selectedCount = 0;
      for (int i = 0; i < 12; i++) {
        if (selectedRelays[i]) selectedCount++;
      }
      if (selectedCount > 0) {
        int targetIndex = effectStep % selectedCount;
        int currentSelected = 0;
        for (int i = 0; i < 12; i++) {
          if (selectedRelays[i]) {
            if (currentSelected == targetIndex) {
              setRelay(i + 1, true);
              break;
            }
            currentSelected++;
          }
        }
      }
    } else {
      setAllRelays(false);
      setRelay((effectStep % 12) + 1, true);
    }
    effectStep++;
    lastEffectUpdate = millis();
  }
}

void runFadeEffect() {
  // For relays, we'll simulate fade with timed on/off patterns
  if (millis() - lastEffectUpdate >= (effectInterval / 10)) {
    int fadeLevel = (effectStep % 20);
    if (selectiveMode) {
      // Fade only selected relays
      setAllRelays(false); // Turn off all first
      if (fadeLevel < 10) {
        // Fade up
        int selectedCount = 0;
        for (int i = 0; i < 12; i++) {
          if (selectedRelays[i]) selectedCount++;
        }
        int onRelays = (fadeLevel * selectedCount) / 10;
        int currentSelected = 0;
        for (int i = 0; i < 12 && currentSelected < onRelays; i++) {
          if (selectedRelays[i]) {
            setRelay(i + 1, true);
            currentSelected++;
          }
        }
      } else {
        // Fade down
        int selectedCount = 0;
        for (int i = 0; i < 12; i++) {
          if (selectedRelays[i]) selectedCount++;
        }
        int onRelays = ((20 - fadeLevel) * selectedCount) / 10;
        int currentSelected = 0;
        for (int i = 0; i < 12 && currentSelected < onRelays; i++) {
          if (selectedRelays[i]) {
            setRelay(i + 1, true);
            currentSelected++;
          }
        }
      }
    } else {
      // Original fade effect for all relays
      if (fadeLevel < 10) {
        // Fade up
        int onRelays = (fadeLevel * 12) / 10;
        setAllRelays(false);
        for (int i = 0; i < onRelays; i++) {
          setRelay(i + 1, true);
        }
      } else {
        // Fade down
        int onRelays = ((20 - fadeLevel) * 12) / 10;
        setAllRelays(false);
        for (int i = 0; i < onRelays; i++) {
          setRelay(i + 1, true);
        }
      }
    }
    effectStep++;
    lastEffectUpdate = millis();
  }
}

void runRandomEffect() {
  if (millis() - lastEffectUpdate >= effectInterval) {
    if (selectiveMode) {
      // Random only among selected relays
      for (int i = 0; i < 12; i++) {
        if (selectedRelays[i]) {
          setRelay(i + 1, random(0, 2) == 1);
        }
      }
    } else {
      for (int i = 0; i < 12; i++) {
        setRelay(i + 1, random(0, 2) == 1);
      }
    }
    lastEffectUpdate = millis();
  }
}

void updateLightingEffect() {
  if (!effectRunning) return;
  
  switch (currentEffect) {
    case EFFECT_SOLID:
      // Static - no updates needed
      break;
    case EFFECT_STROBE:
      runStrobeEffect();
      break;
    case EFFECT_CHASE:
      runChaseEffect();
      break;
    case EFFECT_FADE:
      runFadeEffect();
      break;
    case EFFECT_RANDOM:
      runRandomEffect();
      break;
    default:
      break;
  }
}

void startEffect(EffectType effect, String effectName, unsigned long interval = 1000) {
  Serial.println("Starting effect: " + effectName + " (Area " + String(currentArea) + ")");
  currentEffect = effect;
  currentEffectName = effectName;
  effectInterval = interval;
  effectRunning = true;
  effectStartTime = millis();
  effectStep = 0;
  lastEffectUpdate = 0;
  setStatusLED(true, false); // Red = effect running
}

void stopEffect() {
  Serial.println("Stopping current effect");
  effectRunning = false;
  currentEffectName = "";
  setAllRelaysSafe();
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
  
  // Initialize status LEDs
  pinMode(STATUS_LED_RED, OUTPUT);
  pinMode(STATUS_LED_GREEN, OUTPUT);
  setStatusLED(false, true); // Green = initializing
  
  // Initialize all relay pins to OUTPUT and OFF (safe state)
  for (int i = 0; i < 12; i++) {
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], LOW);
    relayStates[i] = false;
  }
  
  // Simple WiFi setup
  Serial.println("Starting WiFi connection...");
  setupWiFi();
  
  // Setup API and mDNS if WiFi connected
  if (WiFi.status() == WL_CONNECTED) {
    if (MDNS.begin("lume-lighting")) {
      Serial.println("mDNS responder started: lume-lighting.local");
    } else {
      Serial.println("Error starting mDNS responder!");
    }
    setupAPI();
    Serial.println("WiFi connected successfully!");
    Serial.println("Web interface available at: http://" + WiFi.localIP().toString());
    Serial.println("Or via: http://lume-lighting.local/");
  } else {
    Serial.println("WiFi connection failed - using serial commands only.");
  }
  
  Serial.println("LUME Lighting Controller Ready.");
  Serial.println("Current Area: " + String(currentArea) + " (Max: " + String(maxAreas) + ")");
  Serial.println("Each area has 12 lighting zones/relays");
  Serial.println("Commands: RELAY <1-12> <ON/OFF>, ALL <ON/OFF>, EFFECT <SOLID/STROBE/CHASE/FADE/RANDOM>, STOP, AREA <1-99>, STATUS");
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
  
  // Update lighting effects
  updateLightingEffect();
  
  // Check for serial commands
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    command.toUpperCase();
    
    Serial.println("DEBUG: Received serial command: " + command);
    
    if (command.startsWith("RELAY ")) {
      String params = command.substring(6);
      int spaceIndex = params.indexOf(' ');
      if (spaceIndex > 0) {
        int relay = params.substring(0, spaceIndex).toInt();
        String state = params.substring(spaceIndex + 1);
        if (relay >= 1 && relay <= 12) {
          setRelay(relay, state == "ON");
        } else {
          Serial.println("Invalid relay. Use 1-12.");
        }
      } else {
        Serial.println("Usage: RELAY <1-12> <ON/OFF>");
      }
    } else if (command.startsWith("ALL ")) {
      String state = command.substring(4);
      setAllRelays(state == "ON");
    } else if (command.startsWith("EFFECT ")) {
      String effectName = command.substring(7);
      if (effectName == "SOLID") {
        setAllRelays(true);
        startEffect(EFFECT_SOLID, "Solid On");
      } else if (effectName == "STROBE") {
        startEffect(EFFECT_STROBE, "Strobe", 500);
      } else if (effectName == "CHASE") {
        startEffect(EFFECT_CHASE, "Chase", 200);
      } else if (effectName == "FADE") {
        startEffect(EFFECT_FADE, "Fade", 100);
      } else if (effectName == "RANDOM") {
        startEffect(EFFECT_RANDOM, "Random", 300);
      } else {
        Serial.println("Invalid effect. Use: SOLID, STROBE, CHASE, FADE, RANDOM");
      }
    } else if (command == "STOP") {
      stopEffect();
    } else if (command.startsWith("AREA ")) {
      int area = command.substring(5).toInt();
      if (area >= 1 && area <= maxAreas) {
        setArea(area);
      } else {
        Serial.println("Invalid area. Use 1-" + String(maxAreas) + ".");
      }
    } else if (command == "STATUS") {
      Serial.println("=== LIGHTING CONTROLLER STATUS ===");
      Serial.println("Area: " + String(currentArea));
      Serial.println("Effect Running: " + String(effectRunning ? "YES" : "NO"));
      if (effectRunning) {
        Serial.println("Current Effect: " + currentEffectName);
        Serial.println("Effect Runtime: " + String((millis() - effectStartTime) / 1000) + " seconds");
      }
      Serial.println("Brightness: " + String(currentBrightness) + "/255");
      Serial.println("WiFi Status: " + String(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected"));
      if (WiFi.status() == WL_CONNECTED) {
        Serial.println("WiFi SSID: " + WiFi.SSID());
        Serial.println("WiFi IP: " + WiFi.localIP().toString());
        Serial.println("WiFi RSSI: " + String(WiFi.RSSI()) + " dBm");
        Serial.println("Web interface: http://" + WiFi.localIP().toString());
      }
      Serial.println("Relay States:");
      for (int i = 0; i < 12; i++) {
        Serial.println("  Relay " + String(i + 1) + ": " + String(relayStates[i] ? "ON" : "OFF"));
      }
      Serial.println("Uptime: " + String(millis() / 1000) + " seconds");
    } else {
      Serial.println("Unknown command. Use: RELAY <1-12> <ON/OFF>, ALL <ON/OFF>, EFFECT <SOLID/STROBE/CHASE/FADE/RANDOM>, STOP, AREA <1-99>, STATUS");
    }
  }
}

void setArea(int area) {
  Serial.println("Setting lighting area to: " + String(area));
  currentArea = area;
  // Stop any running effects when changing areas
  stopEffect();
  Serial.println("Lighting area set to: " + String(currentArea) + " (of " + String(maxAreas) + " total areas)");
  Serial.println("This area has 12 lighting zones/relays");
}

// WiFi Setup - Same as firework controller for consistency
void setupWiFi() {
  Serial.println("Connecting to WiFi...");
  
  // Apply interference mitigation BEFORE WiFi connection
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false); // Disable power saving BEFORE connecting
  WiFi.setTxPower(WIFI_POWER_MINUS_1dBm); // Set minimum power BEFORE connecting
  
  // Add small delay to let pins stabilize
  delay(100);
  Serial.println("WiFi power set to minimum (-1dBm) for stability");
  
  if (strlen(WIFI_SSID) > 0 && strlen(WIFI_PASSWORD) > 0) {
    Serial.println("Using WiFi credentials: " + String(WIFI_SSID));
    // Try to use WiFi Channel 1 (2412 MHz) - furthest from interference
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD, 1);
  } else {
    Serial.println("Using saved WiFi credentials...");
    WiFi.begin();
  }
  
  // Wait for connection, retrying every 15 seconds until successful
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    for (int i = 0; i < 30; i++) { // 30 x 500ms = 15 seconds
      delay(500);
      Serial.print(".");
      attempts++;
      if (WiFi.status() == WL_CONNECTED) break;
    }
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("\nWiFi not connected, retrying...");
    }
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.println("IP address: " + WiFi.localIP().toString());
    Serial.println("Signal strength: " + String(WiFi.RSSI()) + " dBm");
    
    Serial.println("WiFi interference mitigation active");
    Serial.println("WiFi power set to minimum (-1dBm)");
    Serial.println("WiFi forced to Channel 1 (2412MHz)");
  } else {
    Serial.println("\nWiFi connection failed.");
    Serial.println("Check your credentials at the top of the file.");
  }
}

// API Endpoints Setup - Compatible with firework controller patterns
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
    html += "<title>LUME Lighting Controller</title>";
    html += "<meta charset='UTF-8'>";
    html += "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
    html += "<style>";
    html += "body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a1a; color: #fff; }";
    html += ".container { max-width: 800px; margin: 0 auto; }";
    html += ".header { text-align: center; margin-bottom: 30px; }";
    html += ".status { background: #333; padding: 20px; border-radius: 8px; margin-bottom: 20px; }";
    html += ".section { background: #2a2a2a; padding: 15px; border-radius: 8px; margin-bottom: 15px; }";
    html += ".button { background: #ffa726; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }";
    html += ".button:hover { background: #ff9800; }";
    html += ".button.on { background: #4caf50; }";
    html += ".button.off { background: #f44336; }";
    html += ".relay-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 15px 0; }";
    html += ".api-list { background: #222; padding: 15px; border-radius: 8px; }";
    html += ".endpoint { font-family: monospace; margin: 5px 0; }";
    html += "h1 { color: #ffa726; }";
    html += "h2 { color: #ffb74d; }";
    html += "</style></head><body>";
    
    html += "<div class='container'>";
    html += "<div class='header'>";
    html += "<h1>💡 LUME Lighting Controller</h1>";
    html += "<p>Professional Lighting Control System</p>";
    html += "</div>";
    
    html += "<div class='status'>";
    html += "<h2>System Status</h2>";
    html += "<p><strong>Current Area:</strong> " + String(currentArea) + " / " + String(maxAreas) + "</p>";
    html += "<p><strong>WiFi Network:</strong> " + WiFi.SSID() + "</p>";
    html += "<p><strong>IP Address:</strong> " + WiFi.localIP().toString() + "</p>";
    html += "<p><strong>Signal Strength:</strong> " + String(WiFi.RSSI()) + " dBm</p>";
    html += "<p><strong>Uptime:</strong> " + String(millis() / 1000) + " seconds</p>";
    html += "<p><strong>Effect Status:</strong> " + String(effectRunning ? "🔴 RUNNING" : "🟢 STOPPED") + "</p>";
    if (effectRunning) {
      html += "<p><strong>Current Effect:</strong> " + currentEffectName + "</p>";
    }
    html += "</div>";
    
    html += "<div class='section'>";
    html += "<h2>Quick Actions</h2>";
    html += "<button class='button off' onclick='emergencyStop()'>🛑 ALL OFF</button>";
    html += "<button class='button on' onclick='allOn()'>💡 ALL ON</button>";
    html += "<button class='button' onclick='getStatus()'>📊 Refresh</button>";
    html += "</div>";
    
    html += "<div class='section'>";
    html += "<h2>Lighting Effects</h2>";
    html += "<button class='button' onclick='startEffect(\"solid\")'>🔆 Solid</button>";
    html += "<button class='button' onclick='startEffect(\"strobe\")'>⚡ Strobe</button>";
    html += "<button class='button' onclick='startEffect(\"chase\")'>🏃 Chase</button>";
    html += "<button class='button' onclick='startEffect(\"fade\")'>🌅 Fade</button>";
    html += "<button class='button' onclick='startEffect(\"random\")'>🎲 Random</button>";
    html += "<button class='button off' onclick='stopEffect()'>⏹️ Stop</button>";
    html += "</div>";
    
    html += "<div class='section'>";
    html += "<h2>Individual Relays</h2>";
    html += "<div class='relay-grid'>";
    for (int i = 1; i <= 12; i++) {
      html += "<button class='button " + String(relayStates[i-1] ? "on" : "off") + "' ";
      html += "onclick='toggleRelay(" + String(i) + ")'>Relay " + String(i) + "</button>";
    }
    html += "</div></div>";
    
    html += "<div class='section'>";
    html += "<h2>Controller Information</h2>";
    html += "<p><strong>Lighting Zones:</strong> 12 per area</p>";
    html += "<p><strong>Total Areas:</strong> 99 areas supported</p>";
    html += "<p><strong>Control Method:</strong> Relay switching</p>";
    html += "<p><strong>Safety Features:</strong> Emergency stop, safe initialization</p>";
    html += "</div>";
    
    html += "<div class='api-list'>";
    html += "<h2>API Endpoints</h2>";
    html += "<div class='endpoint'>GET /status - Controller status</div>";
    html += "<div class='endpoint'>POST /area?id=N - Set area (1-99)</div>";
    html += "<div class='endpoint'>POST /relay?id=N&state=ON/OFF - Control relay</div>";
    html += "<div class='endpoint'>POST /all?state=ON/OFF - Control all relays</div>";
    html += "<div class='endpoint'>POST /effect?type=TYPE&interval=MS - Start effect</div>";
    html += "<div class='endpoint'>POST /emergency/stop - Emergency stop</div>";
    html += "<div class='endpoint'>GET /version - Version information</div>";
    html += "</div>";
    
    html += "</div>";
    
    html += "<script>";
    html += "function emergencyStop() {";
    html += "  fetch('/emergency/stop', {method: 'POST'})";
    html += "    .then(r => r.json())";
    html += "    .then(d => { alert('All lights turned off!'); location.reload(); });";
    html += "}";
    html += "function allOn() {";
    html += "  fetch('/all?state=ON', {method: 'POST'})";
    html += "    .then(r => r.json())";
    html += "    .then(d => location.reload());";
    html += "}";
    html += "function startEffect(type) {";
    html += "  fetch('/effect?type=' + type.toUpperCase(), {method: 'POST'})";
    html += "    .then(r => r.json())";
    html += "    .then(d => location.reload());";
    html += "}";
    html += "function stopEffect() {";
    html += "  fetch('/effect/stop', {method: 'POST'})";
    html += "    .then(r => r.json())";
    html += "    .then(d => location.reload());";
    html += "}";
    html += "function toggleRelay(id) {";
    html += "  fetch('/relay/toggle?id=' + id, {method: 'POST'})";
    html += "    .then(r => r.json())";
    html += "    .then(d => location.reload());";
    html += "}";
    html += "function getStatus() { location.reload(); }";
    html += "</script>";
    html += "</body></html>";
    
    server.send(200, "text/html", html);
  });
  
  // GET /status - Controller status
  server.on("/status", HTTP_GET, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    StaticJsonDocument<500> doc;
    doc["area"] = currentArea;
    doc["maxAreas"] = maxAreas;
    doc["effectRunning"] = effectRunning;
    doc["effectName"] = currentEffectName;
    doc["brightness"] = currentBrightness;
    doc["uptime"] = millis();
    doc["wifiRSSI"] = WiFi.RSSI();
    
    JsonArray relays = doc.createNestedArray("relayStates");
    for (int i = 0; i < 12; i++) {
      relays.add(relayStates[i]);
    }
    
    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
  });
  
  // POST /area - Set area
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
  
  // POST /relay - Control single relay
  server.on("/relay", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    if (server.hasArg("id") && server.hasArg("state")) {
      int relay = server.arg("id").toInt();
      String state = server.arg("state");
      state.toUpperCase();
      if (relay >= 1 && relay <= 12) {
        setRelay(relay, state == "ON");
        server.send(200, "application/json", "{\"success\":true,\"relay\":" + String(relay) + ",\"state\":\"" + state + "\"}");
      } else {
        server.send(400, "application/json", "{\"error\":\"Invalid relay. Use 1-12\"}");
      }
    } else {
      server.send(400, "application/json", "{\"error\":\"Missing relay id or state\"}");
    }
  });
  
  // POST /relay/toggle - Toggle single relay
  server.on("/relay/toggle", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    if (server.hasArg("id")) {
      int relay = server.arg("id").toInt();
      if (relay >= 1 && relay <= 12) {
        bool newState = !relayStates[relay - 1];
        setRelay(relay, newState);
        server.send(200, "application/json", "{\"success\":true,\"relay\":" + String(relay) + ",\"state\":\"" + String(newState ? "ON" : "OFF") + "\"}");
      } else {
        server.send(400, "application/json", "{\"error\":\"Invalid relay. Use 1-12\"}");
      }
    } else {
      server.send(400, "application/json", "{\"error\":\"Missing relay id\"}");
    }
  });
  
  // POST /all - Control all relays
  server.on("/all", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    if (server.hasArg("state")) {
      String state = server.arg("state");
      state.toUpperCase();
      setAllRelays(state == "ON");
      server.send(200, "application/json", "{\"success\":true,\"state\":\"" + state + "\"}");
    } else {
      server.send(400, "application/json", "{\"error\":\"Missing state parameter\"}");
    }
  });
  
  // POST /effect - Start lighting effect
  server.on("/effect", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    if (server.hasArg("type")) {
      String effectType = server.arg("type");
      effectType.toUpperCase();
      unsigned long interval = server.hasArg("interval") ? server.arg("interval").toInt() : 1000;
      
      if (effectType == "SOLID") {
        if (selectiveMode) {
          setSelectedRelays(true);
        } else {
          setAllRelays(true);
        }
        startEffect(EFFECT_SOLID, "Solid On");
      } else if (effectType == "STROBE") {
        startEffect(EFFECT_STROBE, "Strobe", interval > 0 ? interval : 500);
      } else if (effectType == "CHASE") {
        startEffect(EFFECT_CHASE, "Chase", interval > 0 ? interval : 200);
      } else if (effectType == "FADE") {
        startEffect(EFFECT_FADE, "Fade", interval > 0 ? interval : 100);
      } else if (effectType == "RANDOM") {
        startEffect(EFFECT_RANDOM, "Random", interval > 0 ? interval : 300);
      } else {
        server.send(400, "application/json", "{\"error\":\"Invalid effect type. Use: SOLID, STROBE, CHASE, FADE, RANDOM\"}");
        return;
      }
      
      server.send(200, "application/json", "{\"success\":true,\"effect\":\"" + effectType + "\",\"interval\":" + String(interval) + ",\"selective\":" + String(selectiveMode ? "true" : "false") + "}");
    } else {
      server.send(400, "application/json", "{\"error\":\"Missing effect type\"}");
    }
  });

  // NEW: POST /effect/selective - Start lighting effect on selected relays only
  server.on("/effect/selective", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    if (server.hasArg("type") && server.hasArg("relays")) {
      String effectType = server.arg("type");
      effectType.toUpperCase();
      String relaysParam = server.arg("relays");
      unsigned long interval = server.hasArg("interval") ? server.arg("interval").toInt() : 1000;
      
      // Parse relay list (comma-separated: "1,3,5,7")
      clearSelectedRelays();
      selectiveMode = true;
      
      int relayIndex = 0;
      int commaIndex = 0;
      while (commaIndex != -1) {
        commaIndex = relaysParam.indexOf(',', relayIndex);
        String relayStr = (commaIndex != -1) ? relaysParam.substring(relayIndex, commaIndex) : relaysParam.substring(relayIndex);
        relayStr.trim();
        
        int relay = relayStr.toInt();
        if (relay >= 1 && relay <= 12) {
          selectedRelays[relay - 1] = true;
        }
        
        relayIndex = commaIndex + 1;
      }
      
      // Start the effect
      if (effectType == "SOLID") {
        setSelectedRelays(true);
        startEffect(EFFECT_SOLID, "Selective Solid");
      } else if (effectType == "STROBE") {
        startEffect(EFFECT_STROBE, "Selective Strobe", interval > 0 ? interval : 500);
      } else if (effectType == "CHASE") {
        startEffect(EFFECT_CHASE, "Selective Chase", interval > 0 ? interval : 200);
      } else if (effectType == "FADE") {
        startEffect(EFFECT_FADE, "Selective Fade", interval > 0 ? interval : 100);
      } else if (effectType == "RANDOM") {
        startEffect(EFFECT_RANDOM, "Selective Random", interval > 0 ? interval : 300);
      } else {
        server.send(400, "application/json", "{\"error\":\"Invalid effect type. Use: SOLID, STROBE, CHASE, FADE, RANDOM\"}");
        return;
      }
      
      server.send(200, "application/json", "{\"success\":true,\"effect\":\"" + effectType + "\",\"relays\":\"" + relaysParam + "\",\"interval\":" + String(interval) + "}");
    } else {
      server.send(400, "application/json", "{\"error\":\"Missing effect type or relays parameter\"}");
    }
  });
  
  // POST /effect/stop - Stop current effect
  server.on("/effect/stop", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    stopEffect();
    clearSelectedRelays(); // Clear selective mode when stopping
    server.send(200, "application/json", "{\"success\":true,\"message\":\"Effect stopped\"}");
  });
  
  // POST /emergency/stop - Emergency stop
  server.on("/emergency/stop", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    setAllRelaysSafe();
    server.send(200, "application/json", "{\"success\":true,\"message\":\"Emergency stop activated\"}");
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

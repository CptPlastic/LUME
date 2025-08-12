// LUME Base Station
// Purpose: Acts as a WiFi base station for LUME nodes (controller, lighting, etc.)
// Author: CptPlastic
// Date: August 2025
// Version: 0.1.0

#include <WiFi.h>
#include <ESPmDNS.h>

// WiFi AP settings
const char* AP_SSID = "LUME";
const char* AP_PASSWORD = "DOXW7TBD";

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println();
  Serial.println("=====================================");
  Serial.println("LUME Base Station - WiFi AP Mode");
  Serial.println("=====================================");

  // Start WiFi in AP mode
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASSWORD);
  Serial.print("WiFi AP started: ");
  Serial.println(AP_SSID);
  Serial.print("IP address: ");
  Serial.println(WiFi.softAPIP());

  // Start mDNS responder for lume-base.local
  if (MDNS.begin("lume-base")) {
    Serial.println("mDNS responder started: lume-base.local");
  } else {
    Serial.println("Error starting mDNS responder!");
  }
}

void loop() {
  // Future: Listen for LUME node discovery requests
  // Future: Broadcast presence, respond to queries
  delay(1000);
}

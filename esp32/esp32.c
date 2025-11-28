#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// --- NETWORK SETTINGS ---
const char* ssid = "po1";
const char* password = "299792ps";
const char* mqtt_server = "test.mosquitto.org";
const int mqtt_port = 1883;
const char* mqtt_topic = "tippaphanun/5f29d93c/sensor/data";

// --- PIN DEFINITIONS ---
#define FLAME_PIN 34      // KY-026 Analog Pin
#define DHT_PIN 26        // KY-015 Data Pin
#define DHT_TYPE DHT11    // KY-015 uses the DHT11 sensor
#define RELAY_PIN 27

// --- OBJECTS ---
WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHT_PIN, DHT_TYPE);

// --- TIMING VARIABLES ---
long lastMsg = 0;
const long interval = 5000; 

const int FLAME_THRESHOLD = 75;

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Create a random client ID
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    
    // Attempt to connect
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  
  // Initialize Sensors
  dht.begin();
  pinMode(FLAME_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);

  // Initialize Network
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Read the flame sensor immediately
  int flame_analog_value = analogRead(FLAME_PIN);
  
  // Map and constrain
  int flame_intensity = map(flame_analog_value, 4095, 0, 0, 100);
  flame_intensity = constrain(flame_intensity, 0, 100);

  char msg_light[100];

  // Check threshold
  if (flame_intensity > FLAME_THRESHOLD) {
    // If fire is detected, turn Relay ON immediately
    digitalWrite(RELAY_PIN, LOW);
    Serial.println("FIRE! Relay ON"); // Uncomment for debugging only
    snprintf(msg_light, 100, "{\"type\": \"light\", \"value\": %d}", flame_intensity);
    Serial.print("Publishing Flame: ");
    Serial.println(msg_light);
    client.publish(mqtt_topic, msg_light);
    delay(3000);
    digitalWrite(RELAY_PIN, HIGH);
    delay(100);
  }

  long now = millis();
  if (now - lastMsg > interval) {
    lastMsg = now;

    // --- READ KY-015 (DHT11) ---
    float h = dht.readHumidity();
    float t = dht.readTemperature(); // Celsius

    // Check if any reads failed
    if (isnan(h) || isnan(t)) {
      Serial.println("Failed to read from DHT sensor!");
      return; 
    }

    // --- READ KY-026 (Flame) ---
    int flame_analog_value = analogRead(FLAME_PIN);
    // Mapping based on your previous code: 4095 (Dark) to 0 (Fire)
    int flame_intensity = map(flame_analog_value, 4095, 0, 0, 100);
    // Clamp result between 0 and 100 just in case
    flame_intensity = constrain(flame_intensity, 0, 100);

    // --- PUBLISH 1: TEMPERATURE ---
    char msg_temp[100];
    // Note: (int)t casts the float temperature to an integer as requested
    snprintf(msg_temp, 100, "{\"type\": \"temp\", \"value\": %d}", (int)t);
    Serial.print("Publishing Temp: ");
    Serial.println(msg_temp);
    client.publish(mqtt_topic, msg_temp);
    
    // --- PUBLISH 2: HUMIDITY ---
    char msg_hum[100];
    snprintf(msg_hum, 100, "{\"type\": \"humid\", \"value\": %d}", (int)h);
    Serial.print("Publishing Humid: ");
    Serial.println(msg_hum);
    client.publish(mqtt_topic, msg_hum);

    // --- PUBLISH 3: LIGHT ---
    snprintf(msg_light, 100, "{\"type\": \"light\", \"value\": %d}", flame_intensity);
    Serial.print("Publishing Flame: ");
    Serial.println(msg_light);
    client.publish(mqtt_topic, msg_light);
  }
}
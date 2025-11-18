# MQTT Data Format Update - Summary

## Changes Made

### 1. Updated MQTT Hook (`hooks/useMQTT.ts`)

**Before**: Subscribed to 3 topics with different message formats

- `sensor-data` - Single object with all sensor values
- `camera-detection` - Camera-specific data
- `control-action` - Control commands

**After**: Subscribed to 2 topics with simplified format

- `sensor/data` - Individual sensor messages with type-value pairs
- `control-action` - Control commands (unchanged)

### 2. New Data Structure

**Message Format** (sensor/data):

```json
{
  "type": "temp" | "humid" | "air" | "sound" | "light" | "people_count",
  "value": number
}
```

**Sensor Types**:

- `temp` → Temperature (°C)
- `humid` → Humidity (%)
- `air` → Air Quality (AQI)
- `sound` → Sound level (dB)
- `light` → Light intensity (lux)
- `people_count` → Number of people detected

### 3. Updated Components

#### `hooks/useMQTT.ts`

- Changed `SensorData` interface to store individual sensor values
- Removed `CameraDetection` interface (people count now part of sensor data)
- Updated message handler to parse type-value format
- State updates now accumulate sensor readings

#### `app/page.tsx`

- Added `getCrowdDensity()` helper function
- Updated all sensor value references to handle nullable values
- Changed CrowdMonitor to use `peopleCount` from sensorData
- Fixed null checks for all sensors

#### `components/CrowdMonitor.tsx`

- Changed props from `cameraDetection` object to individual props
- Now accepts `crowdCount` and `crowdDensity` directly
- Removed timestamp display

### 4. Updated Documentation

#### `README.md`

- Updated MQTT topic documentation
- Added examples for each sensor type
- Updated test commands with new format

### 5. Test Script

Created `test-mqtt.js` to simulate sensor data:

- Publishes random sensor values every 2 seconds
- Simulates all 6 sensor types
- Publishes control actions every 10 seconds

## Testing the Dashboard

### 1. Start MQTT Broker (with WebSocket support)

Create `mosquitto.conf`:

```
listener 1883
protocol mqtt

listener 9001
protocol websockets
```

Run:

```bash
mosquitto -c mosquitto.conf
```

### 2. Start Dashboard

```bash
cd frontend
npm run dev
```

### 3. Publish Test Data

**Option A: Use test script**

```bash
node test-mqtt.js
```

**Option B: Manual publishing**

```bash
# Temperature
mosquitto_pub -t sensor/data -m '{"type":"temp","value":25.5}'

# Humidity
mosquitto_pub -t sensor/data -m '{"type":"humid","value":60}'

# Air Quality
mosquitto_pub -t sensor/data -m '{"type":"air","value":45}'

# Sound
mosquitto_pub -t sensor/data -m '{"type":"sound","value":55}'

# Light
mosquitto_pub -t sensor/data -m '{"type":"light","value":450}'

# People Count
mosquitto_pub -t sensor/data -m '{"type":"people_count","value":15}'
```

## ESP32/Raspberry Pi Integration

Your sensor code should publish messages in this format:

```python
# Python example
import json
import paho.mqtt.client as mqtt

client = mqtt.Client()
client.connect("broker_ip", 1883)

# Send temperature reading
message = json.dumps({"type": "temp", "value": 25.5})
client.publish("sensor/data", message, qos=1)

# Send people count
message = json.dumps({"type": "people_count", "value": 15})
client.publish("sensor/data", message, qos=1)
```

```cpp
// Arduino/ESP32 example
#include <PubSubClient.h>
#include <ArduinoJson.h>

void publishSensor(const char* type, float value) {
  StaticJsonDocument<64> doc;
  doc["type"] = type;
  doc["value"] = value;

  char buffer[64];
  serializeJson(doc, buffer);

  client.publish("sensor/data", buffer, true);
}

// Usage
publishSensor("temp", 25.5);
publishSensor("people_count", 15);
```

## Benefits of New Format

1. **Simpler**: Each sensor sends one message with type and value
2. **Scalable**: Easy to add new sensor types without changing interface
3. **Flexible**: Sensors can publish at different rates
4. **Reliable**: Each reading is independent
5. **Easy to Parse**: Simple type-value structure on ESP32/RPi

## Migration Notes

- Dashboard will show `--` for sensors that haven't sent data yet
- All sensor values start as `null` and update as messages arrive
- Crowd density is calculated based on people count (0-9: low, 10-19: medium, 20+: high)
- Charts will populate as new data arrives

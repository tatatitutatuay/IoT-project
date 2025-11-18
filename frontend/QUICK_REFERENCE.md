# Quick Reference: MQTT Data Format

## 📡 Topic: `sensor/data`

All sensors publish to the same topic with this format:

```json
{
  "type": "sensor_type",
  "value": number
}
```

## 🔧 Sensor Types

| Type           | Description     | Unit  | Example Value |
| -------------- | --------------- | ----- | ------------- |
| `temp`         | Temperature     | °C    | 25.5          |
| `humid`        | Humidity        | %     | 60            |
| `air`          | Air Quality     | AQI   | 45            |
| `sound`        | Sound Level     | dB    | 55            |
| `light`        | Light Intensity | lux   | 450           |
| `people_count` | People Detected | count | 15            |

## 📤 Example Messages

```bash
# Temperature
{"type":"temp","value":25.5}

# Humidity
{"type":"humid","value":60}

# Air Quality
{"type":"air","value":45}

# Sound
{"type":"sound","value":55}

# Light
{"type":"light","value":450}

# People Count
{"type":"people_count","value":15}
```

## 🎛️ Topic: `control-action`

```json
{
  "led": true,
  "fan": false,
  "light": true,
  "autoMode": true,
  "timestamp": 1700000000000
}
```

## 🚀 Quick Test Commands

```bash
# Publish temperature
mosquitto_pub -t sensor/data -m '{"type":"temp","value":25.5}'

# Publish people count
mosquitto_pub -t sensor/data -m '{"type":"people_count","value":15}'

# Subscribe to all sensor data
mosquitto_sub -t sensor/data -v

# Subscribe to control actions
mosquitto_sub -t control-action -v
```

## 💡 Tips

1. **All values are numbers** - Convert strings to numbers before publishing
2. **No timestamp needed** - Dashboard tracks time automatically
3. **Publish frequently** - Dashboard updates in real-time
4. **QoS 1 recommended** - Ensures message delivery
5. **Keep it simple** - Just type and value, nothing else needed

## 🔄 Crowd Density Logic

| People Count | Density Level |
| ------------ | ------------- |
| 0-9          | Low           |
| 10-19        | Medium        |
| 20+          | High          |

## 📊 Sensor Thresholds

### Temperature

- ✅ Normal: 20-28°C
- ⚠️ Warning: <20°C or >28°C
- 🔴 Critical: >30°C

### Humidity

- ✅ Normal: 30-70%
- ⚠️ Warning: <30% or >70%

### Air Quality

- ✅ Good: <50 AQI
- ⚠️ Moderate: 50-100 AQI
- 🔴 Unhealthy: >100 AQI

### Sound Level

- ✅ Normal: <60 dB
- ⚠️ Warning: 60-80 dB
- 🔴 Critical: >80 dB

### Light

- ⚠️ Warning: <200 lux (too dark)
- ✅ Normal: ≥200 lux

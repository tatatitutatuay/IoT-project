# Smart Campus Crowd Monitor Dashboard

A real-time IoT dashboard for monitoring crowd density and environmental comfort in campus zones using Next.js, React, and MQTT.

## Features

- 📊 **Real-time Monitoring**: Live sensor data updates via MQTT
- 👥 **Crowd Detection**: Image-based people counting with density analysis
- 🌡️ **Environmental Sensors**: Temperature, humidity, air quality, sound, and light monitoring
- 📈 **Data Visualization**: Historical charts for all sensor readings
- 🎛️ **Device Control**: Automatic or manual control of LED, fan, and lights
- 🔄 **Auto Mode**: Intelligent device control based on crowd density and sensor data

## Sensors

- **Temperature & Humidity Sensor**: Monitors ambient conditions
- **Air Quality Sensor (ENS160+AHT21)**: Measures AQI and air quality status
- **Sound Sensor**: Detects noise levels in dB
- **LDR (Light Sensor)**: Measures ambient light intensity
- **Camera**: People counting and crowd density detection
- **LED**: Indicator/lighting control
- **Fan**: Climate control
- **Light**: Ambient lighting control

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **IoT Protocol**: MQTT (mqtt.js)

## Getting Started

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## MQTT Configuration

### Broker Setup

The dashboard connects to an MQTT broker via WebSocket. By default, it uses:

```
ws://localhost:9001
```

To change the broker URL, modify the `useMQTT` hook in `hooks/useMQTT.ts`.

### MQTT Topics

The dashboard subscribes to two main topics:

#### 1. `sensor/data`

Real-time sensor readings from ESP32/Raspberry Pi. Each sensor sends data with a type and value.

**Message Format**:

```json
{
  "type": "temp",
  "value": 25.5
}
```

**Sensor Types**:

- `"temp"` - Temperature in °C
- `"humid"` - Humidity in %
- `"air"` - Air Quality (AQI)
- `"sound"` - Sound level in dB
- `"light"` - Light intensity in lux
- `"people_count"` - Number of people detected

**Example Messages**:

```json
{"type": "temp", "value": 25.5}
{"type": "humid", "value": 60.2}
{"type": "air", "value": 45}
{"type": "sound", "value": 55.3}
{"type": "light", "value": 450}
{"type": "people_count", "value": 15}
```

#### 2. `control-action`

Device control status and commands.

**Message Format**:

```json
{
  "led": true,
  "fan": false,
  "light": true,
  "autoMode": true,
  "timestamp": 1700000000000
}
```

## Testing with MQTT

### Using Mosquitto Broker

1. **Install Mosquitto**:

```bash
# Windows
choco install mosquitto

# macOS
brew install mosquitto

# Linux
sudo apt-get install mosquitto mosquitto-clients
```

2. **Start broker with WebSocket support**:
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

3. **Publish test data**:

```bash
# Temperature sensor
mosquitto_pub -t sensor/data -m '{"type":"temp","value":25.5}'

# Humidity sensor
mosquitto_pub -t sensor/data -m '{"type":"humid","value":60}'

# Air quality sensor
mosquitto_pub -t sensor/data -m '{"type":"air","value":45}'

# Sound sensor
mosquitto_pub -t sensor/data -m '{"type":"sound","value":55}'

# Light sensor
mosquitto_pub -t sensor/data -m '{"type":"light","value":450}'

# People count
mosquitto_pub -t sensor/data -m '{"type":"people_count","value":15}'

# Control action
mosquitto_pub -t control-action -m '{"led":true,"fan":false,"light":true,"autoMode":true,"timestamp":1700000000000}'
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main dashboard page
│   └── globals.css         # Global styles
├── components/
│   ├── SensorCard.tsx      # Sensor display card
│   ├── CrowdMonitor.tsx    # Crowd occupancy component
│   ├── ControlPanel.tsx    # Device control interface
│   └── SensorChart.tsx     # Real-time chart component
├── hooks/
│   └── useMQTT.ts          # MQTT connection hook
└── package.json
```

## Sensor Thresholds

### Temperature

- **Normal**: 20-28°C
- **Warning**: <20°C or >28°C
- **Critical**: >30°C

### Humidity

- **Normal**: 30-70%
- **Warning**: <30% or >70%

### Air Quality (AQI)

- **Good**: <50
- **Moderate**: 50-100
- **Unhealthy**: >100

### Sound Level

- **Normal**: <60 dB
- **Warning**: 60-80 dB
- **Critical**: >80 dB

### Light Intensity

- **Warning**: <200 lux (too dark)
- **Normal**: ≥200 lux

## Deploy on Vercel

```bash
npm run build
vercel deploy
```

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

MIT

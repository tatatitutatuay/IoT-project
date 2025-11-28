import time
import board
import busio
import adafruit_ahtx0
# import adafruit_ens160
import json
import paho.mqtt.client as mqtt

# ---------------------- MQTT SETUP ----------------------
MQTT_BROKER = "test.mosquitto.org"      # change to your server IP if needed
MQTT_PORT = 1883
MQTT_TOPIC = "tippaphanun/5f29d93c/sensor/data"

client = mqtt.Client()
client.connect(MQTT_BROKER, MQTT_PORT, 60)
# --------------------------------------------------------
def payload_ens(type: str, detected: bool):
    payload = {
        "type": type,
        "value": detected
    }
    client.publish(MQTT_TOPIC, json.dumps(payload))

# --- 1. เริ่มต้นการเชื่อมต่อ I2C ---
# (Adafruit Blinka จะหา SCL/SDA ที่ถูกต้องให้เราเอง)
i2c = busio.I2C(board.SCL, board.SDA)

# --- 2. เริ่มต้นการเชื่อมต่อเซ็นเซอร์ ---
try:
    aht = adafruit_ahtx0.AHTx0(i2c)
    print("พบ AHT21 (Temp/Humidity)!")
except Exception as e:
    print(f"ไม่พบ AHT21: {e}")
    exit()

# --- 4. วนลูปอ่านค่า ---
try:
    while True:
        # ควรอัปเดตค่าชดเชยเป็นระยะ (เช่น ทุก 1-2 วินาที)
        # ens.set_temperature_compensation(aht.temperature)
        # ens.set_humidity_compensation(aht.relative_humidity)
        
        # อ่านค่าจาก ENS160
        # aqi = ens.AQI         # ดัชนีคุณภาพอากาศ (1-5)
        # tvoc = ens.TVOC       # สารระเหย (ppb)
        # eco2 = ens.eCO2       # ค่าเทียบเท่า CO2 (ppm)

        print(f"อุณหภูมิ: {aht.temperature:.1f} C")
        print(f"ความชื้น: {aht.relative_humidity:.1f} %RH")
        # print(f"AQI (1-5): {aqi}")
        # print(f"eCO2: {eco2} ppm")
        # print(f"TVOC: {tvoc} ppb")
        # print("-" * 30)
        
        # ส่งค่า AQI ไปยัง MQTT
        # payload_ens("aqi", aqi)
        # payload_ens("tvoc", tvoc)
        # payload_ens("eco2", eco2)

        payload_ens("temp", aht.temperature)
        payload_ens("humid", aht.relative_humidity)
        
        time.sleep(5) # อ่านค่าทุก 5 วินาที

except KeyboardInterrupt:
    print("\nหยุดการทำงาน")
finally:
    print("ปิดการเชื่อมต่อ I2C")
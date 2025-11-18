import time
import board
import busio
import adafruit_ahtx0
import adafruit_ens160
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

try:
    ens = adafruit_ens160.ENS160(i2c)
    print("พบ ENS160 (Air Quality)!")
except Exception as e:
    print(f"ไม่พบ ENS160: {e}")
    exit()

# --- 3. (สำคัญ) ตั้งค่าการชดเชยค่า ---
# เราต้องบอก ENS160 ว่าอุณหภูมิและความชื้นตอนนี้เท่าไหร่
# เพื่อให้มันคำนวณค่า AQI, eCO2, TVOC ได้แม่นยำ
try:
    # อ่านค่าจาก AHT21
    current_temp = aht.temperature
    current_humidity = aht.relative_humidity
    
    # ป้อนค่าให้ ENS160
    ens.set_temperature_compensation(current_temp)
    ens.set_humidity_compensation(current_humidity)
    print(f"ตั้งค่าชดเชย: {current_temp:.1f} C, {current_humidity:.1f} %RH")
    
    # หมายเหตุ: เซ็นเซอร์ ENS160 ต้องการเวลา "อุ่นเครื่อง" (warm-up) 
    # ในการใช้งานจริง ค่าจะเริ่มนิ่งหลังจากเปิดไว้สัก 3-5 นาที
    print("เซ็นเซอร์กำลังอุ่นเครื่อง... ค่าอาจยังไม่นิ่งในนาทีแรกๆ")
    print("-" * 30)
    
except Exception as e:
    print(f"เกิดข้อผิดพลาดในการตั้งค่าชดเชย: {e}")
    exit()


# --- 4. วนลูปอ่านค่า ---
try:
    while True:
        # ควรอัปเดตค่าชดเชยเป็นระยะ (เช่น ทุก 1-2 วินาที)
        ens.set_temperature_compensation(aht.temperature)
        ens.set_humidity_compensation(aht.relative_humidity)
        
        # อ่านค่าจาก ENS160
        aqi = ens.AQI         # ดัชนีคุณภาพอากาศ (1-5)
        tvoc = ens.TVOC       # สารระเหย (ppb)
        eco2 = ens.eCO2       # ค่าเทียบเท่า CO2 (ppm)

        print(f"อุณหภูมิ: {aht.temperature:.1f} C")
        print(f"ความชื้น: {aht.relative_humidity:.1f} %RH")
        print(f"AQI (1-5): {aqi}")
        print(f"eCO2: {eco2} ppm")
        print(f"TVOC: {tvoc} ppb")
        print("-" * 30)
        
        # ส่งค่า AQI ไปยัง MQTT
        payload_ens("aqi", aqi)
        payload_ens("tvoc", tvoc)
        payload_ens("eco2", eco2)
        
        time.sleep(2) # อ่านค่าทุก 2 วินาที

except KeyboardInterrupt:
    print("\nหยุดการทำงาน")
finally:
    print("ปิดการเชื่อมต่อ I2C")
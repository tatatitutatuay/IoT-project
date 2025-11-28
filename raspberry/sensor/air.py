import time
import board
import busio
import digitalio
import adafruit_ens160
import json
import paho.mqtt.client as mqtt

# ---------------------- MQTT SETUP ----------------------
MQTT_BROKER = "test.mosquitto.org"
MQTT_PORT = 1883
MQTT_TOPIC = "tippaphanun/5f29d93c/sensor/data"
DEVICE_ID = "5f29d93c"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("MQTT: เชื่อมต่อสำเร็จ")
    else:
        print(f"MQTT: เชื่อมต่อล้มเหลว, Code {rc}")

def publish_ens160_data(aqi, eco2, tvoc):
    # รวมข้อมูลทั้งหมดเป็น Payload เดียว
    payload = {
        "device_id": DEVICE_ID,
        "timestamp": time.time(),
        "aqi_index": aqi,
        "eco2_ppm": eco2,
        "tvoc_ppb": tvoc
    }
    client.publish(MQTT_TOPIC, json.dumps(payload), qos=1)
    print(f"-> ส่งข้อมูล MQTT แล้ว (AQI: {aqi}, eCO2: {eco2})")

client = mqtt.Client()
client.on_connect = on_connect
client.connect(MQTT_BROKER, MQTT_PORT, 60)
client.loop_start() # เริ่มการทำงานแบบ Threaded เพื่อจัดการการเชื่อมต่อ
# --------------------------------------------------------

# --- 1. เริ่มต้นการเชื่อมต่อ SPI ---
# SCK = GPIO 11 (Pin 23), MOSI = GPIO 10 (Pin 19), MISO = GPIO 9 (Pin 21)
spi = busio.SPI(board.SCK, MOSI=board.MOSI, MISO=board.MISO)

# --- 2. กำหนดขา Chip Select (CS) สำหรับ ENS160 ---
# ตัวอย่างนี้ใช้ CE1 (GPIO 7 / Pin 26)
cs_ens = digitalio.DigitalInOut(board.CE1) 

# --- 3. เริ่มต้นเซ็นเซอร์ ENS160 ---
try:
    # ตั้งค่า ENS160 ให้ใช้ SPI
    ens = adafruit_ens160.ENS160(spi, cs_ens)
    print("✅ พบ ENS160 (Air Quality)!")
except Exception as e:
    print(f"❌ ไม่พบ ENS160: {e}")
    client.loop_stop()
    exit()

# --- 4. (สำคัญ) ตั้งค่าการชดเชยค่า (Environment Compensation) ---
# เนื่องจากคุณไม่ได้ใช้ AHT21 คุณต้องกำหนดค่า T/H เอง
# หากคุณไม่ส่งค่า T/H ที่ถูกต้องให้ ENS160 มันจะใช้ค่าเริ่มต้น (20°C, 50% RH) 
# ซึ่งอาจทำให้ค่า eCO2/TVOC ไม่แม่นยำ 
# *หากไม่มีเซนเซอร์ T/H SPI ตัวอื่น ต้องใช้ค่าคงที่นี้*
DEFAULT_TEMP = 25.0  # อุณหภูมิโดยประมาณ (°C)
DEFAULT_HUMIDITY = 40.0 # ความชื้นโดยประมาณ (%RH)

try:
    ens.set_temperature_compensation(DEFAULT_TEMP)
    ens.set_humidity_compensation(DEFAULT_HUMIDITY)
    print(f"⚙️ ตั้งค่าชดเชยค่าคงที่: {DEFAULT_TEMP:.1f} C, {DEFAULT_HUMIDITY:.1f} %RH")
    print("⚠️ ค่า AQI/eCO2/TVOC อาจไม่แม่นยำ หากค่า T/H จริงแตกต่างจากค่าที่ตั้งไว้")
    print("⚠️ เซ็นเซอร์กำลังอุ่นเครื่อง... ค่าอาจยังไม่นิ่งในนาทีแรกๆ")
    print("-" * 30)
    
except Exception as e:
    print(f"❌ เกิดข้อผิดพลาดในการตั้งค่าชดเชย: {e}")
    client.loop_stop()
    exit()


# --- 5. วนลูปอ่านค่า ---
try:
    while True:
        try:
            # อ่านค่าจาก ENS160
            aqi = ens.AQI     # ดัชนีคุณภาพอากาศ (1-5)
            tvoc = ens.TVOC   # สารระเหย (ppb)
            eco2 = ens.eCO2   # ค่าเทียบเท่า CO2 (ppm)

            # แสดงค่า
            print(f"💨 AQI (1-5): {aqi}")
            print(f"💨 eCO2: {eco2} ppm")
            print(f"💨 TVOC: {tvoc} ppb")
            print("-" * 30)
            
            # ส่งค่าไปยัง MQTT
            publish_ens160_data(aqi, eco2, tvoc)
            
        except Exception as read_error:
            print(f"❌ เกิดข้อผิดพลาดในการอ่านค่าเซ็นเซอร์: {read_error}")
            
        time.sleep(2) # อ่านค่าทุก 2 วินาที

except KeyboardInterrupt:
    print("\n👋 หยุดการทำงาน")
finally:
    client.loop_stop()
    print("🗑️ ปิดการเชื่อมต่อ SPI และ MQTT")
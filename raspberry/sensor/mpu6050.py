import time
import board
import busio
import adafruit_mpu6050
import json
import paho.mqtt.client as mqtt

# ---------------------- CONFIGURATION ----------------------
# เกณฑ์การตรวจจับ (Threshold)
# ค่านี้คือความเร่งสูงสุดที่ยอมรับได้เมื่อวัตถุ "นิ่ง"
# หากค่าความเร่ง (ในหน่วย m/s^2) เกินค่านี้ จะถือว่ามีการเคลื่อนที่
MOTION_THRESHOLD_ACCEL = 0.5  # m/s^2 (ประมาณ 0.05g)

# ---------------------- MQTT SETUP ----------------------
MQTT_BROKER = "test.mosquitto.org"      # change to your server IP if needed
MQTT_PORT = 1883
MQTT_TOPIC = "tippaphanun/5f29d93c/sensor/data"

client = mqtt.Client()
client.connect(MQTT_BROKER, MQTT_PORT, 60)
client.loop_start() # ให้ MQTT ทำงานใน background
# --------------------------------------------------------

def publish_door_status(is_moving: bool):
    """ฟังก์ชันสำหรับส่งสถานะประตูผ่าน MQTT"""
    status = 1 if is_moving else 0
    
    payload = {
        "type": "door_open",
        "value": status
    }
    client.publish(MQTT_TOPIC, json.dumps(payload))
    print(f"-> Published Door Status: {status}")

# --- 1. เริ่มต้นการเชื่อมต่อ I2C ---
try:
    i2c = busio.I2C(board.SCL, board.SDA)
except Exception as e:
    print(f"❌ Error setting up I2C bus: {e}")
    exit()

# --- 2. เริ่มต้นการเชื่อมต่อเซ็นเซอร์ MPU6050 ---
try:
    mpu = adafruit_mpu6050.MPU6050(i2c)
    print("✅ พบ MPU-6050 (Motion Sensor)!")
except Exception as e:
    print(f"❌ ไม่พบ MPU-6050: {e}")
    client.loop_stop()
    exit()

# --- 3. วนลูปตรวจจับ ---
try:
    last_motion_state = False # สถานะการเคลื่อนไหวล่าสุด
    print(f"Starting door motion detection. Threshold: {MOTION_THRESHOLD_ACCEL} m/s^2")
    
    while True:
        # 3.1 อ่านค่าความเร่งในแกน X
        # Acceleration เป็น tuple: (X, Y, Z)
        accel_x = mpu.acceleration[0]
        
        # 3.2 คำนวณค่าสัมบูรณ์ (Absolute Value) เพื่อไม่สนใจทิศทาง
        abs_accel_x = abs(accel_x)
        
        # 3.3 ตรวจสอบการเคลื่อนไหว
        is_moving_now = abs_accel_x > MOTION_THRESHOLD_ACCEL
        
        print(f"Accel X: {accel_x:.3f} m/s² | Moving: {is_moving_now}")

        # # 3.4 ตรวจจับการเปลี่ยนแปลงสถานะและส่ง MQTT
        # if is_moving_now != last_motion_state:
        #     last_motion_state = is_moving_now

        publish_door_status(is_moving_now)
        time.sleep(1)  # หน่วงเวลา 1 วินาที ระหว่างการอ่านค่า
        
except KeyboardInterrupt:
    print("\n👋 หยุดการทำงาน")
except Exception as e:
    print(f"\n❌ เกิดข้อผิดพลาดใน Main Loop: {e}")
finally:
    client.loop_stop()
    client.disconnect()
    print("🗑️ ปิดการเชื่อมต่อ I2C และ MQTT")
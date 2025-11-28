import time
import board
import busio
import adafruit_mpu6050
import json
import paho.mqtt.client as mqtt

# ---------------------- MQTT SETUP ----------------------
MQTT_BROKER = "raspberrypi.local"      
MQTT_PORT = 1883
MQTT_TOPIC = "tippaphanun/5f29d93c/sensor/data"

client = mqtt.Client()
client.connect(MQTT_BROKER, MQTT_PORT, 60)
client.loop_start() 
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

# ---------------------- CONFIGURATION ----------------------
MOTION_THRESHOLD_ACCEL = 5

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
# 💡 เพิ่มตัวแปรสถานะเพื่อไม่ให้ส่งข้อความซ้ำ ๆ เมื่อสถานะไม่เปลี่ยน
last_status = None 
PUBLISH_INTERVAL = 1 # ส่งสถานะทุก ๆ 1 วินาที
MOTION_DETECTED_WAIT_TIME = 2 # หยุดส่งสถานะ "กำลังเปิด" หลังตรวจพบการเคลื่อนไหวแล้ว X วินาที

try:
    print(f"Starting door motion detection. Threshold: {MOTION_THRESHOLD_ACCEL} m/s^2")
    
    while True:
        # 3.1 อ่านค่าความเร่งในแกน X
        accel_x = mpu.acceleration[0]
        
        # 3.2 คำนวณค่าสัมบูรณ์
        abs_accel_x = abs(accel_x)

        # 3.3 ตรวจสอบการเคลื่อนไหว
        print(f"Accel X: {accel_x:.3f} m/s² | Abs Accel X: {abs_accel_x:.3f} m/s²")
        
        if abs_accel_x < MOTION_THRESHOLD_ACCEL:
            current_status = 1 # กำลังเคลื่อนที่ (เปิด)
        else:
            current_status = 0 # หยุดนิ่ง (ปิด/หยุด)

        # 💡 ตรวจสอบเพื่อป้องกันการส่งข้อความซ้ำ ๆ (Optimization)
        if current_status != last_status:
            publish_door_status(current_status == 1) 
            last_status = current_status
        
        # 💡 ปรับเวลาหน่วง
        time.sleep(PUBLISH_INTERVAL if current_status == 1 else MOTION_DETECTED_WAIT_TIME)
        
except KeyboardInterrupt:
    print("\n👋 หยุดการทำงาน")
except Exception as e:
    print(f"\n❌ เกิดข้อผิดพลาดใน Main Loop: {e}")
finally:
    client.loop_stop()
    client.disconnect()
    print("🗑️ ปิดการเชื่อมต่อ I2C และ MQTT")
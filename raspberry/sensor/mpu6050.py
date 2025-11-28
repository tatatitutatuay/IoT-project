import time
import board
import busio
# นำเข้าไลบรารี MPU6050 ของ Adafruit
import adafruit_mpu6050 
import json
import paho.mqtt.client as mqtt

# ---------------------- MQTT SETUP ----------------------
MQTT_BROKER = "test.mosquitto.org" # เปลี่ยนเป็น IP Server ของคุณหากจำเป็น
MQTT_PORT = 1883
MQTT_TOPIC = "tippaphanun/5f29d93c/sensor/data" # หัวข้อสำหรับส่งข้อมูล

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
client.connect(MQTT_BROKER, MQTT_PORT, 60)
# --------------------------------------------------------

def payload_mpu(type: str, value):
    payload = {
        "type": type,
        "value": value
    }
    client.publish(MQTT_TOPIC, json.dumps(payload))
# --- 1. เริ่มต้นการเชื่อมต่อ I2C ---
i2c = busio.I2C(board.SCL, board.SDA)

# --- 2. เริ่มต้นการเชื่อมต่อเซ็นเซอร์ MPU6050 ---
try:
    # MPU6050 ใช้ I2C Address มาตรฐาน 0x68 หรือ 0x69 (ขึ้นอยู่กับขา AD0)
    # ไลบรารี adafruit_mpu6050 จะพยายามค้นหา Address โดยอัตโนมัติ
    mpu = adafruit_mpu6050.MPU6050(i2c)
    print("✅ พบ MPU-6050 (Motion Sensor)!")
except Exception as e:
    print(f"❌ ไม่พบ MPU-6050: {e}")
    exit()
# --- 3. วนลูปอ่านค่า ---
try:
    while True:
        # อ่านค่าจาก MPU-6050
        acceleration = mpu.acceleration # (x, y, z) ในหน่วย m/s^2
        gyro = mpu.gyro                # (x, y, z) ในหน่วย rad/s
        temperature = mpu.temperature # อุณหภูมิในหน่วย °C

        print(f"อุณหภูมิ: {temperature:.1f} C")
        print(f"Accel (m/s²): X={acceleration[0]:.2f}, Y={acceleration[1]:.2f}, Z={acceleration[2]:.2f}")
        print(f"Gyro (rad/s): X={gyro[0]:.2f}, Y={gyro[1]:.2f}, Z={gyro[2]:.2f}")
        print("-" * 30)
        
        # ส่งค่าไปยัง MQTT
        # ส่งอุณหภูมิ
        payload_mpu("temp_mpu", round(temperature, 2))
        
        # ส่งค่า Accelerometer
        payload_mpu("accel", {
            "x": round(acceleration[0], 3),
            "y": round(acceleration[1], 3),
            "z": round(acceleration[2], 3)
        })
        
        # ส่งค่า Gyroscope
        payload_mpu("gyro", {
            "x": round(gyro[0], 3),
            "y": round(gyro[1], 3),
            "z": round(gyro[2], 3)
        })
        
        time.sleep(0.5) # อ่านค่าทุก 0.5 วินาที สำหรับเซนเซอร์จับความเคลื่อนไหว
except KeyboardInterrupt:
    print("\n👋 หยุดการทำงาน")
finally:
    print("🗑️ ปิดการเชื่อมต่อ I2C")
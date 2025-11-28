import RPi.GPIO as GPIO
import time
import json
import paho.mqtt.client as mqtt

# --- ตั้งค่า ---
PIN_D0 = 17 # GPIO 17 (Pin 11)

# ---------------------- MQTT SETUP ----------------------
MQTT_BROKER = "raspberrypi.local"      # change to your server IP if needed
MQTT_PORT = 1883
MQTT_TOPIC = "tippaphanun/5f29d93c/sensor/data"

client = mqtt.Client()
client.connect(MQTT_BROKER, MQTT_PORT, 60)
# --------------------------------------------------------
def payload_sound_event(detected: bool):
    """ส่งข้อมูลเสียงไปยัง MQTT"""
    payload = {
        "type": "sound",
        "value": detected
    }
    client.publish(MQTT_TOPIC, json.dumps(payload))

# --- ฟังก์ชันที่จะทำงานเมื่อตรวจพบเสียง ---
def sound_detected_callback(channel):
    print(f"ตรวจพบเสียง! (ที่ GPIO {channel})")
    payload_sound_event(1)

# --- ส่วนหลักของโปรแกรม ---
try:
    # ตั้งค่าโหมด GPIO
    GPIO.setmode(GPIO.BCM) 
    
    GPIO.setup(PIN_D0, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

    while GPIO.input(PIN_D0) == GPIO.HIGH:
        print("✅ พบเซ็นเซอร์เสียง (Sound Sensor)!")

    # เพิ่ม Event Detection (Interrupt)
    # เราจะตรวจจับขอบขาขึ้น (Rising edge) คือเมื่อสัญญาณเปลี่ยนจาก LOW ไป HIGH
    GPIO.add_event_detect(PIN_D0, GPIO.RISING, 
                          callback=sound_detected_callback, 
                          bouncetime=200) # bouncetime เพื่อป้องกันการตรวจจับซ้ำๆ ถี่เกินไป

    print("ระบบพร้อมตรวจจับเสียง... (กด Ctrl+C เพื่อออก)")

    # วนลูปไปเรื่อยๆ เพื่อให้โปรแกรมทำงาน
    while True:
        time.sleep(3) # พัก 3 วินาที
        payload_sound_event(0) # ส่งสถานะไม่มีเสียงเป็นระยะ

except KeyboardInterrupt:
    print("กำลังออกจากโปรแกรม...")
finally:
    GPIO.cleanup() # คืนค่า GPIO กลับเป็นปกติ
    print("GPIO Cleanup เรียบร้อย")
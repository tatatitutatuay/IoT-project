from picamera2 import Picamera2
from ultralytics import YOLO
import cv2
import time
import json
import paho.mqtt.client as mqtt

# ---------------------- MQTT SETUP ----------------------
MQTT_BROKER = "test.mosquitto.org"      # change to your server IP if needed
MQTT_PORT = 1883
MQTT_TOPIC = "tippaphanun/5f29d93c/sensor/data"

client = mqtt.Client()
client.connect(MQTT_BROKER, MQTT_PORT, 60)
# --------------------------------------------------------

# Load YOLO model
model = YOLO("yolov8n.pt")

# Setup Pi Camera
picam2 = Picamera2()
config = picam2.create_video_configuration(
    main={"size": (416, 320), "format": "RGB888"}
)
picam2.configure(config)
picam2.start()
time.sleep(1)

print("Counting people currently in camera... Ctrl+C to stop")

try:
    while True:
        frame = picam2.capture_array()

        # detect only people (class 0)
        results = model.predict(frame, classes=[0], verbose=False)

        people_count = 0

        if len(results) > 0:
            boxes = results[0].boxes

            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                people_count += 1

                # draw bounding box
                cv2.rectangle(
                    frame,
                    (int(x1), int(y1)),
                    (int(x2), int(y2)),
                    (0, 255, 0),
                    2
                )

        # ------------------- SEND TO MQTT -------------------
        payload = {
            "type": "people_count",
            "value": people_count
        }
        client.publish(MQTT_TOPIC, json.dumps(payload))
        # ----------------------------------------------------

        # show current count
        cv2.putText(
            frame,
            f"People: {people_count}",
            (10, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 255),
            2
        )

        cv2.imshow("Live People Counter", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

except KeyboardInterrupt:
    print("Stopped.")

cv2.destroyAllWindows()
picam2.stop()
client.disconnect()

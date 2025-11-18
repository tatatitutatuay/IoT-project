from picamera2 import Picamera2
from ultralytics import YOLO
import cv2
import time
import json
import base64
import paho.mqtt.client as mqtt

# ---------------------- MQTT SETUP ----------------------
MQTT_BROKER = "test.mosquitto.org"      # change to your server IP if needed
MQTT_PORT = 1883
MQTT_TOPIC_COUNT = "tippaphanun/5f29d93c/sensor/data"
MQTT_TOPIC_IMAGE = "tippaphanun/5f29d93c/sensor/image"

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

frame_idx = 0  # simple counter to optionally throttle image sending

try:
    while True:
        frame = picam2.capture_array()
        frame_idx += 1

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

        # ------------------- SEND COUNT TO MQTT -------------------
        payload_count = {
            "type": "people_count",
            "value": people_count
        }
        client.publish(MQTT_TOPIC_COUNT, json.dumps(payload_count))
        # ---------------------------------------------------------

        # ------------------- SEND IMAGE TO MQTT -------------------
        # (optional throttle: only send every 5th frame)
        if frame_idx % 5 == 0:
            # encode frame as JPEG
            success, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
            if success:
                jpg_bytes = buffer.tobytes()
                # base64 encode for safe JSON transport
                img_b64 = base64.b64encode(jpg_bytes).decode("ascii")

                payload_image = {
                    "type": "people_frame",
                    "image": img_b64
                }
                client.publish(MQTT_TOPIC_IMAGE, json.dumps(payload_image))
        # ---------------------------------------------------------

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

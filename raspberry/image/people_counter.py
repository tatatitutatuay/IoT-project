from picamera2 import Picamera2
from ultralytics import YOLO
import cv2
import time

model = YOLO("yolov8n.pt")

picam2 = Picamera2()
config = picam2.create_video_configuration(
    main={"size": (640, 480), "format": "RGB888"}
)
picam2.configure(config)
picam2.start()
time.sleep(1)

line_y = 240
count = 0

# simple tracker: each detection just uses center movement
last_centers = {}

print("Starting people counter... Press Ctrl+C to stop.")

try:
    while True:
        frame = picam2.capture_array()

        # RUN DETECTION ONLY (no .track(), no scipy)
        results = model.predict(frame, classes=[0], verbose=False)

        if len(results) > 0:
            boxes = results[0].boxes.xyxy.cpu().numpy()

            centers = []

            for x1, y1, x2, y2 in boxes:
                cx = int((x1 + x2) / 2)
                cy = int((y1 + y2) / 2)
                centers.append((cx, cy))

                cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)),
                              (0, 255, 0), 2)
                cv2.circle(frame, (cx, cy), 4, (255, 0, 0), -1)

            # naive tracking: check if any center crosses the line
            for cx, cy in centers:
                # find closest old center
                best_prev = None
                best_dist = 99999

                for px, py in last_centers.get("people", []):
                    dist = abs(px - cx) + abs(py - cy)
                    if dist < best_dist:
                        best_dist = dist
                        best_prev = (px, py)

                if best_prev is not None:
                    px, py = best_prev

                    if py < line_y <= cy:
                        count += 1
                        print("Person crossed line. Total:", count)

            last_centers["people"] = centers

        cv2.line(frame, (0, line_y), (640, line_y), (0, 0, 255), 2)
        cv2.putText(frame, f"Count: {count}", (10, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)

        cv2.imshow("Pi People Counter", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

except KeyboardInterrupt:
    print("\nStopped.")

cv2.destroyAllWindows()
picam2.stop()

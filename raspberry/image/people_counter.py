from picamera2 import Picamera2
from ultralytics import YOLO
import cv2
import time

# 1. Load YOLO model (first time it will download)
model = YOLO("yolov8n.pt")  # nano model

# 2. Setup Picamera2
picam2 = Picamera2()
config = picam2.create_video_configuration(
    main={"size": (640, 480), "format": "RGB888"}  # lower res = faster
)
picam2.configure(config)
picam2.start()
time.sleep(1)  # small warm-up

line_y = 240  # middle of 480px frame
count = 0
last_positions = {}  # track_id -> last y

print("Starting people counter... Press Ctrl+C to stop.")

try:
    while True:
        # 3. Capture frame from Pi camera (as numpy array)
        frame = picam2.capture_array()

        # 4. Run detection + tracking, class 0 = person
        results = model.track(
            frame,
            classes=[0],        # only people
            persist=True,       # keep track IDs
            verbose=False
        )

        if results and len(results) > 0:
            boxes = results[0].boxes

            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                track_id = int(box.id.item()) if box.id is not None else None

                # draw bbox
                cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)),
                              (0, 255, 0), 2)

                # center of the person
                cx = int((x1 + x2) / 2)
                cy = int((y1 + y2) / 2)
                cv2.circle(frame, (cx, cy), 4, (255, 0, 0), -1)

                if track_id is not None:
                    prev_y = last_positions.get(track_id, cy)
                    last_positions[track_id] = cy

                    # detect crossing from above line → below line
                    if prev_y < line_y <= cy:
                        count += 1
                        print("Person crossed line. Total:", count)

        # draw counting line
        cv2.line(frame, (0, line_y), (frame.shape[1], line_y), (0, 0, 255), 2)

        # show count on frame
        cv2.putText(frame, f"Count: {count}", (10, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)

        # 5. Show window if you have desktop
        cv2.imshow("Raspberry Pi People Counter", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

except KeyboardInterrupt:
    print("\nStopped by user")

finally:
    cv2.destroyAllWindows()
    picam2.stop()

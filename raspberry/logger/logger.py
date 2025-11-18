import json
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt
import firebase_admin
from firebase_admin import credentials, firestore

# ---------- Firebase setup ----------
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# ---------- MQTT setup ----------
MQTT_BROKER = "test.mosquitto.org"
MQTT_PORT = 1883
MQTT_TOPIC_ROOT = "tippaphanun/5f29d93c/sensor"


def save_data(payload: dict):
    """Save data to Firestore."""
    value = payload.get("value")
    doc = {
        "value": value,
        "type": payload.get("type", "people_count"),
        "created_at": datetime.now(timezone.utc),
    }
    db.collection("data").add(doc)

def on_connect(client, userdata, flags, reason_code, properties=None):
    print("Connected to MQTT broker with code:", reason_code)
    client.subscribe(MQTT_TOPIC_ROOT)
    print("Subscribed to:", MQTT_TOPIC_ROOT)


def on_message(client, userdata, msg):
    topic = msg.topic
    payload_raw = msg.payload.decode("utf-8", errors="ignore")

    # Try parse JSON (for data topics)
    try:
        data = json.loads(payload_raw)
    except json.JSONDecodeError:
        print("Payload is not JSON, skipping.")
        return

    # Route by topic / type
    if topic.endswith("/sensor/data"):
        save_data(data)
    else:
        print("No handler for this topic/type, skipping.")


def main():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_message = on_message

    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    print("Starting MQTT → Firebase logger...")
    client.loop_forever()


if __name__ == "__main__":
    main()

"""
28BYJ-48 Stepper Motor Control with ULN2003AN Driver
Simple open/close control for window/door automation
Fast operation mode for quick response
MQTT control for remote operation
"""

import RPi.GPIO as GPIO
import paho.mqtt.client as mqtt
import time
import threading
import json

class Motor:
    """
    Control class for 28BYJ-48 stepper motor for open/close operations
    Optimized for fast, reliable movement without LED control concerns
    """
    
    # Half-step sequence for smooth operation
    HALF_STEP_SEQ = [
        [1, 0, 0, 0],
        [1, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 1],
        [0, 0, 0, 1],
        [1, 0, 0, 1]
    ]
    
    def __init__(self, 
                 in1_pin: int = 5, 
                 in2_pin: int = 6, 
                 in3_pin: int = 12, 
                 in4_pin: int = 16,
                 steps_to_open: int = 2048):
        """
        Initialize the motor controller
        
        Args:
            in1_pin: GPIO pin for IN1 (default: GPIO5)
            in2_pin: GPIO pin for IN2 (default: GPIO6)
            in3_pin: GPIO pin for IN3 (default: GPIO12)
            in4_pin: GPIO pin for IN4 (default: GPIO16)
            steps_to_open: Number of steps for full open (default: 2048 = half revolution)
        """
        self.pins = [in1_pin, in2_pin, in3_pin, in4_pin]
        self.step_sequence = self.HALF_STEP_SEQ
        self.steps_to_open = steps_to_open
        self.current_position = 0  # 0 = closed, steps_to_open = fully open
        self.is_moving = False
        self.stop_flag = False
        
        # Setup GPIO
        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)
        
        for pin in self.pins:
            GPIO.setup(pin, GPIO.OUT)
            GPIO.output(pin, GPIO.LOW)
        
        print(f"Motor initialized on pins {self.pins}")
        print(f"Steps for full open: {self.steps_to_open}")
    
    def _set_step(self, step_pattern: list):
        """Set the GPIO pins according to step pattern"""
        for pin, state in zip(self.pins, step_pattern):
            GPIO.output(pin, state)
    
    def _move_steps(self, steps: int, delay: float = 0.001):
        """
        Move motor by specified steps (fast operation)
        
        Args:
            steps: Number of steps (positive = open direction, negative = close direction)
            delay: Delay between steps (0.001 = fast, 0.002 = normal)
        """
        self.is_moving = True
        self.stop_flag = False
        
        step_count = abs(steps)
        direction = 1 if steps > 0 else -1
        
        for _ in range(step_count):
            if self.stop_flag:
                break
            
            sequence = self.step_sequence if direction > 0 else self.step_sequence[::-1]
            for step_pattern in sequence:
                if self.stop_flag:
                    break
                self._set_step(step_pattern)
                time.sleep(delay)
            
            self.current_position += direction
            
            # Limit position
            if self.current_position < 0:
                self.current_position = 0
            elif self.current_position > self.steps_to_open:
                self.current_position = self.steps_to_open
        
        # Turn off coils to save power and reduce heat
        self._set_step([0, 0, 0, 0])
        self.is_moving = False
    
    def open(self, speed: str = "fast"):
        """
        Open to full position
        
        Args:
            speed: "fast", "normal" (default: "fast")
        """
        if self.is_moving:
            print("Motor is already moving")
            return False
        
        steps_needed = self.steps_to_open - self.current_position
        
        if steps_needed <= 0:
            print("Already fully open")
            return True
        
        # Set speed
        delay_map = {
            "fast": 0.001,
            "normal": 0.002
        }
        delay = delay_map.get(speed, 0.001)
        
        print(f"Opening... (moving {steps_needed} steps at {speed} speed)")
        self._move_steps(steps_needed, delay)
        print(f"Open complete. Position: {self.current_position}/{self.steps_to_open}")
        return True
    
    def close(self, speed: str = "fast"):
        """
        Close to starting position
        
        Args:
            speed: "fast", "normal" (default: "fast")
        """
        if self.is_moving:
            print("Motor is already moving")
            return False
        
        steps_needed = -self.current_position
        
        if steps_needed >= 0:
            print("Already fully closed")
            return True
        
        # Set speed
        delay_map = {
            "fast": 0.001,
            "normal": 0.002
        }
        delay = delay_map.get(speed, 0.001)
        
        print(f"Closing... (moving {abs(steps_needed)} steps at {speed} speed)")
        self._move_steps(steps_needed, delay)
        print(f"Close complete. Position: {self.current_position}/{self.steps_to_open}")
        return True
    
    def open_threaded(self, speed: str = "fast"):
        """Open in background thread (non-blocking)"""
        if self.is_moving:
            print("Motor is already moving")
            return False
        thread = threading.Thread(target=self.open, args=(speed,), daemon=True)
        thread.start()
        return True
    
    def close_threaded(self, speed: str = "fast"):
        """Close in background thread (non-blocking)"""
        if self.is_moving:
            print("Motor is already moving")
            return False
        thread = threading.Thread(target=self.close, args=(speed,), daemon=True)
        thread.start()
        return True
    
    def stop(self):
        """Emergency stop"""
        self.stop_flag = True
        self._set_step([0, 0, 0, 0])
        print(f"Motor stopped at position {self.current_position}/{self.steps_to_open}")
    
    def reset_position(self):
        """Reset position counter (use when motor is at closed position)"""
        self.current_position = 0
        print("Position reset to 0 (closed)")
    
    def get_position(self) -> dict:
        """Get current position info"""
        percentage = (self.current_position / self.steps_to_open) * 100
        return {
            "current_steps": self.current_position,
            "total_steps": self.steps_to_open,
            "percentage": round(percentage, 1),
            "is_moving": self.is_moving
        }
    
    def is_open(self) -> bool:
        """Check if fully open"""
        return self.current_position >= self.steps_to_open
    
    def is_closed(self) -> bool:
        """Check if fully closed"""
        return self.current_position <= 0
    
    def cleanup(self):
        """Clean up GPIO resources"""
        self.stop()
        time.sleep(0.1)
        GPIO.cleanup(self.pins)
        print("Motor GPIO cleaned up")


# ---------------------- MQTT SETUP ----------------------
MQTT_BROKER = "test.mosquitto.org"      # change to your server IP if needed
MQTT_PORT = 1883
MQTT_TOPIC_CONTROL = "tippaphanun/5f29d93c/motor/control"  # Topic to receive commands
MQTT_TOPIC_STATUS = "tippaphanun/5f29d93c/motor/status"    # Topic to publish status

# Global motor instance
motor_instance = None


def on_connect(client, userdata, flags, rc):
    """Callback when connected to MQTT broker"""
    if rc == 0:
        print(f"Connected to MQTT Broker: {MQTT_BROKER}")
        client.subscribe(MQTT_TOPIC_CONTROL)
        print(f"Subscribed to topic: {MQTT_TOPIC_CONTROL}")
        
        # Publish initial status
        publish_status(client, "idle", "Motor connected and ready")
    else:
        print(f"Failed to connect, return code {rc}")


def on_message(client, userdata, msg):
    """Callback when a message is received"""
    global motor_instance
    
    try:
        payload = msg.payload.decode()
        print(f"Received message on {msg.topic}: {payload}")
        
        # Parse command
        try:
            command = json.loads(payload)
        except json.JSONDecodeError:
            # If not JSON, treat as simple text command
            command = {"action": payload.lower().strip()}
        
        action = command.get("action", "").lower()
        speed = command.get("speed", "fast")
        
        if motor_instance is None:
            print("Motor not initialized!")
            publish_status(client, "error", "Motor not initialized")
            return
        
        # Execute command
        if action == "open":
            print(f"Opening motor at {speed} speed...")
            publish_status(client, "opening", f"Motor opening at {speed} speed")
            motor_instance.open_threaded(speed=speed)
            
        elif action == "close":
            print(f"Closing motor at {speed} speed...")
            publish_status(client, "closing", f"Motor closing at {speed} speed")
            motor_instance.close_threaded(speed=speed)
            
        elif action == "stop":
            print("Stopping motor...")
            motor_instance.stop()
            publish_status(client, "stopped", "Motor stopped by user")
            
        elif action == "status":
            # Request status
            position = motor_instance.get_position()
            status_msg = {
                "state": "open" if motor_instance.is_open() else ("closed" if motor_instance.is_closed() else "partial"),
                "position": position,
                "is_moving": motor_instance.is_moving
            }
            client.publish(MQTT_TOPIC_STATUS, json.dumps(status_msg))
            print(f"Published status: {status_msg}")
            
        else:
            print(f"Unknown command: {action}")
            publish_status(client, "error", f"Unknown command: {action}")
            
    except Exception as e:
        print(f"Error processing message: {e}")
        publish_status(client, "error", str(e))


def publish_status(client, state, message=""):
    """Publish motor status to MQTT"""
    try:
        status = {
            "state": state,
            "message": message,
            "timestamp": time.time()
        }
        
        if motor_instance:
            status["position"] = motor_instance.get_position()
        
        client.publish(MQTT_TOPIC_STATUS, json.dumps(status))
        print(f"Published status: {state} - {message}")
    except Exception as e:
        print(f"Error publishing status: {e}")


def status_monitor_loop(client):
    """Background thread to monitor motor and publish status updates"""
    global motor_instance
    
    last_moving_state = False
    
    while True:
        try:
            if motor_instance:
                is_moving = motor_instance.is_moving
                
                # Publish status when motor stops
                if last_moving_state and not is_moving:
                    if motor_instance.is_open():
                        publish_status(client, "open", "Motor fully opened")
                    elif motor_instance.is_closed():
                        publish_status(client, "closed", "Motor fully closed")
                    else:
                        publish_status(client, "partial", "Motor at partial position")
                
                last_moving_state = is_moving
            
            time.sleep(0.5)
            
        except Exception as e:
            print(f"Error in status monitor: {e}")
            time.sleep(1)


# Example usage and testing
if __name__ == "__main__":
    print("28BYJ-48 Motor Control - MQTT Remote Control")
    print("=" * 50)
    
    # Initialize motor
    motor_instance = Motor(steps_to_open=2048)  # 2048 steps = half revolution
    
    # Setup MQTT client
    mqtt_client = mqtt.Client()
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message
    
    try:
        print(f"\nConnecting to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}...")
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        
        # Start status monitor thread
        status_thread = threading.Thread(target=status_monitor_loop, args=(mqtt_client,), daemon=True)
        status_thread.start()
        
        print("\n--- MQTT Motor Control Active ---")
        print(f"Control Topic: {MQTT_TOPIC_CONTROL}")
        print(f"Status Topic: {MQTT_TOPIC_STATUS}")
        print("\nCommands:")
        print("  - Send 'open' or {\"action\": \"open\", \"speed\": \"fast\"} to open")
        print("  - Send 'close' or {\"action\": \"close\", \"speed\": \"normal\"} to close")
        print("  - Send 'stop' to stop motor")
        print("  - Send 'status' to request current status")
        print("\nPress Ctrl+C to exit...\n")
        
        # Start MQTT loop
        mqtt_client.loop_forever()
        
    except KeyboardInterrupt:
        print("\n\nShutting down...")
        mqtt_client.disconnect()
        motor_instance.stop()
    except Exception as e:
        print(f"\nError: {e}")
        mqtt_client.disconnect()
    finally:
        if motor_instance:
            motor_instance.cleanup()
        print("Cleanup complete")

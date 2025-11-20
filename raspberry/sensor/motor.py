"""
28BYJ-48 Stepper Motor Control with ULN2003AN Driver
Simple open/close control for window/door automation
Fast operation mode for quick response
"""

import RPi.GPIO as GPIO
import time
import threading

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
    
    def _move_steps(self, steps: int, delay: float = 0.0005):
        """
        Move motor by specified steps (fast operation)
        
        Args:
            steps: Number of steps (positive = open direction, negative = close direction)
            delay: Delay between steps (0.0005 = very fast, 0.001 = fast, 0.002 = normal)
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
            speed: "very_fast", "fast", "normal" (default: "fast")
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
            "very_fast": 0.0005,
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
            speed: "very_fast", "fast", "normal" (default: "fast")
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
            "very_fast": 0.0005,
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


# Example usage and testing
if __name__ == "__main__":
    print("28BYJ-48 Motor Control - Open/Close Demo")
    print("=" * 50)
    
    # Initialize motor
    motor = Motor(steps_to_open=2048)  # 2048 steps = half revolution
    
    try:
        print("\n--- Fast Open/Close Demo ---\n")
        
        # Test 1: Fast open
        print("Test 1: Opening at FAST speed...")
        motor.open(speed="fast")
        print(f"Position: {motor.get_position()}")
        time.sleep(1)
        
        # Test 2: Fast close
        print("\nTest 2: Closing at FAST speed...")
        motor.close(speed="fast")
        print(f"Position: {motor.get_position()}")
        time.sleep(1)
        
        # Test 3: Very fast open
        print("\nTest 3: Opening at VERY FAST speed...")
        motor.open(speed="very_fast")
        print(f"Position: {motor.get_position()}")
        time.sleep(1)
        
        # Test 4: Very fast close
        print("\nTest 4: Closing at VERY FAST speed...")
        motor.close(speed="very_fast")
        print(f"Position: {motor.get_position()}")
        time.sleep(1)
        
        # Test 5: Threaded operation (non-blocking)
        print("\nTest 5: Non-blocking operation...")
        print("Opening in background...")
        motor.open_threaded(speed="fast")
        
        # Do other things while motor moves
        for i in range(5):
            print(f"  Doing other work... {i+1}")
            time.sleep(0.5)
        
        # Wait for completion
        while motor.is_moving:
            time.sleep(0.1)
        print("Background open complete!")
        
        time.sleep(1)
        motor.close(speed="fast")
        
        print("\n\nDemo completed!")
        print(f"Final position: {motor.get_position()}")
        
    except KeyboardInterrupt:
        print("\n\nDemo interrupted by user")
        motor.stop()
    except Exception as e:
        print(f"\nError: {e}")
    finally:
        motor.cleanup()
        print("Cleanup complete")

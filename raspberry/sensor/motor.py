"""
28BYJ-48 Stepper Motor Fan Control with ULN2003AN Driver
Control module for 28BYJ-48 stepper motor as a fan with speed levels (OFF, 1, 2, 3)
LED indicators show current fan speed level
"""

import RPi.GPIO as GPIO
import time
import threading

class FanMotor:
    """
    Control class for 28BYJ-48 stepper motor as a fan with speed levels
    
    Fan Modes:
    - OFF (0): Fan stopped, all LEDs off
    - Level 1: Slow speed, LED 1 on
    - Level 2: Medium speed, LED 1-2 on
    - Level 3: Fast speed, LED 1-3 on
    
    The 4th LED blinks when fan is running
    """
    
    # Step sequences for smooth operation
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
    
    # Speed settings (RPM for each level)
    SPEED_LEVELS = {
        0: 0,      # OFF
        1: 5,      # Slow
        2: 10,     # Medium
        3: 15      # Fast
    }
    
    def __init__(self, 
                 in1_pin: int = 5, 
                 in2_pin: int = 6, 
                 in3_pin: int = 12, 
                 in4_pin: int = 16):
        """
        Initialize the fan motor controller
        
        Args:
            in1_pin: GPIO pin for IN1 on ULN2003AN (default: GPIO5)
            in2_pin: GPIO pin for IN2 on ULN2003AN (default: GPIO6)
            in3_pin: GPIO pin for IN3 on ULN2003AN (default: GPIO12)
            in4_pin: GPIO pin for IN4 on ULN2003AN (default: GPIO16)
        """
        self.pins = [in1_pin, in2_pin, in3_pin, in4_pin]
        self.step_sequence = self.HALF_STEP_SEQ
        self.steps_per_rev = 4096
        self.current_level = 0
        self.is_running = False
        self.fan_thread = None
        
        # Setup GPIO
        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)
        
        for pin in self.pins:
            GPIO.setup(pin, GPIO.OUT)
            GPIO.output(pin, GPIO.LOW)
        
        print(f"FanMotor initialized on pins {self.pins}")
        print("Fan Levels: 0 (OFF), 1 (Slow), 2 (Medium), 3 (Fast)")
    
    def _set_step(self, step_pattern: list):
        """Set the GPIO pins according to step pattern"""
        for pin, state in zip(self.pins, step_pattern):
            GPIO.output(pin, state)
    
    def _update_led_indicator(self):
        """Update LED pattern based on current fan level (LEDs 1-3 indicate speed)"""
        if self.current_level == 0:
            # OFF - All LEDs off
            self._set_step([0, 0, 0, 0])
        elif self.current_level == 1:
            # Level 1 - Only LED 1 on (slow)
            led_pattern = [1, 0, 0, 0]
            self._set_step(led_pattern)
        elif self.current_level == 2:
            # Level 2 - LED 1 and 2 on (medium)
            led_pattern = [1, 1, 0, 0]
            self._set_step(led_pattern)
        elif self.current_level == 3:
            # Level 3 - LED 1, 2, and 3 on (fast)
            led_pattern = [1, 1, 1, 0]
            self._set_step(led_pattern)
    
    def _run_motor_loop(self):
        """Internal method to run motor continuously"""
        speed = self.SPEED_LEVELS[self.current_level]
        delay = 60.0 / (speed * self.steps_per_rev) if speed > 0 else 0
        
        led_blink_state = False
        step_counter = 0
        
        while self.is_running:
            # Rotate through step sequence
            for step_pattern in self.step_sequence:
                if not self.is_running:
                    break
                
                # Create pattern with speed LEDs (1-3) and blinking activity LED (4)
                pattern = step_pattern.copy()
                
                # Set speed indicator LEDs (1-3)
                if self.current_level >= 1:
                    pattern[0] = 1
                if self.current_level >= 2:
                    pattern[1] = 1
                if self.current_level >= 3:
                    pattern[2] = 1
                
                # Blink 4th LED to show fan is active (toggle every 8 steps)
                if step_counter % 8 == 0:
                    led_blink_state = not led_blink_state
                pattern[3] = 1 if led_blink_state else 0
                
                self._set_step(pattern)
                time.sleep(delay)
                step_counter += 1
        
        # When stopped, show only the level indicator LEDs
        self._update_led_indicator()
    
    def set_level(self, level: int):
        """
        Set fan speed level
        
        Args:
            level: Speed level (0=OFF, 1=Slow, 2=Medium, 3=Fast)
        """
        if level not in [0, 1, 2, 3]:
            print(f"Invalid level {level}. Use 0 (OFF), 1 (Slow), 2 (Medium), or 3 (Fast)")
            return
        
        # Stop current operation
        was_running = self.is_running
        if was_running:
            self.stop()
            time.sleep(0.1)  # Brief pause for thread to stop
        
        self.current_level = level
        
        if level == 0:
            print("Fan: OFF")
            self._update_led_indicator()
        else:
            level_names = {1: "Slow", 2: "Medium", 3: "Fast"}
            print(f"Fan: Level {level} ({level_names[level]}) - RPM: {self.SPEED_LEVELS[level]}")
            self.start()
    
    def start(self):
        """Start the fan at current level"""
        if self.current_level == 0:
            print("Cannot start: Fan level is 0 (OFF). Use set_level(1-3) first.")
            return
        
        if not self.is_running:
            self.is_running = True
            self.fan_thread = threading.Thread(target=self._run_motor_loop, daemon=True)
            self.fan_thread.start()
            print("Fan started")
    
    def stop(self):
        """Stop the fan"""
        if self.is_running:
            self.is_running = False
            if self.fan_thread:
                self.fan_thread.join(timeout=1)
            self.current_level = 0
            self._set_step([0, 0, 0, 0])
            print("Fan stopped")
    
    def get_level(self) -> int:
        """Get current fan speed level"""
        return self.current_level
    
    def is_fan_running(self) -> bool:
        """Check if fan is currently running"""
        return self.is_running
    
    def cycle_level(self):
        """Cycle through fan levels: 0 -> 1 -> 2 -> 3 -> 0"""
        next_level = (self.current_level + 1) % 4
        self.set_level(next_level)
        return next_level
    
    def cleanup(self):
        """Clean up GPIO resources"""
        self.stop()
        time.sleep(0.2)
        GPIO.cleanup(self.pins)
        print("FanMotor GPIO cleaned up")


# Example usage and testing
if __name__ == "__main__":
    print("28BYJ-48 Fan Motor Control Demo")
    print("=" * 50)
    
    # Initialize fan motor
    fan = FanMotor()
    
    try:
        print("\n--- Fan Control Demo ---\n")
        
        # Test each speed level
        for level in range(4):
            if level == 0:
                print("\nSetting fan to OFF...")
                fan.set_level(0)
                time.sleep(3)
            else:
                level_names = {1: "Slow", 2: "Medium", 3: "Fast"}
                print(f"\nSetting fan to Level {level} ({level_names[level]})...")
                print(f"  - LED indicators: {level} LED(s) on")
                print(f"  - 4th LED: Blinking (activity indicator)")
                fan.set_level(level)
                time.sleep(5)  # Run for 5 seconds at each level
        
        # Demo level cycling
        print("\n\n--- Level Cycling Demo ---")
        print("Cycling through all levels (press Ctrl+C to stop)...\n")
        
        for i in range(12):  # Cycle 3 times through all levels
            current_level = fan.cycle_level()
            time.sleep(3)
        
        print("\n\nDemo completed!")
        
    except KeyboardInterrupt:
        print("\n\nDemo interrupted by user")
    except Exception as e:
        print(f"\nError: {e}")
    finally:
        fan.cleanup()
        print("Cleanup complete")

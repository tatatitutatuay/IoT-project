"""
28BYJ-48 Stepper Motor Control with ULN2003AN Driver
Control module for 28BYJ-48 stepper motor connected via ULN2003AN driver board to Raspberry Pi
"""

import RPi.GPIO as GPIO
import time
from typing import Literal

class StepperMotor:
    """
    Control class for 28BYJ-48 stepper motor with ULN2003AN driver
    
    The 28BYJ-48 is a 5V unipolar stepper motor with:
    - Stride Angle: 5.625°/64
    - Reduction Ratio: 1/64
    - Steps per revolution: 2048 (with gear reduction)
    """
    
    # Step sequences for different drive modes
    # Half-step sequence (8 steps) - smoother operation, better torque
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
    
    # Full-step sequence (4 steps) - higher torque, less smooth
    FULL_STEP_SEQ = [
        [1, 0, 0, 1],
        [1, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 1]
    ]
    
    # Wave drive sequence (4 steps) - lowest power consumption
    WAVE_STEP_SEQ = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ]
    
    def __init__(self, 
                 in1_pin: int = 5, 
                 in2_pin: int = 6, 
                 in3_pin: int = 12, 
                 in4_pin: int = 16,
                 step_mode: Literal["half", "full", "wave"] = "half"):
        """
        Initialize the stepper motor controller
        
        Args:
            in1_pin: GPIO pin for IN1 on ULN2003AN (default: GPIO17)
            in2_pin: GPIO pin for IN2 on ULN2003AN (default: GPIO18)
            in3_pin: GPIO pin for IN3 on ULN2003AN (default: GPIO27)
            in4_pin: GPIO pin for IN4 on ULN2003AN (default: GPIO22)
            step_mode: Stepping mode - "half", "full", or "wave" (default: "half")
        """
        self.pins = [in1_pin, in2_pin, in3_pin, in4_pin]
        self.step_mode = step_mode
        self.current_position = 0
        
        # Set step sequence based on mode
        if step_mode == "half":
            self.step_sequence = self.HALF_STEP_SEQ
            self.steps_per_rev = 4096  # 2048 * 2 for half-stepping
        elif step_mode == "full":
            self.step_sequence = self.FULL_STEP_SEQ
            self.steps_per_rev = 2048
        else:  # wave
            self.step_sequence = self.WAVE_STEP_SEQ
            self.steps_per_rev = 2048
        
        # Setup GPIO
        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)
        
        for pin in self.pins:
            GPIO.setup(pin, GPIO.OUT)
            GPIO.output(pin, GPIO.LOW)
        
        print(f"StepperMotor initialized on pins {self.pins} in {step_mode}-step mode")
    
    def _set_step(self, step_pattern: list):
        """Set the GPIO pins according to step pattern"""
        for pin, state in zip(self.pins, step_pattern):
            GPIO.output(pin, state)
    
    def step(self, steps: int, delay: float = 0.001, direction: Literal["cw", "ccw"] = "cw"):
        """
        Move the motor by specified number of steps
        
        Args:
            steps: Number of steps to move (positive = clockwise, negative = counter-clockwise)
            delay: Delay between steps in seconds (default: 0.001, min: 0.0005 for 28BYJ-48)
            direction: Direction to move - "cw" (clockwise) or "ccw" (counter-clockwise)
        """
        # Adjust steps based on direction parameter
        if direction == "ccw":
            steps = -abs(steps)
        else:
            steps = abs(steps)
        
        step_count = abs(steps)
        step_direction = 1 if steps > 0 else -1
        
        for _ in range(step_count):
            for step_pattern in self.step_sequence[::step_direction]:
                self._set_step(step_pattern)
                time.sleep(delay)
                self.current_position += step_direction
        
        # Turn off all coils after movement to save power
        self._set_step([0, 0, 0, 0])
    
    def rotate_angle(self, angle: float, speed: float = 15.0, direction: Literal["cw", "ccw"] = "cw"):
        """
        Rotate the motor by a specific angle
        
        Args:
            angle: Angle to rotate in degrees (0-360)
            speed: Rotation speed in RPM (revolutions per minute, default: 15)
            direction: Direction to move - "cw" or "ccw"
        """
        steps = int((angle / 360.0) * self.steps_per_rev)
        delay = 60.0 / (speed * self.steps_per_rev)  # Calculate delay for desired RPM
        
        self.step(steps, delay, direction)
    
    def rotate_revolutions(self, revolutions: float, speed: float = 15.0, direction: Literal["cw", "ccw"] = "cw"):
        """
        Rotate the motor by a number of full revolutions
        
        Args:
            revolutions: Number of complete revolutions (can be fractional)
            speed: Rotation speed in RPM (default: 15)
            direction: Direction to move - "cw" or "ccw"
        """
        steps = int(revolutions * self.steps_per_rev)
        delay = 60.0 / (speed * self.steps_per_rev)
        
        self.step(steps, delay, direction)
    
    def continuous_rotation(self, speed: float = 15.0, direction: Literal["cw", "ccw"] = "cw", duration: float = None):
        """
        Rotate continuously at specified speed
        
        Args:
            speed: Rotation speed in RPM (default: 15)
            direction: Direction to move - "cw" or "ccw"
            duration: Duration in seconds (None = indefinite, requires manual stop)
        """
        delay = 60.0 / (speed * self.steps_per_rev)
        start_time = time.time()
        
        try:
            while True:
                if duration and (time.time() - start_time) >= duration:
                    break
                
                for step_pattern in (self.step_sequence if direction == "cw" else self.step_sequence[::-1]):
                    self._set_step(step_pattern)
                    time.sleep(delay)
        except KeyboardInterrupt:
            print("\nContinuous rotation stopped")
        finally:
            self._set_step([0, 0, 0, 0])
    
    def stop(self):
        """Stop the motor and release all coils"""
        self._set_step([0, 0, 0, 0])
    
    def reset_position(self):
        """Reset the position counter to zero"""
        self.current_position = 0
    
    def get_position(self) -> int:
        """Get the current position in steps"""
        return self.current_position
    
    def cleanup(self):
        """Clean up GPIO resources"""
        self.stop()
        GPIO.cleanup(self.pins)
        print("StepperMotor GPIO cleaned up")


# Example usage and testing
if __name__ == "__main__":
    print("28BYJ-48 Stepper Motor Control Demo")
    print("=" * 50)
    
    # Initialize motor with default pins (GPIO 17, 18, 27, 22)
    motor = StepperMotor(step_mode="half")
    
    try:
        # Demo 1: Rotate 90 degrees clockwise
        print("\n1. Rotating 90 degrees clockwise...")
        motor.rotate_angle(90, speed=15, direction="cw")
        time.sleep(1)
        
        # Demo 2: Rotate 90 degrees counter-clockwise (back to start)
        print("2. Rotating 90 degrees counter-clockwise...")
        motor.rotate_angle(90, speed=15, direction="ccw")
        time.sleep(1)
        
        # Demo 3: Rotate 1 full revolution clockwise
        print("3. Rotating 1 full revolution clockwise...")
        motor.rotate_revolutions(1, speed=15, direction="cw")
        time.sleep(1)
        
        # Demo 4: Rotate 1 full revolution counter-clockwise
        print("4. Rotating 1 full revolution counter-clockwise...")
        motor.rotate_revolutions(1, speed=15, direction="ccw")
        time.sleep(1)
        
        # Demo 5: Continuous rotation for 5 seconds
        print("5. Continuous rotation for 5 seconds...")
        motor.continuous_rotation(speed=15, direction="cw", duration=5)
        
        print("\nDemo completed!")
        print(f"Final position: {motor.get_position()} steps")
        
    except KeyboardInterrupt:
        print("\nDemo interrupted by user")
    except Exception as e:
        print(f"\nError: {e}")
    finally:
        motor.cleanup()
        print("Cleanup complete")

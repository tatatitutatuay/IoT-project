#!/usr/bin/env python3
"""
Main script to run all sensor modules concurrently
Runs air.py, sound.py, and logger.py in separate processes
"""

import subprocess
import sys
import os
import signal
import time

def run_script(script_name):
    """Run a Python script as a subprocess"""
    script_path = os.path.join(os.path.dirname(__file__), script_name)
    
    if not os.path.exists(script_path):
        print(f"⚠️  Warning: {script_name} not found at {script_path}")
        return None
    
    print(f"🚀 Starting {script_name}...")
    return subprocess.Popen([sys.executable, script_path])

def main():
    print("=" * 60)
    print("   IoT Sensor System - Multi-Process Launcher")
    print("=" * 60)
    
    # List of scripts to run
    scripts = [
        "air.py",
        "sound.py",
        "../logger/logger.py"
    ]
    
    processes = []
    
    # Start all scripts
    for script in scripts:
        proc = run_script(script)
        if proc:
            processes.append((script, proc))
            time.sleep(1)  # Small delay between starts
    
    print("\n" + "=" * 60)
    print(f"✅ Started {len(processes)} processes")
    print("=" * 60)
    print("\n🔄 All sensors running. Press Ctrl+C to stop all.\n")
    
    def signal_handler(sig, frame):
        print("\n\n🛑 Shutdown signal received. Stopping all processes...")
        for script, proc in processes:
            print(f"   Terminating {script}...")
            proc.terminate()
        
        # Wait for graceful shutdown
        time.sleep(2)
        
        # Force kill if still running
        for script, proc in processes:
            if proc.poll() is None:
                print(f"   Force killing {script}...")
                proc.kill()
        
        print("\n✅ All processes stopped.")
        sys.exit(0)
    
    # Register signal handler for Ctrl+C
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Monitor processes
    try:
        while True:
            time.sleep(1)
            
            # Check if any process died
            for i, (script, proc) in enumerate(processes):
                if proc.poll() is not None:
                    print(f"⚠️  {script} terminated unexpectedly with code {proc.returncode}")
                    print(f"   {script} has failed and will not be restarted.")
                    # Remove the failed process from monitoring
                    processes.pop(i)
                    break  # Break to avoid index issues after removing item
    
    except KeyboardInterrupt:
        signal_handler(signal.SIGINT, None)

if __name__ == "__main__":
    main()

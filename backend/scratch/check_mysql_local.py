import socket

# Check port 3306
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(1.0)
result = s.connect_ex(('127.0.0.1', 3306))
s.close()

if result == 0:
    print("Port 3306 is OPEN. MySQL is likely running locally!")
else:
    print("Port 3306 is CLOSED. MySQL is NOT running on localhost:3306.")

# Also check running docker containers or services
import subprocess
try:
    print("\n--- Running docker ps ---")
    out = subprocess.check_output("docker ps", shell=True, text=True)
    print(out)
except Exception as e:
    print("docker ps failed:", e)

try:
    print("\n--- Service mysql status (tasklist) ---")
    out = subprocess.check_output('tasklist /FI "IMAGENAME eq mysqld.exe"', shell=True, text=True)
    print(out)
except Exception as e:
    print("tasklist failed:", e)

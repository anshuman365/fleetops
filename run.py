#!/usr/bin/env python3
"""
run.py

Starts the Flask backend and exposes it via a cloudflared tunnel.
Updates the frontend App.js to use the tunnel URL.
Saves the URL to README.md and commits/pushes the changes to git.
"""

import os
import sys
import re
import time
import signal
import subprocess
import threading
from pathlib import Path

# ---------- Paths ----------
BASE_DIR = Path(__file__).parent.absolute()
BACKEND_DIR = BASE_DIR / "backend"
FRONTEND_SRC = BASE_DIR / "frontend" / "src"
APP_JS = FRONTEND_SRC / "App.js"
README = BASE_DIR / "README.md"

BACKEND_SCRIPT = BACKEND_DIR / "app.py"

# ---------- Processes ----------
backend_proc = None
tunnel_proc = None

def cleanup(signum=None, frame=None):
    """Terminate subprocesses on exit."""
    print("\nShutting down...")
    if tunnel_proc:
        tunnel_proc.terminate()
    if backend_proc:
        backend_proc.terminate()
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

def start_backend():
    global backend_proc
    print("🚀 Starting Flask backend...")
    backend_proc = subprocess.Popen(
        [sys.executable, str(BACKEND_SCRIPT)],
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    # Give it a moment
    time.sleep(2)

def start_tunnel():
    global tunnel_proc
    print("🌍 Starting cloudflared tunnel to http://localhost:5000 ...")
    tunnel_proc = subprocess.Popen(
        ["cloudflared", "--url", "http://localhost:5000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

def extract_tunnel_url():
    """Read from tunnel_proc.stdout until we find the URL."""
    url_pattern = re.compile(r"https://[a-zA-Z0-9.-]+\.trycloudflare\.com")
    print("⏳ Waiting for tunnel URL...")
    while True:
        line = tunnel_proc.stdout.readline()
        if not line:
            # EOF: tunnel process died
            return None
        print(line, end="")
        match = url_pattern.search(line)
        if match:
            return match.group(0)

def log_output(pipe, prefix):
    """Continuously read lines from pipe and print with prefix."""
    try:
        for line in iter(pipe.readline, ""):
            if line:
                print(f"{prefix} {line}", end="")
    except:
        pass

# ---------- Main flow ----------
start_backend()
start_tunnel()

tunnel_url = extract_tunnel_url()
if not tunnel_url:
    print("❌ Could not extract tunnel URL. Exiting.")
    cleanup()
    sys.exit(1)

print(f"\n✅ Tunnel URL: {tunnel_url}")

# Start logging threads for both processes
tunnel_log_thread = threading.Thread(
    target=log_output,
    args=(tunnel_proc.stdout, "[TUNNEL]"),
    daemon=True
)
tunnel_log_thread.start()

backend_log_thread = threading.Thread(
    target=log_output,
    args=(backend_proc.stdout, "[BACKEND]"),
    daemon=True
)
backend_log_thread.start()

# ---------- Update App.js ----------
print("✏️  Updating frontend App.js with tunnel URL...")
if APP_JS.exists():
    content = APP_JS.read_text(encoding="utf-8")
    pattern = r'(const API = process\.env\.REACT_APP_API_URL \|\| )"http://localhost:5000/api";'
    new_content = re.sub(pattern, r'\1' + f'"{tunnel_url}/api";', content)
    if new_content != content:
        APP_JS.write_text(new_content, encoding="utf-8")
        print("✅ App.js updated.")
    else:
        print("⚠️  No changes made to App.js (pattern not found).")
else:
    print("❌ App.js not found!")

# ---------- Save URL to README.md ----------
print("📝 Saving tunnel URL to README.md...")
with open(README, "a", encoding="utf-8") as f:
    f.write(f"\n## 🌐 Current Tunnel URL\n{tunnel_url}\n")
print("✅ URL saved.")

# ---------- Git commit and push ----------
def has_git_changes():
    result = subprocess.run(
        ["git", "status", "--porcelain"],
        capture_output=True,
        text=True,
        cwd=BASE_DIR
    )
    return bool(result.stdout.strip())

def run_git_commands():
    try:
        print("📦 Staging changes...")
        subprocess.run(["git", "add", "."], check=True, cwd=BASE_DIR)
        print("📝 Committing...")
        subprocess.run(["git", "commit", "-m", "updated"], check=True, cwd=BASE_DIR)
        print("☁️  Pushing to remote...")
        subprocess.run(["git", "push"], check=True, cwd=BASE_DIR)
        print("✅ Git commit and push successful.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Git command failed: {e}")

if has_git_changes():
    run_git_commands()
else:
    print("ℹ️ No changes to commit. Git step skipped.")

# ---------- Keep running ----------
print("\n🎉 Both services are running. Press Ctrl+C to stop.")
try:
    # Wait for the tunnel process (or backend) to exit. If either exits, we exit.
    tunnel_proc.wait()
except KeyboardInterrupt:
    cleanup()
except:
    cleanup()
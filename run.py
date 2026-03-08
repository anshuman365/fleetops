#!/usr/bin/env python3
"""
run.py - Launch Flask app, create Cloudflare tunnel, update App.js, and push to git.
"""

import subprocess
import sys
import time
import os
import signal
import re
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
flask_proc = None
tunnel_proc = None

def cleanup(signum=None, frame=None):
    """Terminate subprocesses on exit."""
    print("\n🛑 Shutting down...")
    if tunnel_proc:
        tunnel_proc.terminate()
    if flask_proc:
        flask_proc.terminate()
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

def kill_process_on_port(port):
    """Try to kill any process using the given port (Linux only)."""
    try:
        result = subprocess.run(
            ["fuser", "-k", f"{port}/tcp"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print(f"✅ Killed process on port {port}")
        else:
            # fuser may return non-zero if no process found
            pass
    except FileNotFoundError:
        # fuser not available, just warn
        print("⚠️  'fuser' not found. If port 5000 is in use, please kill it manually.")

def log_output(pipe, prefix):
    """Read lines from pipe and print with prefix."""
    try:
        for line in iter(pipe.readline, ""):
            if line:
                print(f"{prefix} {line}", end="")
    except:
        pass

def start_flask():
    global flask_proc
    kill_process_on_port(5000)
    print("🚀 Starting Flask app on http://localhost:5000 ...")
    flask_proc = subprocess.Popen(
        [sys.executable, str(BACKEND_SCRIPT)],
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    time.sleep(2)  # Give it a moment

def start_tunnel():
    global tunnel_proc
    print("🌍 Creating Cloudflare tunnel to http://localhost:5000 ...")
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
            return None
        print(line, end="")
        match = url_pattern.search(line)
        if match:
            return match.group(0)

def update_app_js(url):
    """Replace the fallback API URL in App.js."""
    if not APP_JS.exists():
        print("❌ App.js not found!")
        return False
    content = APP_JS.read_text(encoding="utf-8")
    pattern = r'(const API = process\.env\.REACT_APP_API_URL \|\| )"http://localhost:5000/api";'
    new_content = re.sub(pattern, r'\1' + f'"{url}/api";', content)
    if new_content == content:
        print("⚠️  No changes made to App.js (pattern not found).")
        return False
    APP_JS.write_text(new_content, encoding="utf-8")
    print("✅ App.js updated.")
    return True

def save_url_to_readme(url):
    """Append the tunnel URL to README.md."""
    with open(README, "a", encoding="utf-8") as f:
        f.write(f"\n## 🌐 Current Tunnel URL\n{url}\n")
    print("✅ URL saved to README.md.")

def git_commit_and_push():
    """Commit all changes and push to remote."""
    try:
        # Check if there are changes
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            capture_output=True,
            text=True,
            cwd=BASE_DIR
        )
        if not result.stdout.strip():
            print("ℹ️ No changes to commit. Git step skipped.")
            return

        print("📦 Staging changes...")
        subprocess.run(["git", "add", "."], check=True, cwd=BASE_DIR)
        print("📝 Committing...")
        subprocess.run(["git", "commit", "-m", "Update tunnel URL"], check=True, cwd=BASE_DIR)
        print("☁️  Pushing to remote...")
        subprocess.run(["git", "push"], check=True, cwd=BASE_DIR)
        print("✅ Git push successful.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Git command failed: {e}")

# ---------- Main ----------
start_flask()
start_tunnel()

tunnel_url = extract_tunnel_url()
if not tunnel_url:
    print("❌ Could not extract tunnel URL. Exiting.")
    cleanup()
    sys.exit(1)

print(f"\n✅ Tunnel URL: {tunnel_url}\n")

# Start logging threads for both processes
threading.Thread(target=log_output, args=(tunnel_proc.stdout, "[TUNNEL]"), daemon=True).start()
threading.Thread(target=log_output, args=(flask_proc.stdout, "[BACKEND]"), daemon=True).start()

# Update files and git
update_app_js(tunnel_url)
save_url_to_readme(tunnel_url)
git_commit_and_push()

print("\n🎉 Both services are running. Press Ctrl+C to stop.")
try:
    # Wait for either process to exit (shouldn't happen)
    tunnel_proc.wait()
except KeyboardInterrupt:
    cleanup()
except:
    cleanup()
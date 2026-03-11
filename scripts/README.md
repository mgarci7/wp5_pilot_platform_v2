# WP5 Platform — Launchers

Double-click the launcher for your operating system. On the first run, a setup wizard will ask for your API keys and admin password. After that, it launches directly every time.

---

## Linux

**File:** `start-linux.sh`

1. Right-click the file → **Properties** → **Permissions** → enable "Allow executing file as program"
   *(or run once in a terminal: `chmod +x start-linux.sh`)*
2. Double-click the file. If your file manager asks, choose **"Run in terminal"** or **"Execute"**.

**Optional — Desktop shortcut:**

Copy `WP5-Platform.desktop` to your desktop, then right-click it → **"Allow Launching"** (GNOME) or equivalent. After that you can double-click it directly from the desktop.

---

## macOS

**File:** `start-macos.command`

1. Open a terminal once and run:
   ```
   chmod +x /path/to/scripts/start-macos.command
   ```
2. Double-click the `.command` file. macOS will open a Terminal window and run it automatically.

> **Security note:** If macOS blocks the file ("unidentified developer"), go to
> **System Settings → Privacy & Security** and click **"Allow Anyway"**.

---

## Windows

**File:** `start-windows.bat`

1. Double-click `start-windows.bat`.
2. If Windows SmartScreen appears, click **"More info"** → **"Run anyway"**.

The `.bat` file calls `start-windows.ps1` automatically — you don't need to run the PowerShell script directly.

---

## First-time setup wizard

On the first run the wizard will ask you for:

| Step | What it does |
|------|-------------|
| **Admin password** | Password to log in to the researcher panel at `/admin` |
| **Anthropic API key** | For Claude (Director agent) — get it at [console.anthropic.com](https://console.anthropic.com/) |
| **HuggingFace API key** | For Performer agents (chat bots) — get it at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |
| **Google Gemini key** | Optional alternative provider — [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| **Mistral key** | Optional alternative provider — [console.mistral.ai](https://console.mistral.ai/api-keys) |
| **Konstanz vLLM key** | University-hosted model — contact your institution |

You only need **at least one** LLM key. The wizard saves everything to the `.env` file and will not appear again once a key is set.

To change any value later, edit the `.env` file in the project root folder.

---

## What happens when you launch

1. Checks / installs Docker automatically if missing
2. Starts Docker if it is not running
3. Builds and starts all containers (`docker compose up -d --build`)
4. Waits until the platform is ready
5. Opens the **admin panel** (`http://localhost:3000/admin`) and the **participant interface** (`http://localhost:3000`) in your browser

The terminal window stays open so you can see the logs. Press **Enter** to close it when you are done.

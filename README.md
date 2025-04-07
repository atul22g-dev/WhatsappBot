# WhatsApp Bot with Automated QR Code Scanning

This WhatsApp Bot uses Puppeteer to automate WhatsApp Web interactions. It includes features for session persistence and QR code automation.

## Features

- **Session Persistence**: After the first login, the bot saves your WhatsApp Web session so you don't need to scan the QR code every time.
- **QR Code Automation**: When a QR code scan is needed, the bot:
  - Saves the QR code as an image file (`whatsapp-qr.png`)
  - Displays the QR code in the terminal for easy scanning
- **Scheduled Messaging**: Send messages at a specific time
- **Multiple Messages**: Send the same message multiple times

## Installation

```bash
npm install
```

## Usage

### Option 1: Scheduled Messages

1. Edit the configuration in `index.js`:

```javascript
const sender = new WhatsAppAutoSender({
  targetName: "Contact Name",        // Receiver's Name as it appears in WhatsApp
  message: "Your message here",      // Message to send
  count: "5",                        // Number of times to send
  time: "14:30",                     // Scheduled Time (HH:MM) - no spaces!
  sessionId: "my-whatsapp-session"   // Session ID for persistence
});
```

2. Run the bot:

```bash
npm start
```

### Option 2: Send Messages Immediately

1. Edit the configuration in `send-now.js`:

```javascript
const sender = new WhatsAppAutoSender({
  targetName: "Contact Name",        // Receiver's Name as it appears in WhatsApp
  message: "Your message here",      // Message to send
  count: "5",                        // Number of times to send
  sessionId: "my-whatsapp-session"   // Session ID for persistence
});
```

2. Run the bot to send messages immediately:

```bash
npm run send-now
```

### QR Code Scanning

1. The first time you run the bot, you'll need to scan the QR code that appears in the terminal or open the saved `whatsapp-qr.png` file.

2. For subsequent runs, the bot will use the saved session and won't require QR code scanning unless your session expires.

### Clear Session

If you need to force a new login or clear the session data:

```bash
npm run clear-session
```

## Notes

- The bot uses a headful browser (you can see the browser window) for better reliability.
- Session data is stored in the `whatsapp-session/[sessionId]` directory.
- If you want to force a new login, simply delete the session directory.

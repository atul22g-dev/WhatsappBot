const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs-extra');
const path = require('path');
const qrcode = require('qrcode-terminal');

// Add stealth plugin to puppeteer (helps avoid detection)
puppeteer.use(StealthPlugin());

// Define session directory
const SESSION_DIR = path.join(__dirname, 'whatsapp-session');

// WhatsApp Auto Sender Class (simplified version that sends immediately)
class WhatsAppAutoSender {
  constructor({ url, targetName, message, count, sessionId = 'default' }) {
    // Initialize values
    this.url = url || 'https://web.whatsapp.com'; // Default WhatsApp Web URL
    this.targetName = targetName; // Receiver Name
    this.message = message; // Message to send
    this.count = count; // Number of times to send
    this.sessionId = sessionId; // Session ID for saving/loading browser session
    this.sessionDir = path.join(SESSION_DIR, this.sessionId); // Session directory path
  }

  // Initialize Browser and Navigate to WhatsApp Web
  async init() {
    // Ensure session directory exists
    await fs.ensureDir(this.sessionDir);

    // Launch browser with UI and session persistence
    this.browser = await puppeteer.launch({
      headless: false,
      userDataDir: this.sessionDir,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications']
    });

    this.page = await this.browser.newPage();

    // Navigate to WhatsApp Web
    await this.page.goto(this.url);

    // Check if QR code is present (not logged in)
    try {
      // Wait for either QR code or the main chat interface
      await Promise.race([
        this.page.waitForSelector('canvas[aria-label="Scan me!"]', { timeout: 15000 }),
        this.page.waitForSelector('#side', { timeout: 15000 })
      ]);

      // Check if QR code is present
      const qrCodeElement = await this.page.$('canvas[aria-label="Scan me!"]');

      if (qrCodeElement) {
        console.log('QR Code detected. Need to scan...');

        // Extract QR code data and display it in terminal
        await this.extractAndDisplayQR();

        // Wait for successful login after QR scan
        await this.page.waitForSelector('#side', { timeout: 0 });
        console.log('Logged in successfully!');
      } else {
        console.log('Already logged in!');
      }

      // Send message immediately
      await this.sendMessage();

    } catch (error) {
      console.error('Error during login process:', error.message);
      throw error;
    }
  }

  // Extract QR code and display it in terminal
  async extractAndDisplayQR() {
    try {
      // Get QR code data from the canvas element
      const qrData = await this.page.evaluate(() => {
        const canvas = document.querySelector('canvas[aria-label="Scan me!"]');
        return canvas ? canvas.toDataURL() : null;
      });

      if (qrData) {
        // Save QR code as image file
        const qrImagePath = path.join(__dirname, 'whatsapp-qr.png');
        const base64Data = qrData.replace(/^data:image\/png;base64,/, "");
        await fs.writeFile(qrImagePath, base64Data, 'base64');
        console.log(`QR Code saved to ${qrImagePath}`);

        // Also display QR in terminal for convenience
        // Extract the QR code text from WhatsApp Web
        const qrCodeText = await this.page.evaluate(() => {
          // This is a simplified approach - in practice, you'd need to decode the QR
          // Here we're just getting a unique identifier from the page
          return window.location.href;
        });

        // Display QR in terminal
        qrcode.generate(qrCodeText, { small: true });
        console.log('Scan the QR code above with your WhatsApp app');
      }
    } catch (error) {
      console.error('Error extracting QR code:', error.message);
    }
  }

  // Send Message to Target User
  async sendMessage() {
    console.log(`Sending message to ${this.targetName}...`);

    try {
      // Wait for chat with target name to appear & click on it
      await this.page.waitForSelector(`span[title='${this.targetName}']`, { timeout: 30000 });
      await this.page.click(`span[title='${this.targetName}']`);

      // Wait for message input box
      const inputBox = await this.page.waitForSelector('.selectable-text.copyable-text', { timeout: 30000 });

      // Convert count to number to ensure proper iteration
      const messageCount = parseInt(this.count, 10) || 1;
      console.log(`Sending ${messageCount} messages...`);

      // Send message multiple times
      for (let i = 0; i < messageCount; i++) {
        await inputBox.type(this.message); // Type the message
        await this.page.keyboard.press('Enter'); // Press Enter to send
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between messages
        console.log(`Message ${i + 1}/${messageCount} sent`);
      }

      console.log('All messages sent successfully!');
    } catch (error) {
      console.error('Error sending messages:', error.message);
    }
  }

  // Close the browser
  async close() {
    if (this.browser) {
      try {
        await this.browser.close();
        console.log('Browser closed successfully.');
      } catch (error) {
        console.error('Error closing browser:', error.message);
      }
    }
  }
}

// Configuration - edit these values
const sender = new WhatsAppAutoSender({
  targetName: "Atul",                  // Receiver's Name as it appears in WhatsApp
  message: "This is a test message",   // Message to send
  count: "3",                          // Number of times to send
  sessionId: "my-whatsapp-session"     // Session ID for persistence
});

// Run the bot and handle errors
sender.init()
  .catch(error => {
    console.error('Error in WhatsApp Bot:', error);
  })
  .finally(() => {
    // We don't close the browser here as we want to keep the session active
    // If you want to close it after sending, uncomment the next line
    // setTimeout(() => sender.close(), 5000); // Close after 5 seconds
    console.log('Process completed.');
  });

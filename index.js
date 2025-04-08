const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs-extra');
const path = require('path');

// Add stealth plugin to puppeteer (helps avoid detection)
puppeteer.use(StealthPlugin());

// Define session directory
const SESSION_DIR = path.join(__dirname, 'whatsapp-session');

// WhatsApp Auto Sender Class
class WhatsAppAutoSender {
  constructor({ url, targetName, message, count, time, sessionId = 'default' }) {
    // Initialize values
    this.url = url || 'https://web.whatsapp.com'; // WhatsApp Web URL
    this.targetName = targetName;                  // Receiver Name
    this.message = message;                        // Message to send
    this.count = parseInt(count, 10) || 1;         // Number of messages to send
    this.time = time;                              // Scheduled Time (HH:MM)
    this.sessionId = sessionId;                    // Unique Session ID
    this.sessionDir = path.join(SESSION_DIR, this.sessionId); // Session path
  }

  // Initialize Browser and Navigate to WhatsApp Web
  async init() {
    await fs.ensureDir(this.sessionDir);
  
    this.browser = await puppeteer.launch({
      headless: false,
      userDataDir: this.sessionDir,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-notifications'
      ]
    });
  
    this.page = await this.browser.newPage();
  
    await this.page.goto(this.url, { waitUntil: 'networkidle2' });
  
    try {
      // Check already logged in
      const isLoggedIn = await this.page.$('#side');
  
      if (isLoggedIn) {
        console.log('Already logged in!');
      } else {
        console.log('Waiting for QR or Auto-login...');
  
        // Wait for either QR OR Logged In
        await Promise.race([
          this.page.waitForSelector('canvas[aria-label="Scan me!"]').catch(() => {}),
          this.page.waitForSelector('#side').catch(() => {})
        ]);
  
        console.log('Waiting for successful login...');
  
        // Now wait until login successful
        await this.page.waitForSelector('#side', { timeout: 0 });
  
        console.log('Login Successful!');
      }
  
      // Call your next function
      await this.waitForScheduledTime();
  
    } catch (error) {
      console.error('Error during login:', error.message);
      throw error;
    }
  }
  
  

  // Wait until current time matches scheduled time
  async waitForScheduledTime() {
    const [targetHour, targetMinute] = this.time.replace(/\s+/g, '').split(':').map(Number);

    console.log(`Waiting for time: ${targetHour}:${targetMinute} to send message...`);

    const checkTime = setInterval(async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      console.log(`Current Time: ${currentHour}:${currentMinute}`);

      if (currentHour === targetHour && currentMinute === targetMinute) {
        clearInterval(checkTime); // Stop checking
        await this.sendMessage(); // Start sending message
      }
    }, 30000); // Check every 30 seconds
  }

  // Send Message to Target User
  async sendMessage() {
    console.log(`Sending message to ${this.targetName}...`);

    try {
      // Search and open chat by contact name
      await this.page.waitForSelector(`span[title='${this.targetName}']`, { timeout: 30000 });
      await this.page.click(`span[title='${this.targetName}']`);

      const inputBox = await this.page.waitForSelector('.selectable-text.copyable-text', { timeout: 30000 });

      console.log(`Sending ${this.count} messages...`);

      for (let i = 0; i < this.count; i++) {
        await inputBox.type(this.message);
        await this.page.keyboard.press('Enter');
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay between messages
        console.log(`Message ${i + 1}/${this.count} sent`);
      }

      console.log('All messages sent successfully!');
    } catch (error) {
      console.error('Error sending messages:', error.message);
    }
  }

  // Close browser after operation (optional)
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

// Pass Data for Single Execution
const sender = new WhatsAppAutoSender({
  targetName: "Atul",              // Receiver Name
  message: "This is a test message 4", // Message Content
  count: "10",                     // Total Messages
  time: "15:55",                   // Scheduled Time (HH:MM)
  sessionId: "my-whatsapp-session" // Unique Session ID
});

// Execute the Bot
sender.init()
  .catch(error => {
    console.error('Error in WhatsApp Bot:', error);
  })
  .finally(() => {
    console.log('Process completed.');
  });

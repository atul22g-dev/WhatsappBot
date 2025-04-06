const puppeteer = require('puppeteer');

// WhatsApp Auto Sender Class
class WhatsAppAutoSender {
  constructor({ url, targetName, message, count, time }) {
    // Initialize values
    this.url = url || 'https://web.whatsapp.com'; // Default WhatsApp Web URL
    this.targetName = targetName; // Receiver Name
    this.message = message; // Message to send
    this.count = count; // Number of times to send
    this.time = time; // Scheduled Time (HH:MM)
  }

  // Initialize Browser and Navigate to WhatsApp Web
  async init() {
    // Launch browser with UI
    this.browser = await puppeteer.launch({ headless: false });
    this.page = await this.browser.newPage();

    // Navigate to WhatsApp Web
    await this.page.goto(this.url);

    console.log('Waiting for QR scan...');
    // Wait until user scans QR code and WhatsApp loads
    await this.page.waitForSelector('#side', { timeout: 0 });
    console.log('Logged in successfully!');

    // Wait until scheduled time matches
    await this.waitForScheduledTime();
  }

  // Check every minute until scheduled time matches current time
  async waitForScheduledTime() {
    const [targetHour, targetMinute] = this.time.split(':').map(Number);

    console.log(`Waiting for time: ${this.time} to send message to ${this.targetName}...`);

    const checkTime = setInterval(async () => {
      const now = new Date();
      console.log(`Current Time: ${now.getHours()}:${now.getMinutes()}`);

      // If current time matches scheduled time, send the message
      if (now.getHours() === targetHour && now.getMinutes() === targetMinute) {
        clearInterval(checkTime); // Stop checking time
        await this.sendMessage(); // Call send message function
      }
    }, 60 * 1000); // Check every 1 minute
  }

  // Send Message to Target User
  async sendMessage() {
    console.log(`Sending message to ${this.targetName}...`);

    // Wait for chat with target name to appear & click on it
    await this.page.waitForSelector(`span[title='${this.targetName}']`);
    await this.page.click(`span[title='${this.targetName}']`);

    // Wait for message input box
    const inputBox = await this.page.waitForSelector('.selectable-text.copyable-text');

    // Send message multiple times
    for (let i = 0; i < this.count; i++) {
      await inputBox.type(this.message); // Type the message
      await this.page.keyboard.press('Enter'); // Press Enter to send
    }

    console.log('Messages sent successfully!');
  }
}

// Pass data only one time here
const sender = new WhatsAppAutoSender({
  targetName: "Atul",               // Receiver's Name
  message: "This is a test message 2",// Message to send
  count: "10",                      // Number of times to send
  time: "2: 17",                     // Scheduled Time (HH:MM)
});

// Start the process
sender.init();

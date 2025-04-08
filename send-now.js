const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs-extra');
const path = require('path');
const { url, targetName, message, count, sessionId } = require('./config');

puppeteer.use(StealthPlugin());

const SESSION_DIR = path.join(__dirname, 'whatsapp-session');

class WhatsAppAutoSender {
  constructor({ url, targetName, message, count, sessionId = 'default' }) {
    this.url = url || 'https://web.whatsapp.com';
    this.targetName = targetName;
    this.message = message;
    this.count = parseInt(count, 10) || 1;
    this.sessionId = sessionId;
    this.sessionDir = path.join(SESSION_DIR, this.sessionId);
  }

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
      const isLoggedIn = await this.page.$('#side');

      if (isLoggedIn) {
        console.log('Already logged in!');
      } else {
        console.log('Waiting for QR or Auto-login...');

        await Promise.race([
          this.page.waitForSelector('canvas[aria-label="Scan me!"]').catch(() => {}),
          this.page.waitForSelector('#side').catch(() => {})
        ]);

        console.log('Waiting for successful login...');
        await this.page.waitForSelector('#side', { timeout: 0 });

        console.log('Login Successful!');
      }

      await this.sendMessage();

    } catch (error) {
      console.error('Error during login:', error.message);
      throw error;
    }
  }

  async sendMessage() {
    console.log(`Sending message to ${this.targetName}...`);

    try {
      await this.page.waitForSelector(`span[title='${this.targetName}']`, { timeout: 30000 });
      await this.page.click(`span[title='${this.targetName}']`);

      const inputBox = await this.page.waitForSelector('.selectable-text.copyable-text', { timeout: 30000 });

      console.log(`Sending ${this.count} messages...`);

      for (let i = 0; i < this.count; i++) {
        await inputBox.type(this.message);
        await this.page.keyboard.press('Enter');
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`Message ${i + 1}/${this.count} sent`);
      }

      console.log('All messages sent successfully!');

    } catch (error) {
      console.error('Error sending messages:', error.message);
    }
  }

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

const sender = new WhatsAppAutoSender({
  url,
  targetName,
  message,
  count,
  sessionId,
});

sender.init()
  .catch(error => {
    console.error('Error in WhatsApp Bot:', error);
  })
  .finally(() => {
    console.log('Process completed.');
  });

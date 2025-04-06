const puppeteer = require("puppeteer");

async function scrape(url) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url);

  console.log("Waiting for WhatsApp to load...");
  await page.waitForSelector("#side", { timeout: 0 });

  console.log("Waiting for chat with Atul...");
  await page.waitForSelector("span[title='Atul']", { timeout: 0 });
  const target = await page.$("span[title='Atul']");
  await target.click();

  const inp = await page.waitForSelector(".selectable-text.copyable-text");

  for (let i = 0; i < 10; i++) {
    await inp.type("This is Testing!");
    await page.keyboard.press("Enter");
  }

  console.log("Messages sent!");
}

scrape("https://web.whatsapp.com");

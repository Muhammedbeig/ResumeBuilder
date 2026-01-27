const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('Attempting to launch browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', "--disable-setuid-sandbox"],
      dumpio: true // Print browser stdout/stderr to console
    });
    console.log('Browser launched successfully!');
    console.log('Version:', await browser.version());
    await browser.close();
    console.log('Browser closed.');
  } catch (error) {
    console.error('Failed to launch browser:', error);
  }
})();

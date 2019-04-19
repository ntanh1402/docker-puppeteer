const express = require('express');
const app = express();

const puppeteer = require('puppeteer-extra');

puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());
puppeteer.use(require('puppeteer-extra-plugin-stealth')());
puppeteer.use(require('puppeteer-extra-plugin-block-resources')({
  blockedTypes: new Set(['image', 'media'])
}));

(async () => {

  app.get('/html', async function(req, res) {
    if (!req.query.url) {
      return res.end('Please specify url like this: ?url=example.com');
    }
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox',
        '--no-zygote'
      ]
    });

    try {
      // Create a new incognito browser context
      const context = await browser.createIncognitoBrowserContext();

      // Create a new page inside context.
      const page = await context.newPage();

      await page.goto(req.query.url, {
        timeout: 20000,
        waitUntil: ['load', 'networkidle2']
      });
      const result = await page.content();

      res.set('Content-Type', 'text/html');
      res.send(result);
    } catch (err) {
      console.error(err);
      res.send(err);
    } finally {
      await browser.close();
    }
  });

  app.get('/url', async function(req, res) {
    if (!req.query.url) {
      return res.end('Please specify url like this: ?url=example.com');
    }
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox',
        '--no-zygote'
      ]
    });

    try {
      // Create a new incognito browser context
      const context = await browser.createIncognitoBrowserContext();

      // Create a new page inside context.
      const page = await context.newPage();

      await page.goto(req.query.url, {
        timeout: 20000,
        waitUntil: ['domcontentloaded']
      });

      const result = await page.url();

      res.set('Content-Type', 'text/plain');
      res.send(result);
    } catch (err) {
      console.error(err);
      res.send(err);
    } finally {
      await browser.close();
    }
  });

  app.get('/healthcheck', async function(req, res) {
    res.send('OK');
  });

  app.listen(8080, function() {
    console.log('Server listening on port 8080.');
  });

})();

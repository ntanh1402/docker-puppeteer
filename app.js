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

    var args = [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--no-zygote',
    ];
    if (req.query.proxy) {
      args.push('--proxy-server=' + req.query.proxy);
    }

    var browser;
    try {
      browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
        args: args
      });

      // Create a new incognito browser context
      const context = await browser.createIncognitoBrowserContext();

      // Create a new page inside context.
      const page = await context.newPage();

      if (req.query.proxy) {
        const user = req.query.username;
        const pass = req.query.password;

        await page.authenticate({
          username: user,
          password: pass
        });
      }

      await page.goto(req.query.url, {
        timeout: 30000,
        waitUntil: ['domcontentloaded', 'networkidle2']
      });

      const result = await page.content();

      res.set('Content-Type', 'text/html');
      res.send(result);
    } catch (err) {
      console.error(err);
      res.send(err);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  });

  app.get('/url', async function(req, res) {
    if (!req.query.url) {
      return res.end('Please specify url like this: ?url=example.com');
    }

    var args = [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--no-zygote',
    ];
    if (req.query.proxy) {
      args.push('--proxy-server=' + req.query.proxy);
    }
    var browser;
    try {
      browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
        args: args
      });

      // Create a new incognito browser context
      const context = await browser.createIncognitoBrowserContext();

      // Create a new page inside context.
      const page = await context.newPage();

      if (req.query.proxy) {
        const user = req.query.username;
        const pass = req.query.password;

        await page.authenticate({
          username: user,
          password: pass
        });
      }

      await page.goto(req.query.url, {
        timeout: 30000,
        waitUntil: ['domcontentloaded']
      });

      const result = await page.url();

      res.set('Content-Type', 'text/plain');
      res.send(result);
    } catch (err) {
      console.error(err);
      res.send(err);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  });

  app.get('/healthcheck', async function(req, res) {
    res.send('OK');
  });

  app.listen(8000, function() {
    console.log('Server listening on port 8000.');
  });

})();

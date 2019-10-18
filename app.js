const express = require('express');
const app = express();

const puppeteer = require('puppeteer-extra');

//puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());
puppeteer.use(require('puppeteer-extra-plugin-stealth')());
//puppeteer.use(require('puppeteer-extra-plugin-block-resources')({
//    blockedTypes: new Set(['image', 'media'])
//}));

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

      console.log('Start time: ' + getDateTime());

      await page.goto(req.query.url, {
        timeout: 30000,
        waitUntil: ['domcontentloaded']
      });

      if (req.query.waitFor) {
        console.log('Waiting for "' + req.query.waitFor + '" ...');
        await page.waitFor(req.query.waitFor);
      }

      console.log('End time: ' + getDateTime());

      const result = await page.content();

      res.set('Content-Type', 'text/html');
      res.send(result);
    } catch (err) {
      console.error(err);
      res.set('Content-Type', 'text/plain');
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

      console.log('Start time: ' + getDateTime());

      await page.goto(req.query.url, {
        timeout: 30000,
        waitUntil: ['domcontentloaded']
      });

      console.log('End time: ' + getDateTime());

      const result = await page.url();

      res.set('Content-Type', 'text/plain');
      res.send(result);
    } catch (err) {
      console.error(err);
      res.set('Content-Type', 'text/plain');
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

  function getDateTime() {
    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;
  }

})();
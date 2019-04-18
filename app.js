const express = require('express');
const app = express();
const { Cluster } = require('puppeteer-cluster');

const puppeteer = require('puppeteer-extra');

puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());
puppeteer.use(require('puppeteer-extra-plugin-stealth')());
puppeteer.use(require('puppeteer-extra-plugin-block-resources')({
  blockedTypes: new Set(['image', 'media'])
}));

(async () => {

  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
    puppeteer,
    puppeteerOptions: {
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
    },
    monitor: false,
  });

  const getUrl = async ({ page, data: url }) => {
    try {
      await page.goto(url, {
        timeout: 20000,
        waitUntil: ['domcontentloaded']
      });

      const urlStr = await page.url();

      return urlStr;
    } catch (err) {
      throw err;
    } finally {
      await page.goto('about:blank');
      await page.close();
    }
  };

  const getHtml = async ({ page, data: url }) => {
    try {
      await page.goto(url, {
        timeout: 20000,
        waitUntil: ['load', 'networkidle2']
      });

      const htmlStr = await page.content();

      return htmlStr;
    } catch (err) {
      throw err;
    } finally {
      await page.goto('about:blank');
      await page.close();
    }
  };

  app.get('/html', async function(req, res) {
    if (!req.query.url) {
      return res.end('Please specify url like this: ?url=example.com');
    }
    try {
      const result = await cluster.execute(req.query.url, getHtml);

      res.set('Content-Type', 'text/html');
      res.send(result);
    } catch (err) {
      console.error(err);
      res.status(500).send(err);
    }
  });

  app.get('/url', async function(req, res) {
    if (!req.query.url) {
      return res.end('Please specify url like this: ?url=example.com');
    }
    try {
      const result = await cluster.execute(req.query.url, getUrl);

      res.set('Content-Type', 'text/plain');
      res.send(result);
    } catch (err) {
      console.error(err);
      res.status(500).send(err);
    }
  });

  app.get('/healthcheck', async function(req, res) {
    res.send('OK');
  });

  app.listen(8080, function() {
    console.log('Server listening on port 8080.');
  });

})();

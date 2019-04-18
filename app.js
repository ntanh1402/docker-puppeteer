const express = require('express');
const app = express();
const { Cluster } = require('puppeteer-cluster');

// puppeteer-extra is a drop-in replacement for puppeteer, it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra');

// register plugins through `.use()`
puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());
puppeteer.use(require('puppeteer-extra-plugin-stealth')());
puppeteer.use(require('puppeteer-extra-plugin-block-resources')({
  blockedTypes: new Set(['image', 'media'])
}));

let getHtml = async ({ page, data: url }) => {
  await page.goto(url, {
    timeout: 30000,
    waitUntil: ['load', 'networkidle2']
  });

  const htmlStr = await page.content();
  await page.close();

  return htmlStr;
};

let getUrl = async ({ page, data: url }) => {
  await page.goto(url, {
    timeout: 30000,
    waitUntil: ['domcontentloaded']
  });

  const urlStr = await page.url();
  await page.close();

  return urlStr;
};

let cluster;
(async () => {
  if (!cluster) {
    cluster = await Cluster.launch({
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
      monitor: true,
    });
  }
})();

app.get('/html', function(request, response) {
  (async () => {
    try {
      const result = await cluster.execute(request.query.url, getHtml);

      response.set('Content-Type', 'text/html');
      response.send(result);
    } catch (err) {
      console.error(err);
      response.status(500).send(err);
    }
  })();
});

app.get('/url', function(request, response) {
  (async () => {
    try {
      const result = await cluster.execute(request.query.url, getUrl);

      response.set('Content-Type', 'text/plain');
      response.send(result);
    } catch (err) {
      console.error(err);
      response.status(500).send(err);
    }
  })();
});

app.get('/healthcheck', function(request, response) {
  (async () => {
    await response.send('OK');
  })();
});

const server = app.listen(8080, err => {
  if (err) {
    return console.error(err);
  }
  const port = server.address().port;
  console.info(`App listening on port ${port}`);
});

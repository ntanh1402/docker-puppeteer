const express = require('express');
const app = express();
const {
    Cluster
} = require('puppeteer-cluster');

// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra');

// register plugins through `.use()`
puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());
puppeteer.use(require('puppeteer-extra-plugin-stealth')());
puppeteer.use(require('puppeteer-extra-plugin-block-resources')({
    blockedTypes: new Set(['image', 'media'])
}));

let cluster;
let getHtml;
let getUrl;
let proxy;

async function getCluster(req) {
    var proxyReq = req.query.proxy;
    var args = [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox',
        '--no-zygote',
    ];
    var shouldLaunchCluster = false;
    if (!cluster) {
        if (proxyReq) {
            proxy = proxyReq;
        }
        shouldLaunchCluster = true;
    } else {
        if (proxyReq && proxy != proxyReq) {
            await cluster.idle();
            await cluster.close();

            shouldLaunchCluster = true;
            proxy = proxyReq;
        }
    }
    if (shouldLaunchCluster) {
        if (proxy) {
            args.push('--proxy-server=' + proxy);
            console.info(`Launch cluster with proxy: ${proxy}`);
        } else {
            console.info(`Launch headful cluster.`);
        }

        cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_BROWSER,
            maxConcurrency: 2,
            puppeteer,
            puppeteerOptions: {
                headless: false,
                defaultViewport: {
                    width: 1920,
                    height: 1080,
                },
                args: args
            },
            monitor: true,
        });
    }
    if (!getHtml) {
        getHtml = async ({
            page,
            data
        }) => {
            const {
                req,
                res
            } = data;

            try {
                const url = req.query.url;
                if (!url) {
                    return res.send('Please provide URL as GET parameter, for example: <a href="?url=https://example.com">?url=https://example.com</a>');
                }

                if (proxy) {
                    const username = req.query.username;
                    const password = req.query.password;
                    await page.authenticate({
                        username: username,
                        password: password
                    });
                }
                await page.goto(url, {
                    timeout: 30000,
                    waitUntil: ['load', 'networkidle2']
                });

                const htmlStr = await page.content();

                res.set('Content-Type', 'text/html');
                res.send(htmlStr);
            } catch (error) {
                console.error(error);
                res.status(500).send(error);
            } finally {
                await page.close();
            }
        };
    }
    if (!getUrl) {
        getUrl = async ({
            page,
            data
        }) => {
            const {
                req,
                res
            } = data;

            try {
                const url = req.query.url;
                if (!url) {
                    return res.send('Please provide URL as GET parameter, for example: <a href="?url=https://example.com">?url=https://example.com</a>');
                }

                if (proxy) {
                    const username = req.query.username;
                    const password = req.query.password;
                    await page.authenticate({
                        username: username,
                        password: password
                    });
                }
                await page.goto(url, {
                    timeout: 30000,
                    waitUntil: ['domcontentloaded']
                });

                const urlStr = await page.url();

                res.set('Content-Type', 'text/plain');
                res.send(urlStr);
            } catch (error) {
                console.error(error);
                res.status(500).send(error);
            } finally {
                await page.close();
            }
        };
    }
}

app.get('/html', function(request, response) {
    (async () => {
        await getCluster(request);
        await cluster.queue({
            req: request,
            res: response
        }, getHtml);
    })();
});

app.get('/url', function(request, response) {
    (async () => {
        await getCluster(request);
        await cluster.queue({
            req: request,
            res: response
        }, getUrl);
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

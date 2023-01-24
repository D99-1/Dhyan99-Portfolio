const puppeteer = require('puppeteer');
const cache = require('memory-cache');
const QRCode = require('qrcode');
const Jimp = require("jimp");
const axios = require('axios');
const request = require('request');
const mime = require("mime-types")
const ejs = require('ejs');
const path = require('path');

export default async function screenshot(req, res) {
    console.log("Screenshot Endpoint Called")
    const { url } = req.query;
    // Validate the URL
    if (!url || !/^(http|https):\/\/[^ "]+$/.test(url) || url.includes("ip")) {
      return res.status(400).json({ error: 'Invalid URL' });
    }
  
    // Check if the screenshot is already in the cache
    const screenshotFromCache = cache.get(url);
    if (screenshotFromCache) {
        res.set('Content-Type', 'image/png');
        return res.send(screenshotFromCache);
    }
    // If not, take the screenshot
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url);
    const screenshot = await page.screenshot();
  
    res.set('Content-Type', 'image/png');
    res.send(screenshot);
    await browser.close();
    
    // Add the screenshot to the cache
    cache.put(url, screenshot, 60 * 60 * 1000); // cache the screenshot for 1 hour
}
  
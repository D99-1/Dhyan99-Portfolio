// Server Imports
const express = require('express');
const rateLimit = require("express-rate-limit");

const subdomain = require("express-subdomain")



// Endpoint Packages
const puppeteer = require('puppeteer');
const cache = require('memory-cache');
const QRCode = require('qrcode');
const Jimp = require("jimp");
const axios = require('axios');
const request = require('request');
const mime = require("mime-types")
const ejs = require('ejs');
const path = require('path');

// Configs
const app = express();
app.set('view engine', 'ejs');
app.use('/public', express.static(path.join(__dirname, 'public')))
// Rate limiter
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // limit each IP to 5 requests per windowMs
    message: "401: Too Many Requests"
});
app.use("/api/screenshot", limiter);

// Website
app.get("/", (req,res)=>{
    res.status(200).sendFile(path.join(__dirname+'/index.html'));
})

// Website Screenshotter
app.get('/api/screenshot', async (req, res) => {
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
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'],ignoreDefaultArgs: ['--disable-extensions'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url);
    const screenshot = await page.screenshot();
  
    res.set('Content-Type', 'image/png');
    res.send(screenshot);
    await browser.close();
    
    // Add the screenshot to the cache
    cache.put(url, screenshot, 60 * 60 * 1000); // cache the screenshot for 1 hour
});

// QR Code
app.get('/api/qr', (req, res) => {
    console.log("QR Endpoint Called")
    let { text, download } = req.query;
    text = encodeURIComponent(text);
    QRCode.toDataURL(text, (err, url) => {
        if (err) {
            res.status(500).send(err);
        } else {
            const img = Buffer.from(url.split(',')[1], 'base64');

            if (download !== 'true') {
                res.render('qr', { qr: url });
            } else {
                res.setHeader('Content-Type', 'image/png');
                res.setHeader('Content-Disposition', 'attachment; filename="qr.png"');
                res.send(img)
            }
        }
    });
});

// Image Colour Inverter
app.get("/api/invert", (req, res) => {
    console.log("Invert Endpoint Called")
    // Get the image URL from the query
    const imageUrl = req.query.url;

    // Open the image using Jimp
    Jimp.read(imageUrl, (err, image) => {
        if (err) {
            // Handle the error
            res.status(400).send(err);
        } else {
            // Invert the colors of the image
            image.invert();

            // Send the inverted image back to the user
            image.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
                if (err) {
                    // Handle the error
                    res.status(400).send(err);
                } else {
                    res.set("Content-Type", Jimp.MIME_PNG);
                    res.send(buffer);
                }
            });
        }
    });
});

// Image Greyscale
app.get('/api/greyscale', (req, res) => {
    console.log("Greyscale Endpoint Called")
    const imageUrl = req.query.url;
    Jimp.read(imageUrl, (err, image) => {
        if (err) {
            res.status(404).json({ error: 'Image not found' });
        } else {
            image.greyscale().getBuffer(Jimp.MIME_JPEG, (error, buffer) => {
                if (error) {
                    res.status(500).json({ error: 'Server error' });
                } else {
                    res.set('Content-Type', 'image/jpeg');
                    res.send(buffer);
                }
            });
        }
    });
});

// Weather
app.get("/api/weather", (req, res) => {
    console.log("Weather Endpoint Called")
    // Get the location from the query
    const location = req.query.location;

    // Make a GET request to the OpenStreetMap Nominatim API
    axios.get(`https://nominatim.openstreetmap.org/search?q=${location}&format=json`)
        .then(response => {
            // Get the first result
            const result = response.data[0];
            // Get the latitude and longitude
            const latitude = result.lat;
            const longitude = result.lon;

            // Make a GET request to the Open-Meteo API
            const weatherapi = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
            axios.get(weatherapi)
                .then(response => {
                    // Get the current weather data
                    const currentWeather = response.data.current_weather;
                    // Send the current weather data back to the user
                    res.send(currentWeather);
                })
                .catch(error => {
                    // Handle the error
                    console.log(error);
                    res.status(500).send(error);
                });
        })
        .catch(error => {
            // Handle the error
            console.log(error);
            res.status(500).send(error);
        });
});

// Meme
app.get("/api/meme", (req, res) => {
    console.log("Meme Endpoint Called")

    // API endpoint for getting memes
    let url = `https://www.reddit.com/r/memes/top.json?sort=top&t=week`;

    // Make a GET request to the API
    axios.get(url)
        .then(response => {
            // Get a random meme from the result
            const memes = response.data.data.children;
            const randomIndex = Math.floor(Math.random() * memes.length);
            const randomMeme = memes[randomIndex].data.url;

            // Get the file type of the URL
            const fileType = mime.lookup(randomMeme);

            if (fileType.startsWith('image')) {
                // Send the image back to the user
                res.send(`<img src="${randomMeme}" />`);
             } else if (fileType.startsWith('video')) { 
                // Send the video back to the user 
                res.send(`<video controls>
                    <source src="${randomMeme}" type="${fileType}">
                    Your browser does not support the video tag.
                    </video>`);
                    } else {
                    // Handle the error
                res.status(400).send("Error: Invalid file type");
                }
                })
                .catch(error => {
                    // Handle the error
                console.log(error);
                res.status(500).send(error);
    });
});
                    
// Image Blur
app.get("/api/blur", (req, res) => {
    console.log("Blur Endpoint Called")
    // Get the image URL from the query
    const imageUrl = req.query.url;
    // Get the blur strength from query
    const blurLevel = req.query.strength;

    // Open the image using Jimp
    Jimp.read(imageUrl, (err, image) => {
        if (err) {
            // Handle the error
            res.status(400).send(err);
        } else {
            // Blur image
            image.blur(10);

            // Send the blurred image back to the user
            image.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
                if (err) {
                    // Handle the error
                    res.status(400).send(err);
                } else {
                    res.set("Content-Type", Jimp.MIME_PNG);
                    res.send(buffer);
                }
            });
        }
    });
});              

// Currency Value
app.get("/api/value",(req,res) => {
console.log("Value Endpoint Called")
let Cur = req.query.currency
Cur = Cur.toUpperCase()
const CACHE_DURATION = 86400000; // 24 hours in milliseconds

const getExchangeRates = (callback) => {
    const cachedData = cache.get('exchangeRates');
    if (cachedData) {
        callback(null, cachedData);
    } else {
        request(`https://open.er-api.com/v6/latest/USD`, (error, response, body) => {
            if (error) {
                callback(error);
            } else {
                try {
                    const exchangeRates = JSON.parse(body).rates;
                    cache.put('exchangeRates', exchangeRates, CACHE_DURATION);
                    callback(null, exchangeRates);
                } catch (e) {
                    callback(e);
                }
            }
        });
    }
};

const getExchangeRate = (countryCode, callback) => {
    getExchangeRates((error, exchangeRates) => {
        if (error) {
            callback(error);
        } else {
            if (exchangeRates[countryCode]) {
                callback(null, { [countryCode]: exchangeRates[countryCode],"Base Value":"The currency is being compared to the current value of 1 USD" });
            } else {
                callback(new Error(`Invalid country code: ${countryCode}`));
            }
        }
    });
};

getExchangeRate(Cur, (error, result) => {
    if (error) {
        res.status(400).send(error);
    } else {
        res.send(result)
    }
});

});

// Song Lyrics
app.get("/api/lyrics",(req,res)=>{
    console.log("Lyrics Endpoint Called")
    const song = req.query.song
        axios.get(`https://lyrist.vercel.app/api/${song}`)
        .then(response=>{
        const data = response.data;
        res.send({"title":data.title,"artist":data.artist,"lyrics":data.lyrics})
    }).catch(error=>{
        res.status(400).send("Error: Song Not Found")
    })

})

// Quotes
app.get("/api/quote",(req,res)=>{
    console.log("Quotes Endpoint Called")
    const quotes = require("./resources/quotes.json")
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    res.json(quote);
})

// Crypto Price
app.get("/api/crypto",(req,res)=>{
    console.log("Crypto Endpoint Called")
    const crypto = req.query.currency;
    axios.get(`https://api.coinbase.com/v2/exchange-rates?currency=${crypto}`)
  .then(response => {
    const jsondata = response.data
    res.send({"currency":jsondata.data.currency,"value":{"USD":jsondata.data.rates.USD}});
  })
  .catch(error => {
    res.status(400).send(error);
  });
})

// NPM Info
app.get('/api/npm', (req, res) => {
    console.log("NPM Endpoint Called")
    const packageName = req.query.package;
    axios.get(`https://registry.npmjs.org/${packageName}`)
      .then(response => {
        res.json(response.data);
      })
      .catch(error => {
        if (error.response.status === 404) {
          res.status(404).json({ error: 'Package not found' });
        } else {
          res.status(500).json({ error: 'Server error' });
        }
      });
  });

// Morseify
app.get('/api/morseify', (req, res) => {
    const morseCode = {
        'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.', 'g': '--.', 'h': '....', 'i': '..',
        'j': '.---', 'k': '-.-', 'l': '.-..', 'm': '--', 'n': '-.', 'o': '---', 'p': '.--.', 'q': '--.-', 'r': '.-.',
        's': '...', 't': '-', 'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-', 'y': '-.--', 'z': '--..',
        '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
        '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.', ' ': ' '
    };
    const text = req.query.text;
    let morseText = '';
    text.split('').forEach(char => {
        morseText += morseCode[char.toLowerCase()] + ' ';
    });
    res.json({ morse: morseText });
});

// UnMorseify
app.get('/api/unmorseify', (req, res) => {
    const morseCode = {
        '.-': 'a', '-...': 'b', '-.-.': 'c', '-..': 'd', '.': 'e', '..-.': 'f', '--.': 'g', '....': 'h', '..': 'i',
        '.---': 'j', '-.-': 'k', '.-..': 'l', '--': 'm', '-.': 'n', '---': 'o', '.--.': 'p', '--.-': 'q', '.-.': 'r',
        '...': 's', '-': 't', '..-': 'u', '...-': 'v', '.--': 'w', '-..-': 'x', '-.--': 'y', '--..': 'z',
        '.----': '1', '..---': '2', '...--': '3', '....-': '4', '.....': '5', '-....': '6', '--...': '7', '---..': '8', '----.': '9', '-----': '0',
        '.-.-.-': '.', '--..--': ',', '..--..': '?', '.----.': "'", '-.-.--':'!', '-..-.': '/', '-.--.': '(', '-.--.-': ')', '.-...': '&', '---...': ':', '-.-.-.': ';', '-...-': '=', '.-.-.': '+', '-....-': '-', '..--.-': '_', '.-..-.': '"', '...-..-': '$', '.--.-.': '@', ' ': ' '
    };
    const morse = req.query.morse;
    let text = '';
    morse.split(' ').forEach(code => {
        if(morseCode[code]) {
            text += morseCode[code];
        } else {
            res.status(400).json({ error: 'Invalid morse code format' });
            return;
        }
    });
    res.json({ text: text });
});

// Server
const PORT = 3030;

app.listen(PORT, () => {
    console.log(`Dhyan99API Running On Port ${PORT}`);
});

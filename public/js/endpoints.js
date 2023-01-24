const endpoints = [{
	"endpoint": "Screenshotter",
	"link": "/api/screenshot?url=https://google.com",
	"description": "Never forget what a website looks like by instantly getting a screenshot of it"
},
{
	"endpoint": "QR Code Generator",
	"link": "/api/qr?text=Hello&download=false",
	"description": "Imagine typing, just scan a QR code instead"
},
{
	"endpoint": "Image Inverter",
	"link": "/api/invert?url=https://media.timeout.com/images/103161245/image.jpg",
	"description": "Images were never meant to be this way"
},
{
	"endpoint": "Image Blur",
	"link":"/api/blur?url=https://media.timeout.com/images/103161245/image.jpg&strength=7",
	"description":"No one will ever know what was in the image"
},
{
	"endpoint": "Image Greyscale",
	"link":"/api/greyscale?url=https://media.timeout.com/images/103161245/image.jpg",
	"description":"Welcome to the dark side"
},
{
	"endpoint": "Weather",
	"link": "/api/weather?location=sydney",
	"description": "Now you'll know \"weather\" or not you need a jacket"
},
{
	"endpoint": "Memes",
	"link": "/api/meme",
	"description": "You can never have enough memes"
},
{
	"endpoint": "Currency Value",
	"link": "/api/value?currency=AUD",
	"description": "Wait, $1 isn't always worth $1"
},
{
	"endpoint": "Lyrics",
	"link": "/api/lyrics?song=YourFavouriteSong",
	"description": "Now you can read your favourite song"
},
{
	"endpoint": "Quotes",
	"link": "/api/quote",
	"description": "Nothin' better than a quote to start your day"
},
{
	"endpoint": "Crypto Value",
	"link": "/api/crypto?currency=DOGE",
	"description": "I must buy more Doge"
},
{
	"endpoint": "NPM Package Info",
	"link": "/api/npm?package=xtra-express",
	"description": "Know more about that really useful package"
},
{
	"endpoint": "Morse-ify",
	"link":"/api/morseify?text=English-is-Inferior",
	"description":"Now you won't know what you wrote either"
},
{
	"endpoint":"UnMorse-ify",
	"link":"/api/unmorseify?morse=.%20-.%20--.%20.-..%20..%20...%20....%20-....-%20..%20...%20-....-%20...%20..-%20.--.%20.%20.-.%20..%20---%20.-.",
	"description":"Now you can finally understand those dots and dashes "
}
]
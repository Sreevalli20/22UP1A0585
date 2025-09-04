const express = require('express');
const app = express();
const shortid = require('shortid');
const moment = require('moment');
const loggingMiddleware = require('../logging middleware/logger');
app.use(loggingMiddleware);
app.use(express.json());
let urlDatabase = {};
app.post('/shorturls', (req, res) => {
    const { url, validity = 30, shortcode } = req.body;
    const expiry = moment().add(validity, 'minutes');
    let shortCode;
    if (shortcode) {
        if (urlDatabase[shortcode]) {
            return res.status(409).json({ error: 'Shortcode already exists' });
        }
        shortCode = shortcode;
    } else {
        shortCode = shortid.generate();
    }
    urlDatabase[shortCode] = { url, expiry, clicks: [] };
    res.status(201).json({
        shortLink: `http://localhost:3000/${shortCode}`,
        expiry: expiry.format(),
    });
});
app.get('/shorturls/:shortcode', (req, res) => {
    const shortCode = req.params.shortcode;
    const urlData = urlDatabase[shortCode];
    if (!urlData) {
        return res.status(404).json({ error: 'Short URL not found' });
    }
    res.json({
        totalClicks: urlData.clicks.length,
        originalUrl: urlData.url,
        expiry: urlData.expiry.format(),
        clickData: urlData.clicks,
    });
});
app.get('/:shortcode', (req, res) => {
    const shortCode = req.params.shortcode;
    const urlData = urlDatabase[shortCode];
    if (!urlData || urlData.expiry.isBefore(moment())) {
        return res.status(404).json({ error: 'Short URL not found or expired' });
    }
    urlData.clicks.push({
        timestamp: moment(),
        source: req.headers.referer || 'Direct',
    });
    res.redirect(urlData.url);
});
const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
import express from 'express';
import { scrape } from '../controllers/Scrapper.controller.js';

const scrapeRouter = express.Router();

// Validate scraping request middleware
const validateScrapeRequest = (req, res, next) => {
    const { url, selectors, format } = req.body;

    // Validate URL
    if (!url) {
        return res.status(400).json({ message: 'URL is required' });
    }

    try {
        new URL(url);
    } catch (e) {
        return res.status(400).json({ message: 'Invalid URL format' });
    }

    // Validate selectors if not using scrapeAll
    if (!req.body.scrapeAll && (!selectors || typeof selectors !== 'object' || Object.keys(selectors).length === 0)) {
        return res.status(400).json({ message: 'Valid selectors are required when not using scrapeAll' });
    }

    // Validate format
    if (format && !['json', 'csv'].includes(format.toLowerCase())) {
        return res.status(400).json({ message: 'Invalid format specified' });
    }

    next();
};

scrapeRouter.post('/scrape', validateScrapeRequest, scrape);

export default scrapeRouter;

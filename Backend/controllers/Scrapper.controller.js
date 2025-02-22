import axios from 'axios';
import * as cheerio from 'cheerio';
import { Parser } from 'json2csv';
import mongoose from 'mongoose';

const SCRAPER_VERSION = '1.0.0';

const hasEmoji = (str) => {
    const emoticonRegex = /[:;=][-']?[)(DOPp\[\]\\/@]|[<>][3:]|[♥❤️♡]/;
    return emojiRegex.test(str) || emoticonRegex.test(str);
};

const isSpecialCharacterOnly = (str) => {
    const specialCharsRegex = /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?°•○●□■♦★☆~`₹€£¥%©®™✓×÷=<>{}()\[\]]+$/;
    const singleCharRegex = /^[-~<>.+={}\[\]()\/\\]+$/;
    return specialCharsRegex.test(str.trim()) || singleCharRegex.test(str.trim());
};

const isValidContent = (content, filterContent) => {
    if (!filterContent) return true;
    
    if (!content || typeof content !== 'string') return false;
    
    const trimmedContent = content.trim();
    
    if (!trimmedContent || /^\s*$/.test(trimmedContent)) return false;
    if (trimmedContent.length < 2) return false;
    
    if (/^[.…\-_=<>{}()\[\]\/\\]+$/.test(trimmedContent)) return false;
    
    const invalidPatterns = [
        /^[<>{}()\[\]\/\\]+$/, 
        /^[-_.=]+$/, 
        /^[,;:]+$/,
        /^\s*[<>\/\\\[\]{}()]\s*$/,
        /^[!?.,;:()[\]{}'"~`<>]{1,2}$/
    ];
    
    if (invalidPatterns.some(pattern => pattern.test(trimmedContent))) {
        return false;
    }
    
    if (!/[a-zA-Z0-9]/.test(trimmedContent)) return false;
    
    if (hasEmoji(trimmedContent)) return false;
    if (isSpecialCharacterOnly(trimmedContent)) return false;
    
    return true;
};

const handleScrapingError = (error, res) => {
    console.error('Scraping error:', error);
    
    if (error.response) {
        return res.status(error.response.status).json({
            message: 'Error accessing website',
            error: error.response.statusText,
            data: {}
        });
    } else if (error.request) {
        return res.status(500).json({
            message: 'No response from website',
            error: 'Connection error',
            data: {}
        });
    } else {
        return res.status(500).json({
            message: 'Error scraping website',
            error: error.message,
            data: {}
        });
    }
};

const ALL_HTML_TAGS = [
    'a', 'abbr', 'address', 'article', 'aside', 'audio', 'b', 'blockquote', 'body', 'br', 
    'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 
    'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 
    'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 
    'header', 'hr', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 
    'main', 'map', 'mark', 'meta', 'meter', 'nav', 'object', 'ol', 'optgroup', 'option', 
    'output', 'p', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 
    'section', 'select', 'small', 'source', 'span', 'strong', 'sub', 'summary', 'sup', 
    'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 
    'track', 'u', 'ul', 'var', 'video', 'wbr'
];

export const scrape = async (req, res) => {
    try {
        const { url, selectors, format = 'json', filterContent = false, scrapeAll = false } = req.body;

        console.log('Starting scrape operation:', { url, format, scrapeAll });

        if (!url) {
            return res.status(400).json({ message: 'URL is required' });
        }

        const effectiveSelectors = scrapeAll 
            ? ALL_HTML_TAGS.reduce((acc, tag) => ({ ...acc, [tag]: tag }), {})
            : selectors;

        try {
            new URL(url);
        } catch (e) {
            return res.status(400).json({ message: 'Invalid URL format' });
        }

        if (typeof effectiveSelectors !== 'object' || Object.keys(effectiveSelectors).length === 0) {
            return res.status(400).json({ message: 'Invalid selectors format' });
        }

        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; ScraperBot/1.0)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                },
                timeout: 15000 // Increased timeout
            });

            if (!response.data) {
                throw new Error('No data received from website');
            }

            const $ = cheerio.load(response.data);
            
            console.log('Raw scraped data:', {
                timestamp: new Date().toISOString(),
                url,
                status: 'initial_scrape'
            });

            const scrapedData = {
                data: {},
                metadata: {
                    source_url: url,
                    scraped_at: new Date().toISOString(),
                    scraper_version: SCRAPER_VERSION
                }
            };

            for (const [key, selector] of Object.entries(effectiveSelectors)) {
                try {
                    const rawResults = [];
                    $(selector).each((_, el) => {
                        const $el = $(el);
                        rawResults.push({
                            content: $el.text().trim(),
                            hasAttributes: Object.keys($el.attr() || {}).length > 0
                        });
                    });

                    console.log('Pre-filter data:', {
                        timestamp: new Date().toISOString(),
                        selector: key,
                        itemCount: rawResults.length,
                        status: 'pre_filter'
                    });

                    scrapedData.data[key] = [];
                    $(selector).each((_, el) => {
                        const $el = $(el);
                        const content = $el.text();
                        
                        // Only add content if it passes the enhanced filter
                        if (isValidContent(content, filterContent)) {
                            const item = {
                                content: content.trim(),
                                attributes: $el.attr() || {},
                                html: $el.html()?.trim() || ''
                            };
                            scrapedData.data[key].push(item);
                        }
                    });

                    console.log('Post-filter data:', {
                        timestamp: new Date().toISOString(),
                        selector: key,
                        itemCount: scrapedData.data[key].length,
                        status: 'post_filter',
                        filterApplied: filterContent
                    });

                } catch (err) {
                    console.error(`Error processing selector ${key}:`, err);
                    scrapedData.data[key] = []; // Initialize as empty array on error
                }
            }

            let formattedResult;
            if (format.toLowerCase() === 'csv') {
                const flatData = flattenData(scrapedData);
                const parser = new Parser({
                    fields: Object.keys(flatData[0] || {}),
                    defaultValue: null
                });
                const csv = parser.parse(flatData);
                formattedResult = {
                    format: 'csv',
                    data: scrapedData.data,
                    formatted: {
                        headers: Object.keys(flatData[0] || {}),
                        rows: flatData,
                        csv: csv
                    }
                };
            } else {
                formattedResult = {
                    format: 'json',
                    data: scrapedData.data,
                    formatted: {
                        data: scrapedData.data
                    }
                };
            }

            return res.json({
                ...formattedResult,
                metadata: {
                    ...scrapedData.metadata,
                    filtered: filterContent,
                    filterApplied: new Date().toISOString()
                }
            });

        } catch (axiosError) {
            console.error('Axios or cheerio error:', axiosError);
            return res.status(500).json({
                message: 'Failed to fetch or parse website',
                error: axiosError.message
            });
        }
    } catch (error) {
        console.error('Scraping Error:', error);
        return handleScrapingError(error, res);
    }
};

const flattenData = (data) => {
    const tags = Object.keys(data.data);
    const maxItems = Math.max(...tags.map(tag => data.data[tag].length));
    
    const rows = [];
    for (let i = 0; i < maxItems; i++) {
        const row = {};
        tags.forEach(tag => {
            const item = data.data[tag][i] || { content: '', attributes: {} };
            
            row[`${tag}`] = item.content;
            
            if (item.attributes.src) {
                row[`${tag}_src`] = item.attributes.src;
            }
            if (item.attributes.href) {
                row[`${tag}_href`] = item.attributes.href;
            }
        });
        rows.push(row);
    }

    return rows;
};

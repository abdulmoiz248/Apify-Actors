// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
import { Actor } from 'apify';
// Crawlee - web scraping and browser automation library (Read more at https://crawlee.dev)
import { PuppeteerCrawler } from 'crawlee';

// Helper function to clean and parse text
const cleanText = (text) => text?.trim().replace(/\s+/g, ' ') || '';

// Helper function to parse table data
const parseTable = ($, tableSelector) => {
    const data = [];
    $(tableSelector).find('tr').each((_, row) => {
        const cells = [];
        $(row).find('td, th').each((_, cell) => {
            cells.push(cleanText($(cell).text()));
        });
        if (cells.length > 0) {
            data.push(cells);
        }
    });
    return data;
};

// Parse company profile
const parseCompanyProfile = ($) => {
    const profile = {};
    
    // Business description
    const bizDesc = $('.profile__item--decription p').text();
    profile.businessDescription = cleanText(bizDesc);
    
    // Key people
    const keyPeople = [];
    $('.profile__item--people table tbody tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 2) {
            keyPeople.push({
                name: cleanText($(cells[0]).text()),
                position: cleanText($(cells[1]).text())
            });
        }
    });
    profile.keyPeople = keyPeople;
    
    // Address
    const addressItem = $('.profile__item').filter((i, el) => {
        return $(el).find('.item__head').text().includes('ADDRESS');
    });
    profile.address = cleanText(addressItem.find('p').first().text());
    
    // Website
    const websiteItem = $('.profile__item').filter((i, el) => {
        return $(el).find('.item__head').text().includes('WEBSITE');
    });
    const websiteLink = websiteItem.find('a');
    profile.website = websiteLink.attr('href') || cleanText(websiteLink.text());
    
    // Registrar
    const registrarItem = $('.profile__item').filter((i, el) => {
        return $(el).find('.item__head').text().includes('REGISTRAR');
    });
    profile.registrar = cleanText(registrarItem.find('p').text());
    
    // Auditor
    const auditorItem = $('.profile__item').filter((i, el) => {
        return $(el).find('.item__head').text().includes('AUDITOR');
    });
    profile.auditor = cleanText(auditorItem.find('p').first().text());
    
    // Fiscal Year End
    const fiscalItem = $('.profile__item').filter((i, el) => {
        return $(el).find('.item__head').text().includes('Fiscal Year End');
    });
    profile.fiscalYearEnd = cleanText(fiscalItem.find('p').last().text());
    
    return profile;
};

// Parse equity profile
const parseEquityProfile = ($) => {
    const equity = {};
    
    $('.companyEquity .stats_item').each((_, item) => {
        const label = cleanText($(item).find('.stats_label').text()).toLowerCase();
        const value = cleanText($(item).find('.stats_value').text());
        
        if (label.includes('market cap')) {
            equity.marketCap = value;
        } else if (label === 'shares') {
            equity.totalShares = value;
        } else if (label === 'free float' && !equity.freeFloat) {
            equity.freeFloat = value;
        } else if (label === 'free float' && !value.includes('%') && !equity.freeFloatPercentage) {
            equity.freeFloat = value;
        } else if (label === 'free float' && value.includes('%')) {
            equity.freeFloatPercentage = value;
        }
    });
    
    return equity;
};

// Parse market data
const parseMarketData = ($) => {
    const marketData = {};
    
    // Parse all stats items from the quote stats section
    $('.quote__stats .stats_item').each((_, item) => {
        const label = cleanText($(item).find('.stats_label').text()).toLowerCase();
        const value = cleanText($(item).find('.stats_value').text());
        
        if (value) {
            // Convert label to key (e.g., "P/E Ratio (TTM)" -> "pe_ratio")
            const key = label.replace(/[^\w\s]/g, '').replace(/\s+/g, '_');
            marketData[key] = value;
        }
    });
    
    return marketData;
};

// Parse financials
const parseFinancials = ($) => {
    const financials = {
        annual: [],
        quarterly: []
    };
    
    // Parse Annual data
    const annualTable = $('#financialTab .tabs__panel[data-name="Annual"] table');
    if (annualTable.length) {
        const headers = [];
        annualTable.find('thead tr th').each((_, th) => {
            headers.push(cleanText($(th).text()));
        });
        
        annualTable.find('tbody tr').each((_, row) => {
            const rowData = {};
            $(row).find('td').each((i, td) => {
                const header = headers[i] || `col${i}`;
                rowData[header] = cleanText($(td).text());
            });
            if (Object.keys(rowData).length > 0) {
                financials.annual.push(rowData);
            }
        });
    }
    
    // Parse Quarterly data
    const quarterlyTable = $('#financialTab .tabs__panel[data-name="Quarterly"] table');
    if (quarterlyTable.length) {
        const headers = [];
        quarterlyTable.find('thead tr th').each((_, th) => {
            headers.push(cleanText($(th).text()));
        });
        
        quarterlyTable.find('tbody tr').each((_, row) => {
            const rowData = {};
            $(row).find('td').each((i, td) => {
                const header = headers[i] || `col${i}`;
                rowData[header] = cleanText($(td).text());
            });
            if (Object.keys(rowData).length > 0) {
                financials.quarterly.push(rowData);
            }
        });
    }
    
    return financials;
};

// Parse ratios
const parseRatios = ($) => {
    const ratios = [];
    
    const ratiosTable = $('#ratios table, .company__ratios table');
    if (ratiosTable.length) {
        const headers = [];
        ratiosTable.find('thead tr th').each((_, th) => {
            headers.push(cleanText($(th).text()));
        });
        
        ratiosTable.find('tbody tr').each((_, row) => {
            const rowData = {};
            $(row).find('td').each((i, td) => {
                const header = headers[i] || `col${i}`;
                rowData[header] = cleanText($(td).text());
            });
            if (Object.keys(rowData).length > 0) {
                ratios.push(rowData);
            }
        });
    }
    
    return ratios;
};

// Parse announcements
const parseAnnouncements = ($) => {
    const announcements = [];
    
    $('#announcementsTab .tabs__panel--selected table tbody tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 2) {
            const links = $(cells[2]).find('a');
            const pdfLink = links.filter((i, a) => $(a).text().includes('PDF')).attr('href');
            
            announcements.push({
                date: cleanText($(cells[0]).text()),
                title: cleanText($(cells[1]).text()),
                pdfLink: pdfLink ? `https://dps.psx.com.pk${pdfLink}` : null
            });
        }
    });
    
    return announcements.slice(0, 10); // Get latest 10 announcements
};

// Parse payouts/dividends
const parsePayouts = ($) => {
    const payouts = [];
    
    $('#payouts table tbody tr, .company__payouts table tbody tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 3) {
            payouts.push({
                announcementDate: cleanText($(cells[0]).text()),
                financialPeriod: cleanText($(cells[1]).text()),
                dividend: cleanText($(cells[2]).text()),
                bookClosurePeriod: cleanText($(cells[3]).text())
            });
        }
    });
    
    return payouts;
};

// Main execution
await Actor.main(async () => {
    // Get input
    const input = await Actor.getInput() ?? {};
    const { 
        symbols = ['SYS'], 
        proxyConfiguration = { useApifyProxy: true },
        maxRequestRetries = 3 
    } = input;

    console.log(`Starting PSX scraper for ${symbols.length} symbol(s): ${symbols.join(', ')}`);

    // Create start URLs from symbols
    const startUrls = symbols.map(symbol => ({
        url: `https://dps.psx.com.pk/company/${symbol.toUpperCase()}`,
        userData: { symbol: symbol.toUpperCase() }
    }));

    // Setup proxy configuration
    const proxyConfig = await Actor.createProxyConfiguration(proxyConfiguration);

    // Create the crawler with Puppeteer for JavaScript rendering
    const crawler = new PuppeteerCrawler({
        proxyConfiguration: proxyConfig,
        maxRequestRetries,
        requestHandlerTimeoutSecs: 60,
        
        async requestHandler({ request, page, log }) {
            const { symbol } = request.userData;
            
            log.info(`Scraping data for ${symbol}`, { url: request.url });
            
            try {
                // Wait for the main content to load
                await page.waitForSelector('.item__head', { timeout: 15000 });
                
                // Wait a bit more for dynamic content using setTimeout
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Get page content after JavaScript has rendered
                const content = await page.content();
                
                // Use Cheerio to parse the rendered HTML
                const { load } = await import('cheerio');
                const $ = load(content);
                // Extract all data
                const companyProfile = parseCompanyProfile($);
                const equityProfile = parseEquityProfile($);
                const marketData = parseMarketData($);
                const financials = parseFinancials($);
                const ratios = parseRatios($);
                const announcements = parseAnnouncements($);
                const payouts = parsePayouts($);
                
                // Compile all data
                const result = {
                    symbol,
                    url: request.url,
                    scrapedAt: new Date().toISOString(),
                    companyProfile,
                    equityProfile,
                    marketData,
                    financials,
                    ratios,
                    announcements,
                    payouts
                };
                
                // Save to dataset
                await Actor.pushData(result);
                
                log.info(`Successfully scraped data for ${symbol}`);
                
            } catch (error) {
                log.error(`Error scraping ${symbol}: ${error.message}`);
                throw error;
            }
        },
        
        failedRequestHandler({ request, log, error }) {
            log.error(`Request failed for ${request.userData.symbol}: ${error.message}`, {
                url: request.url,
                error: error.message
            });
        }
    });

    // Run the crawler
    await crawler.run(startUrls);

    console.log('Scraping completed!');
});

// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
import { Actor } from 'apify';
// Crawlee - web scraping and browser automation library (Read more at https://crawlee.dev)
import { CheerioCrawler } from 'crawlee';

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
    profile.businessDescription = cleanText($('h4:contains("BUSINESS DESCRIPTION")').next('p').text());
    
    // Key people
    const keyPeople = [];
    $('h4:contains("KEY PEOPLE")').parent().find('table tr').each((_, row) => {
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
    profile.address = cleanText($('h4:contains("ADDRESS")').next('p').text());
    
    // Website
    const websiteLink = $('h4:contains("WEBSITE")').next('p').find('a');
    profile.website = websiteLink.attr('href') || cleanText(websiteLink.text());
    
    // Registrar
    profile.registrar = cleanText($('h4:contains("REGISTRAR")').next('p').text());
    
    // Auditor
    profile.auditor = cleanText($('h4:contains("AUDITOR")').next('p').text());
    
    // Fiscal Year End
    profile.fiscalYearEnd = cleanText($('h4:contains("Fiscal Year End")').next('p').text());
    
    return profile;
};

// Parse equity profile
const parseEquityProfile = ($) => {
    const equity = {};
    
    $('h3:contains("Equity Profile")').parent().find('p').each((_, p) => {
        const text = $(p).text();
        
        if (text.includes('MARKET CAP')) {
            const parts = text.split(/\s+/);
            equity.marketCap = parts.find(p => p.includes(',') && p.replace(/,/g, '').match(/^\d+(\.\d+)?$/));
        }
        if (text.includes('SHARES')) {
            const match = text.match(/SHARES\s+([\d,]+)/);
            equity.totalShares = match ? match[1] : null;
        }
        if (text.includes('FREE FLOAT') && !equity.freeFloat) {
            const match = text.match(/FREE FLOAT\s+([\d,]+)/);
            equity.freeFloat = match ? match[1] : null;
        }
        if (text.includes('FREE FLOAT') && text.includes('%')) {
            const match = text.match(/([\d.]+)%/);
            equity.freeFloatPercentage = match ? match[1] + '%' : null;
        }
    });
    
    return equity;
};

// Parse market data
const parseMarketData = ($) => {
    const marketData = {};
    
    // Current price and change
    const priceText = cleanText($('.stock-price, .price').first().text());
    marketData.lastPrice = priceText;
    
    // Parse various market metrics
    const metrics = [
        'OPEN', 'HIGH', 'LOW', 'VOLUME', 'LDCP', 'VAR', 
        'ASK PRICE', 'BID PRICE', 'P/E RATIO', 'HAIRCUT'
    ];
    
    metrics.forEach(metric => {
        const element = $(`b:contains("${metric}")`).parent();
        if (element.length) {
            const value = cleanText(element.text().replace(metric, ''));
            marketData[metric.toLowerCase().replace(/\s+/g, '_')] = value;
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
    
    const financialSection = $('h3:contains("Financials")').parent();
    const tables = financialSection.find('table');
    
    if (tables.length > 0) {
        financials.data = parseTable($, tables.first());
    }
    
    return financials;
};

// Parse ratios
const parseRatios = ($) => {
    const ratiosSection = $('h3:contains("Ratios")').parent();
    const tables = ratiosSection.find('table');
    
    if (tables.length > 0) {
        return parseTable($, tables.first());
    }
    
    return [];
};

// Parse announcements
const parseAnnouncements = ($) => {
    const announcements = [];
    
    $('h3:contains("Announcements")').parent().find('table tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 2) {
            announcements.push({
                date: cleanText($(cells[0]).text()),
                description: cleanText($(cells[1]).text()),
                link: $(cells[2]).find('a').attr('href') || null
            });
        }
    });
    
    return announcements.slice(0, 10); // Get latest 10 announcements
};

// Parse payouts/dividends
const parsePayouts = ($) => {
    const payouts = [];
    
    $('h3:contains("Payouts")').parent().find('table tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 3) {
            payouts.push({
                announcementDate: cleanText($(cells[0]).text()),
                period: cleanText($(cells[1]).text()),
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

    // Create the crawler
    const crawler = new CheerioCrawler({
        proxyConfiguration: proxyConfig,
        maxRequestRetries,
        requestHandlerTimeoutSecs: 60,
        
        async requestHandler({ request, $, log }) {
            const { symbol } = request.userData;
            
            log.info(`Scraping data for ${symbol}`, { url: request.url });
            
            try {
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

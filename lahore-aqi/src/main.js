import { PlaywrightCrawler, Dataset, log } from 'crawlee';
import { Actor } from 'apify';

const defaultInput = {
    city: '',
    province: '',
    days: 30,
    debug: false
};

function slugify(s) {
    return s.toString().trim().toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
}

function isoDateYmd(d) {
    return d.toISOString().slice(0,10);
}

function getLastNDates(n) {
    const out = [];
    const today = new Date();
    for (let i = 0; i < n; i++) {
        const dd = new Date(today);
        dd.setDate(today.getDate() - i);
        out.push(isoDateYmd(dd));
    }
    return out;
}

// Parser for AQI.in historical table
async function parseAqiInPage(page, days) {
    const html = await page.content();
    const results = [];
    const dates = getLastNDates(days);
    for (const date of dates) results.push({ date, aqi: null, pm25: null, note: 'not found yet' });

    // Find table rows containing date and AQI
    const rows = await page.$$eval('table tr', trs => trs.map(tr => tr.innerText));
    for (const row of rows) {
        for (let i = 0; i < dates.length; i++) {
            const d = dates[i];
            if (row.includes(d)) {
                const match = row.match(/(\d+)/);
                if (match) {
                    results[i].aqi = parseInt(match[1], 10);
                    results[i].note = 'parsed from aqi.in table';
                }
            }
        }
    }

    const foundAny = results.some(r => r.aqi !== null);
    return { results, foundAny, debugHtml: html.slice(0,16000) };
}

await Actor.init();

const input = await Actor.getInput() || defaultInput;
input.city = (input.city || '').trim();
input.province = (input.province || '').trim();
input.days = Math.max(1, Math.min(90, input.days || 30));

if (!input.city) {
    log.error('city missing in input');
    throw new Error('Input must include "city" (e.g., Lahore)');
}

// Candidate URLs using AQI.in only
const candidateUrls = [];
candidateUrls.push(`https://www.aqi.in/dashboard/pakistan/${slugify(input.city)}`);
if (input.province) {
    candidateUrls.push(`https://www.aqi.in/dashboard/pakistan/${slugify(input.province)}/${slugify(input.city)}`);
}

const crawler = new PlaywrightCrawler({
    launchContext: { launchOptions: { headless: process.env.CRAWLEE_HEADLESS !== '0' } },
    requestHandlerTimeoutSecs: 90,
    maxRequestRetries: 1,
    navigationTimeoutSecs: 60,
    async requestHandler({ request, page, log }) {
        await page.waitForLoadState('networkidle').catch(()=>{});
        const { results, foundAny, debugHtml } = await parseAqiInPage(page, input.days);

        const item = {
            fetchedAt: new Date().toISOString(),
            input,
            sourceUrl: request.url,
            city: input.city,
            province: input.province || null,
            daysRequested: input.days,
            results,
            debugHtmlSnippet: input.debug ? debugHtml : null
        };

        await Dataset.pushData(item);
        if (foundAny) {
            log.info(`Scraped ${request.url} — found data`);
            return;
        } else {
            log.warning(`No data parsed from ${request.url}`);
        }
    },
    failedRequestHandler: async ({ request, log }) => {
        log.error(`Failed to crawl ${request.url}`);
    }
});

await crawler.run(candidateUrls);
await Actor.exit();

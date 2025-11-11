import { PuppeteerCrawler } from 'crawlee';
import fs from 'fs';

const crawler = new PuppeteerCrawler({
    maxRequestsPerCrawl: 1,
    async requestHandler({ page, log }) {
        log.info('Waiting for page to load...');
        
        await page.waitForSelector('.item__head', { timeout: 15000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const content = await page.content();
        
        // Save HTML to file for inspection
        fs.writeFileSync('page-content.html', content);
        log.info('HTML saved to page-content.html');
        
        // Use Cheerio to parse
        const { load } = await import('cheerio');
        const $ = load(content);
        
        console.log('\n--- Inspecting Page Structure ---\n');
        console.log('Title:', $('title').text());
        console.log('\nCompany name elements:');
        $('.company__name, .company-name, h1, h2').each((i, el) => {
            const text = $(el).text().trim();
            if (text) console.log(`  ${el.name}.${$(el).attr('class')}: ${text.substring(0, 100)}`);
        });
        
        console.log('\nLooking for "BUSINESS DESCRIPTION":');
        let found = false;
        $('*').each((i, el) => {
            const text = $(el).text();
            if (text.includes('BUSINESS DESCRIPTION') && text.length < 200) {
                console.log(`  Found in <${el.name}> class="${$(el).attr('class')}"`);
                console.log(`  Next sibling:`, $(el).next().text().substring(0, 200));
                found = true;
            }
        });
        
        if (!found) {
            console.log('  Not found - checking for class patterns...');
            $('[class*="item"], [class*="profile"], [class*="company"]').each((i, el) => {
                if (i < 10) {
                    console.log(`  <${el.name}> class="${$(el).attr('class')}": ${$(el).text().substring(0, 80)}`);
                }
            });
        }
    }
});

await crawler.run(['https://dps.psx.com.pk/company/SYS']);

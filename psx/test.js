import { CheerioCrawler } from 'crawlee';

const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 1,
    async requestHandler({ $, log }) {
        console.log('Title:', $('title').text());
        console.log('\n--- Testing Selectors ---\n');
        
        // Find all h3 headers
        console.log('H3 headers:');
        $('h3').each((i, el) => {
            console.log(`  ${i}: ${$(el).text()}`);
        });
        
        // Find all h4 headers
        console.log('\nH4 headers:');
        $('h4').each((i, el) => {
            console.log(`  ${i}: ${$(el).text()}`);
        });
        
        // Find company name
        console.log('\nCompany info:');
        console.log('  Name:', $('.company-name, .company__name').text());
        
        // Look for specific text patterns
        console.log('\nLooking for BUSINESS DESCRIPTION:');
        $('*').each((i, el) => {
            const text = $(el).text();
            if (text.includes('BUSINESS DESCRIPTION') && text.length < 100) {
                console.log('  Found in:', el.name, '-', $(el).attr('class'));
            }
        });
    }
});

await crawler.run(['https://dps.psx.com.pk/company/SYS']);


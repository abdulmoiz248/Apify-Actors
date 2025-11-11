# Pakistan Stock Exchange (PSX) Scraper

A powerful Apify Actor that scrapes company data from Pakistan Stock Exchange (dps.psx.com.pk). This scraper uses the latest Apify SDK v4 and Crawlee with proxy support for reliable data extraction.

## Features

- ✅ **Latest Apify SDK v4** - Built with the newest version of Apify SDK
- ✅ **Proxy Support** - Uses Apify proxy with residential IPs to prevent blocking
- ✅ **Comprehensive Data** - Extracts complete company information including:
  - Company Profile (business description, key people, address, etc.)
  - Equity Profile (market cap, shares, free float)
  - Market Data (current price, volume, P/E ratio, etc.)
  - Financial Statements
  - Financial Ratios
  - Recent Announcements
  - Dividend/Payout History
- ✅ **Multiple Symbols** - Scrape multiple stock symbols in a single run
- ✅ **Error Handling** - Built-in retry mechanism for failed requests

## Input

The Actor accepts the following input parameters:

```json
{
    "symbols": ["SYS", "OGDC", "PPL", "HBL", "LUCK"],
    "proxyConfiguration": {
        "useApifyProxy": true,
        "apifyProxyGroups": ["RESIDENTIAL"]
    },
    "maxRequestRetries": 3
}
```

### Input Parameters

- **symbols** (required, array) - List of PSX stock symbols to scrape (e.g., SYS, OGDC, PPL)
- **proxyConfiguration** (optional, object) - Proxy settings (defaults to Apify Residential proxy)
- **maxRequestRetries** (optional, number) - Maximum retry attempts for failed requests (default: 3)

## Output

The Actor outputs structured data in JSON format for each symbol:

```json
{
    "symbol": "SYS",
    "url": "https://dps.psx.com.pk/company/SYS",
    "scrapedAt": "2025-11-11T15:30:00.000Z",
    "companyProfile": {
        "businessDescription": "Systems Limited is a public limited company...",
        "keyPeople": [
            {
                "name": "Asif Peer",
                "position": "CEO"
            }
        ],
        "address": "E-1, Sehjpal Road, Near DHA Phase-8...",
        "website": "www.systemsltd.com",
        "registrar": "CDC Share Registrar Services Limited...",
        "auditor": "M/s A.F.Ferguson & Co, Chartered Accountants",
        "fiscalYearEnd": "December"
    },
    "equityProfile": {
        "marketCap": "219,444,493.26",
        "totalShares": "1,472,880,685",
        "freeFloat": "881,665,500",
        "freeFloatPercentage": "59.86%"
    },
    "marketData": {
        "lastPrice": "152.00",
        "open": "152.20",
        "high": "152.51",
        "low": "148.00",
        "volume": "2,056,218",
        "p/e_ratio": "9.23"
    },
    "financials": { ... },
    "ratios": [ ... ],
    "announcements": [ ... ],
    "payouts": [ ... ]
}
```

## Usage

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Run the Actor locally:
```bash
apify run
```

### Deploy to Apify

1. Login to Apify:
```bash
apify login
```

2. Push the Actor to Apify platform:
```bash
apify push
```

## Example Use Cases

### Scrape Single Stock
```json
{
    "symbols": ["SYS"]
}
```

### Scrape Multiple Stocks
```json
{
    "symbols": ["SYS", "OGDC", "PPL", "HBL", "LUCK", "ENGRO", "MCB", "UBL"]
}
```

### Custom Proxy Configuration
```json
{
    "symbols": ["SYS"],
    "proxyConfiguration": {
        "useApifyProxy": true,
        "apifyProxyGroups": ["RESIDENTIAL"],
        "apifyProxyCountry": "PK"
    }
}
```

## Popular PSX Symbols

Here are some popular Pakistan Stock Exchange symbols you can scrape:

- **SYS** - Systems Limited
- **OGDC** - Oil & Gas Development Company
- **PPL** - Pakistan Petroleum Limited
- **HBL** - Habib Bank Limited
- **LUCK** - Lucky Cement Limited
- **ENGRO** - Engro Corporation Limited
- **MCB** - MCB Bank Limited
- **UBL** - United Bank Limited
- **PSO** - Pakistan State Oil
- **HUBC** - Hub Power Company

## Technical Details

- **Platform**: Apify
- **SDK Version**: 4.0.0+
- **Crawler**: Crawlee CheerioCrawler v3.15.0+
- **Node Version**: 20.0.0+
- **Proxy**: Apify Residential Proxy (recommended)

## Project Structure

```
.actor/
├── actor.json              # Actor configuration
├── input_schema.json       # Input validation schema
├── dataset_schema.json     # Output dataset schema
└── output_schema.json      # Output specification
src/
└── main.js                 # Main scraper logic
storage/
├── datasets/               # Scraped data output
├── key_value_stores/       # Input and metadata
└── request_queues/         # Crawl queue
```

## Error Handling

The scraper includes robust error handling:
- Automatic retries for failed requests (configurable)
- Detailed error logging
- Proxy rotation to avoid blocking
- Timeout handling

## Resources

- [Apify Documentation](https://docs.apify.com/)
- [Crawlee Documentation](https://crawlee.dev/)
- [PSX Website](https://dps.psx.com.pk/)
- [Apify Proxy Documentation](https://docs.apify.com/platform/proxy)

## Support

For issues or questions:
- Create an issue in the repository
- Contact via Apify Console
- Check [Apify Discord community](https://discord.com/invite/jyEM2PRvMU)

## License

ISC

## Quick Start

Once you've installed the dependencies, start the Actor:

```bash
apify run
```

Once your Actor is ready, you can push it to the Apify Console:

```bash
apify login # first, you need to log in if you haven't already done so

apify push
```

## Project Structure

```text
.actor/
├── actor.json # Actor config: name, version, env vars, runtime settings
├── dataset_schena.json # Structure and representation of data produced by an Actor
├── input_schema.json # Input validation & Console form definition
└── output_schema.json # Specifies where an Actor stores its output
src/
└── main.js # Actor entry point and orchestrator
storage/ # Local storage (mirrors Cloud during development)
├── datasets/ # Output items (JSON objects)
├── key_value_stores/ # Files, config, INPUT
└── request_queues/ # Pending crawl requests
Dockerfile # Container image definition
```

For more information, see the [Actor definition](https://docs.apify.com/platform/actors/development/actor-definition) documentation.

## How it works

This code is a JavaScript script that uses Cheerio to scrape data from a website. It then stores the website titles in a dataset.

- The crawler starts with URLs provided from the input `startUrls` field defined by the input schema. Number of scraped pages is limited by `maxPagesPerCrawl` field from the input schema.
- The crawler uses `requestHandler` for each URL to extract the data from the page with the Cheerio library and to save the title and URL of each page to the dataset. It also logs out each result that is being saved.

## What's included

- **[Apify SDK](https://docs.apify.com/sdk/js)** - toolkit for building [Actors](https://apify.com/actors)
- **[Crawlee](https://crawlee.dev/)** - web scraping and browser automation library
- **[Input schema](https://docs.apify.com/platform/actors/development/input-schema)** - define and easily validate a schema for your Actor's input
- **[Dataset](https://docs.apify.com/sdk/python/docs/concepts/storages#working-with-datasets)** - store structured data where each object stored has the same attributes
- **[Cheerio](https://cheerio.js.org/)** - a fast, flexible & elegant library for parsing and manipulating HTML and XML
- **[Proxy configuration](https://docs.apify.com/platform/proxy)** - rotate IP addresses to prevent blocking

## Resources

- [Quick Start](https://docs.apify.com/platform/actors/development/quick-start) guide for building your first Actor
- [Video tutorial](https://www.youtube.com/watch?v=yTRHomGg9uQ) on building a scraper using CheerioCrawler
- [Written tutorial](https://docs.apify.com/academy/web-scraping-for-beginners/challenge) on building a scraper using CheerioCrawler
- [Web scraping with Cheerio in 2023](https://blog.apify.com/web-scraping-with-cheerio/)
- How to [scrape a dynamic page](https://blog.apify.com/what-is-a-dynamic-page/) using Cheerio
- [Integration with Zapier](https://apify.com/integrations), Make, Google Drive and others
- [Video guide on getting data using Apify API](https://www.youtube.com/watch?v=ViYYDHSBAKM)

## Creating Actors with templates

[How to create Apify Actors with web scraping code templates](https://www.youtube.com/watch?v=u-i-Korzf8w)


## Getting started

For complete information [see this article](https://docs.apify.com/platform/actors/development#build-actor-locally). To run the Actor use the following command:

```bash
apify run
```

## Deploy to Apify

### Connect Git repository to Apify

If you've created a Git repository for the project, you can easily connect to Apify:

1. Go to [Actor creation page](https://console.apify.com/actors/new)
2. Click on **Link Git Repository** button

### Push project on your local machine to Apify

You can also deploy the project on your local machine to Apify without the need for the Git repository.

1. Log in to Apify. You will need to provide your [Apify API Token](https://console.apify.com/account/integrations) to complete this action.

    ```bash
    apify login
    ```

2. Deploy your Actor. This command will deploy and build the Actor on the Apify Platform. You can find your newly created Actor under [Actors -> My Actors](https://console.apify.com/actors?tab=my).

    ```bash
    apify push
    ```

## Documentation reference

To learn more about Apify and Actors, take a look at the following resources:

- [Apify SDK for JavaScript documentation](https://docs.apify.com/sdk/js)
- [Apify SDK for Python documentation](https://docs.apify.com/sdk/python)
- [Apify Platform documentation](https://docs.apify.com/platform)
- [Join our developer community on Discord](https://discord.com/invite/jyEM2PRvMU)

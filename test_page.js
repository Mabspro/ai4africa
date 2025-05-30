const puppeteer = require('puppeteer');
const path = require('path');

async function testPage() {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const errors = [];

    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });

    page.on('pageerror', error => {
        errors.push(error.message);
    });

    const filePath = `file://${path.join(__dirname, 'index.html')}`;
    await page.goto(filePath, { waitUntil: 'networkidle0' });

    console.log('Testing sector buttons...');
    const sectorButtons = ['agriculture', 'energy', 'ai', 'healthcare', 'other'];
    for (const sector of sectorButtons) {
        await page.click(`button[data-sector="${sector}"]`);
        await new Promise(r => setTimeout(r, 200)); // Wait for content to potentially load
    }

    console.log('Testing search functionality...');
    // Site search with results
    await page.type('#search input', 'agriculture');
    await page.click('#search button');
    await new Promise(r => setTimeout(r, 500)); // Wait for search results

    // Site search with no results
    await page.evaluate(() => { document.querySelector('#search input').value = ''; });
    await page.type('#search input', 'xyznonexistent');
    await page.click('#search button');
    await new Promise(r => setTimeout(r, 500));

    // Web search (will open a new tab, not much to test in console for this)
    // Ensure 'Search the web' is selected
    await page.evaluate(() => {
        document.querySelector('input[name="search-type"][value="web"]').click();
    });
    await page.type('#search input', 'test web search');
    // const [newPage] = await Promise.all([
    //     browser.waitForTarget(target => target.opener() === page.target()).then(target => target.page()),
    //     page.click('#search button')
    // ]);
    // if (newPage) await newPage.close();
    // For now, just click the button, as handling the new tab for errors is complex here
    await page.click('#search button');
    await new Promise(r => setTimeout(r, 500));


    console.log('Testing navigation links...');
    const navLinks = ['#hero', '#sectors', '#featured', '#contact'];
    for (const link of navLinks) {
        await page.click(`nav ul li a[href="${link}"]`);
        await new Promise(r => setTimeout(r, 500)); // Wait for scroll
    }

    console.log('Testing contact form...');
    await page.type('#contact-form input[type="text"]', 'Test Name');
    await page.type('#contact-form input[type="email"]', 'test@example.com');
    await page.type('#contact-form textarea', 'Test message');
    page.on('dialog', async dialog => {
        console.log(`Dialog message: ${dialog.message()}`);
        await dialog.dismiss();
    });
    await page.click('#contact-form button[type="submit"]');
    await new Promise(r => setTimeout(r, 200));


    await browser.close();

    if (errors.length > 0) {
        console.error('JavaScript errors found:');
        errors.forEach(err => console.error(err));
        return false;
    } else {
        console.log('No JavaScript errors detected.');
        return true;
    }
}

testPage().then(success => {
    process.exit(success ? 0 : 1);
});

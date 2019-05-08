const puppeteer = require('puppeteer');

(async () => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	const dest = process.argv.length > 2 ? process.argv[2] : 'QTM RT Protocol Documentation.pdf';

	page.emulateMedia('screen');

	await page.goto('file:///' + __dirname + '/dist/index.html', { waitUntil: 'networkidle2' });
	await page.addStyleTag({ path: __dirname + '/client/styles/pdf.css' })

	await page.pdf({
		path: dest,
		format: 'A4',
		headerTemplate: ''
	});

	await browser.close();
})();
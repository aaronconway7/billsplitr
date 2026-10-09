import { expect, test } from '@playwright/test';
import { addPeople, item, open, toast } from './helpers.ts';

// A 1×1 PNG; the scanner itself is mocked, so any image will do
const photo = 'e2e/fixtures/receipt.png';

test.beforeEach(({ page }) => open(page));

test('fills the bill from a receipt photo', async ({ page }) => {
	let sent: { image?: string; mime?: string } = {};
	await page.route('/api/scan', (route) => {
		sent = route.request().postDataJSON();
		return route.fulfill({
			json: { items: [{ name: 'Pizza', qty: 1, price: 12.5 }, { name: 'Beer', qty: 2, price: 9 }], service: { percent: 10 }, total: 23.65, currency: 'EUR' }
		});
	});
	await addPeople(page, 'Ann', 'Bob');
	await page.getByLabel('Receipt photo').setInputFiles(photo);
	await toast(page, 'Added 2 items');
	expect(sent.mime).toBe('image/jpeg');
	expect(sent.image).toMatch(/^[A-Za-z0-9+/]+=*$/);
	await expect(item(page, 'Pizza').getByLabel('Price of Pizza')).toHaveValue('12.50');
	await expect(item(page, '2 × Beer').getByLabel('Price of 2 × Beer')).toHaveValue('9.00');
	await expect(page.getByLabel('Currency')).toHaveText(/EUR \(€\)/);
	await expect(page.getByRole('button', { name: '10%' })).toHaveAttribute('aria-pressed', 'true');
});

test('says when the free scans are used up for the day', async ({ page }) => {
	await page.route('/api/scan', (route) => route.fulfill({ status: 429, json: { why: 'day', until: Date.now() + 3_600_000 } }));
	await page.getByLabel('Receipt photo').setInputFiles(photo);
	await toast(page, /Out of free receipt scans for today\. They're back (tomorrow )?at/);
	await expect(page.getByText('No items yet.')).toBeVisible();
});

test('says to wait a minute when scans are rate limited', async ({ page }) => {
	await page.route('/api/scan', (route) => route.fulfill({ status: 429 }));
	await page.getByLabel('Receipt photo').setInputFiles(photo);
	await toast(page, 'Too many receipt scans just now, try again in a minute');
});

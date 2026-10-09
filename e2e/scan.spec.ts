import { expect, test } from '@playwright/test';
import { addPeople, item, open, toast } from './helpers.ts';

// A 1×1 PNG; the scanner itself is mocked, so any image will do
const photo = 'e2e/fixtures/receipt.png';


test('fills the bill from a receipt photo', async ({ page }) => {
	let sent: { image?: string; mime?: string } = {};
	await page.route('/api/scan', (route) => {
		if (route.request().method() === 'GET') return route.fulfill({ json: { ok: true } });
		sent = route.request().postDataJSON();
		return route.fulfill({
			json: { items: [{ name: 'Pizza', qty: 1, price: 12.5 }, { name: 'Beer', qty: 2, price: 9 }], service: { percent: 10 }, total: 23.65, currency: 'EUR' }
		});
	});
	await open(page);
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

test('a used-up daily quota disables scanning until it resets', async ({ page }) => {
	let left = true;
	const until = Date.now() + 3_600_000;
	await page.route('/api/scan', (route) =>
		route.request().method() === 'GET' || !left ? route.fulfill({ json: { ok: true } }) : ((left = false), route.fulfill({ status: 429, json: { why: 'day', until } }))
	);
	await open(page);
	const button = page.getByRole('button', { name: 'Scan a receipt' });
	await expect(button).not.toHaveAttribute('aria-disabled', 'true');
	await page.getByLabel('Receipt photo').setInputFiles(photo);
	await toast(page, /Out of free receipt scans for today\. They're back (tomorrow )?at/);
	await expect(page.getByText('No items yet.')).toBeVisible();
	await expect(button).toHaveAttribute('aria-disabled', 'true');
	// aria-disabled, so Playwright needs forcing; people can still hover and tap it
	await button.hover({ force: true });
	await expect(page.locator('[data-slot=tooltip-content]')).toContainText('Out of free receipt scans for today');
});

test('says why scanning is off when the page loads', async ({ page }) => {
	await page.route('/api/scan', (route) => route.fulfill({ json: { ok: false, why: 'minute', until: Date.now() + 30_000 } }));
	await open(page);
	const button = page.getByRole('button', { name: 'Scan a receipt' });
	await expect(button).toHaveAttribute('aria-disabled', 'true');
	// A tap explains instead of opening the camera
	await button.click({ force: true });
	await toast(page, 'Too many receipt scans just now, try again in a minute');
});

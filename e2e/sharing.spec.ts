import { expect, test, type Browser, type Page } from '@playwright/test';
import { addPeople, clipboard, item, LEGACY_HASH, open, result, sampleBill, toast } from './helpers.ts';

const VIEW = /\/[0-9a-f-]{36}$/;
const EDIT = /\/e\/[0-9a-f-]{36}$/;

// A new browser profile: no local bill, no edit keys
async function fresh(browser: Browser) {
	const ctx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
	return ctx.newPage();
}

// Share the sample bill and return its view and edit links
async function share(page: Page) {
	await open(page);
	await sampleBill(page);
	await page.getByRole('button', { name: 'Copy link' }).click();
	await toast(page, 'Link copied');
	const view = await clipboard(page);
	await page.getByRole('switch', { name: 'Allow editing' }).click();
	await page.getByRole('button', { name: 'Copy link' }).click();
	await toast(page, 'Edit link copied');
	return { view, edit: await clipboard(page) };
}

test('copy link stores the bill and moves it to its own address', async ({ page }) => {
	await open(page);
	await sampleBill(page);
	await page.getByRole('button', { name: 'Copy link' }).click();
	await toast(page, 'Link copied');
	expect(await clipboard(page)).toMatch(VIEW);
	await expect(page).toHaveURL(VIEW);
	await expect(page.getByText('All changes saved')).toBeVisible();
	// The home page goes back to a fresh bill
	expect(await page.evaluate(() => localStorage.getItem('bsplitr'))).toBeNull();
	// The switch picks which link the address bar and copy buttons use
	await page.getByRole('switch', { name: 'Allow editing' }).click();
	await expect(page).toHaveURL(EDIT);
	await page.getByRole('button', { name: 'Copy for WhatsApp' }).click();
	await toast(page, 'Summary copied');
	expect(await clipboard(page)).toMatch(/\n\nView or edit the split: http:\/\/localhost:\d+\/e\/[0-9a-f-]{36}$/);
	await page.getByRole('switch', { name: 'Allow editing' }).click();
	await expect(page).toHaveURL(VIEW);
});

test('edit links open editable and save changes', async ({ page, browser }) => {
	const { view, edit } = await share(page);
	const editor = await fresh(browser);
	await open(editor, edit);
	await expect(editor).toHaveURL(edit);
	await expect(editor.getByRole('switch', { name: 'Allow editing' })).toBeChecked();
	await expect(editor.getByText('All changes saved')).toBeVisible();
	await addPeople(editor, 'Dan');
	await expect(editor.getByText('Saving…')).toBeVisible();
	await expect(editor.getByText('All changes saved')).toBeVisible();

	const viewer = await fresh(browser);
	await open(viewer, view);
	await expect(result(viewer, 'Dan')).toBeVisible();
});

test('view links are read-only', async ({ page, browser }) => {
	const { view } = await share(page);
	const viewer = await fresh(browser);
	await open(viewer, view);
	await expect(viewer).toHaveURL(view);
	await expect(viewer.getByText('This shared bill is read-only.')).toBeVisible();
	await expect(viewer.getByPlaceholder('Add a name')).toHaveCount(0);
	await expect(viewer.getByPlaceholder('Item (e.g. Margherita)')).toHaveCount(0);
	await expect(viewer.getByRole('slider')).toHaveCount(0);
	await expect(viewer.getByLabel('Service amount')).toHaveCount(0);
	await expect(viewer.getByLabel(/^(Name of|Price of|Item name)/)).toHaveCount(0);
	await expect(viewer.getByRole('switch')).toHaveCount(0);
	await expect(viewer.getByLabel('Currency')).toBeDisabled();
	await expect(viewer.getByRole('button', { name: /Remove/ })).toHaveCount(0);
	await expect(viewer.getByRole('button', { name: 'Everyone' })).toHaveCount(0);
	await expect(item(viewer, 'Bread')).toContainText('Unassigned');
	await expect(item(viewer, 'Pizza').getByRole('button')).toHaveCount(0);
	await expect(item(viewer, 'Pizza')).toContainText('AnnBob');
	await expect(viewer.getByText('12.5%', { exact: true })).toBeVisible();
	await expect(result(viewer, 'Bob')).toContainText('£18.28');
	await expect(viewer.getByText('Ann pays Bob £18.28')).toBeVisible();
	// Copying still works, and shares the same view link
	await viewer.getByRole('button', { name: 'Copy link' }).click();
	await toast(viewer, 'Link copied');
	expect(await clipboard(viewer)).toBe(view);
});

test('the browser that shared a bill can still edit it from the view link', async ({ page }) => {
	const { view } = await share(page);
	await open(page, view);
	await expect(page).toHaveURL(view);
	await expect(page.getByPlaceholder('Add a name')).toBeVisible();
	await expect(page.getByRole('switch', { name: 'Allow editing' })).not.toBeChecked();
});

test('new bill from a shared bill leaves the link alone', async ({ page, browser }) => {
	const { view } = await share(page);
	await page.getByRole('main').getByRole('button', { name: 'New bill' }).click();
	await expect(page.getByRole('alertdialog')).toContainText('Shared links will keep showing this one.');
	await page.getByRole('alertdialog').getByRole('button', { name: 'New bill' }).click();
	await expect(page).toHaveURL('/');
	await expect(page.getByText('Add at least two people.')).toBeVisible();
	await expect(page.getByRole('switch', { name: 'Allow editing' })).not.toBeChecked();
	const viewer = await fresh(browser);
	await open(viewer, view);
	await expect(result(viewer, 'Ann')).toBeVisible();
});

test('unknown or expired links go home with a message', async ({ page }) => {
	await open(page, '/00000000-0000-4000-8000-000000000000');
	await toast(page, 'That bill link has expired');
	await expect(page).toHaveURL('/');
	await open(page, '/e/00000000-0000-4000-8000-000000000000');
	await toast(page, 'That bill link has expired');
});

test('old #hash links open read-only', async ({ page }) => {
	await open(page, '/#' + LEGACY_HASH);
	await expect(page.getByText('This shared bill is read-only.')).toBeVisible();
	await expect(result(page, 'Zoë')).toContainText('€11.25');
	await expect(page.getByText('Total€52.80')).toBeVisible();
	await expect(item(page, 'Pizza 🍕')).toContainText('€12.50');
	// Copy link shares the same address
	await page.getByRole('button', { name: 'Copy link' }).click();
	await toast(page, 'Link copied');
	expect(await clipboard(page)).toBe(page.url());
});

test('a #hash link matching this browser’s own bill stays editable', async ({ page }) => {
	await open(page);
	await addPeople(page, 'Ann', 'Bob');
	const bill = await page.evaluate(() => localStorage.getItem('bsplitr')!);
	const hash = await page.evaluate((b) => btoa(unescape(encodeURIComponent(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), bill);
	// A new tab, since changing only the hash doesn't reload the page
	const tab = await page.context().newPage();
	await open(tab, '/#' + hash);
	await expect(tab.getByPlaceholder('Add a name')).toBeVisible();
	await expect(tab).toHaveURL('/');
});

test('falls back to a long link when the server is unavailable', async ({ page }) => {
	await page.route('**/api/bills', (r) => r.abort());
	await open(page);
	await sampleBill(page);
	await page.getByRole('button', { name: 'Copy link' }).click();
	await toast(page, 'Link copied');
	const link = await clipboard(page);
	expect(link).toMatch(/\/#z\S+$/);
	await expect(page).toHaveURL('/');
	// The long link opens the same bill, read-only
	const viewer = await page.context().browser()!.newPage();
	await open(viewer, link);
	await expect(result(viewer, 'Cat')).toContainText('£11.25');
	await expect(viewer.getByText('This shared bill is read-only.')).toBeVisible();
	// No edit link without the server
	await page.getByRole('switch', { name: 'Allow editing' }).click();
	await page.getByRole('button', { name: 'Copy link' }).click();
	await toast(page, 'Couldn’t create an edit link. Try again in a moment.');
});

test('failed saves say so and retry on the next edit', async ({ page }) => {
	await share(page);
	await page.route('**/api/bills/*', (r) => r.fulfill({ status: 500 }));
	await addPeople(page, 'Dan');
	await expect(page.getByText('Couldn’t save changes. They’ll retry on your next edit.')).toBeVisible();
	await page.unroute('**/api/bills/*');
	await addPeople(page, 'Eve');
	await expect(page.getByText('All changes saved')).toBeVisible();
	await page.reload();
	await expect(result(page, 'Dan')).toBeVisible();
	await expect(result(page, 'Eve')).toBeVisible();
});

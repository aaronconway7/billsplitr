import { expect, type Page } from '@playwright/test';

// A bill made by the pre-Svelte page: Ann, Bob, Zoë; Pizza 🍕 €12.50 (Ann, Bob), Wine €30 (everyone), Bread €4.99; 12.5%; Bob paid
export const LEGACY_HASH =
	'W1siQW5uIiwiQm9iIiwiWm_DqyJdLFtbIlBpenphIPCfjZUiLDEyLjUsWzAsMV1dLFsiV2luZSIsMzAsWzAsMSwyXV0sWyJCcmVhZCIsNC45OSxbXV1dLDEyLjUsMSwiRVVSIl0';

export async function open(page: Page, path = '/') {
	await page.goto(path);
	// The bill loads after the page does
	await expect(page.getByRole('heading', { name: 'BillSplitr' })).toBeVisible();
	// The page is prerendered, so its controls show before they work
	await expect(page.locator('main[data-ready="true"]')).toBeVisible();
	await page.waitForFunction(() => document.readyState === 'complete');
	await page.waitForTimeout(200);
}

export async function addPeople(page: Page, ...names: string[]) {
	for (const n of names) {
		await page.getByPlaceholder('Add a name').fill(n);
		await page.getByPlaceholder('Add a name').press('Enter');
	}
}

export async function addItem(page: Page, name: string, amount: string) {
	await page.getByPlaceholder('Item (e.g. Margherita)').fill(name);
	await page.locator('input[type=number]').first().fill(amount);
	await page.locator('input[type=number]').first().press('Enter');
}

// Editable items show their name in an input, so match the price field's label too
export const item = (page: Page, name: string) => {
	const items = page.getByRole('list', { name: 'Items' }).getByRole('listitem');
	return items.filter({ hasText: name }).or(items.filter({ has: page.getByLabel(`Price of ${name}`) }));
};
export const result = (page: Page, name: string) => page.getByRole('list', { name: 'Who owes what' }).getByRole('listitem').filter({ hasText: name });
export const payerChips = (page: Page) => page.getByText('Who paid the bill?');
export const toast = (page: Page, text: string | RegExp) => expect(page.locator('[data-sonner-toast]').filter({ hasText: text })).toBeVisible();
export const clipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());

// Ann, Bob, Cat; Pizza £12.50 (Ann, Bob), Wine £30 (everyone), Bread £4.99 (nobody); 12.5% service; Bob paid
export async function sampleBill(page: Page) {
	await addPeople(page, 'Ann', 'Bob', 'Cat');
	await addItem(page, 'Pizza', '12.50');
	await addItem(page, 'Wine', '30');
	await addItem(page, 'Bread', '4.99');
	await item(page, 'Pizza').getByRole('button', { name: 'Ann' }).click();
	await item(page, 'Pizza').getByRole('button', { name: 'Bob' }).click();
	await item(page, 'Wine').getByRole('button', { name: 'Everyone' }).click();
	await page.getByRole('button', { name: '12.5%' }).click();
	await payerChips(page).getByRole('button', { name: 'Bob' }).click();
}

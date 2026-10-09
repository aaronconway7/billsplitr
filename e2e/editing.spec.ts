import { expect, test } from '@playwright/test';
import { addItem, addPeople, clipboard, item, open, payerChips, result, sampleBill, toast } from './helpers.ts';

test.beforeEach(({ page }) => open(page));

test('starts empty', async ({ page }) => {
	await expect(page.getByText('Add at least two people.')).toBeVisible();
	await expect(page.getByText('No items yet.')).toBeVisible();
	await expect(page.getByText('Add people and items to see the split.')).toBeVisible();
	await expect(page.getByLabel('Currency')).toHaveText(/GBP \(£\)/);
});

test('splits a bill', async ({ page }) => {
	await sampleBill(page);
	await expect(result(page, 'Ann')).toContainText('£16.25');
	await expect(result(page, 'Ann')).toContainText('£18.28');
	await expect(result(page, 'Bob')).toContainText('£16.25 + £2.03 service · paid');
	await expect(result(page, 'Bob')).toContainText('£18.28');
	await expect(result(page, 'Cat')).toContainText('£10.00');
	await expect(result(page, 'Cat')).toContainText('£11.25');
	await expect(page.getByText('Items£47.49')).toBeVisible();
	await expect(page.getByText('Service / tip (12.5%)£5.94')).toBeVisible();
	await expect(page.getByText('Total£53.43')).toBeVisible();
	await expect(page.getByText("£4.99 of items (+ £0.63 service) aren't assigned to anyone yet.")).toBeVisible();
	await expect(page.getByText('Ann pays Bob £18.28')).toBeVisible();
	await expect(page.getByText('Cat pays Bob £11.25')).toBeVisible();
	await expect(item(page, 'Pizza').getByRole('button', { name: 'Ann' })).toHaveAttribute('aria-pressed', 'true');
	await expect(item(page, 'Pizza').getByRole('button', { name: 'Cat' })).toHaveAttribute('aria-pressed', 'false');
});

test('toggles sharers, service and payer', async ({ page }) => {
	await sampleBill(page);
	await item(page, 'Pizza').getByRole('button', { name: 'Ann' }).click();
	await expect(item(page, 'Pizza').getByRole('button', { name: 'Ann' })).toHaveAttribute('aria-pressed', 'false');
	await expect(result(page, 'Bob')).toContainText('£22.50');
	await payerChips(page).getByRole('button', { name: 'Bob' }).click();
	await expect(page.getByText(/pays Bob/)).toHaveCount(0);
	await expect(result(page, 'Bob')).not.toContainText('paid');
	await page.getByRole('button', { name: 'None' }).click();
	await expect(page.getByText(/Service \/ tip/)).toHaveCount(0);
	await expect(page.getByText('Total£47.49')).toBeVisible();
});

test('service percentage slider', async ({ page }) => {
	await sampleBill(page);
	const slider = page.getByRole('slider');
	await expect(slider).toHaveAttribute('aria-valuenow', '12.5');
	// Each arrow key is one 0.5% step
	await slider.focus();
	for (let k = 0; k < 15; k++) await slider.press('ArrowRight');
	await expect(page.getByText('Service / tip (20%)£9.50')).toBeVisible();
	await expect(page.getByText('20%', { exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: '12.5%' })).toHaveAttribute('aria-pressed', 'false');
	await page.getByRole('button', { name: '10%' }).click();
	await expect(slider).toHaveAttribute('aria-valuenow', '10');
});

test('edits items in place', async ({ page }) => {
	await sampleBill(page);
	const price = page.getByLabel('Price of Wine');
	await price.fill('36');
	await price.blur();
	await expect(result(page, 'Cat')).toContainText('£12.00');
	await expect(page.getByText('Items£53.49')).toBeVisible();
	// A cleared or blank field goes back to what it was
	await price.fill('');
	await price.blur();
	await expect(price).toHaveValue('36.00');
	const name = item(page, 'Wine').getByLabel('Item name');
	await name.fill('Red wine');
	await name.blur();
	await expect(page.getByLabel('Price of Red wine')).toHaveValue('36.00');
	const renamed = item(page, 'Red wine').getByLabel('Item name');
	await renamed.fill(' ');
	await renamed.blur();
	await expect(renamed).toHaveValue('Red wine');
});

test('renames people in place', async ({ page }) => {
	await sampleBill(page);
	const ann = page.getByLabel('Name of Ann');
	await ann.fill('Annie');
	await ann.press('Enter');
	await expect(result(page, 'Annie')).toContainText('£18.28');
	await expect(item(page, 'Pizza').getByRole('button', { name: 'Annie' })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByText('Annie pays Bob £18.28')).toBeVisible();
	await page.getByLabel('Name of Annie').fill('');
	await page.getByLabel('Name of Annie').blur();
	await expect(page.getByLabel('Name of Annie')).toHaveValue('Annie');
});

test('fixed service amount', async ({ page }) => {
	await sampleBill(page);
	await page.getByRole('button', { name: 'Amount' }).click();
	await expect(page.getByRole('button', { name: '12.5%' })).toHaveCount(0);
	await expect(page.getByText(/Service \/ tip/)).toHaveCount(0);
	const amount = page.getByLabel('Service amount');
	await amount.fill('5');
	await amount.blur();
	await expect(page.getByText('Service / tip£5.00')).toBeVisible();
	await expect(page.getByText('Total£52.49')).toBeVisible();
	// £5 shared by what each ordered, Bread's 53p held back until it's assigned: £1.71, £1.71, £1.05
	await expect(result(page, 'Ann')).toContainText('£16.25 + £1.71 service');
	await expect(result(page, 'Ann')).toContainText('£17.96');
	await expect(result(page, 'Cat')).toContainText('£11.05');
	await page.reload();
	await expect(page.getByLabel('Service amount')).toHaveValue('5');
	// Clearing a loaded amount stays in Amount mode
	await page.getByLabel('Service amount').fill('');
	await page.getByLabel('Service amount').blur();
	await expect(page.getByLabel('Service amount')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Amount' })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByText('Total£47.49')).toBeVisible();
	await page.getByRole('button', { name: 'Percentage' }).click();
	await expect(page.getByRole('button', { name: 'None' })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByText('Total£47.49')).toBeVisible();
});

test('removing a person keeps everyone else’s shares and the payer', async ({ page }) => {
	await sampleBill(page);
	await page.getByRole('button', { name: 'Remove Ann' }).click();
	await expect(item(page, 'Pizza').getByRole('button', { name: 'Bob' })).toHaveAttribute('aria-pressed', 'true');
	await expect(item(page, 'Wine').getByRole('button', { name: 'Bob' })).toHaveAttribute('aria-pressed', 'true');
	await expect(item(page, 'Wine').getByRole('button', { name: 'Cat' })).toHaveAttribute('aria-pressed', 'true');
	await expect(payerChips(page).getByRole('button', { name: 'Bob' })).toHaveAttribute('aria-pressed', 'true');
	// Bread is still unassigned, so Bob's 343.97p rounds down and the odd penny waits with Bread
	await expect(result(page, 'Bob')).toContainText('£27.50 + £3.43 service · paid');
	// Removing the payer clears it
	await page.getByRole('button', { name: 'Remove Bob' }).click();
	await expect(page.getByText(/· paid/)).toHaveCount(0);
});

test('removes items', async ({ page }) => {
	await sampleBill(page);
	await item(page, 'Bread').getByRole('button', { name: 'Remove item' }).click();
	await expect(item(page, 'Bread')).toHaveCount(0);
	await expect(page.getByText(/aren't assigned/)).toHaveCount(0);
});

test('validates new items and people', async ({ page }) => {
	await page.getByPlaceholder('Add a name').fill('   ');
	await page.getByRole('button', { name: 'Add' }).first().click();
	await expect(page.getByText('Add at least two people.')).toBeVisible();
	await page.getByPlaceholder('Item (e.g. Margherita)').fill('Chips');
	await page.getByRole('button', { name: 'Add' }).nth(1).click();
	await toast(page, 'Enter a name and price');
	await expect(page.getByText('No items yet.')).toBeVisible();
	// Inputs clear and keep focus after adding
	await addPeople(page, 'Ann');
	await expect(page.getByPlaceholder('Add a name')).toHaveValue('');
	await expect(page.getByPlaceholder('Add a name')).toBeFocused();
	await addItem(page, 'Chips', '3');
	await expect(page.getByPlaceholder('Item (e.g. Margherita)')).toHaveValue('');
	await expect(page.getByPlaceholder('Item (e.g. Margherita)')).toBeFocused();
	// "Everyone" only appears once there are two people
	await expect(item(page, 'Chips').getByRole('button', { name: 'Everyone' })).toHaveCount(0);
});

test('currencies use their own decimals', async ({ page }) => {
	await addPeople(page, 'Ann', 'Bob');
	await addItem(page, 'Sushi', '20');
	const pick = async (code: string) => {
		await page.getByLabel('Currency').click();
		await page.getByRole('option', { name: new RegExp(code) }).click();
	};
	await pick('JPY');
	await expect(page.getByLabel('Price of Sushi')).toHaveValue('20');
	await expect(item(page, 'Sushi')).toContainText('¥');
	await expect(page.locator('input[type=number]').first()).toHaveAttribute('step', '1');
	await expect(page.locator('input[type=number]').first()).toHaveAttribute('placeholder', '¥');
	await pick('KWD');
	await expect(page.getByLabel('Price of Sushi')).toHaveValue('20.000');
	await expect(page.getByLabel('Price of Sushi')).toHaveAttribute('step', '0.001');
	await expect(page.locator('input[type=number]').first()).toHaveAttribute('step', '0.001');
});

test('keeps the bill in this browser', async ({ page }) => {
	await sampleBill(page);
	await page.reload();
	await expect(result(page, 'Ann')).toContainText('£18.28');
	await expect(payerChips(page).getByRole('button', { name: 'Bob' })).toHaveAttribute('aria-pressed', 'true');
	await expect(page).toHaveURL('/');
});

test('summary text', async ({ page }) => {
	await page.route('**/api/bills', (r) => r.abort());
	await sampleBill(page);
	await page.getByRole('button', { name: 'Copy summary' }).click();
	await toast(page, 'Summary copied');
	const text = await clipboard(page);
	expect(text).toMatch(
		/^🧾 \*Bill split\*\nTotal: \*£53\.43\* \(incl\. 12\.5% service\)\n\n💸 \*Pay Bob:\*\n• Ann – £18\.28\n• Cat – £11\.25\n\n⚠️ £5\.62 not yet assigned\n\nSee the full split: http:\/\/localhost:\d+\/#z\S+$/
	);
});

test('new bill clears everything but the currency', async ({ page }) => {
	await sampleBill(page);
	await page.getByLabel('Currency').click();
	await page.getByRole('option', { name: /EUR/ }).click();
	await page.getByRole('main').getByRole('button', { name: 'New bill' }).click();
	await expect(page.getByRole('alertdialog')).toContainText('This clears everything on this bill.');
	await page.getByRole('button', { name: 'Cancel' }).click();
	await expect(result(page, 'Ann')).toBeVisible();
	await page.getByRole('main').getByRole('button', { name: 'New bill' }).click();
	await page.getByRole('alertdialog').getByRole('button', { name: 'New bill' }).click();
	await expect(page.getByText('Add at least two people.')).toBeVisible();
	await expect(page.getByLabel('Currency')).toHaveText(/EUR/);
	await page.reload();
	await expect(page.getByText('Add at least two people.')).toBeVisible();
});

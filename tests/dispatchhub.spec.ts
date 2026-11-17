import { test, expect } from '@playwright/test';

// TC01: Check whether login page loads
test('TC01 - Login page loads correctly', async ({ page }) => {

    await page.goto('/login');

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password', {
        exact: true
    })).toBeVisible();

    await expect(page.getByRole('button', {
        name: 'Sign in'
    })).toBeVisible();
});


// TC02: Empty login form
test('TC02 - Empty login validation', async ({ page }) => {

    await page.goto('/login');

    await page.getByRole('button', {
        name: 'Sign in'
    }).click();

    await expect(
        page.getByText('Enter your email', { exact: true })
    ).toBeVisible();

    await expect(
        page.getByText('Enter your password', { exact: true })
    ).toBeVisible();
});


// TC03: Invalid email format
test('TC03 - Invalid email validation', async ({ page }) => {

    await page.goto('/login');

    await page.getByLabel('Email').fill('invalidemail');

    await page.getByLabel('Password', {
        exact: true
    }).fill('Test12345');

    await page.getByRole('button', {
        name: 'Sign in'
    }).click();

    await expect(
        page.getByText('Enter a valid email address')
    ).toBeVisible();
});


// TC04: Incorrect login credentials
test('TC04 - Incorrect credentials rejected', async ({ page }) => {

    await page.goto('/login');

    await page.getByLabel('Email')
        .fill('nonexistent@example.com');

    await page.getByLabel('Password', {
        exact: true
    }).fill('WrongPassword123');

    await page.getByRole('button', {
        name: 'Sign in'
    }).click();

    await expect(page.getByRole('alert')).toBeVisible();

    await expect(page).toHaveURL(/\/login/);
});


// TC05: Empty tracking number
test('TC05 - Empty tracking number rejected', async ({ page }) => {

    await page.goto('/track');

    await page.getByRole('button', {
        name: 'Track',
        exact: true
    }).click();

    await expect(
        page.getByText('Enter a valid tracking number', {
            exact: false
        })
    ).toBeVisible();
});


// TC06: Invalid tracking number
test('TC06 - Invalid tracking number rejected', async ({ page }) => {

    await page.goto('/track');

    await page.getByLabel('Tracking number').fill('@#$%');

    await page.getByRole('button', {
        name: 'Track',
        exact: true
    }).click();

    await expect(
        page.getByText('Enter a valid tracking number', {
            exact: false
        })
    ).toBeVisible();
});


// TC07: Nonexistent parcel
test('TC07 - Nonexistent parcel tracking', async ({ page }) => {

    await page.goto('/track');

    await page.getByLabel('Tracking number')
        .fill('DH999999ZZZZZZ');

    await page.getByRole('button', {
        name: 'Track',
        exact: true
    }).click();

    await expect(
        page.getByRole('heading', {
            name: 'No parcel found'
        })
    ).toBeVisible({ timeout: 15000 });
});

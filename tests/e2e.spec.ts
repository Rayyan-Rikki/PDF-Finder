import { test, expect } from '@playwright/test';

test('login page loads correctly', async ({ page }) => {
  await page.goto('/auth');
  await expect(page.getByRole('tab', { name: 'Login' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Sign Up' })).toBeVisible();
});

test('can switch between login and signup tabs', async ({ page }) => {
  await page.goto('/auth');
  await page.getByRole('tab', { name: 'Sign Up' }).click();
  await expect(page.getByText('Create a new parent account.')).toBeVisible();
  
  await page.getByRole('tab', { name: 'Login' }).click();
  await expect(page.getByText('Enter your email below to login to your account.')).toBeVisible();
});

test('public gallery is accessible', async ({ page }) => {
  await page.goto('/presentations');
  await expect(page.getByRole('heading', { name: 'Discovery Gallery' })).toBeVisible();
});

test('sessions page is accessible', async ({ page }) => {
  await page.goto('/sessions');
  await expect(page.getByRole('heading', { name: 'Explore Sessions' })).toBeVisible();
});

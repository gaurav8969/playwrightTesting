const { test, expect, beforeEach, describe } = require('@playwright/test');
const { createBlog, extractLikes, addLikes } = require('../utils/helper');

describe('Blog app', () => {
  beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('Login form is shown', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const locator = page.getByText('log in to application');
    await expect(locator).toBeVisible();
    await expect(page.getByText('login')).toBeVisible();
  });

  describe('When one User exists in db', () => {
    beforeEach(async ({ page, request }) => {
      await request.post('http://localhost:3003/api/testing/reset');
      await request.post('http://localhost:3003/api/users', {
        data: {
          name : 'Yash Tiwari',
          username: 'yashtiwari8969',
          password: '4252'
        }
      });

      await page.goto('http://localhost:5173');
    });

    test('login is successful with correct credentials', async ({ page }) => {
      await page.getByRole('textbox').first().fill('yashtiwari8969');
      await page.getByRole('textbox').last().fill('4252');
      await page.getByRole('button', { name: 'login' }).click();
      await expect(page.getByText('Yash Tiwari logged in')).toBeVisible();
    });

    test('login fails with false credentials', async ({ page }) => {
      await page.getByRole('textbox').first().fill('wrongUsername');
      await page.getByRole('textbox').last().fill('wrongPassword');
      await page.getByRole('button', { name: 'login' }).click();
      await expect(page.getByText('wrong username or password')).toBeVisible();
    });

    describe('if user is logged in', () => {
      beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173');
        await page.getByRole('textbox').first().fill('yashtiwari8969');
        await page.getByRole('textbox').last().fill('4252');
        await page.getByRole('button', { name: 'login' }).click();
      });

      test('can create a blog', async ({ page }) => {
        await createBlog(page, 'System programming', 'Yash', 'http://localhost:3000/hohoho');
        await expect(page.getByText('System programming Yash')).toBeVisible();
      });

      describe('and a blog is present', () => {
        beforeEach(async ({ page }) => {
          await createBlog(page, 'System programming', 'Yash', 'http://localhost:3000/hohoho');
        });

        test('you can like the blog', async ({ page }) => {
          await page.getByRole('button', { name: 'view' }).click();
          const initialLikes = await extractLikes(page);
          await page.getByRole('button', { name: 'like' }).click();
          await page.getByText(`likes ${initialLikes+1}`).waitFor();
          const finalLikes = await extractLikes(page);

          expect(finalLikes === initialLikes + 1).toBeTruthy();
        });

        test('you can delete the blog', async ({ page }) => {
          await page.getByRole('button', { name: 'view' }).click();

          // Set up a listener for the dialog BEFORE triggering it
          page.on('dialog', dialog => dialog.accept());
          await page.getByRole('button', { name: 'remove' }).click();

          await expect(page.getByText('System programming Yash')).not.toBeVisible();
        });
      });

      describe('many blogs are present, out of order, by likes', () => {
        beforeEach(async ({ page }) => {
          await createBlog(page, 'System programming', 'Yash', 'http://localhost:3000/hohoho');
          page.getByText('System programming Yash').waitFor();
          await createBlog(page, 'Stateful Components', 'Harsh', 'http://localhost:3131/hobohobo');
          page.getByText('Stateful Components Harsh').waitFor();
          await createBlog(page, 'Cybersecurity', 'Gaurav', 'http://localhost:6969/yesyes');
          page.getByText('Cybersecurity Gaurav').waitFor();
        });

        test('they are displayed sorted in order of likes', async ({ page }) => {
          await expect(page.getByText('System programming Yash')).toBeVisible();
          await expect(page.getByText('Stateful Components Harsh')).toBeVisible();
          await expect(page.getByText('Cybersecurity Gaurav')).toBeVisible();

          let viewButtons = await page.getByRole('button', { name: 'view' }).all();
          await viewButtons[0].click();
          let likes = 1;
          await addLikes(page, likes);
          await page.getByRole('button', { name: 'hide' }).click();
          await viewButtons[1].click();
          likes = 2;
          await addLikes(page, likes);
          await page.getByRole('button', { name: 'hide' }).click();
          await viewButtons[2].click();
          likes = 3;
          await addLikes(page, likes);
          await page.getByRole('button', { name: 'hide' }).click();
          const sleep = ms => new Promise(res => setTimeout(res, ms));
          sleep(5000);
          viewButtons = await page.getByRole('button', { name: 'view' }).all();
          await viewButtons[0].click();
          const highestLikes = await extractLikes(page);
          await page.getByRole('button', { name: 'hide' }).click();
          await viewButtons[1].click();
          const mediumLikes = await extractLikes(page);
          await page.getByRole('button', { name: 'hide' }).click();
          await viewButtons[2].click();
          const lowestLikes = await extractLikes(page);
          await page.getByRole('button', { name: 'hide' }).click();
          expect(highestLikes >= mediumLikes).toBeTruthy();
          expect(mediumLikes >= lowestLikes).toBeTruthy();
        });
      });
    });
  });
});
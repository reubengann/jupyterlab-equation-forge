import { expect, test } from '@jupyterlab/galata';

test('opens a singleton Equation Forge from the launcher', async ({ page }) => {
  await page.getByText('Open Equation Forge', { exact: true }).click();

  await expect(
    page.locator('.lm-TabBar-tabLabel', {
      hasText: 'Equation Forge'
    })
  ).toHaveCount(1);
  await expect(page.getByText('Build and rewrite equations.')).toBeVisible();
});

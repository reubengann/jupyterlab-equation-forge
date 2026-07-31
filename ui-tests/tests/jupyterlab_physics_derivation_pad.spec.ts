import { expect, test } from '@jupyterlab/galata';

test('opens a singleton derivation pad from the launcher', async ({ page }) => {
  await page.getByText('Open Physics Derivation Pad', { exact: true }).click();

  await expect(
    page.locator('.lm-TabBar-tabLabel', {
      hasText: 'Physics Derivation Pad'
    })
  ).toHaveCount(1);
  await expect(page.getByText('Build and rewrite equations.')).toBeVisible();
});

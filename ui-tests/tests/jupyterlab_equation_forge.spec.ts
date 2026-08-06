import { expect, test } from '@jupyterlab/galata';

test('opens a singleton Equation Forge from the launcher', async ({ page }) => {
  await page.getByText('Open Equation Forge', { exact: true }).click();

  await expect(
    page.locator('.lm-TabBar-tabLabel', {
      hasText: 'Equation Forge'
    })
  ).toHaveCount(1);
  await expect(
    page.getByRole('heading', { name: 'Equation Forge' })
  ).toHaveCount(0);

  const equations = page.locator('[data-testid="pad-equation"]');
  const initialCount = await equations.count();
  await page.getByRole('button', { name: 'Add item' }).click();
  await expect(equations).toHaveCount(initialCount + 1);

  await expect(page.getByLabel('Copy surround')).toHaveValue('display-math');
  const numberToggle = page.getByRole('button', {
    name: 'Show equation numbers'
  });
  await numberToggle.click();
  await expect(page.getByText('(1)', { exact: true })).toHaveCount(0);
  await numberToggle.click();
  await expect(page.getByText('(1)', { exact: true })).toBeVisible();
});

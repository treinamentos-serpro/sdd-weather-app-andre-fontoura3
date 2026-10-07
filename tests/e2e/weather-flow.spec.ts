import { expect, type Page, test } from '@playwright/test';
import {
  forecastFull,
  geocodingMultipleResults,
  geocodingNoResults,
  geocodingSingleResult,
} from '../fixtures/openMeteo';

async function mockOpenMeteo(page: Page, geocodingBody: object) {
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', json: geocodingBody }),
  );
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', json: forecastFull }),
  );
}

async function searchFor(page: Page, city: string) {
  await page.getByRole('searchbox', { name: 'Cidade' }).fill(city);
  await page.getByRole('button', { name: 'Buscar' }).click();
}

test.describe('fluxo de clima', () => {
  test('vários resultados: busca, seleção, clima atual, °F e previsão de 5 dias', async ({
    page,
  }) => {
    await mockOpenMeteo(page, geocodingMultipleResults);
    await page.goto('/');

    await searchFor(page, 'Santa');

    const suggestions = page.getByRole('navigation', { name: 'Sugestões de cidades' });
    await expect(suggestions.getByRole('button')).toHaveCount(3);
    await expect(
      suggestions.getByRole('button', { name: 'São Paulo, São Paulo, Brasil' }),
    ).toBeVisible();
    await expect(
      suggestions.getByRole('button', { name: 'Santa Maria, Rio Grande do Sul, Brasil' }),
    ).toBeVisible();

    await suggestions.getByRole('button', { name: 'São Paulo, São Paulo, Brasil' }).click();

    const current = page.getByRole('region', { name: 'São Paulo' });
    await expect(current).toBeVisible();
    await expect(current).toContainText('Temperatura atual: 25°C');
    await expect(current.getByRole('img', { name: 'Parcialmente nublado' })).toBeVisible();
    await expect(current.getByText('62%')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Sugestões de cidades' })).toHaveCount(0);

    await page.getByRole('button', { name: '°F' }).click();
    await expect(page.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
    await expect(current).toContainText('Temperatura atual: 76°F');

    const forecast = page.getByRole('region', { name: 'Previsão' });
    await expect(forecast.getByRole('article')).toHaveCount(5);
    await expect(forecast.getByRole('article', { name: 'Hoje' })).toContainText('81°F');
    await expect(forecast.getByRole('article', { name: 'Amanhã' })).toBeVisible();

    await page.getByRole('button', { name: '°C' }).click();
    await expect(current).toContainText('Temperatura atual: 25°C');
    await expect(forecast.getByRole('article', { name: 'Hoje' })).toContainText('27°C');
  });

  test('1 resultado: vai direto ao clima, sem lista de sugestões', async ({ page }) => {
    await mockOpenMeteo(page, geocodingSingleResult);
    await page.goto('/');

    await searchFor(page, 'Londres');

    await expect(page.getByRole('region', { name: 'Londres' })).toContainText('Temperatura atual:');
    await expect(page.getByRole('region', { name: 'Previsão' }).getByRole('article')).toHaveCount(
      5,
    );
    await expect(page.getByRole('navigation', { name: 'Sugestões de cidades' })).toHaveCount(0);
  });

  test('cidade inexistente: exibe estado vazio', async ({ page }) => {
    await mockOpenMeteo(page, geocodingNoResults);
    await page.goto('/');

    await searchFor(page, 'Xyzxyz');

    await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Sugestões de cidades' })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Previsão' })).toHaveCount(0);
  });

  test('teclado: Enter busca, Tab percorre a lista e Enter escolhe', async ({ page }) => {
    await mockOpenMeteo(page, geocodingMultipleResults);
    await page.goto('/');

    const input = page.getByRole('searchbox', { name: 'Cidade' });
    await input.fill('Santa');
    await input.press('Enter');

    const suggestions = page.getByRole('navigation', { name: 'Sugestões de cidades' });
    await expect(suggestions).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(
      suggestions.getByRole('button', { name: 'São Paulo, São Paulo, Brasil' }),
    ).toBeFocused();

    await page.keyboard.press('Tab');
    const second = suggestions.getByRole('button', {
      name: 'Santa Maria, Rio Grande do Sul, Brasil',
    });
    await expect(second).toBeFocused();

    await page.keyboard.press('Enter');

    await expect(page.getByRole('region', { name: 'Santa Maria' })).toContainText(
      'Temperatura atual:',
    );
    await expect(page.getByRole('region', { name: 'Previsão' }).getByRole('article')).toHaveCount(
      5,
    );
  });

  test.describe('viewport mobile', () => {
    test.use({ viewport: { width: 360, height: 740 } });

    test('sem scroll horizontal em nenhuma etapa do fluxo', async ({ page }) => {
      const hasHorizontalScroll = () =>
        page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        );

      await mockOpenMeteo(page, geocodingMultipleResults);
      await page.goto('/');
      expect(await hasHorizontalScroll()).toBe(false);

      await searchFor(page, 'Santa');
      const suggestions = page.getByRole('navigation', { name: 'Sugestões de cidades' });
      await expect(suggestions).toBeVisible();
      expect(await hasHorizontalScroll()).toBe(false);

      await suggestions.getByRole('button', { name: 'São Paulo, São Paulo, Brasil' }).click();
      await expect(page.getByRole('region', { name: 'Previsão' }).getByRole('article')).toHaveCount(
        5,
      );
      expect(await hasHorizontalScroll()).toBe(false);

      await page.getByRole('button', { name: '°F' }).click();
      expect(await hasHorizontalScroll()).toBe(false);
    });
  });
});

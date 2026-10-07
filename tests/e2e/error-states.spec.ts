import { expect, type Page, test } from '@playwright/test';
import { errorBody400, forecastFull, geocodingSingleResult } from '../fixtures/openMeteo';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/**';
const FORECAST_URL = 'https://api.open-meteo.com/**';

async function searchFor(page: Page, city: string) {
  await page.getByRole('searchbox', { name: 'Cidade' }).fill(city);
  await page.getByRole('button', { name: 'Buscar' }).click();
}

test.describe('estados de erro', () => {
  test('falha na previsão: exibe erro e "Tentar novamente" recupera', async ({ page }) => {
    let forecastCalls = 0;
    await page.route(GEOCODING_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', json: geocodingSingleResult }),
    );
    await page.route(FORECAST_URL, (route) => {
      forecastCalls += 1;
      if (forecastCalls === 1) {
        return route.fulfill({ status: 400, contentType: 'application/json', json: errorBody400 });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', json: forecastFull });
    });
    await page.goto('/');

    await searchFor(page, 'Londres');

    const alert = page.getByRole('alert');
    await expect(alert).toContainText('Algo deu errado');
    await expect(alert).toContainText('O serviço de clima está indisponível no momento');

    await alert.getByRole('button', { name: 'Tentar novamente' }).click();

    await expect(page.getByRole('region', { name: 'Londres' })).toContainText('Temperatura atual:');
    await expect(page.getByRole('region', { name: 'Previsão' }).getByRole('article')).toHaveCount(
      5,
    );
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(forecastCalls).toBe(2);
  });

  test('falha na busca: exibe erro e "Tentar novamente" repete a busca', async ({ page }) => {
    let geocodingCalls = 0;
    await page.route(GEOCODING_URL, (route) => {
      geocodingCalls += 1;
      if (geocodingCalls === 1) {
        return route.fulfill({ status: 503, contentType: 'application/json', json: errorBody400 });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: geocodingSingleResult,
      });
    });
    await page.route(FORECAST_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', json: forecastFull }),
    );
    await page.goto('/');

    await searchFor(page, 'Londres');

    await expect(page.getByRole('alert')).toContainText('Algo deu errado');

    await page.getByRole('button', { name: 'Tentar novamente' }).click();

    await expect(page.getByRole('region', { name: 'Londres' })).toContainText('Temperatura atual:');
    expect(geocodingCalls).toBe(2);
  });

  test('falha de rede: exibe mensagem de conexão', async ({ page }) => {
    await page.route(GEOCODING_URL, (route) => route.abort('failed'));
    await page.goto('/');

    await searchFor(page, 'Londres');

    await expect(page.getByRole('alert')).toContainText('Sem conexão com a internet');
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
  });
});

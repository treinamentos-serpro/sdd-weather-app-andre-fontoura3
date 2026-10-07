import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { getErrorMessage } from '../../src/lib/errorMessages';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type {
  City,
  CurrentWeather,
  ForecastDay,
  WeatherErrorCategory,
  WeatherForecast,
} from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/services/weatherService')>()),
  searchCities: vi.fn(),
  getWeather: vi.fn(),
}));

const DASH = '\u2014';

const london: City = {
  id: 2643743,
  name: 'Londres',
  country: 'Reino Unido',
  admin1: 'Inglaterra',
  latitude: 51.50853,
  longitude: -0.12574,
};
const saoPaulo: City = {
  id: 3448439,
  name: 'S\u00e3o Paulo',
  country: 'Brasil',
  admin1: 'S\u00e3o Paulo',
  latitude: -23.5475,
  longitude: -46.63611,
};
const santaMaria: City = {
  id: 3902189,
  name: 'Santa Maria',
  country: 'Brasil',
  admin1: 'Rio Grande do Sul',
  latitude: -29.68417,
  longitude: -53.80694,
};

const fullCurrent: CurrentWeather = {
  temperature: 24.5,
  weatherCode: 2,
  humidity: 62,
  windSpeed: 12.4,
  pressure: 925.3,
  precipitation: 0,
  time: '2026-10-07T14:00',
};

function day(date: string, overrides: Partial<ForecastDay> = {}): ForecastDay {
  return {
    date,
    min: 16,
    max: 27,
    weatherCode: 3,
    precipitationProbability: 20,
    ...overrides,
  };
}

const fullForecast: WeatherForecast = {
  current: fullCurrent,
  forecast: [
    day('2026-10-07'),
    day('2026-10-08'),
    day('2026-10-09'),
    day('2026-10-10'),
    day('2026-10-11'),
  ],
};

function failure(category: WeatherErrorCategory) {
  return new WeatherServiceError(category);
}

async function searchFor(term: string) {
  const user = userEvent.setup();
  await user.type(screen.getByRole('searchbox'), `${term}{Enter}`);
  return user;
}

afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
});

describe('resili\u00eancia no App (hook real, service mockado)', () => {
  describe.each<WeatherErrorCategory>(['timeout', 'network'])('falha de %s', (category) => {
    it('na busca exibe a mensagem da categoria e o bot\u00e3o de retry', async () => {
      vi.mocked(searchCities).mockRejectedValue(failure(category));
      render(<App />);

      await searchFor('Londres');

      const alert = await screen.findByRole('alert');
      expect(within(alert).getByText(getErrorMessage(category))).toBeInTheDocument();
      expect(within(alert).getByRole('button', { name: 'Tentar novamente' })).toBeEnabled();
    });

    it('no forecast exibe a mensagem da categoria e o bot\u00e3o de retry', async () => {
      vi.mocked(searchCities).mockResolvedValue([london]);
      vi.mocked(getWeather).mockRejectedValue(failure(category));
      render(<App />);

      await searchFor('Londres');

      const alert = await screen.findByRole('alert');
      expect(within(alert).getByText(getErrorMessage(category))).toBeInTheDocument();
      expect(within(alert).getByRole('button', { name: 'Tentar novamente' })).toBeEnabled();
    });
  });

  it('retry ap\u00f3s falha na busca refaz a busca com o mesmo termo e chega ao sucesso', async () => {
    vi.mocked(searchCities)
      .mockRejectedValueOnce(failure('timeout'))
      .mockResolvedValueOnce([london]);
    vi.mocked(getWeather).mockResolvedValue(fullForecast);
    render(<App />);

    const user = await searchFor('Londres');
    await user.click(await screen.findByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('region', { name: 'Londres' })).toBeInTheDocument();
    expect(searchCities).toHaveBeenCalledTimes(2);
    expect(vi.mocked(searchCities).mock.calls.map(([name]) => name)).toEqual([
      'Londres',
      'Londres',
    ]);
  });

  it('resposta parcial exibe \u201c\u2014\u201d sem quebrar o layout', async () => {
    const partial: WeatherForecast = {
      current: {
        ...fullCurrent,
        humidity: Number.NaN,
        windSpeed: Number.NaN,
        pressure: Number.NaN,
      },
      forecast: [
        day('2026-10-07'),
        day('2026-10-08', {
          min: Number.NaN,
          max: Number.NaN,
          weatherCode: Number.NaN,
          precipitationProbability: Number.NaN,
        }),
        day('2026-10-09'),
        day('2026-10-10', {
          min: Number.NaN,
          max: Number.NaN,
          weatherCode: Number.NaN,
          precipitationProbability: Number.NaN,
        }),
        day('2026-10-11'),
      ],
    };
    vi.mocked(searchCities).mockResolvedValue([london]);
    vi.mocked(getWeather).mockResolvedValue(partial);
    render(<App />);

    await searchFor('Londres');

    const current = await screen.findByRole('region', { name: 'Londres' });
    for (const label of ['Umidade', 'Vento', 'Press\u00e3o']) {
      expect(within(current).getByText(label).parentElement).toHaveTextContent(DASH);
    }
    expect(within(current).getByText('Precipita\u00e7\u00e3o').parentElement).toHaveTextContent(
      '0 mm',
    );
    expect(within(current).getByText('25\u00b0C')).toBeInTheDocument();

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(5);
    for (const index of [1, 3]) {
      expect(within(cards[index]).getAllByText(DASH).length).toBeGreaterThanOrEqual(3);
    }
    expect(within(cards[0]).queryByText(DASH)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('forecast com menos de 5 dias renderiza apenas os dias recebidos', async () => {
    vi.mocked(searchCities).mockResolvedValue([london]);
    vi.mocked(getWeather).mockResolvedValue({
      current: fullCurrent,
      forecast: [day('2026-10-07'), day('2026-10-08')],
    });
    render(<App />);

    await searchFor('Londres');

    expect(await screen.findByRole('region', { name: 'Londres' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Hoje' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Amanh\u00e3' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('forecast vazio exibe mensagem de indisponibilidade sem quebrar o clima atual', async () => {
    vi.mocked(searchCities).mockResolvedValue([london]);
    vi.mocked(getWeather).mockResolvedValue({ current: fullCurrent, forecast: [] });
    render(<App />);

    await searchFor('Londres');

    expect(await screen.findByRole('region', { name: 'Londres' })).toBeInTheDocument();
    expect(screen.getByText('Previs\u00e3o indispon\u00edvel.')).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('falha no forecast ap\u00f3s sele\u00e7\u00e3o: retry repete s\u00f3 o forecast da cidade escolhida', async () => {
    vi.mocked(searchCities).mockResolvedValue([saoPaulo, santaMaria]);
    vi.mocked(getWeather)
      .mockRejectedValueOnce(failure('network'))
      .mockResolvedValueOnce(fullForecast);
    render(<App />);

    const user = await searchFor('Santa');
    await user.click(await screen.findByRole('button', { name: /Rio Grande do Sul/ }));

    expect(await screen.findByText(getErrorMessage('network'))).toBeInTheDocument();
    expect(getWeather).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('region', { name: 'Santa Maria' })).toBeInTheDocument();
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenCalledTimes(2);
    expect(vi.mocked(getWeather).mock.calls.map(([lat, lon]) => [lat, lon])).toEqual([
      [santaMaria.latitude, santaMaria.longitude],
      [santaMaria.latitude, santaMaria.longitude],
    ]);
  });

  it('falha no forecast de cidade \u00fanica: retry n\u00e3o refaz o geocoding', async () => {
    vi.mocked(searchCities).mockResolvedValue([london]);
    vi.mocked(getWeather)
      .mockRejectedValueOnce(failure('timeout'))
      .mockResolvedValueOnce(fullForecast);
    render(<App />);

    const user = await searchFor('Londres');
    await user.click(await screen.findByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('region', { name: 'Londres' })).toBeInTheDocument();
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenCalledTimes(2);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import {
  errorBody400,
  forecastFull,
  forecastPartial,
  geocodingMultipleResults,
  geocodingNoResults,
  geocodingSingleResult,
} from '../fixtures/openMeteo';

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// fetch que só rejeita quando o signal recebido é abortado.
function pendingUntilAborted(): void {
  fetchMock.mockImplementation(
    (_url: string, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        const signal = init?.signal;
        const fail = () => reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'));
        if (signal?.aborted) {
          fail();
        }
        signal?.addEventListener('abort', fail);
      }),
  );
}

function requestedUrl(callIndex = 0): URL {
  return new URL(fetchMock.mock.calls[callIndex][0] as string);
}

async function catchError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Esperava rejeição, mas a promise resolveu');
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('searchCities', () => {
  it('retorna cidades mapeadas em caso de sucesso', async () => {
    fetchMock.mockResolvedValue(jsonResponse(geocodingMultipleResults));

    const cities = await searchCities('Santa Maria');

    expect(cities).toHaveLength(3);
    expect(cities[0]).toEqual({
      id: 3448439,
      name: 'São Paulo',
      country: 'Brasil',
      admin1: 'São Paulo',
      latitude: -23.5475,
      longitude: -46.63611,
    });
    expect(cities[2]).toMatchObject({ name: 'Santa Maria', admin1: 'Bahia' });
  });

  it('retorna uma única cidade', async () => {
    fetchMock.mockResolvedValue(jsonResponse(geocodingSingleResult));

    const cities = await searchCities('Londres');

    expect(cities).toHaveLength(1);
    expect(cities[0]).toMatchObject({ name: 'Londres', country: 'Reino Unido' });
  });

  it('omite admin1 quando ausente', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ results: [{ id: 1, name: 'X', country: 'Y', latitude: 1, longitude: 2 }] }),
    );

    const [city] = await searchCities('Xx');

    expect(city).not.toHaveProperty('admin1');
  });

  it('retorna lista vazia quando results é []', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ results: [] }));

    await expect(searchCities('Zzzzz')).resolves.toEqual([]);
  });

  it('retorna lista vazia quando results está ausente', async () => {
    fetchMock.mockResolvedValue(jsonResponse(geocodingNoResults));

    await expect(searchCities('Zzzzz')).resolves.toEqual([]);
  });

  it.each(['', ' ', 'a', ' a '])('não faz request para entrada curta %j', async (input) => {
    await expect(searchCities(input)).resolves.toEqual([]);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('envia URL e parâmetros esperados', async () => {
    fetchMock.mockResolvedValue(jsonResponse(geocodingNoResults));

    await searchCities('  Santa   Maria ');

    const url = requestedUrl();
    expect(url.origin + url.pathname).toBe('https://geocoding-api.open-meteo.com/v1/search');
    expect(url.searchParams.get('name')).toBe('Santa Maria');
    expect(url.searchParams.get('count')).toBe('5');
    expect(url.searchParams.get('language')).toBe('pt');
    expect(url.searchParams.get('format')).toBe('json');
  });

  it('preserva acentos no parâmetro name', async () => {
    fetchMock.mockResolvedValue(jsonResponse(geocodingSingleResult));

    await searchCities('São Paulo');

    expect(requestedUrl().searchParams.get('name')).toBe('São Paulo');
    expect(fetchMock.mock.calls[0][0]).toContain('S%C3%A3o+Paulo');
  });

  it.each([400, 429, 500])('HTTP %i vira WeatherServiceError category http', async (status) => {
    fetchMock.mockResolvedValue(jsonResponse(errorBody400, status));

    const error = await catchError(searchCities('Santa Maria'));

    expect(error).toBeInstanceOf(WeatherServiceError);
    expect(error).toMatchObject({ category: 'http' });
  });

  it('JSON inválido vira invalid-response', async () => {
    fetchMock.mockResolvedValue(new Response('<html>não é json</html>', { status: 200 }));

    const error = await catchError(searchCities('Santa Maria'));

    expect(error).toMatchObject({ name: 'WeatherServiceError', category: 'invalid-response' });
  });

  it.each([
    ['corpo não é objeto', [1, 2]],
    ['corpo null', null],
    ['results não é array', { results: 'x' }],
  ])('%s vira invalid-response', async (_label, body) => {
    fetchMock.mockResolvedValue(jsonResponse(body));

    const error = await catchError(searchCities('Santa Maria'));

    expect(error).toMatchObject({ category: 'invalid-response' });
  });

  it('falha de rede vira category network', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await catchError(searchCities('Santa Maria'));

    expect(error).toBeInstanceOf(WeatherServiceError);
    expect(error).toMatchObject({ category: 'network', message: 'Failed to fetch' });
  });

  it('timeout de 10s vira category timeout', async () => {
    vi.useFakeTimers();
    pendingUntilAborted();

    const pending = catchError(searchCities('Santa Maria'));
    await vi.advanceTimersByTimeAsync(10_000);

    const error = await pending;
    expect(error).toBeInstanceOf(WeatherServiceError);
    expect(error).toMatchObject({ category: 'timeout' });
  });

  it('não dispara timeout antes de 10s', async () => {
    vi.useFakeTimers();
    pendingUntilAborted();

    let settled = false;
    const pending = catchError(searchCities('Santa Maria')).finally(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(9_999);

    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(settled).toBe(true);
  });

  it('abort externo não vira timeout nem WeatherServiceError', async () => {
    pendingUntilAborted();
    const controller = new AbortController();

    const pending = catchError(searchCities('Santa Maria', controller.signal));
    controller.abort();

    const error = await pending;
    expect(error).not.toBeInstanceOf(WeatherServiceError);
    expect(error).toMatchObject({ name: 'AbortError' });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('signal já abortado propaga o abort sem virar erro de serviço', async () => {
    pendingUntilAborted();
    const controller = new AbortController();
    controller.abort();

    const error = await catchError(searchCities('Santa Maria', controller.signal));

    expect(error).not.toBeInstanceOf(WeatherServiceError);
    expect(error).toMatchObject({ name: 'AbortError' });
  });

  it('repassa um AbortSignal ao fetch', async () => {
    fetchMock.mockResolvedValue(jsonResponse(geocodingNoResults));

    await searchCities('Santa Maria');

    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it('registra log estruturado ao falhar', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500));

    await catchError(searchCities('Santa Maria'));

    const logged = JSON.parse((console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(logged).toMatchObject({
      event: 'weatherService.request.failed',
      category: 'http',
      message: 'HTTP 500',
    });
  });
});

describe('getWeather', () => {
  it('mapeia current e forecast em caso de sucesso', async () => {
    fetchMock.mockResolvedValue(jsonResponse(forecastFull));

    const weather = await getWeather(-23.5475, -46.63611);

    expect(weather.current).toEqual({
      temperature: 24.5,
      weatherCode: 2,
      humidity: 62,
      windSpeed: 12.4,
      pressure: 925.3,
      precipitation: 0,
      time: '2026-10-07T14:00',
    });
    expect(weather.forecast[1]).toEqual({
      date: '2026-10-08',
      min: 15.9,
      max: 23.4,
      weatherCode: 61,
      precipitationProbability: 70,
    });
  });

  it('retorna exatamente 5 dias', async () => {
    fetchMock.mockResolvedValue(jsonResponse(forecastFull));

    const weather = await getWeather(-23.5, -46.6);

    expect(weather.forecast).toHaveLength(5);
    expect(weather.forecast.map((day) => day.date)).toEqual(forecastFull.daily.time);
  });

  it('limita a 5 dias mesmo que a API devolva mais', async () => {
    const time = [...forecastFull.daily.time, '2026-10-12', '2026-10-13'];
    fetchMock.mockResolvedValue(
      jsonResponse({ ...forecastFull, daily: { ...forecastFull.daily, time } }),
    );

    const weather = await getWeather(-23.5, -46.6);

    expect(weather.forecast).toHaveLength(5);
  });

  it('completa com NaN quando a API devolve menos de 5 dias', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        ...forecastFull,
        daily: {
          time: ['2026-10-07'],
          weather_code: [2],
          temperature_2m_max: [27.1],
          temperature_2m_min: [16.2],
          precipitation_probability_max: [10],
        },
      }),
    );

    const weather = await getWeather(-23.5, -46.6);

    expect(weather.forecast).toHaveLength(5);
    expect(weather.forecast[0].max).toBe(27.1);
    expect(weather.forecast[4].date).toBe('');
    expect(weather.forecast[4].max).toBeNaN();
  });

  it('resposta parcial vira NaN nos campos ausentes ou null', async () => {
    fetchMock.mockResolvedValue(jsonResponse(forecastPartial));

    const weather = await getWeather(-23.5, -46.6);

    expect(weather.current.temperature).toBe(24.5);
    expect(weather.current.humidity).toBeNaN();
    expect(weather.current.windSpeed).toBeNaN();
    expect(weather.current.pressure).toBeNaN();
    expect(weather.forecast).toHaveLength(5);
    expect(weather.forecast[0]).toMatchObject({ max: 27.1, weatherCode: 2 });
    expect(weather.forecast[1].max).toBeNaN();
    expect(weather.forecast[1].weatherCode).toBeNaN();
    expect(weather.forecast[0].min).toBeNaN();
    expect(weather.forecast[0].precipitationProbability).toBeNaN();
  });

  it('sem current e sem daily retorna NaN sem lançar', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    const weather = await getWeather(0, 0);

    expect(weather.current.temperature).toBeNaN();
    expect(weather.current.time).toBe('');
    expect(weather.forecast).toHaveLength(5);
    expect(weather.forecast.every((day) => Number.isNaN(day.max))).toBe(true);
  });

  it('envia URL e parâmetros esperados', async () => {
    fetchMock.mockResolvedValue(jsonResponse(forecastFull));

    await getWeather(-23.5475, -46.63611);

    const url = requestedUrl();
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(url.searchParams.get('latitude')).toBe('-23.5475');
    expect(url.searchParams.get('longitude')).toBe('-46.63611');
    expect(url.searchParams.get('forecast_days')).toBe('5');
    expect(url.searchParams.get('timezone')).toBe('auto');
    expect(url.searchParams.get('current')?.split(',')).toEqual([
      'temperature_2m',
      'relative_humidity_2m',
      'wind_speed_10m',
      'surface_pressure',
      'precipitation',
      'weather_code',
    ]);
    expect(url.searchParams.get('daily')?.split(',')).toEqual([
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
    ]);
  });

  it.each([400, 429, 500])('HTTP %i vira WeatherServiceError category http', async (status) => {
    fetchMock.mockResolvedValue(jsonResponse(errorBody400, status));

    const error = await catchError(getWeather(-23.5, -46.6));

    expect(error).toBeInstanceOf(WeatherServiceError);
    expect(error).toMatchObject({ category: 'http', message: `HTTP ${status}` });
  });

  it('JSON inválido vira invalid-response', async () => {
    fetchMock.mockResolvedValue(new Response('not json', { status: 200 }));

    const error = await catchError(getWeather(-23.5, -46.6));

    expect(error).toMatchObject({ category: 'invalid-response' });
  });

  it('corpo que não é objeto vira invalid-response', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    const error = await catchError(getWeather(-23.5, -46.6));

    expect(error).toMatchObject({ category: 'invalid-response' });
  });

  it('falha de rede vira category network', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await catchError(getWeather(-23.5, -46.6));

    expect(error).toMatchObject({ category: 'network' });
  });

  it('timeout de 10s vira category timeout', async () => {
    vi.useFakeTimers();
    pendingUntilAborted();

    const pending = catchError(getWeather(-23.5, -46.6));
    await vi.advanceTimersByTimeAsync(10_000);

    expect(await pending).toMatchObject({ category: 'timeout' });
  });

  it('abort externo não vira timeout', async () => {
    pendingUntilAborted();
    const controller = new AbortController();

    const pending = catchError(getWeather(-23.5, -46.6, controller.signal));
    controller.abort();

    const error = await pending;
    expect(error).not.toBeInstanceOf(WeatherServiceError);
    expect(error).toMatchObject({ name: 'AbortError' });
  });

  it('abort externo durante a leitura do JSON não vira invalid-response', async () => {
    const controller = new AbortController();
    const response = {
      ok: true,
      status: 200,
      json: () => {
        controller.abort();
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
      },
    };
    fetchMock.mockResolvedValue(response);

    const error = await catchError(getWeather(-23.5, -46.6, controller.signal));

    expect(error).not.toBeInstanceOf(WeatherServiceError);
    expect(error).toMatchObject({ name: 'AbortError' });
  });
});

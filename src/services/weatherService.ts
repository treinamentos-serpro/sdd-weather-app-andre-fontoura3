import type { City, WeatherErrorCategory, WeatherForecast } from '../types/weather';

export class WeatherServiceError extends Error {
  readonly category: WeatherErrorCategory;

  constructor(category: WeatherErrorCategory, message?: string) {
    super(message ?? category);
    this.name = 'WeatherServiceError';
    this.category = category;
  }
}

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 10_000;
const MIN_QUERY_LENGTH = 2;
const FORECAST_DAYS = 5;

type Json = Record<string, unknown>;

function isRecord(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Campo ausente/null/não numérico vira NaN (UI exibe "—").
function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : Number.NaN;
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function logFailure(url: string, error: WeatherServiceError): void {
  console.warn(
    JSON.stringify({
      event: 'weatherService.request.failed',
      url,
      category: error.category,
      message: error.message,
    }),
  );
}

// Abort externo propaga como veio; apenas o timeout interno vira WeatherServiceError('timeout').
async function fetchJson(url: string, externalSignal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  const forwardAbort = () => controller.abort(externalSignal?.reason);
  if (externalSignal?.aborted) {
    forwardAbort();
  } else {
    externalSignal?.addEventListener('abort', forwardAbort, { once: true });
  }

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new WeatherServiceError('http', `HTTP ${response.status}`);
    }
    try {
      return await response.json();
    } catch (error) {
      if (timedOut || externalSignal?.aborted) {
        throw error;
      }
      throw new WeatherServiceError('invalid-response', 'JSON inválido');
    }
  } catch (error) {
    let failure: WeatherServiceError;
    if (error instanceof WeatherServiceError) {
      failure = error;
    } else if (externalSignal?.aborted) {
      throw error;
    } else if (timedOut) {
      failure = new WeatherServiceError('timeout', `Timeout após ${REQUEST_TIMEOUT_MS}ms`);
    } else {
      failure = new WeatherServiceError(
        'network',
        error instanceof Error ? error.message : 'Falha de rede',
      );
    }
    logFailure(url, failure);
    throw failure;
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', forwardAbort);
  }
}

export async function searchCities(name: string, signal?: AbortSignal): Promise<City[]> {
  const query = name.trim().replace(/\s+/g, ' ');
  if (query.length < MIN_QUERY_LENGTH) {
    return [];
  }

  const params = new URLSearchParams({ name: query, count: '5', language: 'pt', format: 'json' });
  const body = await fetchJson(`${GEOCODING_URL}?${params}`, signal);
  if (!isRecord(body)) {
    throw new WeatherServiceError('invalid-response', 'Resposta de geocoding inválida');
  }
  if (body.results === undefined || body.results === null) {
    return [];
  }
  if (!Array.isArray(body.results)) {
    throw new WeatherServiceError('invalid-response', 'Campo results inválido');
  }

  return body.results.filter(isRecord).map((item) => {
    const city: City = {
      id: toNumber(item.id),
      name: toText(item.name),
      country: toText(item.country),
      latitude: toNumber(item.latitude),
      longitude: toNumber(item.longitude),
    };
    const admin1 = toText(item.admin1);
    if (admin1) {
      city.admin1 = admin1;
    }
    return city;
  });
}

export async function getWeather(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<WeatherForecast> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      'temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,precipitation,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    forecast_days: String(FORECAST_DAYS),
    timezone: 'auto',
  });
  const body = await fetchJson(`${FORECAST_URL}?${params}`, signal);
  if (!isRecord(body)) {
    throw new WeatherServiceError('invalid-response', 'Resposta de forecast inválida');
  }

  const current = isRecord(body.current) ? body.current : {};
  const daily = isRecord(body.daily) ? body.daily : {};
  const column = (key: string): unknown[] =>
    Array.isArray(daily[key]) ? (daily[key] as unknown[]) : [];
  const dates = column('time');
  const codes = column('weather_code');
  const maxes = column('temperature_2m_max');
  const mins = column('temperature_2m_min');
  const rain = column('precipitation_probability_max');

  return {
    current: {
      temperature: toNumber(current.temperature_2m),
      weatherCode: toNumber(current.weather_code),
      humidity: toNumber(current.relative_humidity_2m),
      windSpeed: toNumber(current.wind_speed_10m),
      pressure: toNumber(current.surface_pressure),
      precipitation: toNumber(current.precipitation),
      time: toText(current.time),
    },
    forecast: Array.from({ length: FORECAST_DAYS }, (_, i) => ({
      date: toText(dates[i]),
      min: toNumber(mins[i]),
      max: toNumber(maxes[i]),
      weatherCode: toNumber(codes[i]),
      precipitationProbability: toNumber(rain[i]),
    })),
  };
}

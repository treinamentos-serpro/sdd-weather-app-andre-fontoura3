// Respostas determinísticas no formato da API Open-Meteo (geocoding + forecast).

export const geocodingMultipleResults = {
  results: [
    {
      id: 3448439,
      name: 'São Paulo',
      latitude: -23.5475,
      longitude: -46.63611,
      elevation: 769,
      feature_code: 'PPLA',
      country_code: 'BR',
      admin1_id: 3448433,
      timezone: 'America/Sao_Paulo',
      population: 10021295,
      country_id: 3469034,
      country: 'Brasil',
      admin1: 'São Paulo',
    },
    {
      id: 3902189,
      name: 'Santa Maria',
      latitude: -29.68417,
      longitude: -53.80694,
      elevation: 113,
      feature_code: 'PPLA2',
      country_code: 'BR',
      admin1_id: 3451133,
      timezone: 'America/Sao_Paulo',
      population: 261031,
      country_id: 3469034,
      country: 'Brasil',
      admin1: 'Rio Grande do Sul',
    },
    {
      id: 3450554,
      name: 'Santa Maria',
      latitude: -9.36111,
      longitude: -40.72139,
      elevation: 392,
      feature_code: 'PPL',
      country_code: 'BR',
      admin1_id: 3471168,
      timezone: 'America/Bahia',
      population: 12000,
      country_id: 3469034,
      country: 'Brasil',
      admin1: 'Bahia',
    },
  ],
  generationtime_ms: 0.8,
};

export const geocodingSingleResult = {
  results: [
    {
      id: 2643743,
      name: 'Londres',
      latitude: 51.50853,
      longitude: -0.12574,
      elevation: 25,
      feature_code: 'PPLC',
      country_code: 'GB',
      admin1_id: 6269513,
      timezone: 'Europe/London',
      population: 8961989,
      country_id: 2635167,
      country: 'Reino Unido',
      admin1: 'Inglaterra',
    },
  ],
  generationtime_ms: 0.6,
};

export const geocodingNoResults = {
  generationtime_ms: 0.4,
};

export const forecastFull = {
  latitude: -23.5,
  longitude: -46.625,
  generationtime_ms: 0.35,
  utc_offset_seconds: -10800,
  timezone: 'America/Sao_Paulo',
  timezone_abbreviation: '-03',
  elevation: 769,
  current_units: {
    time: 'iso8601',
    interval: 'seconds',
    temperature_2m: '°C',
    relative_humidity_2m: '%',
    wind_speed_10m: 'km/h',
    surface_pressure: 'hPa',
    precipitation: 'mm',
    weather_code: 'wmo code',
  },
  current: {
    time: '2026-10-07T14:00',
    interval: 900,
    temperature_2m: 24.5,
    relative_humidity_2m: 62,
    wind_speed_10m: 12.4,
    surface_pressure: 925.3,
    precipitation: 0,
    weather_code: 2,
  },
  daily_units: {
    time: 'iso8601',
    weather_code: 'wmo code',
    temperature_2m_max: '°C',
    temperature_2m_min: '°C',
    precipitation_probability_max: '%',
  },
  daily: {
    time: ['2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'],
    weather_code: [2, 61, 3, 0, 95],
    temperature_2m_max: [27.1, 23.4, 25.0, 29.8, 26.2],
    temperature_2m_min: [16.2, 15.9, 17.1, 18.4, 17.7],
    precipitation_probability_max: [10, 70, 20, 0, 85],
  },
};

// Resposta parcial: valores null em current e arrays de daily ausentes.
export const forecastPartial = {
  latitude: -23.5,
  longitude: -46.625,
  generationtime_ms: 0.3,
  utc_offset_seconds: -10800,
  timezone: 'America/Sao_Paulo',
  timezone_abbreviation: '-03',
  elevation: 769,
  current: {
    time: '2026-10-07T14:00',
    interval: 900,
    temperature_2m: 24.5,
    relative_humidity_2m: null,
    wind_speed_10m: null,
    surface_pressure: null,
    precipitation: 0,
    weather_code: 2,
  },
  daily: {
    time: ['2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'],
    weather_code: [2, null, 3, null, 95],
    temperature_2m_max: [27.1, null, 25.0, null, 26.2],
  },
};

export const errorBody400 = {
  error: true,
  reason: 'Latitude must be in range of -90 to 90°. Given: 123.0.',
};

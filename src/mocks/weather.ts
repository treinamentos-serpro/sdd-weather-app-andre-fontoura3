import type { WeatherData } from '../types/weather';

export const mockWeatherData: WeatherData = {
  city: {
    id: 3390760,
    name: 'Recife',
    country: 'Brasil',
    admin1: 'Pernambuco',
    latitude: -8.0539,
    longitude: -34.8811,
  },
  current: {
    temperature: 28,
    weatherCode: 2,
    humidity: 72,
    windSpeed: 18,
    pressure: 1012,
    precipitation: 0,
    time: '2026-10-07T12:00',
  },
  forecast: [
    {
      date: '2026-10-07',
      min: 24,
      max: 30,
      weatherCode: 2,
      precipitationProbability: 20,
    },
    {
      date: '2026-10-08',
      min: 23,
      max: 29,
      weatherCode: 61,
      precipitationProbability: 75,
    },
    {
      date: '2026-10-09',
      min: 24,
      max: 28,
      weatherCode: 3,
      precipitationProbability: 40,
    },
    {
      date: '2026-10-10',
      min: 24,
      max: 31,
      weatherCode: 0,
      precipitationProbability: 5,
    },
    {
      date: '2026-10-11',
      min: 25,
      max: 30,
      weatherCode: 1,
      precipitationProbability: 10,
    },
  ],
};

import { describe, expect, it } from 'vitest';
import { mockWeatherData } from '../../src/mocks/weather';

describe('mockWeatherData', () => {
  it('oferece uma cidade e clima atual em Celsius para desenvolver a UI', () => {
    expect(mockWeatherData.city.name).toBe('Recife');
    expect(mockWeatherData.current.temperature).toBe(28);
    expect(mockWeatherData.current.humidity).toBeGreaterThanOrEqual(0);
    expect(mockWeatherData.current.humidity).toBeLessThanOrEqual(100);
  });

  it('oferece cinco dias consecutivos a partir da data do clima atual', () => {
    expect(mockWeatherData.forecast).toHaveLength(5);
    expect(mockWeatherData.forecast[0].date).toBe(mockWeatherData.current.time.split('T')[0]);
    expect(mockWeatherData.forecast.map((day) => day.date)).toEqual([
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
      '2026-10-11',
    ]);
  });

  it('mantem temperaturas e probabilidades coerentes na previsao', () => {
    for (const day of mockWeatherData.forecast) {
      expect(day.min).toBeLessThanOrEqual(day.max);
      expect(day.precipitationProbability).toBeGreaterThanOrEqual(0);
      expect(day.precipitationProbability).toBeLessThanOrEqual(100);
    }
  });
});

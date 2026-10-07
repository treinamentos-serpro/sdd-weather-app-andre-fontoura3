import { describe, expect, it } from 'vitest';
import { formatTemperature, toFahrenheit } from '../../src/lib/temperature';

describe('toFahrenheit', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
    [37, 98.6],
  ])('converte %d°C para %d°F', (celsius, fahrenheit) => {
    expect(toFahrenheit(celsius)).toBeCloseTo(fahrenheit, 5);
  });
});

describe('formatTemperature', () => {
  it('formata em Celsius arredondando para inteiro', () => {
    expect(formatTemperature(28.4, 'celsius')).toBe('28°C');
    expect(formatTemperature(28.5, 'celsius')).toBe('29°C');
  });

  it('converte e formata em Fahrenheit', () => {
    expect(formatTemperature(0, 'fahrenheit')).toBe('32°F');
    expect(formatTemperature(100, 'fahrenheit')).toBe('212°F');
    expect(formatTemperature(-40, 'fahrenheit')).toBe('-40°F');
  });

  it('nunca exibe -0', () => {
    expect(formatTemperature(-0, 'celsius')).toBe('0°C');
    expect(formatTemperature(-0.4, 'celsius')).toBe('0°C');
  });

  it.each([
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])('retorna travessão para valor inválido (%s)', (value) => {
    expect(formatTemperature(value, 'celsius')).toBe('—');
    expect(formatTemperature(value, 'fahrenheit')).toBe('—');
  });
});

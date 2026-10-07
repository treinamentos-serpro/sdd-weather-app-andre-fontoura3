import type { Unit } from '../types/weather';

export function toFahrenheit(value: number): number {
  return (value * 9) / 5 + 32;
}

export function formatTemperature(value: number, unit: Unit): string {
  if (!Number.isFinite(value)) {
    return '\u2014';
  }

  const temperature = unit === 'fahrenheit' ? toFahrenheit(value) : value;
  const rounded = Math.round(temperature);
  return `${Object.is(rounded, -0) ? 0 : rounded}\u00b0${unit === 'fahrenheit' ? 'F' : 'C'}`;
}

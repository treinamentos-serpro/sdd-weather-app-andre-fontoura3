import { CircleHelp, CloudLightning } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { getWeatherCondition } from '../../src/lib/weatherCodes';

const mappedCodes = [
  0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86,
  95, 96, 97, 99,
];

describe('getWeatherCondition', () => {
  it.each(mappedCodes)('mapeia o código WMO %d com rótulo e ícone', (code) => {
    const condition = getWeatherCondition(code);

    expect(condition.label).not.toBe('Condição desconhecida');
    expect(condition.label.length).toBeGreaterThan(0);
    expect(condition.icon).toBeDefined();
    expect(condition.icon).not.toBe(CircleHelp);
  });

  it('mapeia o código 97 como trovoada forte', () => {
    const condition = getWeatherCondition(97);

    expect(condition.label).toBe('Trovoada forte');
    expect(condition.icon).toBe(CloudLightning);
  });

  it.each([-1, 4, 98, 1000, Number.NaN])('usa fallback para o código %s', (code) => {
    const condition = getWeatherCondition(code);

    expect(condition.label).toBe('Condição desconhecida');
    expect(condition.icon).toBe(CircleHelp);
  });
});

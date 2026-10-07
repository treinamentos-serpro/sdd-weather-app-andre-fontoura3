import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import { formatTemperature, toFahrenheit } from '../../src/lib/temperature';
import { getWeatherCondition } from '../../src/lib/weatherCodes';
import { mockWeatherData } from '../../src/mocks/weather';

afterEach(cleanup);

describe('CurrentWeather', () => {
  it('exibe cidade, temperatura, condicao, icone acessivel e metricas', () => {
    render(<CurrentWeather {...mockWeatherData} unit="celsius" />);

    expect(screen.getByRole('region', { name: 'Recife' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recife' })).toBeInTheDocument();
    expect(screen.getByText('Pernambuco, Brasil')).toBeInTheDocument();
    expect(screen.getByText('28\u00b0C')).toBeInTheDocument();
    expect(screen.getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Parcialmente nublado' })).toBeInTheDocument();
    for (const label of ['Umidade', 'Vento', 'Precipita\u00e7\u00e3o', 'Press\u00e3o']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    for (const value of ['72%', '18 km/h', '0 mm', '1.012 hPa']) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
  });

  it('atualiza a temperatura ao trocar a unidade sem alterar metricas ou dados', () => {
    const { rerender } = render(<CurrentWeather {...mockWeatherData} unit="celsius" />);

    rerender(<CurrentWeather {...mockWeatherData} unit="fahrenheit" />);

    expect(screen.getByText('82\u00b0F')).toBeInTheDocument();
    expect(screen.queryByText('28\u00b0C')).not.toBeInTheDocument();
    expect(screen.getByText('18 km/h')).toBeInTheDocument();
    expect(mockWeatherData.current.temperature).toBe(28);
  });

  it('exibe a localizacao sem regiao e fallback para codigo desconhecido', () => {
    render(
      <CurrentWeather
        city={{ ...mockWeatherData.city, admin1: undefined }}
        current={{ ...mockWeatherData.current, weatherCode: 999 }}
        unit="celsius"
      />,
    );

    expect(screen.getByText('Brasil')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Condi\u00e7\u00e3o desconhecida' }),
    ).toBeInTheDocument();
  });

  it('exibe fallback para valores numericos indisponiveis', () => {
    render(
      <CurrentWeather
        city={mockWeatherData.city}
        current={{
          ...mockWeatherData.current,
          temperature: Number.NaN,
          humidity: Number.NaN,
          windSpeed: Number.NaN,
          precipitation: Number.NaN,
          pressure: Number.NaN,
        }}
        unit="celsius"
      />,
    );

    expect(screen.getAllByText('\u2014')).toHaveLength(5);
  });
});

describe('temperature', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
  ])('converte %s Celsius para %s Fahrenheit', (celsius, fahrenheit) => {
    expect(toFahrenheit(celsius)).toBe(fahrenheit);
  });

  it('arredonda consistentemente e trata valores invalidos', () => {
    expect(formatTemperature(28.4, 'celsius')).toBe('28\u00b0C');
    expect(formatTemperature(28.4, 'fahrenheit')).toBe('83\u00b0F');
    expect(formatTemperature(-0.1, 'celsius')).toBe('0\u00b0C');
    expect(formatTemperature(Number.NaN, 'celsius')).toBe('\u2014');
  });
});

describe('weatherCodes', () => {
  it.each([
    0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86,
    95, 96, 99,
  ])('mapeia o codigo Open-Meteo %s para condicao e icone', (code) => {
    const condition = getWeatherCondition(code);

    expect(condition.label).not.toBe('Condi\u00e7\u00e3o desconhecida');
    expect(condition.icon).toBeDefined();
  });

  it('oferece fallback para codigo desconhecido', () => {
    expect(getWeatherCondition(999).label).toBe('Condi\u00e7\u00e3o desconhecida');
  });
});

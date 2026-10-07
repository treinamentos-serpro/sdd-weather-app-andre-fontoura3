import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ForecastCard from '../../src/components/ForecastCard';
import ForecastList from '../../src/components/ForecastList';
import { formatDayLabel } from '../../src/lib/format';
import { mockWeatherData } from '../../src/mocks/weather';

afterEach(cleanup);

describe('ForecastList', () => {
  it('exibe cinco dias com rotulos, icones, temperaturas e probabilidade de chuva', () => {
    render(<ForecastList forecast={mockWeatherData.forecast} unit="celsius" />);

    expect(screen.getByRole('region', { name: 'Previs\u00e3o' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getAllByRole('img')).toHaveLength(5);
    expect(screen.getByRole('heading', { name: 'Hoje' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Amanh\u00e3' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'sex.' })).toBeInTheDocument();

    const today = within(screen.getByRole('article', { name: 'Hoje' }));
    expect(today.getByRole('img', { name: 'Parcialmente nublado' })).toBeInTheDocument();
    expect(today.getByText('M\u00e1x.')).toBeInTheDocument();
    expect(today.getByText('30\u00b0C')).toBeInTheDocument();
    expect(today.getByText('M\u00edn.')).toBeInTheDocument();
    expect(today.getByText('24\u00b0C')).toBeInTheDocument();
    expect(today.getByText('Probabilidade de chuva')).toBeInTheDocument();
    expect(today.getByText('20%')).toBeInTheDocument();
  });

  it('converte maximas e minimas de todos os cards ao trocar a unidade', () => {
    const { rerender } = render(
      <ForecastList forecast={mockWeatherData.forecast} unit="celsius" />,
    );

    rerender(<ForecastList forecast={mockWeatherData.forecast} unit="fahrenheit" />);

    const cards = screen.getAllByRole('article');
    const temperatures = [
      ['86\u00b0F', '75\u00b0F'],
      ['84\u00b0F', '73\u00b0F'],
      ['82\u00b0F', '75\u00b0F'],
      ['88\u00b0F', '75\u00b0F'],
      ['86\u00b0F', '77\u00b0F'],
    ];
    cards.forEach((card, index) => {
      const queries = within(card);
      for (const temperature of temperatures[index]) {
        expect(queries.getByText(temperature)).toBeInTheDocument();
      }
      expect(
        queries.getByText(`${mockWeatherData.forecast[index].precipitationProbability}%`),
      ).toBeInTheDocument();
    });
    expect(mockWeatherData.forecast[0].max).toBe(30);
  });

  it('trata previsao vazia sem renderizar cards', () => {
    render(<ForecastList forecast={[]} unit="celsius" />);

    expect(screen.getByText('Previs\u00e3o indispon\u00edvel.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});

describe('ForecastCard', () => {
  it('trata codigo desconhecido e campos numericos indisponiveis', () => {
    render(
      <ForecastCard
        day={{
          ...mockWeatherData.forecast[0],
          weatherCode: 999,
          min: Number.NaN,
          max: Number.NaN,
          precipitationProbability: Number.NaN,
        }}
        index={0}
        unit="celsius"
      />,
    );

    expect(
      screen.getByRole('img', { name: 'Condi\u00e7\u00e3o desconhecida' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('\u2014')).toHaveLength(3);
  });

  it('preserva probabilidade zero e temperaturas negativas', () => {
    render(
      <ForecastCard
        day={{ ...mockWeatherData.forecast[0], min: -5, max: 0, precipitationProbability: 0 }}
        index={0}
        unit="celsius"
      />,
    );

    expect(screen.getByText('-5\u00b0C')).toBeInTheDocument();
    expect(screen.getByText('0\u00b0C')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});

describe('formatDayLabel', () => {
  it('rotula os dois primeiros dias sem depender da data do sistema', () => {
    expect(formatDayLabel('2026-10-07', 0)).toBe('Hoje');
    expect(formatDayLabel('2026-10-08', 1)).toBe('Amanh\u00e3');
  });

  it('formata os demais dias em pt-BR sem deslocamento de fuso', () => {
    expect(formatDayLabel('2026-10-09', 2)).toBe('sex.');
    expect(formatDayLabel('2026-10-10', 3)).toBe('s\u00e1b.');
    expect(formatDayLabel('2026-10-11', 4)).toBe('dom.');
  });

  it('trata datas invalidas', () => {
    expect(formatDayLabel('invalid', 2)).toBe('\u2014');
  });
});

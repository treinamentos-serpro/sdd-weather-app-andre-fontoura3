import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { mockWeatherData } from '../../src/mocks/weather';
import { searchMockWeather } from '../../src/services/mockWeatherService';
import type { WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/mockWeatherService');

afterEach(cleanup);
beforeEach(() => vi.resetAllMocks());

describe('App', () => {
  it('exibe marca, busca, seletor e estado inicial', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'WeatherView' })).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Unidade de temperatura' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Clima da sua cidade' })).toBeInTheDocument();
    expect(searchMockWeather).not.toHaveBeenCalled();
  });

  it('exibe o mock e converte temperaturas sem repetir a busca', async () => {
    const user = userEvent.setup();
    vi.mocked(searchMockWeather).mockResolvedValue(mockWeatherData);
    render(<App />);

    await user.type(screen.getByRole('searchbox'), 'Recife{Enter}');
    expect(await screen.findByRole('heading', { name: 'Recife' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(
      within(screen.getByRole('region', { name: 'Recife' })).getByText('28\u00b0C'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '\u00b0F' }));

    expect(screen.getAllByText('82\u00b0F')).toHaveLength(2);
    expect(screen.getAllByText('86\u00b0F')).toHaveLength(2);
    expect(searchMockWeather).toHaveBeenCalledExactlyOnceWith('Recife');
    expect(mockWeatherData.current.temperature).toBe(28);
  });

  it('exibe loading, bloqueia busca e preserva unidade escolhida durante carregamento', async () => {
    const user = userEvent.setup();
    let finishSearch: ((data: WeatherData | null) => void) | undefined;
    vi.mocked(searchMockWeather).mockReturnValue(
      new Promise((resolve) => {
        finishSearch = resolve;
      }),
    );
    render(<App />);

    await user.type(screen.getByRole('searchbox'), 'Recife{Enter}');

    expect(screen.getByRole('status')).toHaveTextContent('Carregando');
    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '\u00b0F' }));
    await act(async () => {
      finishSearch?.(mockWeatherData);
    });

    expect(await screen.findByRole('heading', { name: 'Recife' })).toBeInTheDocument();
    expect(screen.getAllByText('82\u00b0F')).toHaveLength(2);
    expect(screen.getByRole('searchbox')).toBeEnabled();
  });

  it('exibe estado vazio quando a cidade nao e encontrada', async () => {
    const user = userEvent.setup();
    vi.mocked(searchMockWeather).mockResolvedValue(null);
    render(<App />);

    await user.type(screen.getByRole('searchbox'), 'Outra cidade{Enter}');

    expect(
      await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('exibe erro e permite repetir a ultima busca preservando unidade', async () => {
    const user = userEvent.setup();
    vi.mocked(searchMockWeather)
      .mockRejectedValueOnce(new Error('Falha simulada'))
      .mockResolvedValueOnce(mockWeatherData);
    render(<App />);

    await user.click(screen.getByRole('button', { name: '\u00b0F' }));
    await user.type(screen.getByRole('searchbox'), 'Recife{Enter}');
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('heading', { name: 'Recife' })).toBeInTheDocument();
    expect(screen.getAllByText('82\u00b0F')).toHaveLength(2);
    expect(searchMockWeather).toHaveBeenCalledTimes(2);
    expect(searchMockWeather).toHaveBeenLastCalledWith('Recife');
  });
});

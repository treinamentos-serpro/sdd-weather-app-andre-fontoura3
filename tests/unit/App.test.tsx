import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { type UseWeatherResult, useWeather } from '../../src/hooks/useWeather';
import { mockWeatherData } from '../../src/mocks/weather';
import type { City } from '../../src/types/weather';

vi.mock('../../src/hooks/useWeather');

const recife = mockWeatherData.city;
const cities: City[] = [
  recife,
  { id: 2, name: 'Recife', country: 'Portugal', latitude: 40.1, longitude: -8.2 },
];

const search = vi.fn();
const selectCity = vi.fn();
const retry = vi.fn();

function mockHook(overrides: Partial<UseWeatherResult> = {}) {
  vi.mocked(useWeather).mockReturnValue({
    status: 'idle',
    cities: [],
    data: null,
    error: null,
    search,
    selectCity,
    retry,
    ...overrides,
  });
}

afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
  mockHook();
});

describe('App', () => {
  it('exibe marca, busca, seletor e estado inicial', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'WeatherView' })).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Unidade de temperatura' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Clima da sua cidade' })).toBeInTheDocument();
    expect(search).not.toHaveBeenCalled();
  });

  it('encaminha a busca ao hook com o termo normalizado', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByRole('searchbox'), '  Recife {Enter}');

    expect(search).toHaveBeenCalledExactlyOnceWith('Recife');
  });

  it('exibe loading, bloqueia a busca e preserva a unidade escolhida', async () => {
    const user = userEvent.setup();
    mockHook({ status: 'loading' });
    const { rerender } = render(<App />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando');
    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '\u00b0F' }));

    mockHook({ status: 'success', data: mockWeatherData });
    rerender(<App />);

    expect(screen.getByRole('searchbox')).toBeEnabled();
    expect(screen.getAllByText('82\u00b0F')).toHaveLength(2);
    expect(search).not.toHaveBeenCalled();
  });

  it('exibe estado vazio e anuncia na live region', () => {
    mockHook({ status: 'empty' });
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.getByText('Nenhuma cidade encontrada.')).toHaveAttribute('aria-live', 'polite');
  });

  it('exibe erro e aciona retry', async () => {
    const user = userEvent.setup();
    mockHook({ status: 'error', error: 'network' });
    render(<App />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(retry).toHaveBeenCalledOnce();
  });

  it('preserva a unidade ao sair do erro para o sucesso', async () => {
    const user = userEvent.setup();
    mockHook({ status: 'error', error: 'timeout' });
    const { rerender } = render(<App />);

    await user.click(screen.getByRole('button', { name: '\u00b0F' }));
    mockHook({ status: 'success', data: mockWeatherData });
    rerender(<App />);

    expect(screen.getAllByText('82\u00b0F')).toHaveLength(2);
  });

  it('exibe sugestões, anuncia, foca a lista e chama selectCity', async () => {
    const user = userEvent.setup();
    mockHook({ status: 'selecting', cities });
    render(<App />);

    const suggestions = screen.getByRole('navigation', { name: 'Sugestões de cidades' });
    expect(suggestions.parentElement).toHaveFocus();
    expect(screen.getByText('2 cidades encontradas. Selecione uma.')).toHaveAttribute(
      'aria-live',
      'polite',
    );

    await user.click(within(suggestions).getByRole('button', { name: /Portugal/ }));

    expect(selectCity).toHaveBeenCalledExactlyOnceWith(cities[1]);
  });

  it('exibe o clima, converte C/F sem acionar o hook, anuncia e foca o main', async () => {
    const user = userEvent.setup();
    mockHook({ status: 'success', data: mockWeatherData });
    render(<App />);

    expect(screen.getByRole('main')).toHaveFocus();
    expect(screen.getByText('Clima de Recife carregado.')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(
      within(screen.getByRole('region', { name: 'Recife' })).getByText('28\u00b0C'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '\u00b0F' }));

    expect(screen.getAllByText('82\u00b0F')).toHaveLength(2);
    expect(screen.getAllByText('86\u00b0F')).toHaveLength(2);
    expect(search).not.toHaveBeenCalled();
    expect(selectCity).not.toHaveBeenCalled();
    expect(retry).not.toHaveBeenCalled();
    expect(mockWeatherData.current.temperature).toBe(28);
  });
});

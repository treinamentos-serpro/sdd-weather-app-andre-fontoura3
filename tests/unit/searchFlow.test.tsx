import { act, cleanup, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { useWeather } from '../../src/hooks/useWeather';
import { mockWeatherData } from '../../src/mocks/weather';
import { getWeather, searchCities } from '../../src/services/weatherService';
import type { City, WeatherForecast } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importActual) => ({
  ...(await importActual<typeof import('../../src/services/weatherService')>()),
  searchCities: vi.fn(),
  getWeather: vi.fn(),
}));

const recife = mockWeatherData.city;
const olinda: City = {
  id: 3393536,
  name: 'Olinda',
  country: 'Brasil',
  admin1: 'Pernambuco',
  latitude: -8.0089,
  longitude: -34.8553,
};
const lisboa: City = {
  id: 2267057,
  name: 'Recife',
  country: 'Portugal',
  latitude: 38.7,
  longitude: -9.1,
};

// 28 °C → 82 °F
const warmForecast: WeatherForecast = {
  current: mockWeatherData.current,
  forecast: mockWeatherData.forecast,
};
// 10 °C → 50 °F
const coldForecast: WeatherForecast = {
  current: { ...mockWeatherData.current, temperature: 10 },
  forecast: mockWeatherData.forecast,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

async function searchFor(user: ReturnType<typeof userEvent.setup>, term: string) {
  const input = screen.getByRole('searchbox');
  await user.clear(input);
  await user.type(input, `${term}{Enter}`);
}

function currentTemperature(cityName: string) {
  return within(screen.getByRole('region', { name: cityName }));
}

afterEach(cleanup);
beforeEach(() => vi.resetAllMocks());

describe('fluxo de busca (App + useWeather real)', () => {
  it('0 resultados: exibe estado vazio sem consultar o clima', async () => {
    const user = userEvent.setup();
    vi.mocked(searchCities).mockResolvedValue([]);
    render(<App />);

    await searchFor(user, 'Xyzzy');

    expect(
      await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Sugestões de cidades' })).toBeNull();
    expect(screen.queryByRole('article')).toBeNull();
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('1 resultado: carrega o clima direto, sem exibir a lista', async () => {
    const user = userEvent.setup();
    vi.mocked(searchCities).mockResolvedValue([recife]);
    vi.mocked(getWeather).mockResolvedValue(warmForecast);
    render(<App />);

    await searchFor(user, 'Recife');

    expect(await screen.findByRole('region', { name: 'Recife' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Sugestões de cidades' })).toBeNull();
    expect(getWeather).toHaveBeenCalledExactlyOnceWith(
      recife.latitude,
      recife.longitude,
      expect.any(AbortSignal),
    );
    expect(screen.getAllByRole('article')).toHaveLength(5);
  });

  it('mais de 1 resultado: exibe a lista e escolher uma cidade carrega o clima', async () => {
    const user = userEvent.setup();
    vi.mocked(searchCities).mockResolvedValue([recife, lisboa]);
    vi.mocked(getWeather).mockResolvedValue(warmForecast);
    render(<App />);

    await searchFor(user, 'Recife');

    const suggestions = await screen.findByRole('navigation', { name: 'Sugestões de cidades' });
    expect(within(suggestions).getAllByRole('button')).toHaveLength(2);
    expect(getWeather).not.toHaveBeenCalled();

    await user.click(within(suggestions).getByRole('button', { name: /Portugal/ }));

    expect(await screen.findByRole('region', { name: 'Recife' })).toBeInTheDocument();
    expect(getWeather).toHaveBeenCalledExactlyOnceWith(
      lisboa.latitude,
      lisboa.longitude,
      expect.any(AbortSignal),
    );
    expect(screen.queryByRole('navigation', { name: 'Sugestões de cidades' })).toBeNull();
  });

  it('a unidade escolhida persiste entre buscas', async () => {
    const user = userEvent.setup();
    vi.mocked(searchCities).mockResolvedValueOnce([recife]).mockResolvedValueOnce([olinda]);
    vi.mocked(getWeather).mockResolvedValueOnce(warmForecast).mockResolvedValueOnce(coldForecast);
    render(<App />);

    await user.click(screen.getByRole('button', { name: '°F' }));
    await searchFor(user, 'Recife');
    await screen.findByRole('region', { name: 'Recife' });
    expect(currentTemperature('Recife').getByText('82°F')).toBeInTheDocument();

    await searchFor(user, 'Olinda');
    await screen.findByRole('region', { name: 'Olinda' });

    expect(currentTemperature('Olinda').getByText('50°F')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '°C' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('a unidade escolhida persiste ao escolher cidade da lista', async () => {
    const user = userEvent.setup();
    vi.mocked(searchCities).mockResolvedValue([recife, lisboa]);
    vi.mocked(getWeather).mockResolvedValue(coldForecast);
    render(<App />);

    await searchFor(user, 'Recife');
    await user.click(screen.getByRole('button', { name: '°F' }));
    await user.click(
      within(await screen.findByRole('navigation', { name: 'Sugestões de cidades' })).getByRole(
        'button',
        { name: /Portugal/ },
      ),
    );

    expect(await screen.findByText('50°F', { selector: 'p' })).toBeInTheDocument();
  });

  it('bloqueia nova busca enquanto carrega e aplica a resposta pendente', async () => {
    const user = userEvent.setup();
    const pending = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValue(pending.promise);
    vi.mocked(getWeather).mockResolvedValue(warmForecast);
    render(<App />);

    await searchFor(user, 'Recife');

    expect(screen.getByRole('status')).toHaveTextContent('Carregando');
    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();

    await act(async () => {
      pending.resolve([recife]);
    });

    expect(await screen.findByRole('region', { name: 'Recife' })).toBeInTheDocument();
    expect(searchCities).toHaveBeenCalledOnce();
  });
});

// A UI bloqueia buscas durante o loading; a obsolescência só é observável no hook.
describe('busca obsoleta (useWeather real)', () => {
  it('ignora a resposta de uma busca anterior que chega depois da nova', async () => {
    const first = deferred<City[]>();
    const second = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    vi.mocked(getWeather).mockResolvedValue(coldForecast);
    const { result } = renderHook(() => useWeather());

    act(() => result.current.search('Recife'));
    act(() => result.current.search('Olinda'));
    const firstSignal = vi.mocked(searchCities).mock.calls[0][1];
    expect(firstSignal?.aborted).toBe(true);

    await act(async () => second.resolve([olinda]));
    await waitFor(() => expect(result.current.status).toBe('success'));
    await act(async () => first.resolve([recife, lisboa]));

    expect(result.current.status).toBe('success');
    expect(result.current.data?.city).toEqual(olinda);
    expect(result.current.cities).toEqual([olinda]);
    expect(getWeather).toHaveBeenCalledOnce();
  });

  it('ignora o clima de uma cidade escolhida antes quando outra busca começa', async () => {
    const staleForecast = deferred<WeatherForecast>();
    vi.mocked(searchCities)
      .mockResolvedValueOnce([recife, lisboa])
      .mockResolvedValueOnce([recife, lisboa]);
    vi.mocked(getWeather).mockReturnValueOnce(staleForecast.promise);
    const { result } = renderHook(() => useWeather());

    act(() => result.current.search('Recife'));
    await waitFor(() => expect(result.current.status).toBe('selecting'));
    act(() => result.current.selectCity(recife));
    await waitFor(() => expect(getWeather).toHaveBeenCalledOnce());

    act(() => result.current.search('Recife'));
    await waitFor(() => expect(result.current.status).toBe('selecting'));
    await act(async () => staleForecast.resolve(warmForecast));

    expect(result.current.status).toBe('selecting');
    expect(result.current.data).toBeNull();
  });
});

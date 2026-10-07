import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWeather } from '../../src/hooks/useWeather';
import { mockWeatherData } from '../../src/mocks/weather';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City, WeatherErrorCategory, WeatherForecast } from '../../src/types/weather';

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
const categories: WeatherErrorCategory[] = ['network', 'timeout', 'http', 'invalid-response'];
const forecast: WeatherForecast = {
  current: mockWeatherData.current,
  forecast: mockWeatherData.forecast,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => vi.resetAllMocks());

describe('useWeather', () => {
  it('inicia em idle sem dados', () => {
    const { result } = renderHook(() => useWeather());

    expect(result.current).toMatchObject({
      status: 'idle',
      cities: [],
      data: null,
      error: null,
    });
  });

  it('entra em empty quando a busca não retorna cidades', async () => {
    vi.mocked(searchCities).mockResolvedValue([]);
    const { result } = renderHook(() => useWeather());

    act(() => result.current.search('Xyzzy'));

    await waitFor(() => expect(result.current.status).toBe('empty'));
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('seleciona automaticamente quando há um único resultado', async () => {
    vi.mocked(searchCities).mockResolvedValue([recife]);
    vi.mocked(getWeather).mockResolvedValue(forecast);
    const { result } = renderHook(() => useWeather());

    act(() => result.current.search('Recife'));
    expect(result.current.status).toBe('loading');

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data).toEqual(mockWeatherData);
    expect(result.current.error).toBeNull();
    expect(getWeather).toHaveBeenCalledWith(recife.latitude, recife.longitude, expect.anything());
  });

  it('entra em selecting quando há vários resultados', async () => {
    vi.mocked(searchCities).mockResolvedValue([recife, olinda]);
    const { result } = renderHook(() => useWeather());

    act(() => result.current.search('Re'));

    await waitFor(() => expect(result.current.status).toBe('selecting'));
    expect(result.current.cities).toEqual([recife, olinda]);
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('selectCity a partir de selecting carrega o clima da cidade escolhida', async () => {
    vi.mocked(searchCities).mockResolvedValue([recife, olinda]);
    vi.mocked(getWeather).mockResolvedValue(forecast);
    const { result } = renderHook(() => useWeather());
    act(() => result.current.search('Re'));
    await waitFor(() => expect(result.current.status).toBe('selecting'));

    act(() => result.current.selectCity(olinda));
    expect(result.current.status).toBe('loading');

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data?.city).toEqual(olinda);
    expect(getWeather).toHaveBeenCalledWith(olinda.latitude, olinda.longitude, expect.anything());
  });

  it.each(categories)('expõe a categoria %s quando a busca falha', async (category) => {
    vi.mocked(searchCities).mockRejectedValue(new WeatherServiceError(category));
    const { result } = renderHook(() => useWeather());

    act(() => result.current.search('Recife'));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe(category);
    expect(result.current.data).toBeNull();
  });

  it.each(categories)('expõe a categoria %s quando o forecast falha', async (category) => {
    vi.mocked(searchCities).mockResolvedValue([recife]);
    vi.mocked(getWeather).mockRejectedValue(new WeatherServiceError(category));
    const { result } = renderHook(() => useWeather());

    act(() => result.current.search('Recife'));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe(category);
    expect(result.current.data).toBeNull();
  });

  it('trata erro desconhecido como network', async () => {
    vi.mocked(searchCities).mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useWeather());

    act(() => result.current.search('Recife'));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('network');
  });

  it('retry após falha na busca repete a busca', async () => {
    vi.mocked(searchCities)
      .mockRejectedValueOnce(new WeatherServiceError('timeout'))
      .mockResolvedValueOnce([recife]);
    vi.mocked(getWeather).mockResolvedValue(forecast);
    const { result } = renderHook(() => useWeather());
    act(() => result.current.search('Recife'));
    await waitFor(() => expect(result.current.status).toBe('error'));

    act(() => result.current.retry());
    expect(result.current.status).toBe('loading');

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(searchCities).toHaveBeenCalledTimes(2);
    expect(vi.mocked(searchCities).mock.calls[1][0]).toBe('Recife');
    expect(result.current.error).toBeNull();
  });

  it('retry após falha no forecast repete só o forecast da cidade escolhida', async () => {
    vi.mocked(searchCities).mockResolvedValue([recife, olinda]);
    vi.mocked(getWeather)
      .mockRejectedValueOnce(new WeatherServiceError('http'))
      .mockResolvedValueOnce(forecast);
    const { result } = renderHook(() => useWeather());
    act(() => result.current.search('Re'));
    await waitFor(() => expect(result.current.status).toBe('selecting'));
    act(() => result.current.selectCity(olinda));
    await waitFor(() => expect(result.current.status).toBe('error'));

    act(() => result.current.retry());
    expect(result.current.status).toBe('loading');

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenCalledTimes(2);
    expect(vi.mocked(getWeather).mock.calls[1].slice(0, 2)).toEqual([
      olinda.latitude,
      olinda.longitude,
    ]);
    expect(result.current.data?.city).toEqual(olinda);
  });

  it('ignora a resposta de uma busca antiga quando uma nova é iniciada', async () => {
    const first = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(first.promise).mockResolvedValueOnce([olinda]);
    vi.mocked(getWeather).mockResolvedValue(forecast);
    const { result } = renderHook(() => useWeather());

    act(() => result.current.search('Recife'));
    const firstSignal = vi.mocked(searchCities).mock.calls[0][1];
    act(() => result.current.search('Olinda'));
    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(firstSignal?.aborted).toBe(true);
    await act(async () => first.resolve([recife]));
    expect(result.current.status).toBe('success');
    expect(result.current.data?.city).toEqual(olinda);
    expect(getWeather).toHaveBeenCalledTimes(1);
  });

  it('ignora erro de uma busca antiga quando uma nova é iniciada', async () => {
    const first = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(first.promise).mockResolvedValueOnce([]);
    const { result } = renderHook(() => useWeather());

    act(() => result.current.search('Recife'));
    act(() => result.current.search('Xyzzy'));
    await waitFor(() => expect(result.current.status).toBe('empty'));

    await act(async () => first.reject(new WeatherServiceError('network')));
    expect(result.current.status).toBe('empty');
    expect(result.current.error).toBeNull();
  });

  it('nova seleção aborta o forecast anterior e ignora sua resposta', async () => {
    const first = deferred<WeatherForecast>();
    vi.mocked(searchCities).mockResolvedValue([recife, olinda]);
    vi.mocked(getWeather).mockReturnValueOnce(first.promise).mockResolvedValueOnce(forecast);
    const { result } = renderHook(() => useWeather());
    act(() => result.current.search('Re'));
    await waitFor(() => expect(result.current.status).toBe('selecting'));

    act(() => result.current.selectCity(recife));
    const firstSignal = vi.mocked(getWeather).mock.calls[0][2];
    act(() => result.current.selectCity(olinda));
    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(firstSignal?.aborted).toBe(true);
    await act(async () => first.resolve(forecast));
    expect(result.current.data?.city).toEqual(olinda);
  });

  it('cancela requisições pendentes ao desmontar', async () => {
    vi.mocked(searchCities).mockReturnValue(deferred<City[]>().promise);
    const { result, unmount } = renderHook(() => useWeather());
    act(() => result.current.search('Recife'));
    const signal = vi.mocked(searchCities).mock.calls[0][1];

    unmount();

    expect(signal?.aborted).toBe(true);
  });
});

import { useCallback, useEffect, useRef, useState } from 'react';
import { getWeather, searchCities } from '../services/weatherService';
import type { City, WeatherData, WeatherErrorCategory, WeatherStatus } from '../types/weather';

export interface UseWeatherResult {
  status: WeatherStatus;
  cities: City[];
  data: WeatherData | null;
  error: WeatherErrorCategory | null;
  search: (name: string) => void;
  selectCity: (city: City) => void;
  retry: () => void;
}

interface WeatherState {
  status: WeatherStatus;
  cities: City[];
  data: WeatherData | null;
  error: WeatherErrorCategory | null;
}

// Etapa que falhou; retry repete exatamente esta etapa.
type FailedStep = { kind: 'search'; name: string } | { kind: 'forecast'; city: City };

const CATEGORIES: readonly WeatherErrorCategory[] = [
  'network',
  'timeout',
  'http',
  'invalid-response',
];

const INITIAL_STATE: WeatherState = { status: 'idle', cities: [], data: null, error: null };

// Erros fora do contrato do service são tratados como falha de rede.
function toCategory(error: unknown): WeatherErrorCategory {
  const category = (error as { category?: WeatherErrorCategory } | null)?.category;
  return category && CATEGORIES.includes(category) ? category : 'network';
}

export function useWeather(): UseWeatherResult {
  const [state, setState] = useState<WeatherState>(INITIAL_STATE);
  const controllerRef = useRef<AbortController | null>(null);
  const failedStepRef = useRef<FailedStep | null>(null);

  // Aborta a requisição anterior; respostas obsoletas são descartadas via signal.aborted.
  const beginRequest = useCallback((): AbortController => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    return controller;
  }, []);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const loadForecast = useCallback(async (city: City, controller: AbortController) => {
    const { signal } = controller;
    failedStepRef.current = null;
    setState((prev) => ({ ...prev, status: 'loading', data: null, error: null }));
    try {
      const forecast = await getWeather(city.latitude, city.longitude, signal);
      if (signal.aborted) return;
      setState((prev) => ({
        ...prev,
        status: 'success',
        data: { city, current: forecast.current, forecast: forecast.forecast },
      }));
    } catch (error) {
      if (signal.aborted) return;
      failedStepRef.current = { kind: 'forecast', city };
      setState((prev) => ({ ...prev, status: 'error', error: toCategory(error) }));
    }
  }, []);

  const runSearch = useCallback(
    async (name: string) => {
      const controller = beginRequest();
      const { signal } = controller;
      failedStepRef.current = null;
      setState({ status: 'loading', cities: [], data: null, error: null });
      try {
        const cities = await searchCities(name, signal);
        if (signal.aborted) return;
        if (cities.length === 0) {
          setState({ status: 'empty', cities: [], data: null, error: null });
        } else if (cities.length === 1) {
          setState((prev) => ({ ...prev, cities }));
          await loadForecast(cities[0], controller);
        } else {
          setState({ status: 'selecting', cities, data: null, error: null });
        }
      } catch (error) {
        if (signal.aborted) return;
        failedStepRef.current = { kind: 'search', name };
        setState({ status: 'error', cities: [], data: null, error: toCategory(error) });
      }
    },
    [beginRequest, loadForecast],
  );

  const search = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (trimmed) void runSearch(trimmed);
    },
    [runSearch],
  );

  const selectCity = useCallback(
    (city: City) => {
      void loadForecast(city, beginRequest());
    },
    [beginRequest, loadForecast],
  );

  const retry = useCallback(() => {
    const step = failedStepRef.current;
    if (!step) return;
    if (step.kind === 'search') void runSearch(step.name);
    else void loadForecast(step.city, beginRequest());
  }, [beginRequest, loadForecast, runSearch]);

  return { ...state, search, selectCity, retry };
}

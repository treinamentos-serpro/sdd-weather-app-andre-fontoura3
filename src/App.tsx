import { CloudSun } from 'lucide-react';
import { useEffect, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { searchMockWeather } from './services/mockWeatherService';
import type { Unit, WeatherData } from './types/weather';

type WeatherState =
  | { status: 'idle' | 'loading' | 'empty' | 'error' }
  | { status: 'success'; data: WeatherData };

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const [state, setState] = useState<WeatherState>({ status: 'idle' });
  const [request, setRequest] = useState<{ city: string } | null>(null);

  useEffect(() => {
    if (!request) {
      return;
    }

    let active = true;
    searchMockWeather(request.city)
      .then((data) => {
        if (active) {
          setState(data ? { status: 'success', data } : { status: 'empty' });
        }
      })
      .catch(() => {
        if (active) {
          setState({ status: 'error' });
        }
      });

    return () => {
      active = false;
    };
  }, [request]);

  function handleSearch(city: string) {
    const trimmedCity = city.trim();
    if (!trimmedCity || state.status === 'loading') {
      return;
    }
    setState({ status: 'loading' });
    setRequest({ city: trimmedCity });
  }

  return (
    <div className="min-h-dvh bg-night-900 font-sans text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-night-800 focus:p-3 focus:ring-2 focus:ring-accent-400"
      >
        {'Ir para o conte\u00fado'}
      </a>
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="mx-auto grid w-full max-w-5xl items-end gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="flex items-center gap-3 self-center">
            <CloudSun aria-hidden="true" className="h-9 w-9 shrink-0 text-sun" />
            <h1 className="text-2xl font-semibold">WeatherView</h1>
          </div>
          <SearchBar onSearch={handleSearch} disabled={state.status === 'loading'} />
          <div className="justify-self-start lg:justify-self-end">
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </div>
      </header>
      <div aria-live="polite" className="sr-only">
        {state.status === 'success' && `Clima de ${state.data.city.name} carregado.`}
        {state.status === 'empty' && 'Nenhuma cidade encontrada.'}
      </div>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl px-4 py-6 focus:outline-none sm:px-6"
      >
        {state.status === 'idle' && (
          <EmptyState
            title="Clima da sua cidade"
            hint={'Busque uma cidade para consultar o clima e a previs\u00e3o.'}
          />
        )}
        {state.status === 'loading' && <LoadingState />}
        {state.status === 'empty' && <EmptyState />}
        {state.status === 'error' && (
          <ErrorState onRetry={() => request && handleSearch(request.city)} />
        )}
        {state.status === 'success' && (
          <>
            <CurrentWeather city={state.data.city} current={state.data.current} unit={unit} />
            <ForecastList forecast={state.data.forecast} unit={unit} />
          </>
        )}
      </main>
    </div>
  );
}

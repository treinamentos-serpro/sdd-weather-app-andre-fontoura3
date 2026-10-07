import { CloudSun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import CitySuggestions from './components/CitySuggestions';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { useWeather } from './hooks/useWeather';
import { getErrorMessage } from './lib/errorMessages';
import type { Unit } from './types/weather';

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const { status, cities, data, error, search, selectCity, retry } = useWeather();
  const mainRef = useRef<HTMLElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Foco só muda na entrada em selecting/success; trocar a unidade não altera status.
  useEffect(() => {
    if (status === 'selecting') {
      suggestionsRef.current?.focus();
    } else if (status === 'success') {
      mainRef.current?.focus();
    }
  }, [status]);

  function handleSearch(city: string) {
    const trimmedCity = city.trim();
    if (!trimmedCity || status === 'loading') {
      return;
    }
    search(trimmedCity);
  }

  let liveMessage = '';
  if (status === 'selecting') {
    liveMessage = `${cities.length} cidades encontradas. Selecione uma.`;
  } else if (status === 'success' && data) {
    liveMessage = `Clima de ${data.city.name} carregado.`;
  } else if (status === 'empty') {
    liveMessage = 'Nenhuma cidade encontrada.';
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
          <SearchBar onSearch={handleSearch} disabled={status === 'loading'} />
          <div className="justify-self-start lg:justify-self-end">
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </div>
      </header>
      <div aria-live="polite" className="sr-only">
        {liveMessage}
      </div>
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl px-4 py-6 focus:outline-none sm:px-6"
      >
        {status === 'idle' && (
          <EmptyState
            title="Clima da sua cidade"
            hint={'Busque uma cidade para consultar o clima e a previs\u00e3o.'}
          />
        )}
        {status === 'loading' && <LoadingState />}
        {status === 'empty' && <EmptyState />}
        {status === 'selecting' && (
          <div ref={suggestionsRef} tabIndex={-1} className="focus:outline-none">
            <CitySuggestions cities={cities} onSelect={selectCity} />
          </div>
        )}
        {status === 'error' && error && (
          <ErrorState message={getErrorMessage(error)} onRetry={retry} />
        )}
        {status === 'success' && data && (
          <>
            <CurrentWeather city={data.city} current={data.current} unit={unit} />
            <ForecastList forecast={data.forecast} unit={unit} />
          </>
        )}
      </main>
    </div>
  );
}

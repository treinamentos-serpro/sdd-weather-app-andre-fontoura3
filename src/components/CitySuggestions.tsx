import type { City } from '../types/weather';

interface CitySuggestionsProps {
  cities: City[];
  onSelect: (city: City) => void;
}

function formatCityLabel(city: City): string {
  return [city.name, city.admin1, city.country].filter(Boolean).join(', ');
}

function formatCityContext(city: City): string {
  return [city.admin1, city.country].filter(Boolean).join(', ');
}

export default function CitySuggestions({ cities, onSelect }: CitySuggestionsProps) {
  return (
    <nav aria-label="Sugestões de cidades" className="w-full font-sans">
      <ul className="m-0 list-none divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10 bg-white/5 p-0 text-white shadow-glass backdrop-blur-md">
        {cities.map((city) => (
          <li key={city.id} className="min-w-0">
            <button
              type="button"
              aria-label={formatCityLabel(city)}
              onClick={() => onSelect(city)}
              className="flex min-h-11 w-full min-w-0 items-center gap-3 px-4 py-3 text-left hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-400 active:bg-white/15"
            >
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 shrink-0 text-accent-400"
              >
                <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="flex min-w-0 flex-1 flex-col" aria-hidden="true">
                <span className="break-words text-base font-semibold leading-snug">
                  {city.name}
                </span>
                <span className="break-words text-sm leading-snug text-white/70">
                  {formatCityContext(city)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

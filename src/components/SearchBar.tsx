import { type FormEvent, useId, useState } from 'react';

interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
}

export default function SearchBar({ onSearch, disabled = false }: SearchBarProps) {
  const inputId = useId();
  const [city, setCity] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedCity = city.trim();

    if (disabled || !trimmedCity) {
      return;
    }

    onSearch(trimmedCity);
  }

  return (
    <form
      role="search"
      aria-label="Buscar cidade"
      onSubmit={handleSubmit}
      className="w-full font-sans"
    >
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-white">
        Cidade
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={inputId}
          type="search"
          name="city"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          disabled={disabled}
          placeholder="Buscar cidade"
          enterKeyHint="search"
          className="min-h-12 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-white shadow-glass backdrop-blur-md placeholder:text-white/60 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !city.trim()}
          className="min-h-12 shrink-0 rounded-lg border border-white/10 bg-night-800 px-5 py-3 font-medium text-white backdrop-blur-md enabled:hover:bg-night-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buscar
        </button>
      </div>
    </form>
  );
}

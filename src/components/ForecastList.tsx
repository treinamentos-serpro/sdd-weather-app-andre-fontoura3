import { useId } from 'react';
import type { ForecastDay, Unit } from '../types/weather';
import ForecastCard from './ForecastCard';

interface ForecastListProps {
  forecast: ForecastDay[];
  unit: Unit;
}

export default function ForecastList({ forecast, unit }: ForecastListProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="w-full min-w-0 py-6 font-sans text-white">
      <h2 id={headingId} className="mb-4 text-xl font-semibold">
        {'Previs\u00e3o'}
      </h2>
      {forecast.length === 0 ? (
        <p className="text-sm text-white/70">{'Previs\u00e3o indispon\u00edvel.'}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {forecast.map((day, index) => (
            <li key={day.date} className="min-w-0">
              <ForecastCard day={day} index={index} unit={unit} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

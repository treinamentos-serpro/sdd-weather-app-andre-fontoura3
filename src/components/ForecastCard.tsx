import { useId } from 'react';
import { formatDayLabel } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  index: number;
  unit: Unit;
}

export default function ForecastCard({ day, index, unit }: ForecastCardProps) {
  const headingId = useId();
  const { label, icon: WeatherIcon } = getWeatherCondition(day.weatherCode);
  const probability = Number.isFinite(day.precipitationProbability)
    ? `${day.precipitationProbability}%`
    : '\u2014';

  return (
    <article
      aria-labelledby={headingId}
      className="h-full min-w-0 rounded-lg border border-white/10 bg-white/5 p-3 font-sans text-white backdrop-blur-md"
    >
      <h3 id={headingId} className="break-words text-sm font-semibold">
        <time dateTime={day.date}>{formatDayLabel(day.date, index)}</time>
      </h3>
      <WeatherIcon role="img" aria-label={label} className="my-4 h-10 w-10 text-sun" />
      <dl className="grid grid-cols-2 gap-2">
        <div className="min-w-0">
          <dt className="text-xs text-white/70">{'M\u00e1x.'}</dt>
          <dd className="mt-1 break-words text-base font-semibold tabular-nums">
            {formatTemperature(day.max, unit)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-white/70">{'M\u00edn.'}</dt>
          <dd className="mt-1 break-words text-base tabular-nums text-white/80">
            {formatTemperature(day.min, unit)}
          </dd>
        </div>
        <div className="col-span-2 mt-2 min-w-0 border-t border-white/10 pt-3">
          <dt className="break-words text-xs text-white/70">Probabilidade de chuva</dt>
          <dd className="mt-1 break-words text-sm font-medium tabular-nums">{probability}</dd>
        </div>
      </dl>
    </article>
  );
}

import { useId } from 'react';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
}

const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function formatMetric(value: number, suffix: string): string {
  return Number.isFinite(value) ? `${numberFormatter.format(value)}${suffix}` : '\u2014';
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const headingId = useId();
  const { label, icon: WeatherIcon } = getWeatherCondition(current.weatherCode);
  const location = [city.admin1, city.country].filter(Boolean).join(', ');
  const metrics = [
    { label: 'Umidade', value: formatMetric(current.humidity, '%') },
    { label: 'Vento', value: formatMetric(current.windSpeed, ' km/h') },
    { label: 'Precipita\u00e7\u00e3o', value: formatMetric(current.precipitation, ' mm') },
    { label: 'Press\u00e3o', value: formatMetric(current.pressure, ' hPa') },
  ];

  return (
    <section aria-labelledby={headingId} className="w-full min-w-0 py-6 font-sans text-white">
      <h2 id={headingId} className="break-words text-2xl font-semibold">
        {city.name}
      </h2>
      <p className="mt-1 break-words text-sm text-white/70">{location}</p>
      <div className="my-6 flex flex-wrap items-center gap-6">
        <p className="break-all text-6xl font-bold tabular-nums">
          {formatTemperature(current.temperature, unit)}
        </p>
        <WeatherIcon role="img" aria-label={label} className="h-20 w-20 shrink-0 text-sun" />
      </div>
      <p className="break-words text-lg text-white/90">{label}</p>
      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-6 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="min-w-0">
            <dt className="break-words text-sm text-white/70">{metric.label}</dt>
            <dd className="mt-1 break-words text-lg font-medium tabular-nums">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

import { mockWeatherData } from '../mocks/weather';
import type { WeatherData } from '../types/weather';

export async function searchMockWeather(city: string): Promise<WeatherData | null> {
  await new Promise<void>((resolve) => setTimeout(resolve, 500));
  return city.trim().toLocaleLowerCase('pt-BR') ===
    mockWeatherData.city.name.toLocaleLowerCase('pt-BR')
    ? mockWeatherData
    : null;
}

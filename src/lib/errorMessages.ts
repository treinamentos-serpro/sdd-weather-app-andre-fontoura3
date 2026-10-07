import type { WeatherErrorCategory } from '../types/weather';

const ERROR_MESSAGES: Record<WeatherErrorCategory, string> = {
  network: 'Sem conexão com a internet. Verifique sua rede e tente novamente.',
  timeout: 'A requisição demorou demais para responder. Tente novamente.',
  http: 'O serviço de clima está indisponível no momento. Tente novamente mais tarde.',
  'invalid-response': 'Recebemos uma resposta inesperada do serviço de clima.',
};

export function getErrorMessage(category: WeatherErrorCategory): string {
  return ERROR_MESSAGES[category];
}

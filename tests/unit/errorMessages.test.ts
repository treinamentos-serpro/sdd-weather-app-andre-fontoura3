import { describe, expect, it } from 'vitest';
import { getErrorMessage } from '../../src/lib/errorMessages';
import type { WeatherErrorCategory } from '../../src/types/weather';

const categories: WeatherErrorCategory[] = ['network', 'timeout', 'http', 'invalid-response'];

describe('getErrorMessage', () => {
  it.each(categories)('retorna mensagem não vazia em pt-BR para "%s"', (category) => {
    expect(getErrorMessage(category).trim().length).toBeGreaterThan(0);
  });

  it('retorna mensagens distintas por categoria', () => {
    const messages = categories.map(getErrorMessage);
    expect(new Set(messages).size).toBe(categories.length);
  });

  it('sugere tentar novamente em caso de timeout', () => {
    expect(getErrorMessage('timeout')).toMatch(/tente novamente/i);
  });

  it('menciona conexão em caso de erro de rede', () => {
    expect(getErrorMessage('network')).toMatch(/conexão/i);
  });

  it('descreve serviço indisponível em caso de erro HTTP', () => {
    expect(getErrorMessage('http')).toMatch(/indisponível/i);
  });

  it('descreve resposta inesperada em caso de resposta inválida', () => {
    expect(getErrorMessage('invalid-response')).toMatch(/inesperada/i);
  });

  it('é determinística', () => {
    expect(getErrorMessage('timeout')).toBe(getErrorMessage('timeout'));
  });
});

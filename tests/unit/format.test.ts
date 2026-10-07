import { describe, expect, it } from 'vitest';
import { formatDayLabel } from '../../src/lib/format';

describe('formatDayLabel', () => {
  it('retorna "Hoje" para o índice 0', () => {
    expect(formatDayLabel('2026-10-07', 0)).toBe('Hoje');
  });

  it('retorna "Amanhã" para o índice 1', () => {
    expect(formatDayLabel('2026-10-08', 1)).toBe('Amanhã');
  });

  it('retorna o dia da semana abreviado em pt-BR para os demais índices', () => {
    expect(formatDayLabel('2026-10-09', 2)).toMatch(/^sex/i);
    expect(formatDayLabel('2026-10-10', 3)).toMatch(/^s[áa]b/i);
    expect(formatDayLabel('2026-10-11', 4)).toMatch(/^dom/i);
  });

  it('retorna travessão para data inválida', () => {
    expect(formatDayLabel('invalida', 2)).toBe('—');
    expect(formatDayLabel('', 3)).toBe('—');
  });
});

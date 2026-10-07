import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UnitToggle from '../../src/components/UnitToggle';
import type { Unit } from '../../src/types/weather';

afterEach(cleanup);

describe('UnitToggle', () => {
  it.each<Unit>([
    'celsius',
    'fahrenheit',
  ])('indica a unidade ativa com aria-pressed (%s)', (unit) => {
    render(<UnitToggle unit={unit} onChange={vi.fn()} />);

    const group = screen.getByRole('group', { name: 'Unidade de temperatura' });
    const celsiusButton = within(group).getByRole('button', { name: '\u00b0C' });
    const fahrenheitButton = within(group).getByRole('button', { name: '\u00b0F' });

    expect(celsiusButton).toHaveAttribute('aria-pressed', String(unit === 'celsius'));
    expect(fahrenheitButton).toHaveAttribute('aria-pressed', String(unit === 'fahrenheit'));
    expect(celsiusButton).toHaveAttribute('type', 'button');
    expect(fahrenheitButton).toHaveAttribute('type', 'button');
  });

  it.each<[Unit, string]>([
    ['celsius', '\u00b0C'],
    ['fahrenheit', '\u00b0F'],
  ])('notifica a selecao de %s ao clicar', async (unit, label) => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: label }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith(unit);
  });

  it('mantem a selecao controlada pela prop unit', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '\u00b0F' }));
    expect(screen.getByRole('button', { name: '\u00b0C' })).toHaveAttribute('aria-pressed', 'true');

    rerender(<UnitToggle unit="fahrenheit" onChange={onChange} />);

    expect(screen.getByRole('button', { name: '\u00b0C' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: '\u00b0F' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('permite navegar com Tab e Shift+Tab e ativar com Enter e Espaco', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.tab();
    expect(screen.getByRole('button', { name: '\u00b0C' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenNthCalledWith(1, 'celsius');

    await user.tab();
    expect(screen.getByRole('button', { name: '\u00b0F' })).toHaveFocus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenNthCalledWith(2, 'fahrenheit');

    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: '\u00b0C' })).toHaveFocus();
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

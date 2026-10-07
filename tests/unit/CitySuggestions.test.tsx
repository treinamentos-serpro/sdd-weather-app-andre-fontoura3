import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CitySuggestions from '../../src/components/CitySuggestions';
import type { City } from '../../src/types/weather';

afterEach(cleanup);

const recife: City = {
  id: 1,
  name: 'Recife',
  admin1: 'Pernambuco',
  country: 'Brasil',
  latitude: -8.05,
  longitude: -34.88,
};

const lisboa: City = {
  id: 2,
  name: 'Lisboa',
  country: 'Portugal',
  latitude: 38.72,
  longitude: -9.14,
};

describe('CitySuggestions', () => {
  it('lista as cidades com nome, regiao e pais em uma navegacao acessivel', () => {
    render(<CitySuggestions cities={[recife, lisboa]} onSelect={vi.fn()} />);

    expect(
      screen.getByRole('navigation', { name: 'Sugest\u00f5es de cidades' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Recife, Pernambuco, Brasil' })).toBeInTheDocument();
    expect(screen.getByText('Recife')).toBeInTheDocument();
    expect(screen.getByText('Pernambuco, Brasil')).toBeInTheDocument();
  });

  it('exibe somente o pais quando a cidade nao tem regiao', () => {
    render(<CitySuggestions cities={[lisboa]} onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Lisboa, Portugal' })).toBeInTheDocument();
    expect(screen.getByText('Portugal')).toBeInTheDocument();
  });

  it('seleciona a cidade ao clicar', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CitySuggestions cities={[recife, lisboa]} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'Lisboa, Portugal' }));

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(lisboa);
  });

  it('seleciona a cidade pelo teclado com Enter e Espaco', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CitySuggestions cities={[recife, lisboa]} onSelect={onSelect} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Recife, Pernambuco, Brasil' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.tab();
    await user.keyboard(' ');

    expect(onSelect).toHaveBeenNthCalledWith(1, recife);
    expect(onSelect).toHaveBeenNthCalledWith(2, lisboa);
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('nao renderiza itens quando a lista esta vazia', () => {
    render(<CitySuggestions cities={[]} onSelect={vi.fn()} />);

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

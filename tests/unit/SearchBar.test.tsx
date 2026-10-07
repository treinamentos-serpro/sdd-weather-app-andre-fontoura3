import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SearchBar from '../../src/components/SearchBar';

afterEach(cleanup);

describe('SearchBar', () => {
  it('oferece um formulario de busca e input com label acessivel', () => {
    render(<SearchBar onSearch={vi.fn()} />);

    expect(screen.getByRole('search', { name: 'Buscar cidade' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Cidade' })).toBe(screen.getByLabelText('Cidade'));
  });

  it('busca a cidade sem espacos nas extremidades ao clicar', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox'), '  Recife  ');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Recife');
  });

  it('permite buscar com Enter preservando espacos internos', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox'), 'Rio de Janeiro{Enter}');

    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Rio de Janeiro');
  });

  it.each(['', '   '])('nao busca com entrada vazia ou espacos (%j)', (city) => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: city } });
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    fireEvent.submit(screen.getByRole('search'));

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('desabilita controles e bloqueia envio mesmo com cidade preenchida', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const { rerender } = render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox'), 'Recife');
    rerender(<SearchBar onSearch={onSearch} disabled />);

    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    fireEvent.submit(screen.getByRole('search'));

    expect(onSearch).not.toHaveBeenCalled();
  });
});

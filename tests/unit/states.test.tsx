import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EmptyState from '../../src/components/states/EmptyState';
import ErrorState from '../../src/components/states/ErrorState';
import LoadingState from '../../src/components/states/LoadingState';

afterEach(cleanup);

describe('LoadingState', () => {
  it('anuncia o carregamento com role status e mensagem clara', () => {
    render(<LoadingState />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Carregando dados do clima...');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('anuncia a mensagem padrao e oferece um botao de retry', () => {
    render(<ErrorState onRetry={vi.fn()} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('N\u00e3o foi poss\u00edvel carregar os dados do clima.');
    expect(within(alert).getByRole('button', { name: 'Tentar novamente' })).toHaveAttribute(
      'type',
      'button',
    );
  });

  it('exibe mensagem personalizada', () => {
    render(<ErrorState message="Falha de rede." onRetry={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Falha de rede.');
  });

  it('chama onRetry uma vez ao clicar', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it.each(['{Enter}', ' '])('permite retry por teclado (%j)', async (key) => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toHaveFocus();
    await user.keyboard(key);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('EmptyState', () => {
  it('exibe titulo e dica padrao', () => {
    render(<EmptyState />);

    expect(screen.getByRole('region', { name: 'Nenhuma cidade encontrada' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeInTheDocument();
    expect(screen.getByText('Confira o nome da cidade ou tente outra busca.')).toBeInTheDocument();
  });

  it('permite personalizar titulo e dica', () => {
    render(<EmptyState title="Sem dados" hint="Tente outra cidade." />);

    expect(screen.getByRole('heading', { name: 'Sem dados' })).toBeInTheDocument();
    expect(screen.getByText('Tente outra cidade.')).toBeInTheDocument();
  });
});

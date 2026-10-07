import { CircleAlert, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  onRetry: () => void;
  message?: string;
}

export default function ErrorState({
  onRetry,
  message = 'N\u00e3o foi poss\u00edvel carregar os dados do clima.',
}: ErrorStateProps) {
  return (
    <div role="alert" className="w-full min-w-0 py-8 font-sans text-white">
      <CircleAlert aria-hidden="true" className="mb-3 h-8 w-8 text-sun" />
      <h2 className="break-words text-xl font-semibold">{'Algo deu errado'}</h2>
      <p className="mt-2 break-words text-sm text-white/80">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white backdrop-blur-md hover:bg-white/10"
      >
        <RotateCcw aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span className="break-words">Tentar novamente</span>
      </button>
    </div>
  );
}

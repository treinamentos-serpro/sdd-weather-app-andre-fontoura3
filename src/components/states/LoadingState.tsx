import { LoaderCircle } from 'lucide-react';

export default function LoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex w-full min-w-0 items-center justify-center gap-3 py-8 font-sans text-white"
    >
      <LoaderCircle
        aria-hidden="true"
        className="h-6 w-6 shrink-0 text-accent-400 motion-safe:animate-spin"
      />
      <p className="break-words text-sm">Carregando dados do clima...</p>
    </div>
  );
}

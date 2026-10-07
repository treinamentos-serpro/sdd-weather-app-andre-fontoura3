import { SearchX } from 'lucide-react';
import { useId } from 'react';

interface EmptyStateProps {
  title?: string;
  hint?: string;
}

export default function EmptyState({
  title = 'Nenhuma cidade encontrada',
  hint = 'Confira o nome da cidade ou tente outra busca.',
}: EmptyStateProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="w-full min-w-0 py-8 font-sans text-white">
      <SearchX aria-hidden="true" className="mb-3 h-8 w-8 text-accent-400" />
      <h2 id={headingId} className="break-words text-xl font-semibold">
        {title}
      </h2>
      <p className="mt-2 break-words text-sm text-white/80">{hint}</p>
    </section>
  );
}

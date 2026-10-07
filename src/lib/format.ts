const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  timeZone: 'UTC',
});

export function formatDayLabel(date: string, index: number): string {
  if (index === 0) {
    return 'Hoje';
  }
  if (index === 1) {
    return 'Amanh\u00e3';
  }

  const parsedDate = new Date(`${date}T00:00:00Z`);
  return Number.isFinite(parsedDate.getTime()) ? weekdayFormatter.format(parsedDate) : '\u2014';
}

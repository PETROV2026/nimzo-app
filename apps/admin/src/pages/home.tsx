import { reportStatusLabels, reportStatusSchema } from '@nimzo/shared';

// Placeholder page. Confirms the panel builds and consumes @nimzo/shared.
export function HomePage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Nimzo · Panel de administración</h1>
      <p className="text-muted-foreground mt-2">Estados del reporte:</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {reportStatusSchema.options.map((status) => (
          <li key={status} className="rounded-md border px-3 py-1 text-sm">
            {reportStatusLabels[status]}
          </li>
        ))}
      </ul>
    </main>
  );
}

type CatalogForm = { code: string; name: string };

const frequencySuffixes = ['_weekly', '_monthly', '_quarterly', '_semiannual_annual', '_annual'];

function frequencyRank(code: string) {
  return frequencySuffixes.findIndex((suffix) => code.endsWith(suffix));
}

export function compareCatalogForms(a: CatalogForm, b: CatalogForm) {
  return (
    a.name.localeCompare(b.name, 'es') ||
    frequencyRank(a.code) - frequencyRank(b.code) ||
    a.code.localeCompare(b.code)
  );
}

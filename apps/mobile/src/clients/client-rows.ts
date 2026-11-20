type RowClient = { id: string; isActive: boolean };

export type ClientRow<T extends RowClient> =
  { type: 'header'; key: string; label: string } | { type: 'row'; key: string; clients: T[] };

function chunk<T extends RowClient>(group: string, list: T[], columns: number): ClientRow<T>[] {
  const rows: ClientRow<T>[] = [];
  for (let index = 0; index < list.length; index += columns) {
    const clients = list.slice(index, index + columns);
    rows.push({ type: 'row', key: `${group}:${clients[0].id}`, clients });
  }
  return rows;
}

export function clientRows<T extends RowClient>(clients: T[], columns: number): ClientRow<T>[] {
  const perRow = Math.max(1, columns);
  const active = clients.filter((client) => client.isActive);
  const inactive = clients.filter((client) => !client.isActive);
  return [
    ...chunk('active', active, perRow),
    ...(inactive.length > 0
      ? [{ type: 'header' as const, key: 'inactive', label: 'Inactivos' }]
      : []),
    ...chunk('inactive', inactive, perRow),
  ];
}

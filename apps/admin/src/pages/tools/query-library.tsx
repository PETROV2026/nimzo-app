import ContentCopy from '@mui/icons-material/ContentCopy';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useNotification } from '@refinedev/core';
import { Fragment, useState } from 'react';

import { CodeBlock } from '@/components/code-block';
import { ExternalLink } from '@/components/external-link';
import { GridEmptyState } from '@/components/grid-empty-state';
import { ListToolbar } from '@/components/list-toolbar';
import { Notice } from '@/components/notice';
import { PageHeader } from '@/components/page-header';
import { Postbox } from '@/components/postbox';
import { SearchField } from '@/components/search-field';
import { supabaseSqlEditorUrl } from '@/lib/project-info';

import { devQueryGroups, type DevQuery } from './queries';

function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function QueryItem({ query }: { query: DevQuery }) {
  const { open } = useNotification();
  const titleId = `query-${query.id}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(query.sql);
      open?.({ type: 'success', message: 'Consulta copiada', description: query.title });
    } catch {
      open?.({
        type: 'error',
        message: 'No se pudo copiar',
        description: 'Selecciona el texto de la consulta y cópialo a mano.',
      });
    }
  }

  return (
    <Box component="article" aria-labelledby={titleId} sx={{ display: 'grid', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography id={titleId} variant="h3" sx={{ fontSize: 15, fontWeight: 600 }}>
            {query.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {query.description}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ContentCopy fontSize="small" />}
          onClick={copy}
          aria-label={`Copiar consulta: ${query.title}`}
        >
          Copiar
        </Button>
      </Box>
      <CodeBlock>
        <code>{query.sql}</code>
      </CodeBlock>
    </Box>
  );
}

export function ToolsQueries() {
  const [search, setSearch] = useState('');
  const term = normalize(search.trim());
  const groups = devQueryGroups
    .map((group) => ({
      ...group,
      queries: group.queries.filter(
        (query) => !term || normalize(`${query.title} ${query.description}`).includes(term),
      ),
    }))
    .filter((group) => group.queries.length > 0);

  return (
    <>
      <PageHeader title="Consultas SQL" />

      <Box sx={{ mb: 2.5 }}>
        <Notice
          title="Solo lectura: desde aquí no se ejecuta nada"
          actions={
            <ExternalLink href={supabaseSqlEditorUrl}>Abrir el SQL Editor de Supabase</ExternalLink>
          }
        >
          Copia una consulta y pégala en el SQL Editor de Supabase, o ejecútala desde la terminal
          con <code>pnpm supabase db query --linked "…"</code>. Ninguna modifica datos.
        </Notice>
      </Box>

      <ListToolbar>
        <Typography color="text.secondary">
          {devQueryGroups.reduce((total, group) => total + group.queries.length, 0)} consultas en{' '}
          {devQueryGroups.length} grupos
        </Typography>
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar consultas"
          label="Buscar consultas por nombre o descripción"
        />
      </ListToolbar>

      {groups.length === 0 ? (
        <Postbox title="Resultados">
          <GridEmptyState
            title="No se encontraron consultas"
            description="Prueba con otra palabra, por ejemplo «sucursales» o «usuarios»."
          />
        </Postbox>
      ) : (
        <Stack spacing={2.5}>
          {groups.map((group) => (
            <Postbox key={group.title} title={group.title} collapsible>
              <Stack spacing={2.5}>
                {group.queries.map((query, index) => (
                  <Fragment key={query.id}>
                    {index > 0 && <Divider />}
                    <QueryItem query={query} />
                  </Fragment>
                ))}
              </Stack>
            </Postbox>
          ))}
        </Stack>
      )}
    </>
  );
}

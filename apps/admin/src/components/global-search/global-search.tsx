import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import EastOutlined from '@mui/icons-material/EastOutlined';
import GroupOutlined from '@mui/icons-material/GroupOutlined';
import LocalFireDepartmentOutlined from '@mui/icons-material/LocalFireDepartmentOutlined';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import InputBase from '@mui/material/InputBase';
import Typography from '@mui/material/Typography';
import { useEffect, useId, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router';

import { tokens } from '@/theme';

import {
  MIN_TERM_LENGTH,
  normalize,
  useGlobalSearch,
  type SearchKind,
  type SearchResult,
} from './use-global-search';

const icons: Record<SearchKind, ReactNode> = {
  page: <EastOutlined fontSize="small" />,
  client: <BusinessOutlined fontSize="small" />,
  branch: <PlaceOutlined fontSize="small" />,
  system: <LocalFireDepartmentOutlined fontSize="small" />,
  user: <GroupOutlined fontSize="small" />,
};

function Highlight({ text, term }: { text: string; term: string }) {
  const query = normalize(term.trim());
  const index = query ? normalize(text).indexOf(query) : -1;
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <Box component="mark" sx={{ bgcolor: 'transparent', color: 'inherit', fontWeight: 700 }}>
        {text.slice(index, index + query.length)}
      </Box>
      {text.slice(index + query.length)}
    </>
  );
}

function Key({ children }: { children: ReactNode }) {
  return (
    <Box
      component="kbd"
      sx={{
        px: 0.75,
        py: 0.125,
        border: 1,
        borderColor: 'divider',
        borderRadius: 0.75,
        bgcolor: 'background.paper',
        fontFamily: 'inherit',
        fontSize: 12,
        color: 'text.primary',
      }}
    >
      {children}
    </Box>
  );
}

function useDebounced(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
}

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      sx={{ '& .MuiDialog-container': { alignItems: 'flex-start' } }}
      slotProps={{
        paper: {
          'aria-label': 'Buscar en Nimzo',
          sx: { mt: { xs: 2, sm: '12vh' }, mx: 2, width: 'calc(100% - 32px)' },
        },
      }}
    >
      {open && <SearchPanel onClose={onClose} />}
    </Dialog>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const term = useDebounced(input.trim(), 250);
  const { groups, loading, failed } = useGlobalSearch(term);
  const [activeIndex, setActiveIndex] = useState(0);
  const baseId = useId();
  const listId = `${baseId}-list`;

  const flat = useMemo(() => groups.flatMap((group) => group.results), [groups]);
  const optionId = (result: SearchResult) => `${baseId}-${result.key.replace(/[^a-z0-9-]/gi, '-')}`;
  const active = flat[Math.min(activeIndex, flat.length - 1)];

  useEffect(() => {
    if (!active) return;
    document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
  });

  function go(result: SearchResult) {
    onClose();
    navigate(result.to);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (flat.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % flat.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + flat.length) % flat.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(flat.length - 1);
    } else if (event.key === 'Enter' && active) {
      event.preventDefault();
      go(active);
    }
  }

  const waitingForMore = input.trim().length > 0 && input.trim().length < MIN_TERM_LENGTH;
  const searching = input.trim() !== term || loading;
  const noResults = term.length >= MIN_TERM_LENGTH && !searching && flat.length === 0;
  const status = noResults
    ? `Sin resultados para ${term}`
    : term && !searching
      ? `${flat.length} resultados`
      : '';

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          minHeight: 56,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <SearchIcon sx={{ color: 'text.secondary' }} />
        <InputBase
          autoFocus
          fullWidth
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Buscar clientes, sucursales, sistemas, usuarios o páginas"
          inputProps={{
            role: 'combobox',
            'aria-label': 'Buscar en Nimzo',
            'aria-expanded': flat.length > 0,
            'aria-controls': listId,
            'aria-autocomplete': 'list',
            'aria-activedescendant': active ? optionId(active) : undefined,
          }}
          sx={{ fontSize: 16 }}
        />
        {searching && term.length >= MIN_TERM_LENGTH && (
          <CircularProgress size={18} aria-label="Buscando" />
        )}
        <Key>Esc</Key>
      </Box>

      <Box sx={{ maxHeight: { xs: '60vh', sm: '56vh' }, overflowY: 'auto', py: 0.5 }}>
        {failed && (
          <Typography sx={{ px: 2, py: 1.5 }} color="error">
            No se pudo buscar. Revisa tu conexión e intenta de nuevo.
          </Typography>
        )}

        <Box
          component="ul"
          id={listId}
          role="listbox"
          aria-label="Resultados"
          sx={{ listStyle: 'none', m: 0, p: 0 }}
        >
          {groups.map((group) => {
            const headingId = `${baseId}-${group.kind}`;
            return (
              <Box component="li" role="presentation" key={group.kind}>
                <Typography
                  id={headingId}
                  variant="body2"
                  sx={{ px: 2, pt: 1.25, pb: 0.5, fontWeight: 600, color: 'text.secondary' }}
                >
                  {group.title}
                </Typography>
                <Box
                  component="ul"
                  role="group"
                  aria-labelledby={headingId}
                  sx={{ listStyle: 'none', m: 0, p: 0 }}
                >
                  {group.results.map((result) => {
                    const isActive = result.key === active?.key;
                    return (
                      <Box
                        component="li"
                        role="option"
                        key={result.key}
                        id={optionId(result)}
                        aria-selected={isActive}
                        onMouseMove={() => setActiveIndex(flat.indexOf(result))}
                        onClick={() => go(result)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          minHeight: 48,
                          px: 2,
                          cursor: 'pointer',
                          bgcolor: isActive ? tokens.rowAlt : 'transparent',
                          boxShadow: isActive ? `inset 3px 0 0 ${tokens.tealText}` : 'none',
                          color: 'text.secondary',
                        }}
                      >
                        {icons[result.kind]}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography noWrap sx={{ color: 'text.primary' }}>
                            <Highlight text={result.label} term={term} />
                          </Typography>
                          {result.detail && (
                            <Typography noWrap variant="body2" color="text.secondary">
                              <Highlight text={result.detail} term={term} />
                            </Typography>
                          )}
                        </Box>
                        {result.inactive && (
                          <Chip size="small" variant="outlined" label="Inactivo" />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </Box>

        {waitingForMore && (
          <Typography sx={{ px: 2, py: 1.5 }} color="text.secondary">
            Escribe al menos {MIN_TERM_LENGTH} letras para buscar en clientes, sucursales, sistemas
            y usuarios.
          </Typography>
        )}
        {noResults && (
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 600 }} gutterBottom>
              Sin resultados para «{term}»
            </Typography>
            <Typography color="text.secondary">
              Revisa la ortografía o busca por otro dato: RFC, ciudad o correo.
            </Typography>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          display: { xs: 'none', sm: 'flex' },
          '@media (pointer: coarse)': { display: 'none' },
          alignItems: 'center',
          gap: 2,
          px: 2,
          py: 1,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.default',
          color: 'text.secondary',
          fontSize: 12,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Key>↑</Key>
          <Key>↓</Key>
          para moverte
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Key>Enter</Key>
          para abrir
        </Box>
      </Box>

      <Box role="status" className="visually-hidden">
        {status}
      </Box>
    </>
  );
}

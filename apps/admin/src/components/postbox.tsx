import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useId, useState, type ReactNode } from 'react';

type PostboxProps = {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  collapsible?: boolean;
  flush?: boolean;
};

export function Postbox({
  title,
  children,
  action,
  collapsible = false,
  flush = false,
}: PostboxProps) {
  const [open, setOpen] = useState(true);
  const bodyId = useId();

  return (
    <Paper variant="outlined" component="section" aria-label={title}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          minHeight: 44,
          px: 2,
          borderBottom: open ? 1 : 0,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h2" sx={{ flex: 1 }}>
          {title}
        </Typography>
        {action}
        {collapsible && (
          <IconButton
            size="small"
            className="touch-target"
            aria-expanded={open}
            aria-controls={bodyId}
            aria-label={open ? `Contraer ${title}` : `Expandir ${title}`}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </IconButton>
        )}
      </Box>
      <Collapse in={open} id={bodyId}>
        <Box sx={{ p: flush ? 0 : 2 }}>{children}</Box>
      </Collapse>
    </Paper>
  );
}

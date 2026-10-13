import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { styled } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import logoColor from '@nimzo/brand/logos/logo-horizontal-color.webp';
import { userRoleLabels } from '@nimzo/shared';
import { useGetIdentity, useLogout, useMenu } from '@refinedev/core';
import { useState } from 'react';
import { Link, Outlet } from 'react-router';

import type { Identity } from '@/providers/auth-provider';
import { theme, tokens } from '@/theme';

const SIDEBAR_WIDTH = 256;

// Cast keeps ListItemButton's polymorphic `component` prop after styling.
const NavItem = styled(ListItemButton)(({ theme }) => ({
  borderRadius: 10,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(0.5),
  paddingBlock: theme.spacing(1),
  '& .MuiListItemIcon-root': { color: tokens.muted, minWidth: 36 },
  '&:hover': { backgroundColor: tokens.stone, color: theme.palette.text.primary },
  '&.Mui-selected, &.Mui-selected:hover': {
    backgroundColor: tokens.stone,
    color: theme.palette.text.primary,
    '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
    '& .MuiListItemText-primary': { fontWeight: 600 },
  },
})) as typeof ListItemButton;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { menuItems, selectedKey } = useMenu();
  const { data: identity } = useGetIdentity<Identity>();
  const { mutate: logout } = useLogout();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
      <Box
        component={Link}
        to="/"
        onClick={onNavigate}
        sx={{ display: 'block', px: 1.5, pt: 1, pb: 4 }}
      >
        <Box
          component="img"
          src={logoColor}
          alt="Nimzo, ir al inicio"
          sx={{ height: 40, display: 'block' }}
        />
      </Box>

      <Box component="nav" aria-label="Navegación principal" sx={{ flex: 1 }}>
        <List disablePadding>
          {menuItems.map((item) => (
            <NavItem
              key={item.key}
              component={Link}
              to={item.route ?? '/'}
              selected={item.key === selectedKey}
              onClick={onNavigate}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { fontWeight: 500 } }} />
            </NavItem>
          ))}
        </List>
      </Box>

      {identity && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            borderRadius: '10px',
            bgcolor: 'background.paper',
            boxShadow: `inset 0 0 0 1px ${tokens.hairline}`,
          }}
        >
          <Avatar
            sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 14, fontWeight: 600 }}
          >
            {initials(identity.fullName)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography noWrap variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {identity.fullName}
            </Typography>
            <Typography noWrap variant="body2" color="text.secondary">
              {userRoleLabels[identity.role]}
            </Typography>
          </Box>
          <Tooltip title="Cerrar sesión">
            <IconButton aria-label="Cerrar sesión" size="small" onClick={() => logout()}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}

const drawerPaper = {
  width: SIDEBAR_WIDTH,
  bgcolor: 'background.default',
  border: 'none',
  boxShadow: `inset -1px 0 0 ${tokens.hairline}`,
} as const;

/** Authenticated shell: fixed sidebar on desktop, collapsible drawer on small screens. */
export function AppLayout() {
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isDesktop ? (
        <Drawer
          variant="permanent"
          slotProps={{ paper: { sx: drawerPaper } }}
          sx={{ width: SIDEBAR_WIDTH, flexShrink: 0 }}
        >
          <SidebarContent />
        </Drawer>
      ) : (
        <>
          <AppBar
            position="fixed"
            color="inherit"
            sx={{ bgcolor: 'background.default', boxShadow: `inset 0 -1px 0 ${tokens.hairline}` }}
          >
            <Toolbar>
              <IconButton
                edge="start"
                aria-label="Abrir menú"
                onClick={() => setOpen(true)}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
              <Box component="img" src={logoColor} alt="Nimzo" sx={{ height: 28 }} />
            </Toolbar>
          </AppBar>
          <Drawer
            open={open}
            onClose={() => setOpen(false)}
            slotProps={{ paper: { sx: drawerPaper } }}
          >
            <SidebarContent onNavigate={() => setOpen(false)} />
          </Drawer>
        </>
      )}

      <Box
        component="main"
        sx={{ flex: 1, minWidth: 0, px: { xs: 2, sm: 4, lg: 6 }, pt: { xs: 11, md: 6 }, pb: 6 }}
      >
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

import AddIcon from '@mui/icons-material/Add';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import iconWhite from '@nimzo/brand/logos/icon-white.webp';
import { useGetIdentity, useLogout, useMenu, type TreeMenuItem } from '@refinedev/core';
import { useState, type ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router';

import type { Identity } from '@/providers/auth-provider';
import { ADMIN_BAR_HEIGHT, theme, tokens } from '@/theme';

const SIDEBAR_WIDTH = 200;
const SIDEBAR_COLLAPSED_WIDTH = 56;
const COLLAPSED_KEY = 'nimzo.sidebar.collapsed';

export type SubmenuItem = { label: string; to: string };

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function AdminBar({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const { data: identity } = useGetIdentity<Identity>();
  const { mutate: logout } = useLogout();
  const [addAnchor, setAddAnchor] = useState<HTMLElement | null>(null);
  const [userAnchor, setUserAnchor] = useState<HTMLElement | null>(null);

  const barButton = {
    color: tokens.white,
    minHeight: ADMIN_BAR_HEIGHT,
    borderRadius: 0,
    px: 1.25,
    fontWeight: 500,
    '&:hover, &[aria-expanded="true"]': { bgcolor: tokens.sidebarSub, color: tokens.sidebarHover },
  } as const;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: tokens.adminBar,
        height: ADMIN_BAR_HEIGHT,
        zIndex: (t) => t.zIndex.drawer + 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', pr: 1 }}>
        {onOpenMenu && (
          <IconButton aria-label="Abrir menú" onClick={onOpenMenu} sx={{ ...barButton, px: 1.5 }}>
            <MenuIcon fontSize="small" />
          </IconButton>
        )}
        <Button component={Link} to="/" sx={barButton} aria-label="Nimzo, ir al escritorio">
          <Box component="img" src={iconWhite} alt="" sx={{ height: 20, mr: 1 }} />
          Nimzo
        </Button>
        <Button
          sx={barButton}
          startIcon={<AddIcon fontSize="small" />}
          aria-haspopup="menu"
          aria-expanded={Boolean(addAnchor)}
          onClick={(event) => setAddAnchor(event.currentTarget)}
        >
          Agregar
        </Button>
        <Menu anchorEl={addAnchor} open={Boolean(addAnchor)} onClose={() => setAddAnchor(null)}>
          <MenuItem component={Link} to="/clients/create" onClick={() => setAddAnchor(null)}>
            Cliente
          </MenuItem>
          <MenuItem component={Link} to="/branches/create" onClick={() => setAddAnchor(null)}>
            Sucursal
          </MenuItem>
        </Menu>

        <Box sx={{ flex: 1 }} />

        {identity && (
          <>
            <Button
              sx={barButton}
              aria-haspopup="menu"
              aria-expanded={Boolean(userAnchor)}
              onClick={(event) => setUserAnchor(event.currentTarget)}
              endIcon={
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: 11,
                    fontWeight: 600,
                    bgcolor: tokens.tealStrong,
                  }}
                >
                  {initials(identity.fullName)}
                </Avatar>
              }
            >
              Hola, {identity.fullName}
            </Button>
            <Menu
              anchorEl={userAnchor}
              open={Boolean(userAnchor)}
              onClose={() => setUserAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Box sx={{ px: 2, py: 1, minWidth: 220 }}>
                <Typography sx={{ fontWeight: 600 }}>{identity.fullName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {identity.email}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => logout()}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Cerrar sesión
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>
    </AppBar>
  );
}

function SidebarLink({
  to,
  icon,
  label,
  active,
  collapsed,
  onNavigate,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const link = (
    <Box
      component={Link}
      to={to}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        minHeight: 44,
        px: collapsed ? 0 : 1.5,
        justifyContent: collapsed ? 'center' : 'flex-start',
        color: active ? tokens.white : 'rgba(255,255,255,0.85)',
        bgcolor: active ? tokens.tealStrong : 'transparent',
        textDecoration: 'none',
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        '& svg': { fontSize: 20, opacity: active ? 1 : 0.75 },
        '&:hover': active ? {} : { bgcolor: tokens.sidebarSub, color: tokens.sidebarHover },
        '&:focus-visible': { outline: `2px solid ${tokens.sidebarHover}`, outlineOffset: -2 },
        '&::after': active
          ? {
              content: '""',
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              border: '8px solid transparent',
              borderRightColor: tokens.canvas,
            }
          : undefined,
      }}
    >
      {icon}
      {!collapsed && label}
    </Box>
  );

  return collapsed ? (
    <Tooltip title={label} placement="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}

function Sidebar({
  collapsed,
  onToggleCollapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
}) {
  const { menuItems, selectedKey } = useMenu();
  const { pathname } = useLocation();

  return (
    <Box
      component="nav"
      aria-label="Menú principal"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: tokens.sidebar,
        pt: 1.5,
      }}
    >
      <Box sx={{ flex: 1 }}>
        {menuItems.map((item: TreeMenuItem) => {
          const route = item.route ?? '/';
          const active =
            item.key === selectedKey || (route !== '/' && pathname.startsWith(`${route}/`));
          const submenu = (item.meta?.submenu as SubmenuItem[] | undefined) ?? [];
          return (
            <Box key={item.key}>
              <SidebarLink
                to={route}
                icon={item.icon}
                label={item.label ?? item.name}
                active={active}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
              {active && !collapsed && submenu.length > 0 && (
                <Box
                  component="ul"
                  sx={{ listStyle: 'none', m: 0, py: 0.75, pl: 0, bgcolor: tokens.sidebarSub }}
                >
                  {submenu.map((sub) => {
                    const current = pathname === sub.to;
                    return (
                      <li key={sub.to}>
                        <Box
                          component={Link}
                          to={sub.to}
                          onClick={onNavigate}
                          aria-current={current ? 'page' : undefined}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            minHeight: 36,
                            pl: 5.75,
                            pr: 1.5,
                            fontSize: 13,
                            textDecoration: 'none',
                            color: current ? tokens.white : 'rgba(255,255,255,0.8)',
                            fontWeight: current ? 600 : 400,
                            '&:hover': { color: tokens.sidebarHover },
                            '&:focus-visible': {
                              outline: `2px solid ${tokens.sidebarHover}`,
                              outlineOffset: -2,
                            },
                          }}
                        >
                          {sub.label}
                        </Box>
                      </li>
                    );
                  })}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {onToggleCollapsed && (
        <Box
          component="button"
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 1.25,
            minHeight: 44,
            px: collapsed ? 0 : 1.5,
            mb: 1,
            border: 0,
            bgcolor: 'transparent',
            color: 'rgba(255,255,255,0.72)',
            font: 'inherit',
            fontSize: 13,
            cursor: 'pointer',
            '&:hover': { color: tokens.sidebarHover },
            '&:focus-visible': { outline: `2px solid ${tokens.sidebarHover}`, outlineOffset: -2 },
          }}
        >
          {collapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
          {!collapsed && 'Contraer menú'}
        </Box>
      )}
    </Box>
  );
}

export function AppLayout() {
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleCollapsed() {
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, value ? '0' : '1');
      } catch {}
      return !value;
    });
  }

  const width = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AdminBar onOpenMenu={isDesktop ? undefined : () => setMobileOpen(true)} />

      {isDesktop ? (
        <Box
          sx={{
            position: 'fixed',
            top: ADMIN_BAR_HEIGHT,
            bottom: 0,
            left: 0,
            width,
            zIndex: (t) => t.zIndex.drawer,
            transition: 'width 200ms ease-out',
          }}
        >
          <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
        </Box>
      ) : (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          slotProps={{
            paper: { sx: { width: 240, bgcolor: tokens.sidebar, pt: `${ADMIN_BAR_HEIGHT}px` } },
          }}
        >
          <Sidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          ml: isDesktop ? `${width}px` : 0,
          pt: `${ADMIN_BAR_HEIGHT + 20}px`,
          px: { xs: 2, sm: 2.5 },
          pb: 5,
          transition: 'margin-left 200ms ease-out',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

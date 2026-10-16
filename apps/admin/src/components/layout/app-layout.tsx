import AddIcon from '@mui/icons-material/Add';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListSubheader from '@mui/material/ListSubheader';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import iconWhite from '@nimzo/brand/logos/icon-white.webp';
import { useGetIdentity, useLogout, useMenu, type TreeMenuItem } from '@refinedev/core';
import { lazy, Suspense, useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router';

import type { Identity } from '@/providers/auth-provider';
import { ADMIN_BAR_HEIGHT, theme, tokens } from '@/theme';

const loadGlobalSearch = () => import('@/components/global-search/global-search');

const GlobalSearch = lazy(() =>
  loadGlobalSearch().then((module) => ({ default: module.GlobalSearch })),
);

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

const adminBarMenuProps = {
  slotProps: {
    paper: {
      square: true,
      sx: {
        mt: 0,
        minWidth: 200,
        bgcolor: tokens.adminBar,
        color: tokens.white,
        boxShadow: '0 3px 5px rgba(0, 0, 0, 0.2)',
      },
    },
    list: {
      sx: {
        py: 0.75,
        '& .MuiMenuItem-root': {
          minHeight: 36,
          px: 1.75,
          fontSize: 14,
          color: 'rgba(255,255,255,0.9)',
        },
        '& .MuiMenuItem-root:hover, & .MuiMenuItem-root.Mui-focusVisible': {
          bgcolor: tokens.sidebarSub,
          color: tokens.sidebarHover,
        },
        '& .MuiMenuItem-root.Mui-focusVisible': {
          outline: `2px solid ${tokens.sidebarHover}`,
          outlineOffset: -2,
        },
        '& .MuiListItemIcon-root': { color: 'inherit', minWidth: 30 },
        '& .MuiDivider-root': { borderColor: 'rgba(255,255,255,0.14)', my: 0.75 },
      },
    },
  },
  anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
  transformOrigin: { vertical: 'top', horizontal: 'left' },
} as const;

function AdminBar({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const { data: identity } = useGetIdentity<Identity>();
  const { mutate: logout } = useLogout();
  const [addAnchor, setAddAnchor] = useState<HTMLElement | null>(null);
  const [userAnchor, setUserAnchor] = useState<HTMLElement | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const shortcut = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘K' : 'Ctrl K';

  useEffect(() => {
    function handleShortcut(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const barButton = {
    color: tokens.white,
    minHeight: ADMIN_BAR_HEIGHT,
    borderRadius: 0,
    px: 1.25,
    fontWeight: 500,
    '&:hover, &[aria-expanded="true"]': { bgcolor: tokens.sidebarSub, color: tokens.sidebarHover },
    '&.Mui-focusVisible': { outline: `2px solid ${tokens.sidebarHover}`, outlineOffset: -2 },
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
        <Menu
          {...adminBarMenuProps}
          anchorEl={addAnchor}
          open={Boolean(addAnchor)}
          onClose={() => setAddAnchor(null)}
        >
          <MenuItem component={Link} to="/clients/create" onClick={() => setAddAnchor(null)}>
            Cliente
          </MenuItem>
          <MenuItem component={Link} to="/branches/create" onClick={() => setAddAnchor(null)}>
            Sucursal
          </MenuItem>
          <MenuItem component={Link} to="/users/create" onClick={() => setAddAnchor(null)}>
            Usuario
          </MenuItem>
        </Menu>

        <Button
          sx={barButton}
          startIcon={<SearchIcon fontSize="small" />}
          aria-haspopup="dialog"
          aria-keyshortcuts="Meta+K Control+K"
          onClick={() => setSearchOpen(true)}
          onMouseEnter={() => void loadGlobalSearch()}
          onFocus={() => void loadGlobalSearch()}
        >
          Buscar
          <Box
            component="kbd"
            aria-hidden
            sx={{
              display: { xs: 'none', sm: 'inline' },
              '@media (pointer: coarse)': { display: 'none' },
              ml: 1,
              px: 0.75,
              border: '1px solid rgba(255,255,255,0.28)',
              borderRadius: 0.75,
              fontFamily: 'inherit',
              fontSize: 12,
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            {shortcut}
          </Box>
        </Button>
        {searchOpen && (
          <Suspense fallback={null}>
            <GlobalSearch open onClose={() => setSearchOpen(false)} />
          </Suspense>
        )}

        <Box sx={{ flex: 1 }} />

        {identity && (
          <>
            <Button
              sx={barButton}
              aria-haspopup="menu"
              aria-expanded={Boolean(userAnchor)}
              onClick={(event) => setUserAnchor(event.currentTarget)}
            >
              Hola, {identity.fullName}
              <Avatar
                sx={{
                  ml: 1,
                  width: 28,
                  height: 28,
                  bgcolor: tokens.tealText,
                  color: tokens.white,
                }}
              >
                <PersonIcon sx={{ fontSize: 20 }} />
              </Avatar>
            </Button>
            <Menu
              {...adminBarMenuProps}
              anchorEl={userAnchor}
              open={Boolean(userAnchor)}
              onClose={() => setUserAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <ListSubheader
                role="presentation"
                sx={{
                  px: 1.75,
                  py: 1,
                  minWidth: 220,
                  position: 'static',
                  lineHeight: 1.45,
                  bgcolor: 'transparent',
                  color: 'inherit',
                }}
              >
                <Typography sx={{ fontWeight: 600 }}>{identity.fullName}</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                  {identity.email}
                </Typography>
              </ListSubheader>
              <Divider component="li" role="separator" />
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
  return (
    <Box
      component={Link}
      to={to}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      aria-label={collapsed ? label : undefined}
      className="sidebar-link"
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
}

function SubmenuLinks({
  items,
  pathname,
  onNavigate,
  variant,
}: {
  items: SubmenuItem[];
  pathname: string;
  onNavigate?: () => void;
  variant: 'inline' | 'flyout';
}) {
  return (
    <>
      {items.map((sub) => {
        const current = pathname === sub.to;
        return (
          <li key={sub.to}>
            <Box
              component={Link}
              to={sub.to}
              onClick={onNavigate}
              aria-current={current ? 'page' : undefined}
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                minHeight: 36,
                pl: variant === 'inline' ? 5.75 : 2,
                pr: 2,
                fontSize: 13,
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                color: current ? tokens.white : 'rgba(255,255,255,0.8)',
                fontWeight: current ? 600 : 400,
                '&:hover': { color: tokens.sidebarHover },
                '&:focus-visible': {
                  outline: `2px solid ${tokens.sidebarHover}`,
                  outlineOffset: -2,
                },
                '&::before':
                  current && variant === 'flyout'
                    ? {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 6,
                        bottom: 6,
                        width: 4,
                        bgcolor: tokens.teal,
                      }
                    : undefined,
              }}
            >
              {sub.label}
            </Box>
          </li>
        );
      })}
    </>
  );
}

function SidebarItem({
  item,
  active,
  collapsed,
  flyouts,
  pathname,
  onNavigate,
}: {
  item: TreeMenuItem;
  active: boolean;
  collapsed: boolean;
  flyouts: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  const route = item.route ?? '/';
  const label = item.label ?? item.name;
  const submenu = (item.meta?.submenu as SubmenuItem[] | undefined) ?? [];
  const showInline = active && !collapsed && submenu.length > 0;
  const showFlyout = flyouts && !showInline && (collapsed || submenu.length > 0);

  function handleKeyDown(event: KeyboardEvent<HTMLLIElement>) {
    if (event.key !== 'Escape' || !showFlyout) return;
    setDismissed(true);
    event.currentTarget.querySelector<HTMLElement>('.sidebar-link')?.focus();
  }

  return (
    <Box
      component="li"
      onKeyDown={handleKeyDown}
      onMouseLeave={() => setDismissed(false)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setDismissed(false);
      }}
      data-dismissed={dismissed ? '' : undefined}
      sx={{
        position: 'relative',
        '&:hover > .sidebar-link': active
          ? {}
          : { bgcolor: tokens.sidebarSub, color: tokens.sidebarHover },
        ...(showFlyout && active
          ? {
              '&:not([data-dismissed]):hover > .sidebar-link::after, &:not([data-dismissed]):focus-within > .sidebar-link::after':
                { borderRightColor: tokens.tealStrong },
            }
          : {}),
        '&:not([data-dismissed]):hover > .sidebar-flyout, &:not([data-dismissed]):focus-within > .sidebar-flyout':
          { visibility: 'visible', opacity: 1, transitionDelay: '0s' },
      }}
    >
      <SidebarLink
        to={route}
        icon={item.icon}
        label={label}
        active={active}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />

      {showInline && (
        <Box
          component="ul"
          aria-label={label}
          sx={{ listStyle: 'none', m: 0, py: 0.75, pl: 0, bgcolor: tokens.sidebarSub }}
        >
          <SubmenuLinks
            items={submenu}
            pathname={pathname}
            onNavigate={onNavigate}
            variant="inline"
          />
        </Box>
      )}

      {showFlyout && (
        <Box
          className="sidebar-flyout"
          sx={{
            position: 'absolute',
            left: '100%',
            top: 0,
            zIndex: 1,
            minWidth: 180,
            bgcolor: tokens.adminBar,
            boxShadow: '0 3px 5px rgba(0, 0, 0, 0.2)',
            visibility: 'hidden',
            opacity: 0,
            transition: 'opacity 120ms ease-out, visibility 0s linear 150ms',
          }}
        >
          {collapsed && (
            <Box
              component={Link}
              to={route}
              onClick={onNavigate}
              tabIndex={-1}
              aria-hidden
              sx={{
                display: 'flex',
                alignItems: 'center',
                minHeight: 44,
                px: 2,
                fontSize: 14,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                color: active ? tokens.white : tokens.sidebarHover,
                bgcolor: active ? tokens.tealStrong : 'transparent',
              }}
            >
              {label}
            </Box>
          )}
          {submenu.length > 0 && (
            <Box
              component="ul"
              aria-label={label}
              sx={{ listStyle: 'none', m: 0, py: 0.75, pl: 0 }}
            >
              <SubmenuLinks
                items={submenu}
                pathname={pathname}
                onNavigate={onNavigate}
                variant="flyout"
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

function Sidebar({
  collapsed,
  flyouts = false,
  onToggleCollapsed,
  onNavigate,
}: {
  collapsed: boolean;
  flyouts?: boolean;
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
      <Box component="ul" sx={{ flex: 1, listStyle: 'none', m: 0, p: 0 }}>
        {menuItems.map((item: TreeMenuItem) => {
          const route = item.route ?? '/';
          const active =
            item.key === selectedKey || (route !== '/' && pathname.startsWith(`${route}/`));
          return (
            <SidebarItem
              key={item.key}
              item={item}
              active={active}
              collapsed={collapsed}
              flyouts={flyouts}
              pathname={pathname}
              onNavigate={onNavigate}
            />
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
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'fixed',
          top: 8,
          left: 8,
          zIndex: (t) => t.zIndex.tooltip,
          px: 2,
          py: 1.25,
          borderRadius: 1,
          bgcolor: tokens.white,
          color: tokens.tealDark,
          fontWeight: 600,
          textDecoration: 'none',
          outline: `2px solid ${tokens.tealDark}`,
          transform: 'translateY(-200%)',
          '&:focus': { transform: 'none' },
        }}
      >
        Saltar al contenido
      </Box>
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
          <Sidebar collapsed={collapsed} flyouts onToggleCollapsed={toggleCollapsed} />
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
        id="main-content"
        tabIndex={-1}
        sx={{
          '&:focus': { outline: 'none' },
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

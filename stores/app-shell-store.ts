// stores/app-shell-store.ts
import { create } from "zustand";
import type { ResolvedRoute } from "@/types/routes";

export interface AppShellRouteState {
  pathname: string;
  name: string;
  layout: "none" | "public" | "dashboard" | "admin";
  routeConfig: ResolvedRoute | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isVip: boolean;
  userId?: string;
  hasAccess: boolean;
  requireAuth: boolean;
  requireAdmin: boolean;
  styleGroup?: string;
}

export interface AppShellTopMiddleState {
  enabled: boolean;
  visible: boolean;
  isHiddenOnScroll: boolean;
  height: number;
  top: number;
  bottom: number;
  zIndex: number;
}

export interface AppShellBreadcrumbsState {
  enabled: boolean;
  visible: boolean;
  height: number;
  top: number;
  bottom: number;
  zIndex: number;
}

export interface AppShellFloatingState {
  fabEnabled: boolean;
  fabVisible: boolean;
  fabCount: number;
  fabPosition: { x: number; y: number } | null;
  fabSize: { width: number; height: number } | null;
  dockEnabled: boolean;
  dockVisible: boolean;
  dockCount: number;
  occupiedZones: string[];
  safeMargins: { top: number; right: number; bottom: number; left: number };
}

export interface AppShellFooterState {
  enabled: boolean;
  visible: boolean;
}

export interface AppShellSidebarsState {
  left: { enabled: boolean; open: boolean };
  right: { enabled: boolean; open: boolean };
}

export interface AppShellScrollState {
  scrollY: number;
  isScrolled: boolean;
  scrollDirection: "up" | "down" | "none";
}

export interface AppShellViewportState {
  width: number;
  height: number;
}

export type OverridableKey = "topMiddle" | "breadcrumbs" | "floating" | "footer";

export interface AppShellOverride {
  key: OverridableKey;
  value: Partial<
    | AppShellTopMiddleState
    | AppShellBreadcrumbsState
    | AppShellFloatingState
    | AppShellFooterState
  >;
  componentId: string;
}

export interface AppShellState {
  route: AppShellRouteState;
  topMiddle: AppShellTopMiddleState;
  breadcrumbs: AppShellBreadcrumbsState;
  floating: AppShellFloatingState;
  footer: AppShellFooterState;
  sidebars: AppShellSidebarsState;
  scroll: AppShellScrollState;
  viewport: AppShellViewportState;
  overrides: AppShellOverride[];

  // Actions
  syncRoute: (
    route: ResolvedRoute,
    user: { isAuthenticated: boolean; isAdmin: boolean; isVip: boolean; userId?: string }
  ) => void;
  resetForNoneLayout: () => void;
  setTopMiddle: (patch: Partial<AppShellTopMiddleState>) => void;
  setBreadcrumbs: (patch: Partial<AppShellBreadcrumbsState>) => void;
  setFloating: (patch: Partial<AppShellFloatingState>) => void;
  setFooter: (patch: Partial<AppShellFooterState>) => void;
  setSidebars: (patch: Partial<AppShellSidebarsState>) => void;
  setScroll: (patch: Partial<AppShellScrollState>) => void;
  setViewport: (patch: Partial<AppShellViewportState>) => void;
  setLeftOpen: (open: boolean) => void;
  setRightOpen: (open: boolean) => void;
  requestOverride: (
    key: OverridableKey,
    value: Partial<
      | AppShellTopMiddleState
      | AppShellBreadcrumbsState
      | AppShellFloatingState
      | AppShellFooterState
    >,
    componentId: string
  ) => void;
  clearOverride: (componentId: string) => void;
}

const defaultRoute: AppShellRouteState = {
  pathname: "",
  name: "Default",
  layout: "public",
  routeConfig: null,
  isAuthenticated: false,
  isAdmin: false,
  isVip: false,
  userId: undefined,
  hasAccess: true,
  requireAuth: false,
  requireAdmin: false,
  styleGroup: undefined,
};

const defaultTopMiddle: AppShellTopMiddleState = {
  enabled: false,
  visible: true,
  isHiddenOnScroll: false,
  height: 0,
  top: 0,
  bottom: 0,
  zIndex: 50,
};

const defaultBreadcrumbs: AppShellBreadcrumbsState = {
  enabled: false,
  visible: false,
  height: 0,
  top: 0,
  bottom: 0,
  zIndex: 40,
};

const defaultFloating: AppShellFloatingState = {
  fabEnabled: false,
  fabVisible: false,
  fabCount: 0,
  fabPosition: null,
  fabSize: null,
  dockEnabled: false,
  dockVisible: false,
  dockCount: 0,
  occupiedZones: [],
  safeMargins: { top: 0, right: 0, bottom: 0, left: 0 },
};

const defaultFooter: AppShellFooterState = {
  enabled: false,
  visible: false,
};

const defaultSidebars: AppShellSidebarsState = {
  left: { enabled: false, open: false },
  right: { enabled: false, open: false },
};

const defaultScroll: AppShellScrollState = {
  scrollY: 0,
  isScrolled: false,
  scrollDirection: "none",
};

const defaultViewport: AppShellViewportState = {
  width: typeof window !== "undefined" ? window.innerWidth : 0,
  height: typeof window !== "undefined" ? window.innerHeight : 0,
};

export const useAppShellStore = create<AppShellState>((set) => ({
  route: defaultRoute,
  topMiddle: defaultTopMiddle,
  breadcrumbs: defaultBreadcrumbs,
  floating: defaultFloating,
  footer: defaultFooter,
  sidebars: defaultSidebars,
  scroll: defaultScroll,
  viewport: defaultViewport,
  overrides: [],

  syncRoute: (route, user) =>
    set(() => {
      const isNone = route.layout === "none";
      return {
        route: {
          pathname: route.pathname,
          name: route.name,
          layout: route.layout,
          routeConfig: route,
          isAuthenticated: user.isAuthenticated,
          isAdmin: user.isAdmin,
          isVip: user.isVip,
          userId: user.userId,
          hasAccess: route.hasAccess,
          requireAuth: route.requireAuth,
          requireAdmin: route.requireAdmin,
          styleGroup: route.styleGroup,
        },
        topMiddle: {
          ...defaultTopMiddle,
          enabled: !isNone && route.topMiddle.enabled,
          isHiddenOnScroll: route.topMiddle.hideOnScroll,
          zIndex: 50,
        },
        breadcrumbs: {
          ...defaultBreadcrumbs,
          enabled: !isNone && route.breadcrumbs,
          visible: !isNone && route.breadcrumbs && route.topMiddle.breadcrumbs.length > 0,
          zIndex: 40,
        },
        sidebars: {
          left: { enabled: !isNone && route.leftBar.enabled, open: false },
          right: { enabled: !isNone && route.rightBar.enabled, open: false },
        },
        floating: {
          ...defaultFloating,
          fabEnabled: !isNone && route.fabActions.enabled,
          fabCount: !isNone ? route.fabActions.actions.length : 0,
          dockEnabled: !isNone && route.floatingDock.enabled,
          dockCount: !isNone ? route.floatingDock.links.length : 0,
          dockVisible: !isNone && route.floatingDock.enabled,
        },
        footer: {
          enabled: !isNone && Boolean(route.footer?.enabled),
          visible: !isNone && Boolean(route.footer?.enabled),
        },
        scroll: defaultScroll,
        overrides: [],
      };
    }),

  resetForNoneLayout: () =>
    set(() => ({
      route: { ...defaultRoute, layout: "none" },
      topMiddle: { ...defaultTopMiddle, enabled: false, visible: false },
      breadcrumbs: { ...defaultBreadcrumbs, enabled: false, visible: false },
      sidebars: defaultSidebars,
      floating: defaultFloating,
      footer: defaultFooter,
      scroll: defaultScroll,
      overrides: [],
    })),

  setTopMiddle: (patch) =>
    set((state) => ({ topMiddle: { ...state.topMiddle, ...patch } })),

  setBreadcrumbs: (patch) =>
    set((state) => ({ breadcrumbs: { ...state.breadcrumbs, ...patch } })),

  setFloating: (patch) =>
    set((state) => ({ floating: { ...state.floating, ...patch } })),

  setFooter: (patch) =>
    set((state) => ({ footer: { ...state.footer, ...patch } })),

  setSidebars: (patch) =>
    set((state) => ({ sidebars: { ...state.sidebars, ...patch } })),

  setScroll: (patch) =>
    set((state) => ({ scroll: { ...state.scroll, ...patch } })),

  setViewport: (patch) =>
    set((state) => ({ viewport: { ...state.viewport, ...patch } })),

  setLeftOpen: (open) =>
    set((state) => ({
      sidebars: { ...state.sidebars, left: { ...state.sidebars.left, open } },
    })),

  setRightOpen: (open) =>
    set((state) => ({
      sidebars: { ...state.sidebars, right: { ...state.sidebars.right, open } },
    })),

  requestOverride: (key, value, componentId) =>
    set((state) => {
      const remaining = state.overrides.filter(
        (o) => !(o.componentId === componentId && o.key === key)
      );
      return {
        overrides: [...remaining, { key, value, componentId }],
      };
    }),

  clearOverride: (componentId) =>
    set((state) => ({
      overrides: state.overrides.filter((o) => o.componentId !== componentId),
    })),
}));

export function getEffectiveTopMiddle(state: AppShellState): AppShellTopMiddleState {
  const overrides = state.overrides.filter((o) => o.key === "topMiddle");
  return overrides.reduce<AppShellTopMiddleState>(
    (acc, curr) => ({ ...acc, ...(curr.value as Partial<AppShellTopMiddleState>) }),
    state.topMiddle
  );
}

export function useEffectiveTopMiddle(): AppShellTopMiddleState {
  return useAppShellStore(getEffectiveTopMiddle);
}

export function getEffectiveBreadcrumbs(state: AppShellState): AppShellBreadcrumbsState {
  const overrides = state.overrides.filter((o) => o.key === "breadcrumbs");
  return overrides.reduce<AppShellBreadcrumbsState>(
    (acc, curr) => ({ ...acc, ...(curr.value as Partial<AppShellBreadcrumbsState>) }),
    state.breadcrumbs
  );
}

export function useEffectiveBreadcrumbs(): AppShellBreadcrumbsState {
  return useAppShellStore(getEffectiveBreadcrumbs);
}

export function getEffectiveFloating(state: AppShellState): AppShellFloatingState {
  const overrides = state.overrides.filter((o) => o.key === "floating");
  return overrides.reduce<AppShellFloatingState>(
    (acc, curr) => ({ ...acc, ...(curr.value as Partial<AppShellFloatingState>) }),
    state.floating
  );
}

export function useEffectiveFloating(): AppShellFloatingState {
  return useAppShellStore(getEffectiveFloating);
}

export function getEffectiveFooter(state: AppShellState): AppShellFooterState {
  const overrides = state.overrides.filter((o) => o.key === "footer");
  return overrides.reduce<AppShellFooterState>(
    (acc, curr) => ({ ...acc, ...(curr.value as Partial<AppShellFooterState>) }),
    state.footer
  );
}

export function useEffectiveFooter(): AppShellFooterState {
  return useAppShellStore(getEffectiveFooter);
}

export function getAppShellStickyOffset(state: AppShellState): number {
  if (state.route.layout === "none") return 0;
  let offset = 0;
  const tm = getEffectiveTopMiddle(state);
  const bc = getEffectiveBreadcrumbs(state);
  if (tm.enabled && tm.visible) {
    offset += tm.height;
  }
  if (bc.enabled && bc.visible) {
    offset += bc.height;
  }
  return offset;
}

export function useAppShellStickyOffset(): number {
  return useAppShellStore((state) => getAppShellStickyOffset(state));
}

export function useAppShell() {
  const state = useAppShellStore();
  const stickyOffset = getAppShellStickyOffset(state);
  const effectiveTopMiddle = getEffectiveTopMiddle(state);
  const effectiveBreadcrumbs = getEffectiveBreadcrumbs(state);
  const effectiveFloating = getEffectiveFloating(state);
  const effectiveFooter = getEffectiveFooter(state);

  return {
    route: state.route,
    layout: state.route.layout,
    topMiddle: effectiveTopMiddle,
    breadcrumbs: effectiveBreadcrumbs,
    floating: effectiveFloating,
    footer: effectiveFooter,
    sidebars: state.sidebars,
    scroll: state.scroll,
    viewport: state.viewport,
    overrides: state.overrides,
    requestOverride: state.requestOverride,
    clearOverride: state.clearOverride,
    stickyOffset,
  };
}

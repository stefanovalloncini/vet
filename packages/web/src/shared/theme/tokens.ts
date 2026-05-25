export const TOKEN = {
  colorAccent: "--color-accent",
  colorAccentHover: "--color-accent-hover",
  colorAccentSoft: "--color-accent-soft",
  colorAccentSoftHover: "--color-accent-soft-hover",
  colorBackground: "--color-background",
  colorBorder: "--color-border",
  colorBorderStrong: "--color-border-strong",
  colorDanger: "--color-danger",
  colorOverlay: "--color-overlay",
  colorSuccess: "--color-success",
  colorSurface: "--color-surface",
  colorSurfaceMuted: "--color-surface-muted",
  colorText: "--color-text",
  colorTextMuted: "--color-text-muted",
  colorTextSubtle: "--color-text-subtle",
  colorWarning: "--color-warning",
  motionBase: "--motion-base",
  motionFast: "--motion-fast",
  motionLayout: "--motion-layout",
  motionPress: "--motion-press",
  radiusLg: "--radius-lg",
  radiusMd: "--radius-md",
  radiusSm: "--radius-sm",
  radiusXl: "--radius-xl",
  shadowPopover: "--shadow-popover",
  shadowSoft: "--shadow-soft",
} as const;

export type TokenName = (typeof TOKEN)[keyof typeof TOKEN];

export function readToken(name: TokenName, root: HTMLElement = document.documentElement): string {
  if (typeof window === "undefined") return "";
  return window.getComputedStyle(root).getPropertyValue(name).trim();
}

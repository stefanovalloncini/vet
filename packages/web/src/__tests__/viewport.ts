const DEFAULT_WIDTH = 375;
let currentWidth = DEFAULT_WIDTH;

export function setViewport(width: number): void {
  currentWidth = width;
}

export function resetViewport(): void {
  currentWidth = DEFAULT_WIDTH;
}

function matchesQuery(query: string): boolean {
  const min = /\(min-width:\s*(\d+)px\)/.exec(query);
  if (min?.[1] !== undefined) return currentWidth >= Number(min[1]);
  const max = /\(max-width:\s*(\d+)px\)/.exec(query);
  if (max?.[1] !== undefined) return currentWidth <= Number(max[1]);
  return false;
}

export function installMatchMediaMock(): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList =>
      ({
        matches: matchesQuery(query),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  });
}

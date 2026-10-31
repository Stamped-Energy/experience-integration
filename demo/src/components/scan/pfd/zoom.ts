/** Viewer zoom (ported from PlantCraft diagrams/zoom.ts, Apache-2.0). */

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const MAX_ZOOM = 8;

export function fullView(width: number, height: number): ViewBox {
  return { x: 0, y: 0, w: width, h: height };
}

export function clampView(view: ViewBox, width: number, height: number): ViewBox {
  const w = Math.min(width, Math.max(width / MAX_ZOOM, view.w));
  const h = (w / width) * height;
  return {
    x: Math.min(width - w, Math.max(0, view.x)),
    y: Math.min(height - h, Math.max(0, view.y)),
    w,
    h,
  };
}

export function zoomAt(view: ViewBox, factor: number, px: number, py: number, width: number, height: number): ViewBox {
  const w = Math.min(width, Math.max(width / MAX_ZOOM, view.w / factor));
  const ratio = w / view.w;
  return clampView(
    { x: px - (px - view.x) * ratio, y: py - (py - view.y) * ratio, w, h: view.h * ratio },
    width,
    height,
  );
}

export function zoomLevel(view: ViewBox, width: number): number {
  return width / view.w;
}

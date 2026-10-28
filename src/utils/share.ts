import type { Project } from '../types';

/**
 * Encodes a project into a URL-safe compact string.
 */
export function encodeProjectToUrl(project: Project): string {
  // Only pack necessary data to keep URL / QR code compact
  const compact = {
    n: project.name,
    c: project.client,
    d: project.description,
    w: project.walls.map((w) => ({
      n: w.name,
      w: w.width,
      h: w.height,
      t: w.type,
      d: w.hasDoubleSide ? 1 : 0,
      o: w.openings.map((o) => ({
        t: o.type === 'puerta' ? 1 : 2,
        w: o.width,
        h: o.height,
      })),
    })),
    cl: project.ceilings.map((c) => ({
      n: c.name,
      w: c.width,
      l: c.length,
      d: c.dropHeight,
    })),
  };

  const jsonStr = JSON.stringify(compact);
  // Base64 encode supporting UTF-8
  const base64 = btoa(encodeURIComponent(jsonStr));
  return encodeURIComponent(base64);
}

/**
 * Decodes a project from a URL-safe compact string.
 */
export function decodeProjectFromUrl(encoded: string): Partial<Project> | null {
  try {
    const raw = decodeURIComponent(encoded);
    const jsonStr = decodeURIComponent(atob(raw));
    const compact = JSON.parse(jsonStr);

    interface CompactOpening {
      t: number;
      w: number;
      h: number;
    }

    interface CompactWall {
      n: string;
      w: number;
      h: number;
      t: 'tabique' | 'cieloraso' | 'revestimiento' | 'nicho' | 'mueble';
      d: number;
      o?: CompactOpening[];
    }

    interface CompactCeiling {
      n: string;
      w: number;
      l: number;
      d: number;
    }

    return {
      name: compact.n || 'Proyecto Compartido',
      client: compact.c || '',
      description: compact.d || '',
      walls: (compact.w || []).map((w: CompactWall) => ({
        id: Math.random().toString(36).substring(2, 9),
        name: w.n,
        width: Number(w.w),
        height: Number(w.h),
        type: w.t || 'tabique',
        hasDoubleSide: w.d === 1,
        openings: (w.o || []).map((o: CompactOpening) => ({
          id: Math.random().toString(36).substring(2, 9),
          type: o.t === 1 ? 'puerta' : 'ventana',
          width: Number(o.w),
          height: Number(o.h),
        })),
      })),
      ceilings: (compact.cl || []).map((c: CompactCeiling) => ({
        id: Math.random().toString(36).substring(2, 9),
        name: c.n,
        width: Number(c.w),
        length: Number(c.l),
        dropHeight: Number(c.d),
      })),
    };
  } catch (err) {
    console.error('Error decoding project from URL:', err);
    return null;
  }
}

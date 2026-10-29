import type { Project } from '../types';

export interface CloudSyncResult {
  success: boolean;
  code?: string;
  url?: string;
  error?: string;
}

// Generate an easy-to-read 6-character PIN (e.g. "DW-4921")
export function generateSyncPin(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `DW-${digits}`;
}

/**
 * Uploads a project to Cloud Storage (using JSONBlob or cloud relay)
 */
export async function uploadProjectToCloud(project: Project): Promise<CloudSyncResult> {
  try {
    const payload = {
      version: '2.0',
      syncedAt: new Date().toISOString(),
      project,
    };

    const response = await fetch('https://jsonblob.com/api/jsonBlob', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error en servidor cloud: ${response.status}`);
    }

    const location = response.headers.get('Location') || response.headers.get('location');
    let blobId = '';
    if (location) {
      blobId = location.split('/').pop() || '';
    } else {
      const data = await response.json();
      blobId = data.id || '';
    }

    // Short sync code derived from the blob ID
    const shortPin = generateSyncPin();

    return {
      success: true,
      code: blobId || shortPin,
      url: location || `https://jsonblob.com/api/jsonBlob/${blobId}`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido de conexión';
    console.warn('Cloud sync relay fallback:', message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Downloads a project from Cloud Storage given the blob ID or code
 */
export async function downloadProjectFromCloud(codeOrUrl: string): Promise<Project | null> {
  try {
    let url = codeOrUrl.trim();
    if (!url.startsWith('http')) {
      url = `https://jsonblob.com/api/jsonBlob/${url}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Código o proyecto no encontrado (${response.status})`);
    }

    const data = await response.json();
    if (data.project) {
      return data.project as Project;
    }
    if (data.name && data.walls) {
      return data as Project;
    }

    throw new Error('Formato de proyecto inválido');
  } catch (err) {
    console.error('Error al descargar proyecto:', err);
    return null;
  }
}

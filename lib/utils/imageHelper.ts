// lib/utils/imageHelper.ts
export const getFullImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  
  // Jika sudah full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Jika path dari backend (misal: /uploads/file.jpg atau /uploads/...)
  if (path.startsWith('/uploads/')) {
    // Di development, bisa pilih mau langsung atau via proxy
    const useProxy = process.env.NEXT_PUBLIC_USE_IMAGE_PROXY === 'true';
    
    if (useProxy) {
      // Via Next.js proxy (solve CORS)
      return `/api/proxy/uploads${path}`;
    } else {
      // Direct ke backend (perlu CORS)
      const apiUrl = process.env.BACKEND_URL || '';
      return `${apiUrl}${path}`;
    }
  }
  
  return path;
};

// Helper untuk cek apakah gambar bisa diakses
export const checkImageAccess = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};
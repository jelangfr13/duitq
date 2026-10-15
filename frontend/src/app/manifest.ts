import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DuitQ — Manajemen Keuangan Pribadi',
    short_name: 'DuitQ',
    description:
      'Aplikasi web mobile manajemen keuangan pribadi yang menyatukan sumber dana, ruang penyimpanan, dan piutang.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#2563EB',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

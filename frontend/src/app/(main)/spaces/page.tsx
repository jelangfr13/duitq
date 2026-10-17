'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SpacesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Alihkan langsung ke sistem budgeting baru
    router.replace('/budgets');
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-slate-400">
      Mengalihkan ke halaman Budgeting...
    </div>
  );
}

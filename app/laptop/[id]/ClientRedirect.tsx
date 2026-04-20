'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientRedirect({ id }: { id: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/?laptop=${id}`);
  }, [id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8] dark:bg-slate-950 font-sans">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <span className="text-4xl">💻</span>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Cargando equipo...</p>
      </div>
    </div>
  );
}

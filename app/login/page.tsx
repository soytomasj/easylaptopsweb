'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase'; // <-- Ruta apuntando a la carpeta lib en la raíz
import { motion } from 'framer-motion';

export default function PaginaLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const iniciarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Correo o contraseña incorrectos.');
      setCargando(false);
    } else {
      // Si el login es exitoso, lo mandamos al inicio
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8] dark:bg-slate-950 p-4 font-sans transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl"
      >
        <div className="text-center mb-8">
          <span className="text-4xl mb-4 block">🔐</span>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900 dark:text-white font-display">
            Acceso Admin
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider font-medium">
            Solo personal autorizado
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 rounded-xl text-center">
            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">{error}</span>
          </div>
        )}

        <form onSubmit={iniciarSesion} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold ml-1 mb-1 block uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500 border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              placeholder="admin@tienda.com"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold ml-1 mb-1 block uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500 border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={cargando}
            className={`w-full h-12 mt-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center transition-all shadow-md bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {cargando ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
        
        <button 
          onClick={() => router.push('/')} 
          className="w-full mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          ← Volver a la tienda
        </button>
      </motion.div>
    </div>
  );
}
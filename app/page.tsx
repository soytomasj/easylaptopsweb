'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../lib/supabase'; // <-- RUTA CORREGIDA

// ========================================================
// 🎨 DESIGN SYSTEM (SISTEMA ESTÉTICO CENTRALIZADO)
// ========================================================
const DESIGN_SYSTEM = {
  colors: {
    primary: "violet-600",
    primaryHover: "violet-700",
    primaryDarkHover: "violet-500",
    bgLight: "bg-[#F4F6F8]",
    bgDark: "bg-slate-950",
    surfaceLight: "bg-white",
    surfaceDark: "bg-slate-900",
    borderLight: "border-slate-200",
    borderDark: "border-slate-800",
    textHeadingLight: "text-slate-900",
    textHeadingDark: "text-white",
    textMutedLight: "text-slate-500",
    textMutedDark: "text-slate-400"
  },
  typography: {
    heading: "font-display font-bold tracking-tight",
    body: "font-sans leading-relaxed",
    small: "text-[10px] font-bold uppercase tracking-wider",
    label: "text-[10px] font-medium uppercase tracking-wider"
  },
  spacing: {
    rule: "4px", // Base rule
    radius: "rounded-xl sm:rounded-2xl"
  }
};

const ESTETICA_TARJETA = (isDark: boolean) => ({ contenedor: `flex flex-col overflow-hidden ${DESIGN_SYSTEM.spacing.radius} border transition-colors duration-300 relative min-w-0 cursor-pointer ${isDark ? 'bg-slate-900 border-slate-800 shadow-none hover:border-slate-700' : 'bg-white shadow-lg shadow-slate-200/50 border-slate-200 hover:border-slate-300 hover:shadow-xl'}` });
const ESTETICA_CONTROLES = (isDark: boolean) => ({
  select: `h-10 px-4 rounded-xl text-[10px] font-medium uppercase tracking-wider outline-none focus:ring-2 appearance-none transition-all border cursor-pointer w-full sm:w-auto ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-violet-500 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-700 focus:ring-violet-300 hover:border-slate-300 shadow-sm'}`,
  botonPrincipal: `h-10 px-6 rounded-xl text-[10px] font-semibold shadow-md shadow-violet-200 hover:bg-violet-700 transition-all uppercase tracking-wider flex items-center justify-center bg-violet-600 text-white ${isDark ? 'shadow-none' : ''}`
});
const ESTETICA_FORMULARIO = (isDark: boolean) => ({
  contenedor: `w-full max-w-[400px] mx-auto p-6 flex flex-col ${DESIGN_SYSTEM.spacing.radius} transition-colors duration-300 border ${isDark ? 'bg-slate-900 shadow-none border-slate-800' : 'bg-white shadow-xl shadow-slate-200/60 border-slate-200/80'}`,
  input: `w-full px-4 transition-all text-xs font-medium outline-none focus:ring-2 focus:ring-inset border ${isDark ? 'bg-slate-800 border-slate-700 focus:ring-violet-500 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 focus:ring-violet-300 text-slate-800 placeholder:text-slate-400'}`,
  label: `${DESIGN_SYSTEM.typography.label} ml-1 mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`,
  botonPrincipal: `font-semibold active:scale-95 transition-all uppercase tracking-wider flex items-center justify-center text-xs w-full h-12 mt-2 ${DESIGN_SYSTEM.spacing.radius} ${isDark ? 'bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed' : 'bg-violet-600 text-white shadow-md shadow-violet-200 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed'}`,
  uploadArea: `relative w-full rounded-xl flex flex-col items-center justify-center transition-colors overflow-hidden border-2`
});

// ========================================================
// 🛠️ UTILIDAD: COMPRESOR DE IMÁGENES NATIVO
// ========================================================
const comprimirImagen = (file: File, maxWidth: number = 1200, quality: number = 0.85): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: 'image/jpeg', lastModified: Date.now() });
            resolve(compressedFile);
          } else { resolve(file); }
        }, 'image/jpeg', quality);
      };
    };
  });
};

const formatearPrecio = (precio: number) => `${new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(precio)}gs`;

const normalizarStorage = (v: string): string => {
  if (!v) return v;
  const gb = v.match(/(\d+(?:\.\d+)?)\s*[Gg][Bb]/);
  if (gb) return `${parseInt(gb[1])} GB`;
  const tb = v.match(/(\d+(?:\.\d+)?)\s*[Tt][Bb]/);
  if (tb) return `${parseFloat(tb[1])} TB`;
  return v.trim();
};
const normalizarPantalla = (v: string): string => {
  if (!v) return v;
  const m = v.match(/(\d+(?:[.,]\d+)?)/);
  return m ? `${m[1].replace(',', '.')}"` : v.trim();
};
const normalizarProcesador = (v: string): string => {
  if (!v) return v;
  return v.trim()
    .replace(/\s+/g, ' ')
    .replace(/(\d+)(?:st|nd|rd|th)?°?\s*[Gg]en/g, '$1° Gen');
};
const sortNumerico = (arr: string[]): string[] => [...arr].sort((a, b) => {
  const toN = (s: string) => { const n = parseFloat(s); return isNaN(n) ? 0 : s.toUpperCase().includes('TB') ? n * 1024 : n; };
  return toN(a) - toN(b);
});
const sortProcesadores = (arr: string[]): string[] => {
  const score = (p: string): number => {
    const intel = p.match(/i(\d)\s+(\d+)/);
    if (intel) return parseInt(intel[1]) * 1000 + parseInt(intel[2]);
    const ryzen = p.match(/Ryzen\s+(\d)/i);
    if (ryzen) return 10000 + parseInt(ryzen[1]) * 1000;
    return 99999;
  };
  return [...arr].sort((a, b) => score(a) - score(b));
};

const LOGOS_MARCA = [
  { match: (n: string) => n.includes('dell'), src: 'https://www.nicepng.com/png/full/497-4970654_dell-logo-white-dell-f169g.png', alt: 'Dell' },
  { match: (n: string) => n.includes('lenovo') || n.includes('thinkpad'), src: 'https://i.imgur.com/LE4aNAE.png', alt: 'Lenovo', scale: 1.4 },
];
const getLogoBrand = (marca: string, modelo: string, claseImg: string) => {
  const nombre = `${marca} ${modelo}`.toLowerCase();
  const logo = LOGOS_MARCA.find(l => l.match(nombre));
  if (!logo) return null;
  return <img src={logo.src} alt={logo.alt} className={claseImg} style={logo.scale ? { transform: `scale(${logo.scale})`, transformOrigin: 'bottom right' } : { transformOrigin: 'bottom right' }} />;
};

const getSpecsList = (prod: any) => [
  { l: 'Procesador', v: prod.procesador, i: "https://shopinverse.com/cdn/shop/files/processor_50656a5a-aaf3-45a6-8690-24e540a0f31a.png?v=1750275262&width=48" },
  { l: 'Pulgadas', v: prod.pantalla, i: "https://shopinverse.com/cdn/shop/files/laptop_size.png?v=1750275765&width=48" },
  { l: 'SSD', v: prod.disco, i: "https://shopinverse.com/cdn/shop/files/SD_5b743960-78a8-48bf-b9ef-acdd48f3ae2a.png?v=1751056382&width=48" },
  { l: 'RAM', v: prod.ram, i: "https://shopinverse.com/cdn/shop/files/ram_dcb67804-7fdb-499b-924e-e30679b9fba9.png?v=1750275811&width=48" }
];

// ========================================================
// 📦 DATOS Y CONSTANTES
// ========================================================
const MOCK_BANNERS_INICIALES = [{ id: 1, imgDesktop: 'https://images.unsplash.com/photo-1531297172864-45dc6142db6e?q=80&w=1920&h=600&fit=crop', imgMobile: 'https://images.unsplash.com/photo-1531297172864-45dc6142db6e?q=80&w=1080&h=1080&fit=crop', alt: 'Gran oferta de equipos de diseño', link: '#' }];
const TAGS_DISPONIBLES = [{ label: 'Touch', emoji: '👆' }, { label: '2 en 1', emoji: '🔄' }];
const DESCRIPCION_POR_DEFECTO = `🚀 Potente y versátil, ideal para estudio, trabajo o diseño. Soporta programas pesados como Ilustrator, Photoshop o Premiere.\n⚡️ Incluye Cargador\n📚 Incluye paquete Office y Windows activado de por vida.\n✅ Equipo 100% probado, formateado y listo para usar.`;

interface ImagenPreview { file: File | null; url: string; }
interface Resena { id: string; nombre: string; foto: string; estrellas: number; descripcion: string; }
interface Cupon { id: string; codigo: string; tipo: 'fijo' | 'porcentaje'; valor: number; }

// ========================================================
// 🧩 COMPONENTES INDEPENDIENTES (MODULARIZADOS)
// ========================================================

const parsearTextoAnuncio = (texto: string): React.ReactNode => {
  if (!texto) return '';
  // Si el texto ya contiene etiquetas HTML (viene del editor), no aplicamos markdown simple
  let html = texto;
  if (!html.includes('<')) {
    html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    html = html.replace(/_(.*?)_/g, '<i>$1</i>');
  }
  return (
    <span 
      dangerouslySetInnerHTML={{ __html: html }} 
      className="[&_b]:font-black [&_strong]:font-black [&_span[style*='bold']]:font-black [&_span[style*='700']]:font-black [&_span[style*='900']]:font-black [&_b]:tracking-normal [&_strong]:tracking-normal [&_i]:italic [&_em]:italic [&_i]:normal-case [&_em]:normal-case"
    />
  );
};

const BarraAnuncio = ({ texto, onEdit, isDark, isAdmin, colorFondo, colorTexto }: any) => {
  if (!texto && !isAdmin) return null;
  const repeticiones = Array(20).fill(texto || "AGREGAR ANUNCIO...");
  const estiloFondo = colorFondo ? { backgroundColor: colorFondo, color: colorTexto || '#ffffff' } : {};
  return (
    <div className={`relative flex items-center justify-center h-8 sm:h-10 group shrink-0 ${!colorFondo ? (isDark ? 'bg-violet-900 text-violet-100' : 'bg-violet-600 text-white') : ''}`} style={estiloFondo}>
      <div className="w-full max-w-4xl overflow-hidden relative flex items-center h-full" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}>
        <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, ease: "linear", duration: 100 }} className="flex whitespace-nowrap w-max">
          {repeticiones.map((t, i) => <span key={i} className="text-[11px] sm:text-[12px] font-normal uppercase px-6 sm:px-12 inline-block" style={colorTexto ? { color: colorTexto } : {}}>{parsearTextoAnuncio(t)}</span>)}
        </motion.div>
      </div>
      {isAdmin && (
        <button onClick={onEdit} className="absolute right-2 sm:right-6 z-50 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all shadow-md" title="Editar Anuncio">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        </button>
      )}
    </div>
  );
};

const CarruselBanners = ({ banners, onEdit, isDark, isAdmin }: any) => {
  const [actual, setActual] = useState(0);
  const [imgCargada, setImgCargada] = useState(false);
  useEffect(() => {
    if (banners.length <= 1) return;
    const intervalo = setInterval(() => setActual((prev) => (prev === banners.length - 1 ? 0 : prev + 1)), 5000);
    return () => clearInterval(intervalo);
  }, [banners.length]);
  useEffect(() => { if (actual >= banners.length) setActual(0); }, [banners, actual]);
  useEffect(() => {
    setImgCargada(false);
    if (!banners[actual]) return;
    const src = window.innerWidth < 640 ? banners[actual].imgMobile : banners[actual].imgDesktop;
    const img = new Image(); img.onload = () => setImgCargada(true); img.src = src;
    if (img.complete) setImgCargada(true);
  }, [actual, banners]);

  if (banners.length === 0) {
    if (!isAdmin) return null;
    return (
      <div className={`relative w-full rounded-[1.5rem] border-2 border-dashed flex flex-col items-center justify-center p-8 sm:p-16 transition-colors ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
        <span className="text-3xl mb-2 opacity-50">🖼️</span>
        <p className={`text-xs font-medium uppercase tracking-wider opacity-50 ${isDark ? 'text-white' : 'text-slate-900'}`}>No hay banners activos</p>
        <button onClick={onEdit} className="mt-4 px-4 py-2 bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-md hover:bg-violet-700 transition-all">+ Agregar Banner</button>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-[1.5rem] overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 group">
      {isAdmin && (
        <button onClick={onEdit} className="absolute top-3 right-3 z-50 flex items-center justify-center w-8 h-8 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20 opacity-0 group-hover:opacity-100 hover:bg-violet-600 hover:border-violet-500 transition-all shadow-lg" title="Gestionar Banners">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        </button>
      )}
      <div className="relative w-full aspect-[1080/600] md:aspect-[1920/650]">
        <div className={`absolute inset-0 transition-opacity duration-500 ${imgCargada ? 'opacity-0 pointer-events-none' : 'opacity-100'} ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <div className="absolute inset-0 animate-pulse" style={{ background: isDark ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)' : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        </div>
        <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
        <AnimatePresence initial={false}>
          {imgCargada && banners[actual] && (
            <motion.a key={actual} href={banners[actual]?.link || '#'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: "easeInOut" }} className="absolute inset-0 block cursor-pointer" style={{ backgroundImage: `url(${banners[actual].imgDesktop})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="sm:hidden absolute inset-0" style={{ backgroundImage: `url(${banners[actual].imgMobile})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            </motion.a>
          )}
        </AnimatePresence>
      </div>
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
          {banners.map((_: any, i: number) => <button key={i} onClick={() => setActual(i)} className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${actual === i ? 'bg-white scale-125 shadow-md' : 'bg-white/50 hover:bg-white/80'}`} />)}
        </div>
      )}
    </div>
  );
};

const SliderTarjeta = ({ imagenes, alt, isDark }: any) => {
  const [actual, setActual] = useState(0);
  return (
    <div className="relative w-full h-full group/slider overflow-hidden bg-black/5 dark:bg-black/20">
      <AnimatePresence initial={false}>
        <motion.img key={actual} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1 }} transition={{ duration: 0.3, ease: "easeOut" }} src={imagenes[actual] || ''} alt={`${alt} - Foto ${actual + 1}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/slider:scale-105" decoding="async" loading="lazy" />
      </AnimatePresence>
      {imagenes.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); setActual(p => p === 0 ? imagenes.length - 1 : p - 1); }} className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover/slider:opacity-100 hover:bg-black/60 transition-all z-30"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
          <button onClick={(e) => { e.stopPropagation(); setActual(p => p === 0 ? imagenes.length - 1 : p - 1); }} className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover/slider:opacity-100 hover:bg-black/60 transition-all z-30"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
        </>
      )}
    </div>
  );
};

const LogoNvidia = ({ size = 14 }: { size?: number }) => (
  <img src="https://pbs.twimg.com/profile_images/1828904711124078593/SRvCZSfQ_400x400.jpg" width={size} height={size} alt="NVIDIA" className="rounded-sm object-cover shrink-0" style={{ width: size, height: size }} />
);

const TarjetaNotebook = ({ producto, isDark, isAdmin, onEliminar, onEditar, onClick }: any) => {
  const esNvidia = /nvidia|rtx|gtx/i.test(producto.grafica || '');
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} onClick={onClick} className={`${ESTETICA_TARJETA(isDark).contenedor} group`}>
      {isAdmin && (
        <div className="absolute top-1 right-1 sm:top-2.5 sm:right-2.5 z-40 flex flex-col gap-1 sm:gap-1.5 items-center justify-center">
          <motion.button whileHover={{ scale: 1.1 }} onClick={(e) => { e.stopPropagation(); onEliminar(producto.id); }} className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-colors font-medium cursor-pointer text-[10px] sm:text-xs text-white/70 hover:bg-white/20 bg-black/40 backdrop-blur-md hover:text-red-400" title="Eliminar publicación">✕</motion.button>
          <motion.button whileHover={{ scale: 1.1 }} onClick={(e) => { e.stopPropagation(); onEditar(producto); }} className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-colors font-medium cursor-pointer text-[10px] sm:text-xs text-white/70 hover:bg-white/20 bg-black/40 backdrop-blur-md hover:text-violet-400" title="Editar publicación"><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" className="sm:w-[11px] sm:h-[11px]"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></motion.button>
        </div>
      )}
      <div className={`relative w-full aspect-[4/5] sm:aspect-[3/4] overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
        <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 z-40 flex flex-wrap gap-1 sm:gap-1.5 pointer-events-none max-w-[85%]">
          <span className={`inline-flex items-center justify-center text-[6px] sm:text-[8px] font-semibold px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-full uppercase tracking-wider leading-none shadow-sm text-white ${producto.disponibilidad === 'Sobre Pedido' ? 'bg-orange-500' : 'bg-violet-600'}`}>{producto.estado}</span>
          <span className="inline-flex items-center justify-center text-[6px] sm:text-[8px] font-semibold px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-full uppercase tracking-wider leading-none shadow-sm backdrop-blur-md truncate max-w-full bg-black/55 text-slate-200 border border-white/10">{producto.condicion_estetica}</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/80 to-transparent z-20 pointer-events-none" style={{ backdropFilter: 'blur(0px)', WebkitMaskImage: 'linear-gradient(to top, black 0%, black 30%, transparent 100%)', maskImage: 'linear-gradient(to top, black 0%, black 30%, transparent 100%)' }}></div>
        {(producto.grafica || (producto.tags && producto.tags.length > 0)) && (
          <div className="absolute bottom-1.5 left-1.5 sm:bottom-2.5 sm:left-2.5 z-40 flex flex-wrap justify-start gap-1 sm:gap-1.5 pointer-events-none max-w-[70%]">
            {producto.grafica && (
              <span className="inline-flex items-center gap-1 sm:gap-1.5 text-[6px] sm:text-[8px] font-medium px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-full uppercase tracking-wider leading-none shadow-sm backdrop-blur-md bg-black/40 text-slate-200 border border-white/10">
                {esNvidia ? <LogoNvidia size={13} /> : <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 6V4M12 6V4M16 6V4M8 18v2M12 18v2M16 18v2M2 10h2M2 14h2M20 10h2M20 14h2"/><rect x="9" y="10" width="6" height="4" rx="1"/></svg>}
                {producto.grafica}
              </span>
            )}
            {producto.tags && producto.tags.map((tag: string) => (
              <span key={tag} className="inline-flex items-center gap-0.5 sm:gap-1 text-[6px] sm:text-[8px] font-medium px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-full uppercase tracking-wider leading-none shadow-sm backdrop-blur-md max-w-full bg-black/40 text-slate-200 border border-white/10">
                {tag === 'Touch' && <img src="https://i.imgur.com/QAPfztS.png" alt="" className="w-2.5 h-2.5 sm:w-3 sm:h-3 object-contain flex-shrink-0" />}
                {tag === '2 en 1' && <img src="https://i.imgur.com/LMqDtPC.png" alt="" className="w-4 h-4 object-contain flex-shrink-0 -my-1" />}
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="absolute bottom-2.5 right-1.5 sm:bottom-4 sm:right-2.5 z-40 pointer-events-none">{getLogoBrand(producto.marca, producto.modelo, 'w-8 sm:w-10 h-auto object-contain drop-shadow-md')}</div>
        <SliderTarjeta imagenes={producto.imagenes || []} alt={`${producto.marca} ${producto.modelo}`} isDark={isDark} />
      </div>

      <div className="p-2 sm:p-3 flex flex-col flex-1 w-full min-w-0">
        <div className="flex items-center justify-center gap-1.5 mb-1.5 sm:mb-2 min-w-0 w-full"><span className="text-[10px] sm:text-sm shrink-0">💻</span><h3 className={`text-[12px] sm:text-[14px] font-semibold tracking-tight leading-none truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{producto.marca} {producto.modelo}</h3></div>

        <div className={`grid grid-cols-2 gap-y-1.5 sm:gap-y-2 gap-x-1 sm:gap-x-2 py-1.5 sm:py-2 border-t border-b mb-1.5 sm:mb-2 w-full min-w-0 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          {getSpecsList(producto).map((s, i) => (
            <div key={i} className="flex items-center justify-start gap-2 sm:gap-2.5 min-w-0 w-full pl-0.5 sm:pl-2">
              <img src={s.i} alt={s.l} className={`w-4 h-4 sm:w-6 sm:h-6 object-contain shrink-0 ${isDark ? 'invert opacity-70' : 'opacity-70'}`} />
              <div className="flex flex-col justify-center leading-none min-w-0 text-left w-full">
                <span className={`text-[6.5px] sm:text-[8px] font-medium uppercase tracking-wider mb-[1px] truncate w-full ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.l}</span>
                <span className={`text-[8.5px] sm:text-[10px] font-semibold leading-none truncate w-full ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{s.v}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto flex flex-col items-center justify-center min-w-0 w-full h-[32px] sm:h-[50px]">
          {producto.precio_oferta ? (
            <>
              <span className={`text-[14px] sm:text-[20px] font-display font-bold tracking-tight truncate w-full text-center leading-tight ${isDark ? 'text-blue-400' : 'text-[#005bd3]'}`}>{formatearPrecio(producto.precio_oferta)}</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className={`text-[8px] sm:text-[10px] line-through font-medium ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{formatearPrecio(producto.precio)}</span>
                {producto.descuento && <span className="bg-red-500/90 text-white text-[7px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wide">−{producto.descuento}%</span>}
              </div>
            </>
          ) : (
            <span className={`text-[14px] sm:text-[20px] font-display font-bold tracking-tight truncate w-full text-center ${isDark ? 'text-blue-400' : 'text-[#005bd3]'}`}>{formatearPrecio(producto.precio)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ========================================================
// ⭐ CARRUSEL DE RESEÑAS
// ========================================================
const CarruselResenas = ({ resenas, isDark, isAdmin, onEliminar, onEditar }: any) => {
  if (resenas.length === 0) return null;
  const duplicadas = resenas.length < 4 ? [...resenas, ...resenas, ...resenas, ...resenas] : [...resenas, ...resenas];
  const duracion = Math.max(20, duplicadas.length * 6);
  return (
    <div className="overflow-hidden w-full relative">
      <div className="flex gap-4" style={{ animation: `marquee-resenas ${duracion}s linear infinite`, width: 'max-content' }}>
        {duplicadas.map((r: Resena, i: number) => (
          <div key={`${r.id}-${i}`} className={`relative shrink-0 w-64 sm:w-72 p-5 rounded-2xl border flex flex-col gap-3 ${isDark ? 'bg-slate-800/70 border-slate-700/60' : 'bg-white border-slate-200 shadow-sm'}`}>
            {isAdmin && (
              <div className="absolute top-3 right-3 flex gap-1">
                <button onClick={() => onEditar(r)} className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${isDark ? 'bg-slate-700 text-slate-400 hover:bg-violet-600 hover:text-white' : 'bg-violet-500/10 text-violet-500 hover:bg-violet-500 hover:text-white'}`} title="Editar reseña"><svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
                <button onClick={() => onEliminar(r.id)} className="w-6 h-6 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-[10px] font-bold" title="Eliminar reseña">✕</button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <img src={r.foto} alt={r.nombre} className="w-11 h-11 rounded-full object-cover border-2 border-violet-400/30 shrink-0" onError={(e: any) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath d='M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z'/%3E%3C/svg%3E"; }} />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className={`text-sm font-bold leading-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.nombre}</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} viewBox="0 0 24 24" width="11" height="11" fill={s <= r.estrellas ? '#f59e0b' : 'none'} stroke={s <= r.estrellas ? '#f59e0b' : (isDark ? '#475569' : '#cbd5e1')} strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  ))}
                </div>
              </div>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`} style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.descripcion}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const FormResena = ({ isDark, onClose, onGuardar, onEditar, resenaEnEdicion, estForm, RADIO_GENERAL }: any) => {
  const editando = !!resenaEnEdicion;
  const [nombre, setNombre] = useState(resenaEnEdicion?.nombre || '');
  const [foto, setFoto] = useState(resenaEnEdicion?.foto || '');
  const [estrellas, setEstrellas] = useState(resenaEnEdicion?.estrellas || 5);
  const [descripcion, setDescripcion] = useState(resenaEnEdicion?.descripcion || '');
  const MAX_DESC = 200;

  const manejarFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const comprimida = await comprimirImagen(file, 400, 0.8);
    const reader = new FileReader();
    reader.onload = (ev) => setFoto(ev.target?.result as string);
    reader.readAsDataURL(comprimida);
  };

  const guardar = () => {
    if (!nombre.trim() || !descripcion.trim()) return;
    if (editando) {
      onEditar({ ...resenaEnEdicion, nombre: nombre.trim(), foto, estrellas, descripcion: descripcion.trim() });
    } else {
      onGuardar({ nombre: nombre.trim(), foto, estrellas, descripcion: descripcion.trim() });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 font-sans">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`relative w-full max-w-md flex flex-col shadow-2xl rounded-3xl z-10 overflow-hidden ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-[#F4F6F8]'}`}>
        <div className={`p-5 border-b flex justify-between items-center shrink-0 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h2 className={`text-lg font-display font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{editando ? 'Editar Reseña' : 'Nueva Reseña'}</h2>
          <button onClick={onClose} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-800'}`}>✕</button>
        </div>
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-violet-400/30 bg-slate-200 shrink-0 flex items-center justify-center">
              {foto ? <img src={foto} alt="preview" className="w-full h-full object-cover" /> : <svg viewBox="0 0 24 24" width="32" height="32" fill="#94a3b8"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>}
            </div>
            <label className={`cursor-pointer text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl border-2 transition-colors ${isDark ? 'border-slate-700 text-slate-400 hover:border-violet-500 hover:text-violet-400' : 'border-slate-200 text-slate-500 hover:border-violet-400 hover:text-violet-600'}`}>
              Subir foto
              <input type="file" accept="image/*" onChange={manejarFoto} className="hidden" />
            </label>
          </div>
          <div>
            <label className={estForm.label}>Nombre</label>
            <input type="text" placeholder="Ej: Juan P." className={`${estForm.input} h-11 ${RADIO_GENERAL}`} value={nombre} onChange={e => setNombre(e.target.value)} maxLength={40} />
          </div>
          <div>
            <label className={estForm.label}>Calificación</label>
            <div className="flex gap-2 mt-1">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setEstrellas(s)} className="transition-transform hover:scale-125 active:scale-110">
                  <svg viewBox="0 0 24 24" width="30" height="30" fill={s <= estrellas ? '#f59e0b' : 'none'} stroke={s <= estrellas ? '#f59e0b' : (isDark ? '#475569' : '#cbd5e1')} strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between items-end mb-1">
              <label className={estForm.label}>Comentario</label>
              <span className={`text-[9px] font-medium ${descripcion.length > MAX_DESC * 0.85 ? 'text-amber-500' : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>{descripcion.length}/{MAX_DESC}</span>
            </div>
            <textarea placeholder="¿Qué te pareció Easy Laptops?" className={`${estForm.input} py-3 h-24 resize-none leading-relaxed ${RADIO_GENERAL}`} value={descripcion} onChange={e => setDescripcion(e.target.value.slice(0, MAX_DESC))} maxLength={MAX_DESC} />
          </div>
          <button onClick={guardar} disabled={!nombre.trim() || !descripcion.trim()} className={`w-full h-12 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center ${(!nombre.trim() || !descripcion.trim()) ? 'opacity-40 cursor-not-allowed bg-violet-600 text-white' : `bg-violet-600 text-white hover:bg-violet-700 ${isDark ? '' : 'shadow-md shadow-violet-200'}`}`}>
            {editando ? 'Guardar Cambios' : 'Publicar Reseña'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const GestorPromocionesAdmin = ({ isDark, setMostrandoGestorPromos, textoAnuncioDraft, setTextoAnuncioDraft, setTextoAnuncio, guardarAnuncioDB, banners, eliminarBanner, nuevoBannerDesktop, nuevoBannerMobile, manejarSubidaImagenBanner, nuevoBannerLink, setNuevoBannerLink, guardarBannerNuevo, estaGuardandoBanners, estForm, RADIO_GENERAL, colorFondoAnuncio, setColorFondoAnuncio, colorTextoAnuncio, setColorTextoAnuncio, cupones, onAgregarCupon, onEliminarCupon }: any) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [colorFondo, setColorFondo] = useState(colorFondoAnuncio || '#7c3aed');
  const [colorTexto, setColorTexto] = useState(colorTextoAnuncio || '#ffffff');
  
  // Estados para nuevo cupón
  const [nuevoCod, setNuevoCod] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<'fijo' | 'porcentaje'>('porcentaje');
  const [nuevoVal, setNuevoVal] = useState('');

  useEffect(() => {
    if (editorRef.current) {
      let initialText = textoAnuncioDraft || '';
      initialText = initialText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
      initialText = initialText.replace(/_(.*?)_/g, '<i>$1</i>');
      editorRef.current.innerHTML = initialText;
      if (initialText !== textoAnuncioDraft) {
        setTextoAnuncioDraft(initialText);
      }
    }
  }, []);

  const aplicarFormato = (command: string) => {
    document.execCommand(command, false, '');
    if (editorRef.current) {
      setTextoAnuncioDraft(editorRef.current.innerHTML);
    }
    };

    const handleAgregarCupon = () => {
    if (!nuevoCod.trim() || !nuevoVal) return;
    onAgregarCupon({
      id: Date.now().toString(),
      codigo: nuevoCod.trim().toUpperCase(),
      tipo: nuevoTipo,
      valor: Number(nuevoVal)
    });
    setNuevoCod(''); setNuevoVal('');
    };

    return (
  <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4 font-sans">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMostrandoGestorPromos(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" />
    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`relative w-full max-w-lg max-h-[95vh] flex flex-col shadow-2xl rounded-3xl z-10 overflow-hidden ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-[#F4F6F8]'}`}>
      <div className={`p-4 sm:p-5 border-b flex justify-between items-center shrink-0 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h2 className={`text-lg font-display font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Gestor de Promociones</h2>
        <button onClick={() => setMostrandoGestorPromos(false)} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-800'}`}>✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
        <div>
          <div className="flex justify-between items-end mb-2"><h3 className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Barra de Anuncio Superior</h3></div>
          <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            {/* Toolbar formato */}
            <div className={`flex items-center gap-1.5 px-3 py-2 border-b ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
              <button onMouseDown={e => { e.preventDefault(); aplicarFormato('bold'); }} className={`h-7 px-3 rounded-md text-[11px] font-black flex items-center justify-center transition-colors border ${isDark ? 'border-slate-600 bg-slate-700 text-white hover:bg-slate-600' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-100'}`} title="Negrita">B</button>
              <button onMouseDown={e => { e.preventDefault(); aplicarFormato('italic'); }} className={`h-7 px-3 rounded-md text-[11px] italic font-semibold flex items-center justify-center transition-colors border ${isDark ? 'border-slate-600 bg-slate-700 text-white hover:bg-slate-600' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-100'}`} title="Cursiva">I</button>
              <div className={`w-px h-4 mx-0.5 ${isDark ? 'bg-slate-600' : 'bg-slate-200'}`} />
              {/* Color fondo */}
              <label className="flex items-center gap-1.5 cursor-pointer" title="Color de fondo">
                <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Fondo</span>
                <div className="relative w-6 h-6 rounded-md overflow-hidden border-2 border-white/20 shadow-sm cursor-pointer" style={{ backgroundColor: colorFondo }}>
                  <input type="color" value={colorFondo} onChange={e => setColorFondo(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                </div>
              </label>
              <div className={`w-px h-4 mx-0.5 ${isDark ? 'bg-slate-600' : 'bg-slate-200'}`} />
              {/* Color texto */}
              <label className="flex items-center gap-1.5 cursor-pointer" title="Color de texto">
                <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Texto</span>
                <div className="relative w-6 h-6 rounded-md overflow-hidden border-2 border-white/20 shadow-sm cursor-pointer" style={{ backgroundColor: colorTexto }}>
                  <input type="color" value={colorTexto} onChange={e => setColorTexto(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                </div>
              </label>
            </div>
            {/* Input */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={() => {
                if (editorRef.current) setTextoAnuncioDraft(editorRef.current.innerHTML);
              }}
              onBlur={() => {
                if (editorRef.current) setTextoAnuncioDraft(editorRef.current.innerHTML);
              }}
              className={`${estForm.input} py-3 min-h-[44px] block px-3 rounded-none border-0 border-b outline-none overflow-x-auto whitespace-nowrap [&_b]:font-black [&_strong]:font-black [&_span[style*='bold']]:font-black [&_span[style*='700']]:font-black [&_span[style*='900']]:font-black [&_b]:tracking-normal [&_strong]:tracking-normal [&_i]:italic [&_em]:italic [&_i]:normal-case [&_em]:normal-case ${isDark ? 'border-slate-700' : 'border-slate-100'}`}
            />
            {/* Preview marquee */}
            {textoAnuncioDraft && (
              <div className="flex items-center gap-2 px-3 py-2">
                <span className={`text-[9px] font-bold uppercase tracking-wider shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Preview</span>
                <div className="flex-1 overflow-hidden rounded-lg h-8 flex items-center relative" style={{ backgroundColor: colorFondo, WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}>
                  <motion.div animate={{ x: ['0%', '-50%'] }} transition={{ repeat: Infinity, ease: 'linear', duration: 100 }} className="flex whitespace-nowrap w-max">
                    {Array(6).fill(textoAnuncioDraft).map((t: string, i: number) => (
                      <span key={i} className="text-[10px] font-normal uppercase px-6 inline-block" style={{ color: colorTexto }}>{parsearTextoAnuncio(t)}</span>
                    ))}
                  </motion.div>
                </div>
              </div>
            )}
            {/* Save */}
            <div className="px-3 pb-3">
              <button onClick={async () => { 
                await guardarAnuncioDB(textoAnuncioDraft, colorFondo, colorTexto); 
                setTextoAnuncio(textoAnuncioDraft);
                setMostrandoGestorPromos(false); 
              }} className={`w-full h-10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center ${isDark ? 'bg-violet-600 text-white hover:bg-violet-500' : 'bg-violet-600 text-white hover:bg-violet-700'}`}>Guardar Anuncio</button>
            </div>
          </div>
        </div>

        <div>
          <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Banners Activos ({banners.length})</h3>
          <div className="space-y-2">
            {banners.map((b: any, index: number) => (
              <div key={b.id} className={`flex items-center gap-3 p-2 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="w-16 h-8 rounded bg-slate-200 overflow-hidden shrink-0"><img src={b.imgDesktop} alt="Miniatura" className="w-full h-full object-cover" /></div>
                <span className={`text-xs font-medium flex-1 truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Banner {index + 1}</span>
                <button onClick={() => eliminarBanner(b.id)} className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
              </div>
            ))}
            {banners.length === 0 && <p className={`text-xs text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No hay banners configurados.</p>}
          </div>
        </div>
        <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>Añadir Nuevo Banner</h3>
          {[{id: 'desktop', dim: '1920x730', val: nuevoBannerDesktop, icon: '💻'}, {id: 'mobile', dim: '1080x600', val: nuevoBannerMobile, icon: '📱'}].map(i => (
            <div key={i.id} className={`relative w-full h-12 rounded-xl flex items-center justify-center transition-colors overflow-hidden border-2 border-dashed ${i.val ? (isDark ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-emerald-500/50 bg-emerald-50') : (isDark ? 'border-slate-600 bg-slate-800/50 hover:bg-slate-700' : 'border-slate-300 bg-slate-50 hover:bg-slate-100')}`}>
              <input type="file" accept="image/*" onChange={(e) => manejarSubidaImagenBanner(e, i.id as any)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${i.val ? 'text-emerald-500' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>{i.val ? `✅ Imagen ${i.id==='desktop'?'Web':'Celular'} Lista` : `${i.icon} Subir Imagen ${i.id==='desktop'?'Web':'Celular'} (${i.dim})`}</span>
            </div>
          ))}
          <div><label className={estForm.label}>Link de la oferta (Opcional)</label><input type="url" placeholder="Ej: https://..." className={`${estForm.input} h-10 ${RADIO_GENERAL}`} value={nuevoBannerLink} onChange={e => setNuevoBannerLink(e.target.value)} /></div>
          <button onClick={guardarBannerNuevo} disabled={estaGuardandoBanners} className={`w-full h-11 mt-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center ${isDark ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-none' : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-200'} disabled:opacity-50`}>
            {estaGuardandoBanners ? '⏳ GUARDANDO...' : '💾 GUARDAR BANNER'}
          </button>
        </div>

        {/* SECCIÓN DE CUPONES */}
        <div>
          <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cupones de Descuento</h3>
          <div className={`p-4 rounded-2xl border space-y-4 mb-3 ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 sm:col-span-1">
                <label className={estForm.label}>Código</label>
                <input type="text" placeholder="EJ: PROMO20" className={`${estForm.input} h-10 ${RADIO_GENERAL}`} value={nuevoCod} onChange={e => setNuevoCod(e.target.value.toUpperCase())} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className={estForm.label}>Tipo</label>
                <select className={`${estForm.input} h-10 ${RADIO_GENERAL} appearance-none cursor-pointer`} value={nuevoTipo} onChange={e => setNuevoTipo(e.target.value as any)}>
                  <option value="porcentaje">% Descuento</option>
                  <option value="fijo">Monto Fijo (Gs.)</option>
                </select>
              </div>
            </div>
            <div>
              <label className={estForm.label}>Valor ({nuevoTipo === 'porcentaje' ? '%' : 'Gs.'})</label>
              <input type="number" placeholder={nuevoTipo === 'porcentaje' ? "Ej: 15" : "Ej: 100000"} className={`${estForm.input} h-10 ${RADIO_GENERAL}`} value={nuevoVal} onChange={e => setNuevoVal(e.target.value)} />
            </div>
            <button onClick={handleAgregarCupon} className={`w-full h-10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center bg-violet-600 text-white hover:bg-violet-700`}>+ Agregar Cupón</button>
          </div>
          
          <div className="space-y-2">
            {cupones.map((c: Cupon) => (
              <div key={c.id} className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-col">
                  <span className={`text-xs font-bold tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.codigo}</span>
                  <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {c.tipo === 'porcentaje' ? `${c.valor}% de descuento` : `-${formatearPrecio(c.valor)} de descuento`}
                  </span>
                </div>
                <button onClick={() => onEliminarCupon(c.id)} className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            ))}
            {cupones.length === 0 && <p className={`text-xs text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No hay cupones creados.</p>}
          </div>
        </div>
      </div>
    </motion.div>
  </div>
  );
};

const VistaRapidaPreview = ({ producto, isDark, idxImagenModal, setIdxImagenModal, onClose, onAddToCart, onBuyNow }: any) => {
  const esAccesorio = producto.categoria === 'accesorio';
  const tieneUpgrade = !esAccesorio && producto.disponibilidad !== 'Sobre Pedido';
  const [upgraded, setUpgraded] = useState(false);
  const precioBase = producto.precio_oferta || producto.precio;
  const precioFinal = upgraded ? precioBase + 170000 : precioBase;

  return (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 font-sans">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" />
    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`relative w-full max-w-4xl max-h-[95vh] sm:max-h-[96vh] flex flex-col md:flex-row shadow-2xl rounded-3xl overflow-y-auto md:overflow-hidden z-10 ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
      <button onClick={onClose} className="md:hidden absolute top-2 right-2 z-50 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20">✕</button>
      
      <div className={`w-full md:w-1/2 relative aspect-square sm:aspect-[5/6] md:aspect-[3/4] shrink-0 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
        <AnimatePresence initial={false}>
          <motion.img key={idxImagenModal} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1 }} transition={{ duration: 0.3, ease: "easeOut" }} src={producto.imagenes[idxImagenModal]} alt={producto.modelo} className="absolute inset-0 w-full h-full object-cover" decoding="async" />
        </AnimatePresence>
        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex flex-wrap gap-1 sm:gap-1.5 pointer-events-none max-w-[85%]">
          <span className={`inline-flex items-center justify-center text-[8px] sm:text-[9px] font-semibold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full uppercase tracking-wider leading-none shadow-sm text-white ${producto.disponibilidad === 'Sobre Pedido' ? 'bg-orange-500' : 'bg-violet-600'}`}>{producto.estado}</span>
          <span className="inline-flex items-center justify-center text-[8px] sm:text-[9px] font-semibold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full uppercase tracking-wider leading-none shadow-sm backdrop-blur-md truncate max-w-full bg-black/55 text-slate-200 border border-white/10">{producto.condicion_estetica}</span>
        </div>
        {producto.imagenes.length > 1 && (
          <><button onClick={(e) => { e.stopPropagation(); setIdxImagenModal((p:number) => p === 0 ? producto.imagenes.length - 1 : p - 1); }} className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-all z-30"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
          <button onClick={(e) => { e.stopPropagation(); setIdxImagenModal((p:number) => p === producto.imagenes.length - 1 ? 0 : p + 1); }} className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-all z-30"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></button></>
        )}
        {producto.tags && producto.tags.length > 0 && (
          <div className={`absolute z-20 flex flex-wrap justify-start gap-1 sm:gap-1.5 pointer-events-none max-w-[70%] left-3 sm:left-4 ${producto.imagenes.length > 1 ? 'bottom-3 sm:bottom-24' : 'bottom-3 sm:bottom-4'}`}>
            {producto.tags.map((tag: string) => (
              <span key={tag} className="inline-flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[9px] font-medium px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full uppercase tracking-wider leading-none shadow-sm backdrop-blur-md max-w-full bg-black/40 text-slate-200 border border-white/10">
                {tag === 'Touch' && <img src="https://i.imgur.com/QAPfztS.png" alt="" className="w-2.5 h-2.5 sm:w-3 sm:h-3 object-contain flex-shrink-0" />}{tag === '2 en 1' && <img src="https://i.imgur.com/LMqDtPC.png" alt="" className="w-4 h-4 sm:w-5 sm:h-5 object-contain flex-shrink-0 -my-1" />}{tag}
              </span>
            ))}
          </div>
        )}
        <div className={`absolute z-20 pointer-events-none right-3 sm:right-4 ${producto.imagenes.length > 1 ? 'bottom-3 sm:bottom-24' : 'bottom-3 sm:bottom-4'}`}>{getLogoBrand(producto.marca, producto.modelo, 'w-10 sm:w-12 h-auto object-contain drop-shadow-lg')}</div>
        {producto.imagenes.length > 1 && (
          <div className="hidden sm:flex absolute bottom-4 left-0 right-0 z-30 justify-center gap-2 px-4 overflow-x-auto scrollbar-hide py-1">
            {producto.imagenes.map((img: string, idx: number) => (
              <button key={idx} onClick={() => setIdxImagenModal(idx)} className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 transition-all border-2 ${idxImagenModal === idx ? 'border-violet-500 scale-110 shadow-lg shadow-violet-500/40 z-10' : 'border-white/20 opacity-60 hover:opacity-100 hover:scale-105'}`}><img src={img} alt={`Miniatura ${idx}`} className="w-full h-full object-cover" /></button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full md:w-1/2 px-3 pt-2 pb-3 sm:p-4 lg:p-5 flex flex-col relative flex-1 md:overflow-y-auto">
        <button onClick={onClose} className={`hidden md:flex absolute top-4 right-4 w-7 h-7 items-center justify-center rounded-full transition-colors font-medium z-10 ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'}`}>✕</button>
        <div className="flex flex-col flex-1">
          <div className={`mb-2 py-2.5 md:py-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'} flex flex-col justify-center md:items-start items-center md:text-left text-center min-h-[65px]`}>
            <h2 className={`text-xl sm:text-2xl md:text-3xl font-display font-bold tracking-tight leading-tight px-4 md:px-0 md:pr-10 ${isDark ? 'text-white' : 'text-slate-900'}`}>{producto.marca} {producto.modelo}</h2>
            <div className="flex items-center justify-center md:justify-start gap-1.5 w-full mt-1">
              <div className={`w-2 h-2 rounded-full shrink-0 shadow-sm ${producto.disponibilidad === 'En Stock' ? 'bg-emerald-500 animate-pulse shadow-emerald-500/50' : producto.disponibilidad === 'Sobre Pedido' ? 'bg-orange-500 shadow-orange-500/50' : 'bg-red-500 shadow-red-500/50'}`}></div>
              <span className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider ${producto.disponibilidad === 'En Stock' ? 'text-emerald-500' : producto.disponibilidad === 'Sobre Pedido' ? 'text-orange-500' : 'text-red-500'}`}>
                {producto.disponibilidad === 'En Stock' ? 'En stock, listo para entregar' : producto.disponibilidad === 'Sobre Pedido' ? `A pedido: ${producto.condicion_estetica}` : 'Agotado'}
              </span>
            </div>
          </div>

          <div className={`flex flex-col pb-4 mb-3 gap-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-start justify-between gap-1 sm:gap-2">
              {getSpecsList(producto).map((s, i) => {
                const isSSD = s.l === 'SSD';
                
                // Parseamos siempre el valor original del producto para extraer el formato
                const matchOriginal = s.v.match(/^(\d+)(.*)$/);
                const numOriginal = matchOriginal ? matchOriginal[1] : s.v;
                const restoOriginal = matchOriginal ? matchOriginal[2] : '';

                // Si es SSD y hay upgrade, el número es 512, si no el original
                const numero = (isSSD && upgraded) ? '512' : numOriginal;
                // El resto (unidades) se mantiene SIEMPRE igual al original para que no haya saltos
                const resto = restoOriginal;

                return (
                  <div key={i} className={`flex flex-col items-center justify-center flex-1 min-w-0 text-center ${i > 0 ? `border-l ${isDark ? 'border-slate-800' : 'border-slate-200'}` : ''}`}>
                    <img src={s.i} alt={s.l} className={`w-5 h-5 sm:w-6 sm:h-6 mb-1.5 object-contain shrink-0 ${isDark ? 'invert opacity-70' : 'opacity-70'}`} />
                    <span className={`text-[7px] sm:text-[8px] font-medium uppercase tracking-wider mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.l}</span>
                    <div className="relative h-4 overflow-hidden w-full flex items-center justify-center">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span 
                          key={numero}
                          initial={{ y: 15, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -15, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          className={`text-[9px] sm:text-[11px] font-semibold leading-none ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
                        >
                          {numero}
                        </motion.span>
                      </AnimatePresence>
                      {resto && <span className={`text-[9px] sm:text-[11px] font-semibold leading-none ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{resto}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            {producto.grafica && (
              <div className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'}`}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${isDark ? 'text-violet-400' : 'text-violet-500'}`}><rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 6V4M12 6V4M16 6V4M8 18v2M12 18v2M16 18v2M2 10h2M2 14h2M20 10h2M20 14h2"/><rect x="9" y="10" width="6" height="4" rx="1"/></svg>
                <div className="flex flex-col leading-none min-w-0">
                  <span className={`text-[7px] sm:text-[8px] font-medium uppercase tracking-wider mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Gráfica dedicada</span>
                  <span className={`text-[10px] sm:text-[12px] font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{producto.grafica}</span>
                </div>
              </div>
            )}
            {tieneUpgrade && (
              <div className={`flex items-center justify-between px-3 py-2 rounded-xl border cursor-pointer transition-all ${upgraded ? (isDark ? 'bg-violet-900/20 border-violet-500/50' : 'bg-violet-50 border-violet-300') : (isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200/80')}`} onClick={() => setUpgraded(!upgraded)}>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${upgraded ? 'bg-violet-600 border-violet-600' : (isDark ? 'border-slate-600' : 'border-slate-300')}`}>
                    {upgraded && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </div>
                  <img src="https://shopinverse.com/cdn/shop/files/SD_5b743960-78a8-48bf-b9ef-acdd48f3ae2a.png?v=1751056382&width=48" alt="SSD" className={`w-4 h-4 object-contain ${isDark ? 'invert opacity-70' : 'opacity-70'}`} />
                  <span className={`text-[10px] sm:text-[11px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Aumentar SSD 512GB <span className="font-medium opacity-70">(+170.000 Gs.)</span></span>
                </div>
              </div>
            )}
          </div>

          <div className="mb-4">
            <p className={`text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Software Incluido</p>
            <div className="flex flex-nowrap gap-1.5 sm:gap-2 justify-center overflow-hidden">
              {[{ name: 'Windows', img: 'https://img.icons8.com/color/48/windows-11.png' }, { name: 'Word', img: 'https://img.icons8.com/color/48/microsoft-word-2019--v2.png' }, { name: 'Excel', img: 'https://img.icons8.com/color/48/microsoft-excel-2019--v1.png' }, { name: 'PowerPoint', img: 'https://img.icons8.com/color/48/microsoft-powerpoint-2019--v1.png' }].map(soft => (
                <div key={soft.name} className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full border shadow-sm flex-shrink-0 ${isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-slate-50 border-slate-200/80'}`}><img src={soft.img} alt={soft.name} className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain flex-shrink-0" /><span className={`text-[10px] sm:text-[11px] font-medium whitespace-nowrap ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{soft.name}</span></div>
              ))}
            </div>
          </div>

          <div className={`text-[12px] sm:text-[13px] leading-relaxed whitespace-pre-line ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{producto.descripcion}</div>

          <div className={`mt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} flex flex-col`}>
            <div className="py-4 flex items-center justify-center w-full">
                <div className="flex items-center justify-center gap-2">
                  <div className={`relative inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#2a344e] overflow-hidden`} style={{ minWidth: '120px' }}>
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span key={precioFinal} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="text-base sm:text-lg text-white font-display font-bold tracking-tight leading-none block text-center w-full">
                        {formatearPrecio(precioFinal)}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  {producto.precio_oferta && <span className={`text-xs sm:text-sm line-through font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{formatearPrecio(producto.precio + (upgraded ? 170000 : 0))}</span>}
                  {producto.descuento && <span className="bg-red-500/90 text-white text-[9px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full tracking-wide">−{producto.descuento}%</span>}
                </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-row gap-2 sm:gap-3 w-full">
                <button onClick={() => onAddToCart({ ...producto, upgrade: upgraded ? 'SSD 512GB' : null })} className={`flex-1 h-12 sm:h-11 px-1 sm:px-4 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center leading-tight ${isDark ? 'bg-slate-800 text-white hover:bg-slate-700 shadow-none' : 'bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-50 shadow-none'}`}>Añadir al carrito</button>
                <button onClick={() => onBuyNow({ ...producto, upgrade: upgraded ? 'SSD 512GB' : null })} className={`flex-1 h-12 sm:h-11 px-1 sm:px-4 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-violet-200 flex items-center justify-center leading-tight ${isDark ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-none' : 'bg-violet-600 text-white hover:bg-violet-700'}`}>Comprar ahora</button>
              </div>
              <div className={`flex items-center justify-between px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl border ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'}`}>
                <div className="flex items-center gap-1.5 sm:gap-2"><span className="text-xs sm:text-sm">💳</span><span className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Aceptamos tarjetas y transferencias</span></div>
                <div className="flex items-center gap-1.5"><img src="https://img.icons8.com/color/48/visa.png" alt="Visa" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" /><img src="https://img.icons8.com/color/48/mastercard.png" alt="Mastercard" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  </div>
);
};

// ========================================================
// 🚀 COMPONENTE PRINCIPAL
// ========================================================
const FILTROS_VACIO = { ram: [] as string[], pantalla: [] as string[], disco: [] as string[], procesador: [] as string[], precioMin: '', precioMax: '' };
type Filtros = typeof FILTROS_VACIO;

const SPECS_ICONS = [
  { key: 'procesador' as const, label: 'Procesador', icon: 'https://shopinverse.com/cdn/shop/files/processor_50656a5a-aaf3-45a6-8690-24e540a0f31a.png?v=1750275262&width=48' },
  { key: 'ram' as const, label: 'RAM', icon: 'https://shopinverse.com/cdn/shop/files/ram_dcb67804-7fdb-499b-924e-e30679b9fba9.png?v=1750275811&width=48' },
  { key: 'disco' as const, label: 'SSD', icon: 'https://shopinverse.com/cdn/shop/files/SD_5b743960-78a8-48bf-b9ef-acdd48f3ae2a.png?v=1751056382&width=48' },
  { key: 'pantalla' as const, label: 'Pulgadas', icon: 'https://shopinverse.com/cdn/shop/files/laptop_size.png?v=1750275765&width=48' },
];

const FiltroEspecsBoton = ({ filtros, setFiltros, opciones, mostrandoFiltros, setMostrandoFiltros, alAbrir, isDark }: { filtros: Filtros; setFiltros: (f: Filtros) => void; opciones: Record<string, string[]>; mostrandoFiltros: boolean; setMostrandoFiltros: (v: boolean) => void; alAbrir: () => void; isDark: boolean }) => {
  const [draftFiltros, setDraftFiltros] = useState<Filtros>({ ...filtros });
  const filtrosActivos = (filtros.ram.length + filtros.pantalla.length + filtros.disco.length + filtros.procesador.length) + (filtros.precioMin || filtros.precioMax ? 1 : 0);
  
  // Sincronizar draft cuando se abre el modal
  useEffect(() => {
    if (mostrandoFiltros) setDraftFiltros({ ...filtros });
  }, [mostrandoFiltros, filtros]);

  const aplicar = () => {
    setFiltros(draftFiltros);
    setMostrandoFiltros(false);
  };

  const limpiar = () => {
    const vacio = { ...FILTROS_VACIO };
    setDraftFiltros(vacio);
    setFiltros(vacio);
    setMostrandoFiltros(false);
  };

  return (
    <div className="relative">
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => { setMostrandoFiltros(!mostrandoFiltros); alAbrir(); }}
        className={`relative h-10 px-3 sm:px-4 rounded-full flex items-center gap-2 transition-all border text-[10px] font-bold uppercase tracking-wider ${mostrandoFiltros || filtrosActivos > 0 ? isDark ? 'bg-violet-600 text-white border-violet-600' : 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200' : isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'}`}>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
        <span className="hidden sm:inline">Specs</span>
        {filtrosActivos > 0 && <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold leading-none bg-white/25 text-white">{filtrosActivos}</span>}
      </motion.button>
      <AnimatePresence>
        {mostrandoFiltros && (
          <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.15 }} className={`absolute right-0 top-12 w-64 border shadow-xl rounded-2xl overflow-hidden z-50 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`flex items-center justify-between px-3 py-2.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <p className={`text-[8px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Filtrar por</p>
              {filtrosActivos > 0 && (
                <button onClick={limpiar} className={`flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider transition-colors ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'}`}>
                  <svg viewBox="0 0 24 24" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Limpiar ({filtrosActivos})
                </button>
              )}
            </div>
            <div className="flex flex-col max-h-80 overflow-y-auto pb-2">
              {SPECS_ICONS.map(({ key, label, icon }, idx) => {
                const opcs = opciones[key] || [];
                if (!opcs.length) return null;
                return (
                  <div key={key} className={`px-3 py-2.5 ${idx > 0 ? `border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}` : ''}`}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <img src={icon} alt={label} className={`w-3 h-3 object-contain shrink-0 ${isDark ? 'invert opacity-40' : 'opacity-40'}`} />
                      <span className={`text-[8px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {opcs.map((op: string) => {
                        const lista = (draftFiltros[key] as string[]) || [];
                        const activo = lista.includes(op);
                        return (
                          <button key={op} onClick={() => {
                            const nuevaLista = activo ? lista.filter(x => x !== op) : [...lista, op];
                            setDraftFiltros({ ...draftFiltros, [key]: nuevaLista });
                          }}
                            className={`px-2.5 py-1 text-[10px] font-semibold rounded-xl border transition-all leading-none ${activo ? 'bg-violet-600 text-white border-violet-600' : isDark ? 'bg-slate-800 text-slate-400 border-slate-700 hover:border-violet-500/60 hover:text-violet-400' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-violet-300 hover:text-violet-600'}`}>
                            {op}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className={`px-3 py-2.5 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${isDark ? 'opacity-40' : 'opacity-40'}`}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  <span className={`text-[8px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Precio (Gs.)</span>
                </div>
                <div className="flex gap-2">
                  <input type="text" inputMode="numeric" placeholder="Mín" value={draftFiltros.precioMin ? Number(draftFiltros.precioMin).toLocaleString('es-PY') : ''} onChange={e => setDraftFiltros({ ...draftFiltros, precioMin: e.target.value.replace(/\D/g, '') })} className={`w-full h-8 px-2 text-[10px] font-medium rounded-lg border outline-none transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-violet-500' : 'bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-violet-400'}`} />
                  <input type="text" inputMode="numeric" placeholder="Máx" value={draftFiltros.precioMax ? Number(draftFiltros.precioMax).toLocaleString('es-PY') : ''} onChange={e => setDraftFiltros({ ...draftFiltros, precioMax: e.target.value.replace(/\D/g, '') })} className={`w-full h-8 px-2 text-[10px] font-medium rounded-lg border outline-none transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-violet-500' : 'bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-violet-400'}`} />
                </div>
              </div>
            </div>
            <div className={`p-3 border-t ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <button onClick={aplicar} className="w-full h-9 bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-md hover:bg-violet-700 transition-all">Aplicar Filtros</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function CatalogoContent() {
  const searchParams = useSearchParams();
  const laptopIdParam = searchParams.get('laptop');

  const [isDark, setIsDark] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [estaCargandoDB, setEstaCargandoDB] = useState(true);
  const [estaPublicando, setEstaPublicando] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);
  
  const [banners, setBanners] = useState<any[]>(MOCK_BANNERS_INICIALES);
  const [estaGuardandoBanners, setEstaGuardandoBanners] = useState(false);
  const [textoAnuncio, setTextoAnuncio] = useState('🔥 10% DE DESCUENTO PAGANDO CON TRANSFERENCIA ESTE FIN DE SEMANA 🔥');
  const [textoAnuncioDraft, setTextoAnuncioDraft] = useState('🔥 10% DE DESCUENTO PAGANDO CON TRANSFERENCIA ESTE FIN DE SEMANA 🔥');
  const [colorFondoAnuncio, setColorFondoAnuncio] = useState('');
  const [colorTextoAnuncio, setColorTextoAnuncio] = useState('');
  
  const [menuFiltroAbierto, setMenuFiltroAbierto] = useState(false);
  const [ordenamiento, setOrdenamiento] = useState<'NUEVOS' | 'PRECIO_MENOR' | 'PRECIO_MAYOR'>('NUEVOS');
  const [menuFiltroPedidoAbierto, setMenuFiltroPedidoAbierto] = useState(false);
  const [ordenamientoPedido, setOrdenamientoPedido] = useState<'RECIENTES' | 'PRECIO_MENOR' | 'PRECIO_MAYOR'>('RECIENTES');
  const [filtrosDisponibles, setFiltrosDisponibles] = useState<Filtros>({ ...FILTROS_VACIO });
  const [mostrandoFiltrosDisponibles, setMostrandoFiltrosDisponibles] = useState(false);
  const [filtrosPedido, setFiltrosPedido] = useState<Filtros>({ ...FILTROS_VACIO });
  const [mostrandoFiltrosPedido, setMostrandoFiltrosPedido] = useState(false);

  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [productoEnEdicion, setProductoEnEdicion] = useState<number | null>(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState<any | null>(null);
  const [idxImagenModal, setIdxImagenModal] = useState(0); 
  
  // ---> NUEVOS ESTADOS PARA "SOBRE PEDIDO"
  const [enStockInput, setEnStockInput] = useState(true);
  const [tiempoLlegadaInput, setTiempoLlegadaInput] = useState('Llega en 15 a 20 días');

  const [textoSpecs, setTextoSpecs] = useState('');
  const [descripcionInput, setDescripcionInput] = useState('');
  const [precioInput, setPrecioInput] = useState('');
  const [precioOfertaInput, setPrecioOfertaInput] = useState('');
  const [descuentoInput, setDescuentoInput] = useState('');
  const [condicionInput, setCondicionInput] = useState('Excelente Estado');
  const [graficaInput, setGraficaInput] = useState('');
  const [tagsSel, setTagsSel] = useState<string[]>([]);
  const [imagenesArchivos, setImagenesArchivos] = useState<ImagenPreview[]>([]); 
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [mostrandoGestorPromos, setMostrandoGestorPromos] = useState(false);
  const [nuevoBannerDesktop, setNuevoBannerDesktop] = useState('');
  const [nuevoBannerDesktopFile, setNuevoBannerDesktopFile] = useState<File | null>(null);
  const [nuevoBannerMobile, setNuevoBannerMobile] = useState('');
  const [nuevoBannerMobileFile, setNuevoBannerMobileFile] = useState<File | null>(null);
  const [nuevoBannerLink, setNuevoBannerLink] = useState('');

  const [carrito, setCarrito] = useState<{producto: typeof productos[0], cantidad: number}[]>([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  const [mostrandoCheckout, setMostrandoCheckout] = useState(false);
  const [datosCliente, setDatosCliente] = useState({ nombre: '', whatsapp: '', email: '', direccion: '', linkMaps: '', notas: '' });
  const [tipoEnvio, setTipoEnvio] = useState<'retiro' | 'delivery' | 'encomienda' | null>(null);
  const [metodoPago, setMetodoPago] = useState<'transferencia' | 'tarjeta' | null>(null);
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);

  const [resenas, setResenas] = useState<Resena[]>([]);
  const [mostrandoFormResena, setMostrandoFormResena] = useState(false);
  const [resenaEnEdicion, setResenaEnEdicion] = useState<Resena | null>(null);

  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [cuponAplicado, setCuponAplicado] = useState<Cupon | null>(null);
  const [codCuponInput, setCodCuponInput] = useState('');

  useEffect(() => {
    setIsMounted(true);
    const temaGuardado = localStorage.getItem('tema_tienda');
    if (temaGuardado === 'dark' || (!temaGuardado && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) setIsDark(true);

    const verificarSesionYCargarDatos = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(!!session);
      supabase.auth.onAuthStateChange((_event, session) => setIsAdmin(!!session));
      cargarProductosDB(); cargarBannersDB(); cargarAnuncioDB(); cargarResenas(); cargarCupones();
    };
    verificarSesionYCargarDatos();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProductoSeleccionado(null);
        if (window.location.pathname !== '/') window.history.pushState({}, '', '/');
        setMostrandoCheckout(false);
        setCarritoAbierto(false);
        setMostrandoGestorPromos(false);
        setMostrandoFormResena(false);
        setMostrandoFormulario(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (laptopIdParam && productos.length > 0 && !productoSeleccionado) {
      const p = productos.find(x => x.id.toString() === laptopIdParam);
      if (p) {
        setProductoSeleccionado(p);
        setIdxImagenModal(0);
        window.history.replaceState({}, '', `/laptop/${p.id}`);
      }
    }
  }, [laptopIdParam, productos, productoSeleccionado]);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/') {
        setProductoSeleccionado(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const cargarProductosDB = async () => {
    setEstaCargandoDB(true);
    const { data, error } = await supabase.from('productos').select('*').order('id', { ascending: false });
    if (!error && data) setProductos(data);
    setEstaCargandoDB(false);
  };

  const cargarBannersDB = async () => {
    const { data, error } = await supabase.from('banners').select('*').order('id', { ascending: true });
    if (!error && data && data.length > 0) setBanners(data);
  };

  const cargarAnuncioDB = async () => {
    const { data } = await supabase.from('configuracion').select('*').eq('clave', 'anuncio_superior').single();
    if (data && data.valor) {
      const v = data.valor;
      setTextoAnuncio(v.texto || ''); 
      setTextoAnuncioDraft(v.texto || '');
      if (v.colorFondo) setColorFondoAnuncio(v.colorFondo);
      if (v.colorTexto) setColorTextoAnuncio(v.colorTexto);
    }
  };

  const guardarAnuncioDB = async (texto: string, fondo?: string, textoColor?: string) => {
    const payload = { 
      clave: 'anuncio_superior', 
      valor: { 
        texto, 
        colorFondo: fondo || colorFondoAnuncio, 
        colorTexto: textoColor || colorTextoAnuncio 
      } 
    };
    await supabase.from('configuracion').upsert(payload);
    setTextoAnuncio(texto);
  };

  const cargarResenas = async () => {
    const { data, error } = await supabase.from('resenas').select('*').order('id', { ascending: false });
    if (error) {
      console.error("Error cargando reseñas:", error);
      return;
    }
    if (data) setResenas(data);
  };
  const guardarResena = async (nueva: any) => {
    const { error } = await supabase.from('resenas').insert([nueva]);
    if (error) {
      alert("Error al guardar reseña: " + error.message);
    } else {
      cargarResenas();
    }
  };
  const eliminarResena = async (id: string) => {
    const { error } = await supabase.from('resenas').delete().eq('id', id);
    if (error) {
      alert("Error al eliminar reseña: " + error.message);
    } else {
      cargarResenas();
    }
  };
  const editarResena = async (actualizada: Resena) => {
    const { error } = await supabase.from('resenas').update(actualizada).eq('id', actualizada.id);
    if (error) {
      alert("Error al editar reseña: " + error.message);
    } else {
      cargarResenas();
    }
  };

  const cargarCupones = () => {
    const data = localStorage.getItem('easy_cupones');
    if (data) { try { setCupones(JSON.parse(data)); } catch {} }
  };
  const agregarCupon = (nuevo: Cupon) => {
    setCupones(prev => { const nuevos = [...prev, nuevo]; localStorage.setItem('easy_cupones', JSON.stringify(nuevos)); return nuevos; });
  };
  const eliminarCupon = (id: string) => {
    setCupones(prev => { const nuevos = prev.filter(c => c.id !== id); localStorage.setItem('easy_cupones', JSON.stringify(nuevos)); return nuevos; });
  };

  const aplicarCupon = () => {
    const c = cupones.find(x => x.codigo === codCuponInput.trim().toUpperCase());
    if (c) { setCuponAplicado(c); setCodCuponInput(''); }
    else { alert("⚠️ Código inválido."); }
  };

  useEffect(() => {
    const normal = Number(precioInput); const oferta = Number(precioOfertaInput);
    if (normal > 0 && oferta > 0 && oferta < normal) setDescuentoInput(Math.round(((normal - oferta) / normal) * 100).toString());
    else if (!oferta || oferta >= normal) setDescuentoInput('');
  }, [precioInput, precioOfertaInput]);

  useEffect(() => {
    document.body.style.overflow = (productoSeleccionado || carritoAbierto || mostrandoCheckout || mostrandoGestorPromos || mostrandoFormResena) ? 'hidden' : 'auto';
    if (!productoSeleccionado && !(productoSeleccionado || carritoAbierto || mostrandoCheckout || mostrandoGestorPromos || mostrandoFormResena)) setIdxImagenModal(0);
    return () => { document.body.style.overflow = 'auto'; };
  }, [productoSeleccionado, carritoAbierto, mostrandoCheckout, mostrandoGestorPromos, mostrandoFormResena]);

  const toggleTema = () => {
    const nuevoTema = !isDark;
    setIsDark(nuevoTema);
    localStorage.setItem('tema_tienda', nuevoTema ? 'dark' : 'light');
  };

  const manejarSubidaImagenBanner = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressedFile = await comprimirImagen(file, tipo === 'desktop' ? 1920 : 1080, 0.85);
    const url = URL.createObjectURL(compressedFile);
    if (tipo === 'desktop') { setNuevoBannerDesktop(url); setNuevoBannerDesktopFile(compressedFile); } 
    else { setNuevoBannerMobile(url); setNuevoBannerMobileFile(compressedFile); }
  };

  const eliminarBanner = async (id: number) => {
    if (window.confirm("¿Seguro que querés eliminar este banner?")) {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (!error) setBanners(banners.filter(b => b.id !== id));
    }
  };

  const guardarBannerNuevo = async () => {
    if (!nuevoBannerDesktopFile || !nuevoBannerMobileFile) return alert("⚠️ Tenés que subir ambas imágenes.");
    setEstaGuardandoBanners(true);
    try {
      const extD = nuevoBannerDesktopFile.name.split('.').pop();
      const nameD = `desktop-${Date.now()}-${Math.random().toString(36).substring(7)}.${extD}`;
      await supabase.storage.from('laptops').upload(`banners/${nameD}`, nuevoBannerDesktopFile);
      const { data: urlD } = supabase.storage.from('laptops').getPublicUrl(`banners/${nameD}`);

      const extM = nuevoBannerMobileFile.name.split('.').pop();
      const nameM = `mobile-${Date.now()}-${Math.random().toString(36).substring(7)}.${extM}`;
      await supabase.storage.from('laptops').upload(`banners/${nameM}`, nuevoBannerMobileFile);
      const { data: urlM } = supabase.storage.from('laptops').getPublicUrl(`banners/${nameM}`);

      const { error } = await supabase.from('banners').insert([{ imgDesktop: urlD.publicUrl, imgMobile: urlM.publicUrl, link: nuevoBannerLink || '#', alt: 'Banner Promocional' }]);
      if (error) throw error;
      alert("✅ Banner guardado.");
      setNuevoBannerDesktop(''); setNuevoBannerMobile(''); setNuevoBannerLink(''); setNuevoBannerDesktopFile(null); setNuevoBannerMobileFile(null);
      await cargarBannersDB(); 
    } catch (error) { alert("⚠️ Error al guardar."); }
    setEstaGuardandoBanners(false);
  };

  const agregarAlCarrito = (producto: any) => {
    const precioFinal = producto.upgrade ? (producto.precio_oferta || producto.precio) + 170000 : (producto.precio_oferta || producto.precio);
    const prodConPrecio = { ...producto, precio_final_calculado: precioFinal };
    setCarrito(prev => prev.find(item => item.producto.id === producto.id) 
      ? prev.map(item => item.producto.id === producto.id ? { ...item, producto: prodConPrecio } : item) 
      : [...prev, { producto: prodConPrecio, cantidad: 1 }]);
  };
  const eliminarDelCarrito = (id: number) => { setCarrito(prev => prev.filter(item => item.producto.id !== id)); if (carrito.length === 1 && carrito[0].producto.id === id) setMostrandoCheckout(false); };
  const restarCantidad = (id: number) => setCarrito(prev => prev.map(item => item.producto.id === id && item.cantidad > 1 ? { ...item, cantidad: item.cantidad - 1 } : item));
  const totalCarrito = carrito.reduce((acc, item) => acc + (item.producto.precio_final_calculado || (item.producto.precio_oferta || item.producto.precio)) * item.cantidad, 0);
  const valorDescuento = cuponAplicado ? (cuponAplicado.tipo === 'porcentaje' ? (totalCarrito * cuponAplicado.valor / 100) : cuponAplicado.valor) : 0;
  const totalConDescuento = Math.max(0, totalCarrito - valorDescuento);

  const obtenerUbicacion = () => {
    if (!("geolocation" in navigator)) return alert("⚠️ No soporta ubicación.");
    setObteniendoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      (position) => { setDatosCliente(prev => ({ ...prev, linkMaps: `http://googleusercontent.com/maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}` })); setObteniendoUbicacion(false); },
      (error) => { alert("⚠️ No pudimos acceder a tu ubicación."); setObteniendoUbicacion(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const enviarPedidoWhatsApp = () => {
    if (!datosCliente.nombre || !datosCliente.whatsapp) return alert("⚠️ Completá Nombre y WhatsApp.");
    if (!tipoEnvio) return alert("⚠️ Seleccioná tipo de envío.");
    if (!metodoPago) return alert("⚠️ Seleccioná método de pago.");
    if ((tipoEnvio === 'delivery' || tipoEnvio === 'encomienda') && !datosCliente.direccion && !datosCliente.linkMaps) return alert("⚠️ Ingresá tu dirección o link de Maps.");
    
    let m = `¡Hola! Quiero hacer un pedido 💻\n\n*🛒 RESUMEN DEL PEDIDO:*\n`;
    carrito.forEach(item => m += `- ${item.cantidad}x ${item.producto.marca} ${item.producto.modelo} ${item.producto.upgrade ? `(*Upgrade: ${item.producto.upgrade}*) ` : ''}(${formatearPrecio(item.producto.precio_final_calculado || item.producto.precio_oferta || item.producto.precio)})\n`);
    
    if (cuponAplicado) {
      m += `*Subtotal:* ${formatearPrecio(totalCarrito)}\n`;
      m += `*Cupón:* ${cuponAplicado.codigo} (-${cuponAplicado.tipo === 'porcentaje' ? cuponAplicado.valor + '%' : formatearPrecio(cuponAplicado.valor)})\n`;
      m += `*Total Final:* ${formatearPrecio(totalConDescuento)}\n\n`;
    } else {
      m += `*Total a pagar:* ${formatearPrecio(totalCarrito)}\n\n`;
    }
    
    m += `*👤 MIS DATOS:*\nNombre: ${datosCliente.nombre}\nWhatsApp: ${datosCliente.whatsapp}\n${datosCliente.email ? `Email: ${datosCliente.email}\n` : ''}\n*📦 ENVÍO:*\n`;
    m += `${{ retiro: '🏠 Paso a retirar del local', delivery: '🚚 Envío gratis con delivery propio', encomienda: '📦 Envío por transportadora (Encomienda)' }[tipoEnvio]}\n`;
    if (tipoEnvio !== 'retiro') { if (datosCliente.direccion) m += `Dirección/Ref: ${datosCliente.direccion}\n`; if (datosCliente.linkMaps) m += `Ubicación (Maps): ${datosCliente.linkMaps}\n`; }
    m += `\n*💳 MÉTODO DE PAGO:*\n${{ transferencia: '💸 Transferencia bancaria o efectivo', tarjeta: '💳 Tarjeta de crédito (Visa/Mastercard) o Apple/Google Pay' }[metodoPago]}\n\n`;
    if (datosCliente.notas) m += `*📝 NOTAS ADICIONALES:*\n${datosCliente.notas}\n`;

    window.open(`https://api.whatsapp.com/send?phone=595976654321&text=${encodeURIComponent(m)}`, '_blank');
  };

  const manejarSubidaImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (imagenesArchivos.length + files.length > 5) return alert("⚠️ Máximo 5 fotos.");
    const nuevosArchivos: ImagenPreview[] = [];
    for (const file of files) {
      const compressedFile = await comprimirImagen(file, 1200, 0.85);
      nuevosArchivos.push({ file: compressedFile, url: URL.createObjectURL(compressedFile) });
    }
    setImagenesArchivos(prev => [...prev, ...nuevosArchivos]);
  };

  const eliminarImagenPreview = (index: number) => setImagenesArchivos(prev => prev.filter((_, i) => i !== index));

  const resetearFormulario = () => {
    setProductoEnEdicion(null); setTextoSpecs(''); setDescripcionInput(''); setPrecioInput(''); setPrecioOfertaInput(''); setDescuentoInput(''); setCondicionInput('Excelente Estado'); setTagsSel([]); setImagenesArchivos([]); setMostrandoFormulario(false); setEstaPublicando(false);
    // Reiniciar los estados nuevos
    setEnStockInput(true); setTiempoLlegadaInput('Llega en 15 a 20 días'); setGraficaInput('');
  };

  const abrirEdicion = (p: any) => {
    setProductoEnEdicion(p.id); setTextoSpecs(`${p.marca} ${p.modelo} | ${p.procesador} | ${p.ram} | ${p.disco} | ${p.pantalla}`); setDescripcionInput(p.descripcion || ''); setPrecioInput(p.precio.toString()); setPrecioOfertaInput(p.precio_oferta ? p.precio_oferta.toString() : ''); setDescuentoInput(p.descuento ? p.descuento.toString() : ''); setTagsSel(p.tags || []); setGraficaInput(p.grafica || '');
    
    // Identificamos si estaba en stock o sobre pedido
    const estaEnStock = p.disponibilidad !== 'Sobre Pedido';
    setEnStockInput(estaEnStock);
    if (!estaEnStock) {
      setTiempoLlegadaInput(p.condicion_estetica); // Acá se guardó el "Llega en X días"
    } else {
      setCondicionInput(p.condicion_estetica);
    }

    const imagenesParaEdicion = (p.imagenes || []).map((imgUrl: string) => ({ file: null, url: imgUrl }));
    setImagenesArchivos(imagenesParaEdicion); setMostrandoFormulario(true);
  };

  const eliminarProducto = async (id: number) => {
    if (window.confirm("¿Seguro que querés eliminar esta notebook?")) {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (!error) { setProductos(prev => prev.filter(p => p.id !== id)); if (productoSeleccionado?.id === id) setProductoSeleccionado(null); eliminarDelCarrito(id); }
    }
  };

  const publicarProducto = async () => {
    if (imagenesArchivos.length === 0) return alert("⚠️ Agregá al menos una foto.");
    if (!/[|\/]|\s-\s/.test(textoSpecs)) return alert("⚠️ Falta el separador entre specs (usá |, / o -).");
    if (!precioInput || isNaN(Number(precioInput))) return alert("⚠️ Precio inválido.");
    setEstaPublicando(true);

    const partes = textoSpecs.split(/\s*\|\s*|\s*\/\s*|\s+-\s+/).map(str => str.trim());
    if (partes.length < 5) { setEstaPublicando(false); return alert("⚠️ Faltan datos en specs."); }

    let urlsFinales: string[] = [];
    for (const img of imagenesArchivos) {
      if (img.file) {
        const ext = img.file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('laptops').upload(fileName, img.file);
        if (uploadError) { setEstaPublicando(false); return alert("Error subiendo foto."); }
        const { data } = supabase.storage.from('laptops').getPublicUrl(fileName);
        urlsFinales.push(data.publicUrl);
      } else { urlsFinales.push(img.url); }
    }

    const [marcaModeloBruto, procesadorBruto, ramExtraida, discoExtraido, pantallaExtraida] = partes;
    const primeraPalabra = marcaModeloBruto.split(' ')[0];
    const datosProducto = {
      marca: primeraPalabra, 
      modelo: marcaModeloBruto.substring(primeraPalabra.length).trim(), 
      estado: enStockInput ? 'USADA' : 'A PEDIDO', 
      condicion_estetica: enStockInput ? condicionInput : tiempoLlegadaInput,
      procesador: procesadorBruto.replace(/Intel Core |Intel |th Gen|nd Gen|rd Gen|st Gen/gi, match => match.includes('Gen') ? '° Gen' : '').replace(/AMD Ryzen /gi, 'Ryzen '),
      pantalla: pantallaExtraida, disco: discoExtraido, ram: ramExtraida, precio: Number(precioInput), precio_oferta: precioOfertaInput ? Number(precioOfertaInput) : null,
      descuento: descuentoInput ? Number(descuentoInput) : null, 
      disponibilidad: enStockInput ? 'En Stock' : 'Sobre Pedido',
      tags: tagsSel, descripcion: descripcionInput || DESCRIPCION_POR_DEFECTO, imagenes: urlsFinales,
      grafica: graficaInput.trim() || null
    };

    if (productoEnEdicion) await supabase.from('productos').update(datosProducto).eq('id', productoEnEdicion);
    else await supabase.from('productos').insert([datosProducto]);

    await cargarProductosDB(); resetearFormulario();
  };

  const sortProductos = (arr: any[], ord: string) => [...arr].sort((a, b) => {
    const pA = a.precio_oferta || a.precio, pB = b.precio_oferta || b.precio;
    return ord === 'PRECIO_MENOR' ? pA - pB : ord === 'PRECIO_MAYOR' ? pB - pA : b.id - a.id;
  });

  // Opciones de filtro: derivadas por sección (solo valores que existen en esa sección)
  const productosEnStockRaw = productos.filter(p => p.disponibilidad !== 'Sobre Pedido');
  const productosPedidoRaw = productos.filter(p => p.disponibilidad === 'Sobre Pedido');
  const opcionesBase = (arr: any[]) => ({
    procesador: sortProcesadores([...new Set(arr.map((p: any) => normalizarProcesador(p.procesador)).filter(Boolean))] as string[]),
    ram: sortNumerico([...new Set(arr.map((p: any) => normalizarStorage(p.ram)).filter(Boolean))] as string[]),
    disco: sortNumerico([...new Set(arr.map((p: any) => normalizarStorage(p.disco)).filter(Boolean))] as string[]),
    pantalla: sortNumerico([...new Set(arr.map((p: any) => normalizarPantalla(p.pantalla)).filter(Boolean))] as string[]),
  });
  const opcionesDisponibles = opcionesBase(productosEnStockRaw);
  const opcionesPedido = opcionesBase(productosPedidoRaw);

  const aplicarFiltros = (arr: any[], f: Filtros) => arr.filter(p => {
    const precio = p.precio_oferta || p.precio;
    return (f.ram.length === 0 || f.ram.includes(normalizarStorage(p.ram))) &&
      (f.pantalla.length === 0 || f.pantalla.includes(normalizarPantalla(p.pantalla))) &&
      (f.disco.length === 0 || f.disco.includes(normalizarStorage(p.disco))) &&
      (f.procesador.length === 0 || f.procesador.includes(normalizarProcesador(p.procesador))) &&
      (!f.precioMin || precio >= Number(f.precioMin)) &&
      (!f.precioMax || precio <= Number(f.precioMax));
  });

  // Dividimos en dos listas para la UI, cada una con su propio ordenamiento y filtros
  const productosEnStock = sortProductos(aplicarFiltros(productosEnStockRaw, filtrosDisponibles), ordenamiento);
  const productosSobrePedido = sortProductos(aplicarFiltros(productosPedidoRaw, filtrosPedido), ordenamientoPedido);
  const filtrosActivosCombinados = (filtrosDisponibles.ram.length + filtrosDisponibles.pantalla.length + filtrosDisponibles.disco.length + filtrosDisponibles.procesador.length + (filtrosDisponibles.precioMin || filtrosDisponibles.precioMax ? 1 : 0)) +
                                  (filtrosPedido.ram.length + filtrosPedido.pantalla.length + filtrosPedido.disco.length + filtrosPedido.procesador.length + (filtrosPedido.precioMin || filtrosPedido.precioMax ? 1 : 0));

  if (!isMounted) return <div className={`min-h-screen ${isDark ? 'tech-bg-dark' : 'tech-bg-light'} transition-colors duration-300`} />;

  const estForm = ESTETICA_FORMULARIO(isDark);
  const RADIO_GENERAL = DESIGN_SYSTEM.spacing.radius;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 font-sans ${isDark ? 'tech-bg-dark' : 'tech-bg-light'}`}>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@600;700;800&display=swap');
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        @keyframes marquee-resenas { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .marquee-pause:hover > div { animation-play-state: paused; }
        .tech-bg-dark {
          background-color: #080c18;
          background-image:
            radial-gradient(ellipse 55% 35% at 100% 0%, rgba(30, 64, 175, 0.28) 0%, transparent 100%),
            radial-gradient(ellipse 45% 30% at 0% 100%, rgba(109, 40, 217, 0.20) 0%, transparent 100%),
            radial-gradient(ellipse 35% 25% at 15% 0%, rgba(109, 40, 217, 0.12) 0%, transparent 100%),
            radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.04) 1px, transparent 0);
          background-size: auto, auto, auto, 28px 28px;
        }
        .tech-bg-light {
          background-color: #f8fafc;
          background-image:
            radial-gradient(ellipse 55% 35% at 100% 0%, rgba(59, 130, 246, 0.12) 0%, transparent 100%),
            radial-gradient(ellipse 45% 30% at 0% 100%, rgba(139, 92, 246, 0.09) 0%, transparent 100%),
            radial-gradient(ellipse 35% 25% at 15% 0%, rgba(139, 92, 246, 0.06) 0%, transparent 100%),
            radial-gradient(circle at 1.5px 1.5px, rgba(15, 23, 42, 0.05) 1px, transparent 0);
          background-size: auto, auto, auto, 28px 28px;
        }
      `}} />
      <BarraAnuncio texto={textoAnuncio} onEdit={() => setMostrandoGestorPromos(true)} isDark={isDark} isAdmin={isAdmin} colorFondo={colorFondoAnuncio} colorTexto={colorTextoAnuncio} />

      <nav className="p-4 lg:p-6 flex justify-between items-center max-w-7xl mx-auto w-full relative z-40">
        <img src={isDark ? "https://i.imgur.com/2lSkLeX.png" : "https://i.imgur.com/jNPKE3H.png"} alt="Easy Laptops Logo" className="h-16 sm:h-20 lg:h-24 w-auto object-contain transition-all duration-300" />
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => setCarritoAbierto(true)} className={`relative flex items-center justify-center w-10 h-10 rounded-full border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:text-violet-600 hover:border-violet-300 shadow-sm'}`} title="Ver Carrito">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            {carrito.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-violet-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#F4F6F8] dark:border-slate-950">{carrito.reduce((acc, item) => acc + item.cantidad, 0)}</span>}
          </button>
          <button onClick={toggleTema} className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-400 hover:text-violet-500 hover:border-violet-300 shadow-sm'}`}>
            {isDark ? <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> : <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
          </button>
          {isAdmin && <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setMostrandoFormResena(true)} className={`text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl border-2 transition-all ${isDark ? 'border-slate-700 text-slate-400 hover:border-violet-500 hover:text-violet-400' : 'border-slate-200 text-slate-500 hover:border-violet-400 hover:text-violet-600'}`}>Reseñas</motion.button>}
          {isAdmin && <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { resetearFormulario(); setMostrandoFormulario(true); }} className={ESTETICA_CONTROLES(isDark).botonPrincipal}>+ Publicar</motion.button>}
          {isAdmin && <button onClick={() => supabase.auth.signOut()} className="text-[10px] uppercase font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1 rounded-full ml-2">Salir</button>}
        </div>
      </nav>

      {mostrandoFormulario ? (
        <main className="p-3 sm:p-4 pb-16 sm:pb-24 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 w-full overflow-hidden flex-1">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className={estForm.contenedor}>
            <div className="shrink-0">
              <button onClick={resetearFormulario} className={`text-[10px] mb-4 uppercase tracking-wider transition-colors font-medium ${isDark ? 'text-slate-500 hover:text-violet-400' : 'text-slate-400 hover:text-violet-600'}`}>← Volver al Catálogo</button>
              <h2 className={`text-xl font-display font-bold mb-5 tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>{productoEnEdicion ? 'EDITAR LAPTOP ✏️' : 'NUEVA LAPTOP 💻'}</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
              <div className="pt-1">
                <div className={`${estForm.uploadArea} py-6 ${imagenesArchivos.length >= 5 ? 'opacity-50' : 'cursor-pointer'} ${isDark ? 'border-dashed border-slate-700 bg-slate-800/50 hover:bg-slate-800' : 'border-dashed border-violet-200 bg-violet-50 hover:bg-violet-100'}`}>
                  <input type="file" multiple accept="image/*" onChange={manejarSubidaImagen} disabled={imagenesArchivos.length >= 5} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 mb-1 ${isDark ? 'text-slate-400' : 'text-violet-600'}`}>📸 SUBIR FOTOS</span>
                  <span className={`text-[9px] font-medium ${isDark ? 'text-slate-500' : 'text-violet-400'}`}>Máximo 5 imágenes ({imagenesArchivos.length}/5)</span>
                </div>
                {imagenesArchivos.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {imagenesArchivos.map((imgObj, index) => (
                      <div key={`${imgObj.url}-${index}`} draggable onDragStart={() => setDraggedIndex(index)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (draggedIndex === null || draggedIndex === index) return; const nuevas = [...imagenesArchivos]; nuevas.splice(index, 0, nuevas.splice(draggedIndex, 1)[0]); setImagenesArchivos(nuevas); setDraggedIndex(null); }} onDragEnd={() => setDraggedIndex(null)} className={`relative aspect-square rounded-lg overflow-hidden border cursor-move transition-all ${isDark ? 'border-slate-700' : 'border-slate-200'} group ${draggedIndex === index ? 'opacity-40 scale-90 border-violet-500 border-2' : 'opacity-100'}`}>
                        <img src={imgObj.url} alt={`Preview ${index}`} className="w-full h-full object-cover pointer-events-none" />
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); eliminarImagenPreview(index); }} className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md hover:scale-110 transition-transform">✕</button>
                        </div>
                        {index === 0 && <span className="absolute bottom-0 inset-x-0 bg-violet-600/90 text-white text-[7px] text-center font-bold uppercase py-0.5 pointer-events-none z-10">Principal</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div><label className={estForm.label}>Especificaciones (separar con |, / o -)</label><input type="text" placeholder='Ej: Lenovo Thinkpad E14 | i7 10° Gen | 8 GB | 256 GB | 14"' className={`${estForm.input} h-10 ${RADIO_GENERAL}`} value={textoSpecs} onChange={e => setTextoSpecs(e.target.value)} /></div>

              <div>
                <label className={estForm.label}>Gráfica <span className={`normal-case font-normal ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>(opcional — dejar vacío si no tiene dedicada)</span></label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 6V4M12 6V4M16 6V4M8 18v2M12 18v2M16 18v2M2 10h2M2 14h2M20 10h2M20 14h2"/><rect x="9" y="10" width="6" height="4" rx="1"/></svg>
                  </span>
                  <input type="text" placeholder="Ej: RTX 4060, RX 7600M, Intel Arc A370M..." className={`${estForm.input} h-10 ${RADIO_GENERAL} pl-8`} value={graficaInput} onChange={e => setGraficaInput(e.target.value)} />
                </div>
              </div>
              
              <div className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} onClick={() => setEnStockInput(!enStockInput)}>
                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${enStockInput ? 'bg-violet-600 border-violet-600' : (isDark ? 'border-slate-500' : 'border-slate-300')}`}>
                  {enStockInput && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                </div>
                <div className="flex flex-col">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-700'}`}>Stock Disponible</span>
                  <span className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{enStockInput ? 'El equipo está disponible para entrega inmediata' : 'El equipo se trae sobre pedido (importación)'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className={estForm.label}>Precio Normal (Gs.)</label><input type="text" inputMode="numeric" placeholder="3,000,000" className={`${estForm.input} h-10 ${RADIO_GENERAL}`} value={precioInput ? Number(precioInput).toLocaleString('en-US') : ''} onChange={e => setPrecioInput(e.target.value.replace(/\D/g, ''))} /></div>
                
                {enStockInput ? (
                  <div><label className={estForm.label}>Condición</label><div className="relative"><select className={`${estForm.input} h-10 ${RADIO_GENERAL} appearance-none pr-8 cursor-pointer`} value={condicionInput} onChange={e => setCondicionInput(e.target.value)}>{['Excelente Estado', 'Muy Buen Estado', 'Con detalles estéticos'].map(o => <option key={o} value={o}>{o}</option>)}</select><span className={`absolute right-3 top-3 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'} pointer-events-none`}>▼</span></div></div>
                ) : (
                  <div><label className={estForm.label}>Tiempo de llegada</label><input type="text" placeholder="Ej: Llega en 20 días" className={`${estForm.input} h-10 ${RADIO_GENERAL}`} value={tiempoLlegadaInput} onChange={e => setTiempoLlegadaInput(e.target.value)} /></div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className={estForm.label}>Precio Oferta (Gs.)</label><input type="text" inputMode="numeric" placeholder="2,600,000" className={`${estForm.input} h-10 ${RADIO_GENERAL}`} value={precioOfertaInput ? Number(precioOfertaInput).toLocaleString('en-US') : ''} onChange={e => setPrecioOfertaInput(e.target.value.replace(/\D/g, ''))} /></div>
                <div><label className={estForm.label}>% Descuento</label><input type="number" placeholder="13" className={`${estForm.input} h-10 ${RADIO_GENERAL} ${precioOfertaInput ? 'text-red-500 font-semibold' : ''}`} value={descuentoInput} onChange={e => { setDescuentoInput(e.target.value); if (precioInput && e.target.value && !isNaN(Number(e.target.value))) setPrecioOfertaInput(Math.round(Number(precioInput) * (1 - Number(e.target.value) / 100)).toString()); }} /></div>
              </div>

              <div><label className={estForm.label}>Descripción</label><textarea placeholder="Detalles, accesorios o características extra de la notebook..." className={`${estForm.input} py-3 h-24 resize-none leading-relaxed ${RADIO_GENERAL}`} value={descripcionInput} onChange={e => setDescripcionInput(e.target.value)} /></div>

              <div>
                <label className={estForm.label}>Características Extras</label>
                <div className="flex flex-wrap gap-1.5">
                  {TAGS_DISPONIBLES.map(t => <button key={t.label} onClick={() => setTagsSel(p => p.includes(t.label) ? p.filter(x => x !== t.label) : [...p, t.label])} className={`px-3 py-1 text-[10px] font-medium transition-all border-2 ${tagsSel.includes(t.label) ? 'bg-violet-600 text-white border-violet-600' : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-100')} ${RADIO_GENERAL}`}>{t.emoji} {t.label}</button>)}
                </div>
              </div>
            </div>
            <div className="shrink-0 pt-4 mt-auto border-t border-slate-100 dark:border-slate-800">
              <motion.button whileHover={{ scale: estaPublicando ? 1 : 1.02 }} whileTap={{ scale: estaPublicando ? 1 : 0.98 }} onClick={publicarProducto} disabled={estaPublicando} className={estForm.botonPrincipal}>
                {estaPublicando ? '⏳ CARGANDO FOTOS Y GUARDANDO...' : (productoEnEdicion ? '💾 GUARDAR CAMBIOS' : '🚀 PUBLICAR NOTEBOOK')}
              </motion.button>
            </div>
          </motion.div>
        </main>
      ) : (
        <main className="max-w-7xl mx-auto px-2 sm:px-4 pt-0 pb-6 sm:pb-8 flex flex-col gap-6 sm:gap-8 animate-in fade-in duration-300 w-full overflow-hidden flex-1">
          <CarruselBanners banners={banners} onEdit={() => setMostrandoGestorPromos(true)} isDark={isDark} isAdmin={isAdmin} />

          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-row justify-between items-center gap-4 px-2 sm:px-0">
              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-display font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#1E2046]'}`}>Laptops Disponibles</h2>
              <div className="flex items-center gap-2 sm:gap-3 justify-end sm:ml-auto">
                {!estaCargandoDB && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-[10px] font-medium uppercase tracking-wider mr-1 ${isDark ? 'text-slate-500' : 'text-slate-400'} hidden sm:block`}>{productosEnStock.length} productos</motion.span>}
                <FiltroEspecsBoton filtros={filtrosDisponibles} setFiltros={setFiltrosDisponibles} opciones={opcionesDisponibles} mostrandoFiltros={mostrandoFiltrosDisponibles} setMostrandoFiltros={setMostrandoFiltrosDisponibles} alAbrir={() => { setMenuFiltroAbierto(false); setMostrandoFiltrosPedido(false); }} isDark={isDark} />
                <div className="relative">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setMenuFiltroAbierto(!menuFiltroAbierto); setMostrandoFiltrosDisponibles(false); }} className={`w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-200 transition-all ${isDark ? 'shadow-none' : ''}`} title="Ordenar catálogo"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="6" y1="12" x2="18" y2="12"></line><line x1="8" y1="18" x2="16" y2="18"></line></svg></motion.button>
                  <AnimatePresence>
                    {menuFiltroAbierto && (
                      <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.15 }} className={`absolute right-0 top-12 w-48 border shadow-xl rounded-2xl p-2 flex flex-col z-50 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <p className={`text-[8px] font-semibold uppercase tracking-wider text-center border-b pb-2 mb-2 ${isDark ? 'text-slate-500 border-slate-800' : 'text-slate-400 border-slate-100'}`}>Ordenar por</p>
                        {[{id: 'NUEVOS', label: 'Nuevos ingresos'}, {id: 'PRECIO_MENOR', label: 'Precio (Menor a Mayor)'}, {id: 'PRECIO_MAYOR', label: 'Precio (Mayor a Menor)'}].map(op => (
                          <button key={op.id} onClick={() => { setOrdenamiento(op.id as any); setMenuFiltroAbierto(false); }} className={`text-left px-3 py-2 text-[10px] font-medium uppercase tracking-wider rounded-xl transition-colors flex items-center justify-between ${op.id !== 'NUEVOS' ? 'mt-1 ' : ''}${ordenamiento === op.id ? (isDark ? 'bg-violet-900/40 text-violet-400' : 'bg-violet-50 text-violet-600') : (isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50')}`}>{op.label} {ordenamiento === op.id && '✓'}</button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </div>

          </div>

          {estaCargandoDB ? (
            <div className="w-full py-20" />
          ) : (
            <>
              {productosEnStock.length === 0 && productosSobrePedido.length === 0 ? (
                <div className="w-full flex flex-col items-center justify-center py-20 text-center opacity-60">
                  <span className="text-4xl mb-4">{filtrosActivosCombinados > 0 ? '🔍' : '🛒'}</span>
                  <p className="font-bold">{filtrosActivosCombinados > 0 ? 'No hay laptops con esas specs.' : 'No hay notebooks publicadas.'}</p>
                  {filtrosActivosCombinados > 0 && <button onClick={() => { setFiltrosDisponibles({ ...FILTROS_VACIO }); setFiltrosPedido({ ...FILTROS_VACIO }); }} className={`mt-3 text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-full border transition-all ${isDark ? 'border-slate-700 text-slate-400 hover:border-violet-500 hover:text-violet-400' : 'border-slate-300 text-slate-500 hover:border-violet-400 hover:text-violet-600'}`}>Limpiar filtros</button>}
                </div>
              ) : (
                <>
                  {productosEnStock.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 w-full px-2 sm:px-0">
                      <AnimatePresence>
                        {productosEnStock.map((producto) => (
                          <TarjetaNotebook key={producto.id} producto={producto} isDark={isDark} isAdmin={isAdmin} onEliminar={eliminarProducto} onEditar={abrirEdicion} onClick={() => { setProductoSeleccionado(producto); setIdxImagenModal(0); window.history.pushState({}, '', `/laptop/${producto.id}`); }} />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {productosSobrePedido.length > 0 && (
                    <div className="mt-4 sm:mt-6 flex flex-col gap-4 sm:gap-6">
                      <div className="flex flex-row justify-between items-center gap-4 px-2 sm:px-0">
                        <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-display font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#1E2046]'}`}>Laptops sobre pedido</h2>
                        <div className="flex items-center gap-3 justify-end sm:ml-auto">
                          {!estaCargandoDB && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-[10px] font-medium uppercase tracking-wider mr-2 ${isDark ? 'text-slate-500' : 'text-slate-400'} hidden sm:block`}>{productosSobrePedido.length} productos</motion.span>}
                          <FiltroEspecsBoton filtros={filtrosPedido} setFiltros={setFiltrosPedido} opciones={opcionesPedido} mostrandoFiltros={mostrandoFiltrosPedido} setMostrandoFiltros={setMostrandoFiltrosPedido} alAbrir={() => { setMenuFiltroPedidoAbierto(false); setMostrandoFiltrosDisponibles(false); }} isDark={isDark} />
                          <div className="relative">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setMenuFiltroPedidoAbierto(!menuFiltroPedidoAbierto); setMostrandoFiltrosPedido(false); }} className={`w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-200 transition-all ${isDark ? 'shadow-none' : ''}`} title="Ordenar"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/></svg></motion.button>
                            <AnimatePresence>
                              {menuFiltroPedidoAbierto && (
                                <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.15 }} className={`absolute right-0 top-12 w-52 border shadow-xl rounded-2xl p-2 flex flex-col z-50 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                  <p className={`text-[8px] font-semibold uppercase tracking-wider text-center border-b pb-2 mb-2 ${isDark ? 'text-slate-500 border-slate-800' : 'text-slate-400 border-slate-100'}`}>Ordenar por</p>
                                  {[{id: 'RECIENTES', label: 'Últimas publicaciones'}, {id: 'PRECIO_MENOR', label: 'Precio (Menor a Mayor)'}, {id: 'PRECIO_MAYOR', label: 'Precio (Mayor a Menor)'}].map((op, idx) => (
                                    <button key={op.id} onClick={() => { setOrdenamientoPedido(op.id as any); setMenuFiltroPedidoAbierto(false); }} className={`text-left px-3 py-2 text-[10px] font-medium uppercase tracking-wider rounded-xl transition-colors flex items-center justify-between ${idx > 0 ? 'mt-1 ' : ''}${ordenamientoPedido === op.id ? (isDark ? 'bg-violet-900/40 text-violet-400' : 'bg-violet-50 text-violet-600') : (isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50')}`}>{op.label} {ordenamientoPedido === op.id && '✓'}</button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 w-full px-2 sm:px-0">
                        <AnimatePresence>
                          {productosSobrePedido.map((producto) => (
                            <TarjetaNotebook key={producto.id} producto={producto} isDark={isDark} isAdmin={isAdmin} onEliminar={eliminarProducto} onEditar={abrirEdicion} onClick={() => { setProductoSeleccionado(producto); setIdxImagenModal(0); window.history.pushState({}, '', `/laptop/${producto.id}`); }} />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      )}

      {/* ========================================================
          ⭐ SECCIÓN DE RESEÑAS
      ======================================================== */}
      {!mostrandoFormulario && (resenas.length > 0 || isAdmin) && (
        <section className={`w-full mt-12 sm:mt-20 pt-12 sm:pt-16 pb-8 sm:pb-12 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} overflow-hidden`}>
          <div className="max-w-7xl mx-auto px-4 mb-6">
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>Lo que dicen nuestros clientes</p>
            <div className="flex items-center gap-2.5">
              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-display font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#1E2046]'}`}>Reseñas verificadas</h2>
              <svg viewBox="0 0 24 24" width="21" height="21" fill="none" className="shrink-0 mt-0.5">
                <defs>
                  <linearGradient id="ig-verified" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f09433"/>
                    <stop offset="30%" stopColor="#e6683c"/>
                    <stop offset="55%" stopColor="#dc2743"/>
                    <stop offset="78%" stopColor="#cc2366"/>
                    <stop offset="100%" stopColor="#bc1888"/>
                  </linearGradient>
                </defs>
                <polygon points="12,1 13.94,4.75 17.5,2.47 17.3,6.7 21.53,6.5 19.24,10.06 23,12 19.24,13.94 21.53,17.5 17.3,17.3 17.5,21.53 13.94,19.24 12,23 10.06,19.24 6.5,21.53 6.7,17.3 2.47,17.5 4.75,13.94 1,12 4.75,10.06 2.47,6.5 6.7,6.7 6.5,2.47 10.06,4.75" fill="url(#ig-verified)"/>
                <path d="M8 12.5l2.8 2.8 5.2-5.8" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className="marquee-pause">
            <CarruselResenas resenas={resenas} isDark={isDark} isAdmin={isAdmin} onEliminar={eliminarResena} onEditar={(r: Resena) => { setResenaEnEdicion(r); setMostrandoFormResena(true); }} />
          </div>
        </section>
      )}

      {/* ========================================================
          🚀 FOOTER (Términos, Privacidad, Contacto)
      ======================================================== */}
      <footer className={`mt-auto py-10 sm:py-12 px-4 border-t ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50/50'} w-full relative z-40`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start gap-2">
            <img src={isDark ? "https://i.imgur.com/2lSkLeX.png" : "https://i.imgur.com/jNPKE3H.png"} alt="Easy Laptops Logo" className="h-6 sm:h-8 w-auto object-contain opacity-50 grayscale transition-all duration-300 hover:grayscale-0 hover:opacity-100" />
            <p className={`text-[10px] sm:text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              © {new Date().getFullYear()} Easy Laptops. Todos los derechos reservados.
            </p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-3">
            {['Términos y Condiciones', 'Política de Privacidad', 'Envíos y Devoluciones', 'Contacto'].map((link) => (
              <a key={link} href="#" className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-colors ${isDark ? 'text-slate-400 hover:text-violet-400' : 'text-slate-500 hover:text-violet-600'}`}>
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* ========================================================
          ⭐ MODAL NUEVA RESEÑA (Solo Admin)
      ======================================================== */}
      <AnimatePresence>
        {mostrandoFormResena && isAdmin && (
          <FormResena isDark={isDark} onClose={() => { setMostrandoFormResena(false); setResenaEnEdicion(null); }} onGuardar={guardarResena} onEditar={editarResena} resenaEnEdicion={resenaEnEdicion} estForm={estForm} RADIO_GENERAL={RADIO_GENERAL} />
        )}
      </AnimatePresence>

      {/* ========================================================
          🚀 GESTOR DE PROMOCIONES (Solo lo ve el Admin)
      ======================================================== */}
      <AnimatePresence>
        {mostrandoGestorPromos && isAdmin && (
          <GestorPromocionesAdmin 
            isDark={isDark} setMostrandoGestorPromos={setMostrandoGestorPromos} textoAnuncioDraft={textoAnuncioDraft}
            setTextoAnuncioDraft={setTextoAnuncioDraft} setTextoAnuncio={setTextoAnuncio} guardarAnuncioDB={guardarAnuncioDB}
            colorFondoAnuncio={colorFondoAnuncio} setColorFondoAnuncio={setColorFondoAnuncio}
            colorTextoAnuncio={colorTextoAnuncio} setColorTextoAnuncio={setColorTextoAnuncio}
            banners={banners} eliminarBanner={eliminarBanner} nuevoBannerDesktop={nuevoBannerDesktop} 
            nuevoBannerMobile={nuevoBannerMobile} manejarSubidaImagenBanner={manejarSubidaImagenBanner}
            nuevoBannerLink={nuevoBannerLink} setNuevoBannerLink={setNuevoBannerLink} guardarBannerNuevo={guardarBannerNuevo}
            estaGuardandoBanners={estaGuardandoBanners} estForm={estForm} RADIO_GENERAL={RADIO_GENERAL}
            cupones={cupones} onAgregarCupon={agregarCupon} onEliminarCupon={eliminarCupon}
          />
        )}
      </AnimatePresence>

      {/* ========================================================
          🚀 POP-UP DE VISTA RÁPIDA / COMPRA
      ======================================================== */}
      <AnimatePresence>
        {productoSeleccionado && (
          <VistaRapidaPreview 
            producto={productoSeleccionado} isDark={isDark} idxImagenModal={idxImagenModal} setIdxImagenModal={setIdxImagenModal}
            onClose={() => { setProductoSeleccionado(null); window.history.pushState({}, '', '/'); }}
            onAddToCart={(prod: any) => { agregarAlCarrito(prod); setProductoSeleccionado(null); window.history.pushState({}, '', '/'); setCarritoAbierto(true); }}
            onBuyNow={(prod: any) => { agregarAlCarrito(prod); setProductoSeleccionado(null); window.history.pushState({}, '', '/'); setMostrandoCheckout(true); }}          />
        )}
      </AnimatePresence>

      {/* ========================================================
          🛒 SIDEBAR DEL CARRITO
      ======================================================== */}
      <AnimatePresence>
        {carritoAbierto && (
          <div className="fixed inset-0 z-[200] flex justify-end font-sans">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCarritoAbierto(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className={`relative w-full sm:w-96 h-full shadow-2xl flex flex-col z-10 ${isDark ? 'bg-slate-900 border-l border-slate-800' : 'bg-white'}`}>
              <div className={`p-4 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="flex items-center gap-2"><span className="text-xl">🛒</span><h2 className={`text-lg font-display font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Tu Carrito</h2></div>
                <button onClick={() => setCarritoAbierto(false)} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-800'}`}>✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                {carrito.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-50"><span className="text-4xl mb-2">🛍️</span><p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tu carrito está vacío</p></div>
                ) : (
                  carrito.map((item) => (
                    <div key={item.producto.id} className={`flex gap-3 p-3 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200/50'}`}>
                      <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-white"><img src={item.producto.imagenes[0]} alt={item.producto.modelo} className="w-full h-full object-cover" /></div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <h3 className={`text-xs font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.producto.marca} {item.producto.modelo}
                          {item.producto.upgrade && <span className="block text-[9px] text-emerald-500 mt-0.5">(+ {item.producto.upgrade})</span>}
                        </h3>
                        <span className={`text-[10px] font-semibold mt-1 ${isDark ? 'text-blue-400' : 'text-[#005bd3]'}`}>{formatearPrecio(item.producto.precio_final_calculado || (item.producto.precio_oferta || item.producto.precio))}</span>
                        <div className="flex items-center justify-between mt-auto pt-2">
                          <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>1 unidad</span>
                          <button onClick={() => eliminarDelCarrito(item.producto.id)} className={`p-1.5 rounded-md transition-colors ${isDark ? 'text-slate-500 hover:text-red-400 hover:bg-slate-800' : 'text-slate-400 hover:text-red-500 hover:bg-slate-200'}`} title="Eliminar del carrito"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {carrito.length > 0 && (
                <div className={`p-4 border-t bg-opacity-90 backdrop-blur-md shrink-0 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center justify-between mb-4"><span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total a pagar</span><span className={`text-xl font-display font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatearPrecio(totalCarrito)}</span></div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => { setCarritoAbierto(false); setMostrandoCheckout(true); }} className={`w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-violet-200 flex items-center justify-center bg-violet-600 text-white hover:bg-violet-700 ${isDark ? 'shadow-none hover:bg-violet-500' : ''}`}>Finalizar Compra</button>
                    <button onClick={() => setCarritoAbierto(false)} className={`w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-2 flex items-center justify-center ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Volver al Catálogo</button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          🚀 MODAL DE CHECKOUT
      ======================================================== */}
      <AnimatePresence>
        {mostrandoCheckout && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4 font-sans">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMostrandoCheckout(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`relative w-full max-w-lg max-h-[95vh] flex flex-col shadow-2xl rounded-3xl z-10 overflow-hidden ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-[#F4F6F8]'}`}>
              <div className={`p-4 sm:p-5 border-b flex justify-between items-center shrink-0 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-lg font-display font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Completar Pedido</h2>
                <button onClick={() => setMostrandoCheckout(false)} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-800'}`}>✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                <div>
                  <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Resumen de Compra</h3>
                  <div className={`p-3 sm:p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                    {carrito.map(item => (
                      <div key={item.producto.id} className="flex justify-between items-start text-sm">
                        <div className="flex flex-col min-w-0 mr-2">
                          <span className={`truncate font-medium text-xs sm:text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.cantidad}x {item.producto.marca} {item.producto.modelo}</span>
                          {item.producto.upgrade && <span className="text-[9px] sm:text-[10px] text-emerald-500 font-bold tracking-wide mt-0.5 truncate">(+ {item.producto.upgrade})</span>}
                        </div>
                        <span className={`font-semibold shrink-0 text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatearPrecio((item.producto.precio_final_calculado || item.producto.precio_oferta || item.producto.precio) * item.cantidad)}</span>
                      </div>
                    ))}
                    {cuponAplicado && (
                      <div className="flex justify-between items-center text-xs text-emerald-500 font-bold">
                        <span>🎫 Cupón: {cuponAplicado.codigo}</span>
                        <span>-{formatearPrecio(valorDescuento)}</span>
                      </div>
                    )}
                    <div className={`pt-3 border-t flex justify-between items-center mt-3 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Total</span>
                      <span className={`text-lg font-display font-bold ${isDark ? 'text-blue-400' : 'text-[#005bd3]'}`}>{formatearPrecio(totalConDescuento)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${cuponAplicado ? 'text-emerald-500' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
                    {cuponAplicado ? 'Cupón Aplicado' : '¿Tenés un cupón de descuento?'}
                  </h3>
                  <div className={`p-4 sm:p-5 rounded-2xl border flex gap-2 transition-colors ${cuponAplicado ? (isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200') : (isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm')}`}>
                    <input 
                      type="text" 
                      placeholder="" 
                      className={`${estForm.input} h-11 ${RADIO_GENERAL} uppercase ${cuponAplicado ? 'opacity-50' : ''}`} 
                      value={cuponAplicado ? cuponAplicado.codigo : codCuponInput} 
                      onChange={e => !cuponAplicado && setCodCuponInput(e.target.value)} 
                      disabled={!!cuponAplicado}
                    />
                    {cuponAplicado ? (
                      <button onClick={() => setCuponAplicado(null)} className="h-11 px-4 text-red-500 text-[10px] font-bold uppercase rounded-xl transition-all hover:bg-red-50 dark:hover:bg-red-500/10">Quitar</button>
                    ) : (
                      <button onClick={aplicarCupon} className="h-11 px-6 bg-violet-600 text-white text-[10px] font-bold uppercase rounded-xl transition-all hover:bg-violet-700">Aplicar</button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Datos de Contacto</h3>
                  <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div><label className={estForm.label}>Nombre y Apellido *</label><input type="text" placeholder="Ej: Juan Pérez" className={`${estForm.input} h-11 ${RADIO_GENERAL}`} value={datosCliente.nombre} onChange={e => setDatosCliente({...datosCliente, nombre: e.target.value})} /></div>
                    <div><label className={estForm.label}>WhatsApp *</label><input type="tel" placeholder="Ej: 0981 123 456" className={`${estForm.input} h-11 ${RADIO_GENERAL}`} value={datosCliente.whatsapp} onChange={e => setDatosCliente({...datosCliente, whatsapp: e.target.value})} /></div>
                    <div><label className={estForm.label}>Email <span className="lowercase font-normal opacity-70">(Opcional)</span></label><input type="email" placeholder="Ej: juan@correo.com" className={`${estForm.input} h-11 ${RADIO_GENERAL}`} value={datosCliente.email} onChange={e => setDatosCliente({...datosCliente, email: e.target.value})} /></div>
                  </div>
                </div>

                <div>
                  <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>2. Tipo de Envío</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {[{id: 'retiro', emoji: '🏠', t: 'Paso a retirar', d: 'Pasás a retirar de nuestro local.'}, {id: 'delivery', emoji: '🚚', t: 'Envío gratis con delivery propio', d: 'En departamento central.'}, {id: 'encomienda', emoji: '📦', t: 'Transportadora', d: 'Envío por encomienda, pagás al retirar de la agencia.'}].map(op => (
                      <button key={op.id} onClick={() => setTipoEnvio(op.id as any)} className={`p-4 rounded-2xl border text-left transition-all flex gap-3 relative overflow-hidden ${tipoEnvio === op.id ? (isDark ? 'border-violet-500 bg-violet-900/20 ring-1 ring-violet-500' : 'border-violet-500 bg-violet-50 ring-1 ring-violet-500') : (isDark ? 'border-slate-700 bg-slate-800/80 hover:border-slate-600' : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm')}`}>
                        <span className="text-2xl mt-0.5">{op.emoji}</span>
                        <div className="flex flex-col pr-6">
                          <span className={`text-sm font-bold mb-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{op.t}</span>
                          <span className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{op.d}</span>
                        </div>
                        {tipoEnvio === op.id && <div className="absolute top-1/2 -translate-y-1/2 right-4 text-violet-600 dark:text-violet-400"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l7.07-7.071-1.414-1.414-5.656 5.657-2.829-2.829-1.414 1.414L11.003 16z"/></svg></div>}                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>3. Método de Pago</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {[{id: 'transferencia', emoji: '💸', t: 'Transferencia bancaria o efectivo', d: 'Abonás de forma rápida y segura al recibir o retirar tu equipo.'}, {id: 'tarjeta', emoji: '💳', t: 'Tarjeta de crédito', d: 'Aceptamos Visa y Mastercard (física o contactless). Podés pagar con Apple Pay o Google Pay.'}].map(op => (
                      <button key={op.id} onClick={() => setMetodoPago(op.id as any)} className={`p-4 rounded-2xl border text-left transition-all flex gap-3 relative overflow-hidden ${metodoPago === op.id ? (isDark ? 'border-violet-500 bg-violet-900/20 ring-1 ring-violet-500' : 'border-violet-500 bg-violet-50 ring-1 ring-violet-500') : (isDark ? 'border-slate-700 bg-slate-800/80 hover:border-slate-600' : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm')}`}>
                        <span className="text-2xl mt-0.5">{op.emoji}</span>
                        <div className="flex flex-col pr-6">
                          <span className={`text-sm font-bold mb-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{op.t}</span>
                          <span className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{op.d}</span>
                        </div>
                        {metodoPago === op.id && <div className="absolute top-1/2 -translate-y-1/2 right-4 text-violet-600 dark:text-violet-400"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l7.07-7.071-1.414-1.414-5.656 5.657-2.829-2.829-1.414 1.414L11.003 16z"/></svg></div>}                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {(tipoEnvio === 'delivery' || tipoEnvio === 'encomienda') && (
                    <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -10 }} className="overflow-hidden">
                      <h3 className={`text-[10px] font-bold uppercase tracking-wider mt-4 mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{tipoEnvio === 'delivery' ? '4. ¿A dónde te lo llevamos?' : '4. ¿A qué ciudad/agencia enviamos?'}</h3>
                      <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <button onClick={obtenerUbicacion} disabled={obteniendoUbicacion} className={`w-full h-11 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border-2 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'} ${obteniendoUbicacion ? 'opacity-70 cursor-not-allowed' : ''}`}>
                          {obteniendoUbicacion ? <>⏳ Buscando ubicación...</> : <>📍 Obtener mi ubicación actual</>}
                        </button>
                        <div className="flex items-center gap-3"><hr className={`flex-1 ${isDark ? 'border-slate-700' : 'border-slate-200'}`} /><span className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>o ingresala manual</span><hr className={`flex-1 ${isDark ? 'border-slate-700' : 'border-slate-200'}`} /></div>
                        <div><label className={estForm.label}>Link de Maps (Opcional si usaste el botón)</label><input type="url" placeholder="Ej: https://www.google.com/maps?q=..." className={`${estForm.input} h-11 ${RADIO_GENERAL}`} value={datosCliente.linkMaps} onChange={e => setDatosCliente({...datosCliente, linkMaps: e.target.value})} /></div>
                        <div><label className={estForm.label}>Dirección escrita o referencias</label><textarea placeholder={tipoEnvio === 'delivery' ? "Ej: Calle falsa 123, casa portón negro..." : "Ej: Enviar a la sucursal de Asunción Centro..."} className={`${estForm.input} py-3 h-20 resize-none ${RADIO_GENERAL}`} value={datosCliente.direccion} onChange={e => setDatosCliente({...datosCliente, direccion: e.target.value})} /></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{(tipoEnvio === 'delivery' || tipoEnvio === 'encomienda') ? '5. ' : '4. '}Notas adicionales (Opcional)</h3>
                  <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div><textarea placeholder="Ej: Es para un regalo, por favor llamarme al llegar, etc..." className={`${estForm.input} py-3 h-20 resize-none ${RADIO_GENERAL}`} value={datosCliente.notas} onChange={e => setDatosCliente({...datosCliente, notas: e.target.value})} /></div>
                  </div>
                </div>
              </div>

              <div className={`p-4 sm:p-5 border-t shrink-0 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <button onClick={enviarPedidoWhatsApp} className={`w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600 ${isDark ? 'shadow-none' : ''}`}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 3.825.001 6.938 3.113 6.939 6.938-.001 3.825-3.114 6.938-6.939 6.942z"/></svg>
                  Confirmar y enviar por WhatsApp
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}export default function CatalogoNotebooks() { return <Suspense fallback={null}><CatalogoContent /></Suspense>; }

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase'; // <-- RUTA CORREGIDA

// ========================================================
// 🛠️ UTILIDAD: COMPRESOR DE IMÁGENES NATIVO (CLIENT-SIDE)
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

        // Mantener proporción limitando el ancho máximo
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            // Forzamos formato jpeg para mayor compresión
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback si falla el blob
          }
        }, 'image/jpeg', quality);
      };
    };
  });
};

// ========================================================
// 🎨 ESTÉTICA MODULAR Y JERARQUÍA (CON MODO OSCURO)
// ========================================================
const RADIO_GENERAL = "rounded-xl sm:rounded-2xl"; 
const ESTETICA_TARJETA = (isDark: boolean) => ({ contenedor: `flex flex-col overflow-hidden ${RADIO_GENERAL} border transition-colors duration-300 relative min-w-0 cursor-pointer ${isDark ? 'bg-slate-900 border-slate-800 shadow-none hover:border-slate-700' : 'bg-white shadow-lg shadow-slate-200/50 border-slate-200 hover:border-slate-300 hover:shadow-xl'}` });
const ESTETICA_CONTROLES = (isDark: boolean) => ({
  select: `h-10 px-4 rounded-xl text-[10px] font-medium uppercase tracking-wider outline-none focus:ring-2 appearance-none transition-all border cursor-pointer w-full sm:w-auto ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-violet-500 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-700 focus:ring-violet-300 hover:border-slate-300 shadow-sm'}`,
  botonPrincipal: `h-10 px-6 rounded-xl text-[10px] font-semibold shadow-md shadow-violet-200 hover:bg-violet-700 transition-all uppercase tracking-wider flex items-center justify-center bg-violet-600 text-white ${isDark ? 'shadow-none' : ''}`
});
const ESTETICA_FORMULARIO = (isDark: boolean) => ({
  contenedor: `w-full max-w-[400px] mx-auto p-6 flex flex-col ${RADIO_GENERAL} transition-colors duration-300 border ${isDark ? 'bg-slate-900 shadow-none border-slate-800' : 'bg-white shadow-xl shadow-slate-200/60 border-slate-200/80'}`,
  input: `w-full px-4 transition-all text-xs font-medium outline-none focus:ring-2 focus:ring-inset border ${isDark ? 'bg-slate-800 border-slate-700 focus:ring-violet-500 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 focus:ring-violet-300 text-slate-800 placeholder:text-slate-400'}`,
  label: `text-[10px] font-medium ml-1 mb-1 block uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`,
  botonPrincipal: `font-semibold active:scale-95 transition-all uppercase tracking-wider flex items-center justify-center text-xs w-full h-12 mt-2 ${RADIO_GENERAL} ${isDark ? 'bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed' : 'bg-violet-600 text-white shadow-md shadow-violet-200 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed'}`,
  uploadArea: `relative w-full rounded-xl flex flex-col items-center justify-center transition-colors overflow-hidden border-2`
});

// ========================================================
// 📦 DATOS Y CONSTANTES
// ========================================================
const MOCK_BANNERS_INICIALES = [
  { id: 1, imgDesktop: 'https://images.unsplash.com/photo-1531297172864-45dc6142db6e?q=80&w=1920&h=600&fit=crop', imgMobile: 'https://images.unsplash.com/photo-1531297172864-45dc6142db6e?q=80&w=1080&h=1080&fit=crop', alt: 'Gran oferta de equipos de diseño', link: '#' },
];
const TAGS_DISPONIBLES = [{ label: 'Touch', emoji: '👆' }, { label: '2 en 1', emoji: '🔄' }];
const DESCRIPCION_POR_DEFECTO = `🚀 Potente y versátil, ideal para estudio, trabajo o diseño. Soporta programas pesados como Ilustrator, Photoshop o Premiere.\n⚡️ Incluye Cargador\n📚 Incluye paquete Office y Windows activado de por vida.\n✅ Equipo 100% probado, formateado y listo para usar.`;

// Interfaces para TypeScript
interface ImagenPreview {
  file: File | null;
  url: string;
}

// ========================================================
// 🖼️ COMPONENTES MENORES
// ========================================================
const BarraAnuncio = ({ texto, onEdit, isDark, isAdmin }: { texto: string, onEdit: () => void, isDark: boolean, isAdmin: boolean }) => {
  if (!texto && !isAdmin) return null;
  const repeticiones = Array(20).fill(texto || "AGREGAR ANUNCIO...");
  return (
    <div className={`relative flex items-center justify-center h-8 sm:h-10 group shrink-0 ${isDark ? 'bg-violet-900 text-violet-100' : 'bg-violet-600 text-white'}`}>
      <div className="w-full max-w-4xl overflow-hidden relative flex items-center h-full" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}>
        <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, ease: "linear", duration: 100 }} className="flex whitespace-nowrap w-max">
          {repeticiones.map((t, i) => <span key={i} className="text-[11px] sm:text-[12px] font-bold uppercase tracking-widest px-6 sm:px-12 inline-block">{t}</span>)}
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

const CarruselBanners = ({ banners, onEdit, isDark, isAdmin }: { banners: any[], onEdit: () => void, isDark: boolean, isAdmin: boolean }) => {
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
    const isMobile = window.innerWidth < 640;
    const src = isMobile ? banners[actual].imgMobile : banners[actual].imgDesktop;
    const img = new Image();
    img.onload = () => setImgCargada(true);
    img.src = src;
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
        {/* Skeleton shimmer — visible mientras la imagen no cargó */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${imgCargada ? 'opacity-0 pointer-events-none' : 'opacity-100'} ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <div className="absolute inset-0 animate-pulse" style={{ background: isDark ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)' : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        </div>
        <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
        <AnimatePresence initial={false}>
          {imgCargada && banners[actual] && (
            <motion.a key={actual} href={banners[actual]?.link || '#'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: "easeInOut" }} className="absolute inset-0 block cursor-pointer"
              style={{ backgroundImage: `url(${banners[actual].imgDesktop})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="sm:hidden absolute inset-0" style={{ backgroundImage: `url(${banners[actual].imgMobile})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            </motion.a>
          )}
        </AnimatePresence>
      </div>
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setActual(i)} className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${actual === i ? 'bg-white scale-125 shadow-md' : 'bg-white/50 hover:bg-white/80'}`} aria-label={`Ver banner ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
};

const SliderTarjeta = ({ imagenes, alt, isDark }: { imagenes: string[], alt: string, isDark: boolean }) => {
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

export default function CatalogoNotebooks() {
  const [isDark, setIsDark] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [estaCargandoDB, setEstaCargandoDB] = useState(true);
  const [estaPublicando, setEstaPublicando] = useState(false);
  
  const [productos, setProductos] = useState<any[]>([]);
  
  // Estados para Banners y Anuncio
  const [banners, setBanners] = useState<any[]>(MOCK_BANNERS_INICIALES);
  const [estaGuardandoBanners, setEstaGuardandoBanners] = useState(false);
  const [textoAnuncio, setTextoAnuncio] = useState('🔥 10% DE DESCUENTO PAGANDO CON TRANSFERENCIA ESTE FIN DE SEMANA 🔥');
  const [textoAnuncioDraft, setTextoAnuncioDraft] = useState('🔥 10% DE DESCUENTO PAGANDO CON TRANSFERENCIA ESTE FIN DE SEMANA 🔥');
  
  const [menuFiltroAbierto, setMenuFiltroAbierto] = useState(false);
  const [ordenamiento, setOrdenamiento] = useState<'NUEVOS' | 'PRECIO_MENOR' | 'PRECIO_MAYOR'>('NUEVOS');

  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [productoEnEdicion, setProductoEnEdicion] = useState<number | null>(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState<any | null>(null);
  const [idxImagenModal, setIdxImagenModal] = useState(0); 
  
  const [textoSpecs, setTextoSpecs] = useState('');
  const [descripcionInput, setDescripcionInput] = useState('');
  const [precioInput, setPrecioInput] = useState('');
  const [precioOfertaInput, setPrecioOfertaInput] = useState('');
  const [descuentoInput, setDescuentoInput] = useState('');
  const [condicionInput, setCondicionInput] = useState('Excelente Estado');
  const [tagsSel, setTagsSel] = useState<string[]>([]);
  
  // Imágenes Productos
  const [imagenesArchivos, setImagenesArchivos] = useState<ImagenPreview[]>([]); 
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Imágenes Gestor Promos
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

  // ========================================================
  // 🚀 CONEXIÓN A SUPABASE AL INICIAR
  // ========================================================
  useEffect(() => {
    setIsMounted(true);
    const temaGuardado = localStorage.getItem('tema_tienda');
    if (temaGuardado === 'dark' || (!temaGuardado && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) setIsDark(true);

    const verificarSesionYCargarDatos = async () => {
      // 1. Verificamos si es admin
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(!!session);

      // Listener por si iniciamos/cerramos sesión
      supabase.auth.onAuthStateChange((_event, session) => {
        setIsAdmin(!!session);
      });

      // 2. Traemos datos de la BD
      cargarProductosDB();
      cargarBannersDB();
      cargarAnuncioDB();
    };

    verificarSesionYCargarDatos();
  }, []);

  const cargarProductosDB = async () => {
    setEstaCargandoDB(true);
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('id', { ascending: false });
    
    if (error) console.error("Error cargando productos:", error);
    else if (data) setProductos(data);
    
    setEstaCargandoDB(false);
  };

  const cargarBannersDB = async () => {
    const { data, error } = await supabase.from('banners').select('*').order('id', { ascending: true });
    if (error) {
      console.warn("Aviso: La tabla 'banners' no está configurada en Supabase todavía o hay un error:", error);
    } else if (data && data.length > 0) {
      setBanners(data);
    }
  };

  const cargarAnuncioDB = () => {
    const guardado = localStorage.getItem('texto_anuncio_tienda');
    if (guardado !== null) {
      setTextoAnuncio(guardado);
      setTextoAnuncioDraft(guardado);
    }
  };

  const guardarAnuncioDB = (texto: string) => {
    localStorage.setItem('texto_anuncio_tienda', texto);
  };

  useEffect(() => {
    const normal = Number(precioInput);
    const oferta = Number(precioOfertaInput);
    if (normal > 0 && oferta > 0 && oferta < normal) setDescuentoInput(Math.round(((normal - oferta) / normal) * 100).toString());
    else if (!oferta || oferta >= normal) setDescuentoInput('');
  }, [precioInput, precioOfertaInput]);

  useEffect(() => {
    document.body.style.overflow = (productoSeleccionado || carritoAbierto || mostrandoCheckout || mostrandoGestorPromos) ? 'hidden' : 'auto';
    if (!productoSeleccionado && !(productoSeleccionado || carritoAbierto || mostrandoCheckout || mostrandoGestorPromos)) setIdxImagenModal(0);
    return () => { document.body.style.overflow = 'auto'; };
  }, [productoSeleccionado, carritoAbierto, mostrandoCheckout, mostrandoGestorPromos]);

  const toggleTema = () => {
    const nuevoTema = !isDark;
    setIsDark(nuevoTema);
    localStorage.setItem('tema_tienda', nuevoTema ? 'dark' : 'light');
  };

  const formatearPrecio = (precio: number) => `${new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(precio)}gs`;

  // ========================================================
  // 🚀 LÓGICA DE GESTIÓN DE BANNERS (Con Compresión)
  // ========================================================
  const manejarSubidaImagenBanner = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Comprimimos el banner al momento de seleccionarlo (máximo 1920px o 1080px de ancho)
    const compressedFile = await comprimirImagen(file, tipo === 'desktop' ? 1920 : 1080, 0.85);
    const url = URL.createObjectURL(compressedFile);
    
    if (tipo === 'desktop') {
      setNuevoBannerDesktop(url);
      setNuevoBannerDesktopFile(compressedFile);
    } else {
      setNuevoBannerMobile(url);
      setNuevoBannerMobileFile(compressedFile);
    }
  };

  const eliminarBanner = async (id: number) => {
    if (window.confirm("¿Seguro que querés eliminar este banner?")) {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (error) {
        alert("Hubo un error al eliminar el banner de la base de datos.");
        console.error(error);
        return;
      }
      setBanners(banners.filter(b => b.id !== id));
    }
  };

  const guardarBannerNuevo = async () => {
    if (!nuevoBannerDesktopFile || !nuevoBannerMobileFile) return alert("⚠️ Tenés que subir ambas imágenes (Web y Celular) para guardar el banner.");
    
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

      const { error } = await supabase.from('banners').insert([{ 
        imgDesktop: urlD.publicUrl, 
        imgMobile: urlM.publicUrl, 
        link: nuevoBannerLink || '#', 
        alt: 'Banner Promocional' 
      }]);

      if (error) throw error;

      alert("✅ Banner guardado exitosamente en la tienda.");
      
      setNuevoBannerDesktop(''); setNuevoBannerMobile(''); setNuevoBannerLink('');
      setNuevoBannerDesktopFile(null); setNuevoBannerMobileFile(null);
      
      await cargarBannersDB(); 
    } catch (error) {
      console.error("Error guardando banner:", error);
      alert("⚠️ Hubo un error al guardar. Asegurate de tener creada la tabla 'banners' en tu Supabase.");
    }
    setEstaGuardandoBanners(false);
  };

  // ========================================================
  // 🛒 CARRITO Y CHECKOUT
  // ========================================================
  const agregarAlCarrito = (producto: any) => {
    setCarrito(prev => prev.find(item => item.producto.id === producto.id) ? prev.map(item => item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item) : [...prev, { producto, cantidad: 1 }]);
  };

  const eliminarDelCarrito = (id: number) => {
    setCarrito(prev => prev.filter(item => item.producto.id !== id));
    if (carrito.length === 1 && carrito[0].producto.id === id) setMostrandoCheckout(false);
  };

  const sumarCantidad = (id: number) => setCarrito(prev => prev.map(item => item.producto.id === id ? { ...item, cantidad: item.cantidad + 1 } : item));
  const restarCantidad = (id: number) => setCarrito(prev => prev.map(item => item.producto.id === id && item.cantidad > 1 ? { ...item, cantidad: item.cantidad - 1 } : item));

  const totalCarrito = carrito.reduce((acc, item) => acc + ((item.producto.precio_oferta || item.producto.precio) * item.cantidad), 0);

  const obtenerUbicacion = () => {
    if (!("geolocation" in navigator)) {
      alert("⚠️ Tu navegador o dispositivo no soporta la función de ubicación.");
      return;
    }
    
    setObteniendoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const mapLink = `http://googleusercontent.com/maps.google.com/?q=${lat},${lng}`;
        
        setDatosCliente(prev => ({ ...prev, linkMaps: mapLink }));
        setObteniendoUbicacion(false);
      },
      (error) => {
        console.error("Error obteniendo ubicación:", error);
        alert("⚠️ No pudimos acceder a tu ubicación. Asegurate de tener el GPS activado.");
        setObteniendoUbicacion(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const enviarPedidoWhatsApp = () => {
    if (!datosCliente.nombre || !datosCliente.whatsapp) return alert("⚠️ Por favor completá tu Nombre y WhatsApp para continuar.");
    if (!tipoEnvio) return alert("⚠️ Por favor seleccioná un tipo de envío.");
    if (!metodoPago) return alert("⚠️ Por favor seleccioná un método de pago.");
    if ((tipoEnvio === 'delivery' || tipoEnvio === 'encomienda') && !datosCliente.direccion && !datosCliente.linkMaps) return alert("⚠️ Por favor ingresá tu dirección o el link de Google Maps para el envío.");
    
    let m = `¡Hola! Quiero hacer un pedido 💻\n\n*🛒 RESUMEN DEL PEDIDO:*\n`;
    carrito.forEach(item => m += `- ${item.cantidad}x ${item.producto.marca} ${item.producto.modelo} (${formatearPrecio(item.producto.precio_oferta || item.producto.precio)})\n`);
    m += `*Total a pagar:* ${formatearPrecio(totalCarrito)}\n\n*👤 MIS DATOS:*\nNombre: ${datosCliente.nombre}\nWhatsApp: ${datosCliente.whatsapp}\n${datosCliente.email ? `Email: ${datosCliente.email}\n` : ''}\n*📦 ENVÍO:*\n`;
    m += `${{ retiro: '🏠 Paso a retirar del local', delivery: '🚚 Envío gratis con delivery propio', encomienda: '📦 Envío por transportadora (Encomienda)' }[tipoEnvio]}\n`;
    if (tipoEnvio !== 'retiro') {
      if (datosCliente.direccion) m += `Dirección/Ref: ${datosCliente.direccion}\n`;
      if (datosCliente.linkMaps) m += `Ubicación (Maps): ${datosCliente.linkMaps}\n`;
    }
    m += `\n*💳 MÉTODO DE PAGO:*\n${{ transferencia: '💸 Transferencia bancaria o efectivo', tarjeta: '💳 Tarjeta de crédito (Visa/Mastercard) o Apple/Google Pay' }[metodoPago]}\n\n`;
    if (datosCliente.notas) m += `*📝 NOTAS ADICIONALES:*\n${datosCliente.notas}\n`;

    window.open(`https://api.whatsapp.com/send?phone=595976654321&text=${encodeURIComponent(m)}`, '_blank');
  };

  // ========================================================
  // 📸 LÓGICA DE SUBIDA DE IMÁGENES (Con Compresión)
  // ========================================================
  const manejarSubidaImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (imagenesArchivos.length + files.length > 5) return alert("⚠️ Solo podés subir un máximo de 5 fotos por publicación.");
    
    // Procesamos y comprimimos cada imagen asíncronamente
    const nuevosArchivos: ImagenPreview[] = [];
    for (const file of files) {
      // Comprimimos la foto pesada del iPhone a un máximo de 1200px de ancho y 85% de calidad
      const compressedFile = await comprimirImagen(file, 1200, 0.85);
      nuevosArchivos.push({
        file: compressedFile,
        url: URL.createObjectURL(compressedFile)
      });
    }

    setImagenesArchivos(prev => [...prev, ...nuevosArchivos]);
  };

  const eliminarImagenPreview = (index: number) => setImagenesArchivos(prev => prev.filter((_, i) => i !== index));

  const resetearFormulario = () => {
    setProductoEnEdicion(null); setTextoSpecs(''); setDescripcionInput(''); setPrecioInput(''); setPrecioOfertaInput(''); setDescuentoInput(''); setCondicionInput('Excelente Estado'); setTagsSel([]); setImagenesArchivos([]); setMostrandoFormulario(false); setEstaPublicando(false);
  };

  const abrirEdicion = (p: any) => {
    setProductoEnEdicion(p.id); 
    setTextoSpecs(`${p.marca} ${p.modelo} | ${p.procesador} | ${p.ram} | ${p.disco} | ${p.pantalla}`); 
    setDescripcionInput(p.descripcion || ''); 
    setPrecioInput(p.precio.toString()); 
    setPrecioOfertaInput(p.precio_oferta ? p.precio_oferta.toString() : ''); 
    setDescuentoInput(p.descuento ? p.descuento.toString() : ''); 
    setCondicionInput(p.condicion_estetica); 
    setTagsSel(p.tags || []); 
    
    const imagenesParaEdicion = (p.imagenes || []).map((imgUrl: string) => ({
      file: null,
      url: imgUrl
    }));
    setImagenesArchivos(imagenesParaEdicion); 
    setMostrandoFormulario(true);
  };

  const eliminarProducto = async (id: number) => {
    if (window.confirm("¿Seguro que querés eliminar esta notebook del catálogo?")) {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (error) {
        alert("Hubo un error al eliminar.");
        console.error(error);
        return;
      }
      
      setProductos(prev => prev.filter(p => p.id !== id));
      if (productoSeleccionado?.id === id) setProductoSeleccionado(null);
      eliminarDelCarrito(id);
    }
  };

  // ========================================================
  // 🚀 FUNCIÓN PRINCIPAL DE PUBLICAR (Sube Fotos y a BD)
  // ========================================================
  const publicarProducto = async () => {
    if (imagenesArchivos.length === 0) return alert("⚠️ ¡Tenés que agregar al menos una foto de la notebook!");
    if (!textoSpecs.includes('|')) return alert("⚠️ El texto no tiene el formato correcto. Faltan los separadores '|'.");
    if (!precioInput || isNaN(Number(precioInput))) return alert("⚠️ Por favor ingresá un precio válido (solo números).");

    setEstaPublicando(true);

    const partes = textoSpecs.split('|').map(str => str.trim());
    if (partes.length < 5) {
      setEstaPublicando(false);
      return alert("⚠️ Parece que faltan datos. Tienen que ser 5 bloques separados por '|'.");
    }

    let urlsFinales: string[] = [];
    
    for (const img of imagenesArchivos) {
      if (img.file) {
        // Aseguramos la extensión por si viene del canvas compreso
        const ext = img.file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from('laptops')
          .upload(fileName, img.file);

        if (uploadError) {
          console.error("Error subiendo foto:", uploadError);
          alert("Hubo un error subiendo una de las fotos. Reintentá.");
          setEstaPublicando(false);
          return;
        }

        const { data } = supabase.storage.from('laptops').getPublicUrl(fileName);
        urlsFinales.push(data.publicUrl);
      } else {
        urlsFinales.push(img.url);
      }
    }

    const [marcaModeloBruto, procesadorBruto, ramExtraida, discoExtraido, pantallaExtraida] = partes;
    const primeraPalabra = marcaModeloBruto.split(' ')[0];
    
    const datosProducto = {
      marca: primeraPalabra, 
      modelo: marcaModeloBruto.substring(primeraPalabra.length).trim(), 
      estado: 'USADA', 
      condicion_estetica: condicionInput,
      procesador: procesadorBruto.replace(/Intel Core |Intel |th Gen|nd Gen|rd Gen|st Gen/gi, match => match.includes('Gen') ? '° Gen' : '').replace(/AMD Ryzen /gi, 'Ryzen '),
      pantalla: pantallaExtraida, 
      disco: discoExtraido, 
      ram: ramExtraida, 
      precio: Number(precioInput), 
      precio_oferta: precioOfertaInput ? Number(precioOfertaInput) : null, 
      descuento: descuentoInput ? Number(descuentoInput) : null, 
      disponibilidad: 'En Stock', 
      tags: tagsSel, 
      descripcion: descripcionInput || DESCRIPCION_POR_DEFECTO, 
      imagenes: urlsFinales 
    };

    if (productoEnEdicion) {
      const { error } = await supabase.from('productos').update(datosProducto).eq('id', productoEnEdicion);
      if (error) console.error("Error actualizando:", error);
    } else {
      const { error } = await supabase.from('productos').insert([datosProducto]);
      if (error) console.error("Error creando:", error);
    }

    await cargarProductosDB();
    resetearFormulario();
  };

  const productosOrdenados = [...productos].sort((a, b) => {
    const pA = a.precio_oferta || a.precio, pB = b.precio_oferta || b.precio;
    return ordenamiento === 'PRECIO_MENOR' ? pA - pB : ordenamiento === 'PRECIO_MAYOR' ? pB - pA : b.id - a.id;
  });

  const LOGOS_MARCA: { match: (n: string) => boolean; src: string; alt: string; scale?: number }[] = [
    { match: (n) => n.includes('dell'), src: 'https://www.nicepng.com/png/full/497-4970654_dell-logo-white-dell-f169g.png', alt: 'Dell' },
    { match: (n) => n.includes('lenovo') || n.includes('thinkpad'), src: 'https://i.imgur.com/LE4aNAE.png', alt: 'Lenovo', scale: 1.4 },
  ];
  const getLogoBrand = (marca: string, modelo: string, claseImg: string) => {
    const nombre = `${marca} ${modelo}`.toLowerCase();
    const logo = LOGOS_MARCA.find(l => l.match(nombre));
    if (!logo) return null;
    return <img src={logo.src} alt={logo.alt} className={claseImg} style={logo.scale ? { transform: `scale(${logo.scale})`, transformOrigin: 'bottom right' } : undefined} />;
  };

  const getSpecsList = (prod: any) => [
    { l: 'Procesador', v: prod.procesador, i: "https://shopinverse.com/cdn/shop/files/processor_50656a5a-aaf3-45a6-8690-24e540a0f31a.png?v=1750275262&width=48" },
    { l: 'Pulgadas', v: prod.pantalla, i: "https://shopinverse.com/cdn/shop/files/laptop_size.png?v=1750275765&width=48" },
    { l: 'SSD', v: prod.disco, i: "https://shopinverse.com/cdn/shop/files/SD_5b743960-78a8-48bf-b9ef-acdd48f3ae2a.png?v=1751056382&width=48" },
    { l: 'RAM', v: prod.ram, i: "https://shopinverse.com/cdn/shop/files/ram_dcb67804-7fdb-499b-924e-e30679b9fba9.png?v=1750275811&width=48" }
  ];

  if (!isMounted) return <div className="min-h-screen bg-[#F4F6F8] dark:bg-slate-950 transition-colors duration-300" />;

  const estForm = ESTETICA_FORMULARIO(isDark);

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-slate-950' : 'bg-[#F4F6F8]'} transition-colors duration-300 font-sans pb-20`}>
      <style dangerouslySetInnerHTML={{__html: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@600;700&display=swap'); .font-sans { font-family: 'Inter', sans-serif; } .font-display { font-family: 'Space Grotesk', sans-serif; }`}} />
      <BarraAnuncio texto={textoAnuncio} onEdit={() => setMostrandoGestorPromos(true)} isDark={isDark} isAdmin={isAdmin} />

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
          
          {isAdmin && (
            <button onClick={() => supabase.auth.signOut()} className="text-[10px] uppercase font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1 rounded-full ml-2">Salir</button>
          )}
        </div>
      </nav>

      {mostrandoFormulario ? (
        <main className="p-3 sm:p-4 pb-10 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 w-full overflow-hidden flex-1">
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
                  <span className={`text-[9px] font-medium ${isDark ? 'text-slate-500' : 'text-violet-400'}`}>Máximo 5 imágenes permitidas ({imagenesArchivos.length}/5)</span>
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

              <div><label className={estForm.label}>Especificaciones (Separadas por |)</label><input type="text" placeholder='Ej: Lenovo Thinkpad E14 | i7 10° Gen | 8 GB | 256 GB | 14"' className={`${estForm.input} h-10 ${RADIO_GENERAL}`} value={textoSpecs} onChange={e => setTextoSpecs(e.target.value)} /></div>
              <div><label className={estForm.label}>Descripción</label><textarea placeholder="Detalles, accesorios o características extra de la notebook..." className={`${estForm.input} py-3 h-24 resize-none leading-relaxed ${RADIO_GENERAL}`} value={descripcionInput} onChange={e => setDescripcionInput(e.target.value)} /></div>
              
              <div className="grid grid-cols-2 gap-3">
                <div><label className={estForm.label}>Precio Normal (Gs.)</label><input type="text" inputMode="numeric" placeholder="3,000,000" className={`${estForm.input} h-10 ${RADIO_GENERAL}`} value={precioInput ? Number(precioInput).toLocaleString('en-US') : ''} onChange={e => setPrecioInput(e.target.value.replace(/\D/g, ''))} /></div>
                <div><label className={estForm.label}>Condición</label><div className="relative"><select className={`${estForm.input} h-10 ${RADIO_GENERAL} appearance-none pr-8 cursor-pointer`} value={condicionInput} onChange={e => setCondicionInput(e.target.value)}>{['Excelente Estado', 'Muy Buen Estado', 'Con detalles estéticos'].map(o => <option key={o} value={o}>{o}</option>)}</select><span className={`absolute right-3 top-3 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'} pointer-events-none`}>▼</span></div></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className={estForm.label}>Precio Oferta (Gs.)</label><input type="text" inputMode="numeric" placeholder="2,600,000" className={`${estForm.input} h-10 ${RADIO_GENERAL}`} value={precioOfertaInput ? Number(precioOfertaInput).toLocaleString('en-US') : ''} onChange={e => setPrecioOfertaInput(e.target.value.replace(/\D/g, ''))} /></div>
                <div><label className={estForm.label}>% Descuento</label><input type="number" placeholder="13" className={`${estForm.input} h-10 ${RADIO_GENERAL} ${precioOfertaInput ? 'text-red-500 font-semibold' : ''}`} value={descuentoInput} onChange={e => { setDescuentoInput(e.target.value); if (precioInput && e.target.value && !isNaN(Number(e.target.value))) setPrecioOfertaInput(Math.round(Number(precioInput) * (1 - Number(e.target.value) / 100)).toString()); }} /></div>
              </div>

              <div>
                <label className={estForm.label}>Características Extras</label>
                <div className="flex flex-wrap gap-1.5">
                  {TAGS_DISPONIBLES.map(t => <button key={t.label} onClick={() => setTagsSel(p => p.includes(t.label) ? p.filter(x => x !== t.label) : [...p, t.label])} className={`px-3 py-1 text-[10px] font-medium transition-all border-2 ${tagsSel.includes(t.label) ? 'bg-violet-600 text-white border-violet-600' : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-100')} ${RADIO_GENERAL}`}>{t.emoji} {t.label}</button>)}
                </div>
              </div>
            </div>
            <div className="shrink-0 pt-4 mt-auto border-t border-slate-100 dark:border-slate-800">
              <motion.button 
                whileHover={{ scale: estaPublicando ? 1 : 1.02 }} 
                whileTap={{ scale: estaPublicando ? 1 : 0.98 }} 
                onClick={publicarProducto} 
                disabled={estaPublicando}
                className={estForm.botonPrincipal}
              >
                {estaPublicando ? '⏳ CARGANDO FOTOS Y GUARDANDO...' : (productoEnEdicion ? '💾 GUARDAR CAMBIOS' : '🚀 PUBLICAR NOTEBOOK')}
              </motion.button>
            </div>
          </motion.div>
        </main>
      ) : (
        <main className="max-w-7xl mx-auto p-2 sm:p-4 flex flex-col gap-6 sm:gap-8 animate-in fade-in duration-300 w-full overflow-hidden flex-1">
          <CarruselBanners banners={banners} onEdit={() => setMostrandoGestorPromos(true)} isDark={isDark} isAdmin={isAdmin} />

          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-row justify-between items-center gap-4 px-2 sm:px-0">
              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-display font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#1E2046]'}`}>Laptops</h2>
              <div className="flex items-center gap-3 justify-end sm:ml-auto">
                <span className={`text-[10px] font-medium uppercase tracking-wider mr-2 ${isDark ? 'text-slate-500' : 'text-slate-400'} hidden sm:block`}>{productosOrdenados.length} productos</span>
                <div className="relative">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setMenuFiltroAbierto(!menuFiltroAbierto)} className={`w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-200 transition-all ${isDark ? 'shadow-none' : ''}`} title="Ordenar catálogo"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="6" y1="12" x2="18" y2="12"></line><line x1="8" y1="18" x2="16" y2="18"></line></svg></motion.button>
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
                
                {isAdmin && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { resetearFormulario(); setMostrandoFormulario(true); }} className={ESTETICA_CONTROLES(isDark).botonPrincipal}>+ PUBLICAR</motion.button>
                )}
              </div>
            </div>
          </div>

          {estaCargandoDB ? (
            <div className="w-full py-20" />
          ) : productosOrdenados.length === 0 ? (
             <div className="w-full flex flex-col items-center justify-center py-20 opacity-50 text-center"><span className="text-4xl mb-4">🛒</span><p className="font-bold">No hay notebooks publicadas.</p></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mt-2 w-full px-2 sm:px-0">
              <AnimatePresence>
                {productosOrdenados.map((producto) => (
                  <motion.div key={producto.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} onClick={() => { setProductoSeleccionado(producto); setIdxImagenModal(0); }} className={`${ESTETICA_TARJETA(isDark).contenedor} group`}>
                    
                    {isAdmin && (
                      <div className="absolute top-1 right-1 sm:top-2.5 sm:right-2.5 z-40 flex flex-col gap-1 sm:gap-1.5 items-center justify-center">
                        <motion.button whileHover={{ scale: 1.1 }} onClick={(e) => { e.stopPropagation(); eliminarProducto(producto.id); }} className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-colors font-medium cursor-pointer text-[10px] sm:text-xs text-white/70 hover:bg-white/20 bg-black/40 backdrop-blur-md hover:text-red-400" title="Eliminar publicación">✕</motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} onClick={(e) => { e.stopPropagation(); abrirEdicion(producto); }} className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-colors font-medium cursor-pointer text-[10px] sm:text-xs text-white/70 hover:bg-white/20 bg-black/40 backdrop-blur-md hover:text-violet-400" title="Editar publicación"><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" className="sm:w-[11px] sm:h-[11px]"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></motion.button>
                      </div>
                    )}

                    <div className={`relative w-full aspect-[4/5] sm:aspect-[3/4] overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 z-40 flex flex-wrap gap-1 sm:gap-1.5 pointer-events-none max-w-[85%]">
                        <span className="inline-flex items-center justify-center text-[6px] sm:text-[8px] font-semibold px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-full uppercase tracking-wider leading-none shadow-sm bg-violet-600 text-white">{producto.estado}</span>
                        <span className="inline-flex items-center justify-center text-[6px] sm:text-[8px] font-semibold px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-full uppercase tracking-wider leading-none shadow-sm backdrop-blur-md truncate max-w-full bg-black/40 text-slate-200 border border-white/10">{producto.condicion_estetica}</span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/80 to-transparent z-20 pointer-events-none"></div>
                      {producto.tags && producto.tags.length > 0 && (
                        <div className="absolute bottom-1.5 left-1.5 sm:bottom-2.5 sm:left-2.5 z-40 flex flex-wrap justify-start gap-1 sm:gap-1.5 pointer-events-none max-w-[70%]">
                          {producto.tags.map((tag: string) => (
                            <span key={tag} className="inline-flex items-center gap-0.5 sm:gap-1 text-[6px] sm:text-[8px] font-medium px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-full uppercase tracking-wider leading-none shadow-sm backdrop-blur-md max-w-full bg-black/40 text-slate-200 border border-white/10">
                              {tag === 'Touch' && <img src="https://i.imgur.com/QAPfztS.png" alt="" className="w-2.5 h-2.5 sm:w-3 sm:h-3 object-contain flex-shrink-0" />}
                              {tag === '2 en 1' && <img src="https://i.imgur.com/LMqDtPC.png" alt="" className="w-4 h-4 object-contain flex-shrink-0 -my-1" />}
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="absolute bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 z-40 pointer-events-none">{getLogoBrand(producto.marca, producto.modelo, 'w-8 sm:w-10 h-auto object-contain drop-shadow-md')}</div>
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

                      <div className="mt-auto flex flex-col justify-center items-center min-w-0 w-full h-[32px] sm:h-[50px]">
                        {producto.precio_oferta ? (
                          <><span className={`text-[9px] sm:text-[11px] line-through font-medium truncate w-full text-center ${isDark ? 'text-slate-500' : 'text-slate-400'} -mb-0.5`}>{formatearPrecio(producto.precio)}</span>
                          <div className="flex items-center justify-center gap-1.5 min-w-0 w-full"><span className={`text-[14px] sm:text-[20px] font-display font-bold tracking-tight truncate ${isDark ? 'text-blue-400' : 'text-[#005bd3]'}`}>{formatearPrecio(producto.precio_oferta)}</span>{producto.descuento && <span className="bg-red-600 text-white text-[7px] sm:text-[9px] font-semibold px-1 sm:px-1.5 py-0.5 rounded shrink-0">-{producto.descuento}%</span>}</div></>
                        ) : (
                          <span className={`text-[14px] sm:text-[20px] font-display font-bold tracking-tight truncate w-full text-center ${isDark ? 'text-blue-400' : 'text-[#005bd3]'}`}>{formatearPrecio(producto.precio)}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      )}

      {/* ========================================================
          🚀 GESTOR DE PROMOCIONES (Solo lo ve el Admin)
      ======================================================== */}
      <AnimatePresence>
        {mostrandoGestorPromos && isAdmin && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4 font-sans">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMostrandoGestorPromos(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`relative w-full max-w-lg max-h-[95vh] flex flex-col shadow-2xl rounded-3xl z-10 overflow-hidden ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-[#F4F6F8]'}`}>
              <div className={`p-4 sm:p-5 border-b flex justify-between items-center shrink-0 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-lg font-display font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Gestor de Promociones</h2>
                <button onClick={() => setMostrandoGestorPromos(false)} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-800'}`}>✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                <div>
                  <div className="flex justify-between items-end mb-2"><h3 className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>1. Barra de Anuncio Superior</h3></div>
                  <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <input type="text" placeholder="Ej: 🔥 ENVÍO GRATIS ESTE FINDE 🔥" className={`${estForm.input} h-11 ${RADIO_GENERAL}`} value={textoAnuncioDraft} onChange={e => setTextoAnuncioDraft(e.target.value)} />
                    <button onClick={() => { setTextoAnuncio(textoAnuncioDraft); guardarAnuncioDB(textoAnuncioDraft); setMostrandoGestorPromos(false); }} className={`w-full h-11 mt-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center ${isDark ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-none' : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-200'}`}>Guardar Anuncio</button>
                    <p className={`text-[9px] font-medium uppercase tracking-wider pl-1 mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>* Hacé clic en guardar para aplicar los cambios en la tienda. Si lo dejás vacío, la barra desaparece.</p>
                  </div>
                </div>
                <div>
                  <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>2. Banners Activos ({banners.length})</h3>
                  <div className="space-y-2">
                    {banners.map((b, index) => (
                      <div key={b.id} className={`flex items-center gap-3 p-2 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className="w-16 h-8 rounded bg-slate-200 overflow-hidden shrink-0">
                          <img src={b.imgDesktop} alt="Miniatura" className="w-full h-full object-cover" />
                        </div>
                        <span className={`text-xs font-medium flex-1 truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Banner {index + 1}</span>
                        <button onClick={() => eliminarBanner(b.id)} className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    ))}
                    {banners.length === 0 && <p className={`text-xs text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No hay banners configurados.</p>}
                  </div>
                </div>

                <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <h3 className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>3. Añadir Nuevo Banner de Imagen</h3>
                  {[{id: 'desktop', dim: '1920x730', val: nuevoBannerDesktop, icon: '💻'}, {id: 'mobile', dim: '1080x600', val: nuevoBannerMobile, icon: '📱'}].map(i => (
                    <div key={i.id} className={`relative w-full h-12 rounded-xl flex items-center justify-center transition-colors overflow-hidden border-2 border-dashed ${i.val ? (isDark ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-emerald-500/50 bg-emerald-50') : (isDark ? 'border-slate-600 bg-slate-800/50 hover:bg-slate-700' : 'border-slate-300 bg-slate-50 hover:bg-slate-100')}`}>
                      <input type="file" accept="image/*" onChange={(e) => manejarSubidaImagenBanner(e, i.id as any)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${i.val ? 'text-emerald-500' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>{i.val ? `✅ Imagen ${i.id==='desktop'?'Web':'Celular'} Lista` : `${i.icon} Subir Imagen ${i.id==='desktop'?'Web':'Celular'} (${i.dim})`}</span>
                    </div>
                  ))}
                  <div><label className={estForm.label}>Link de la oferta (Opcional)</label><input type="url" placeholder="Ej: https://..." className={`${estForm.input} h-10 ${RADIO_GENERAL}`} value={nuevoBannerLink} onChange={e => setNuevoBannerLink(e.target.value)} /></div>
                  
                  <button onClick={guardarBannerNuevo} disabled={estaGuardandoBanners} className={`w-full h-11 mt-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center ${isDark ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-none' : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-200'} disabled:opacity-50`}>
                    {estaGuardandoBanners ? '⏳ GUARDANDO BANNER...' : '💾 GUARDAR BANNER'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          🚀 POP-UP DE VISTA RÁPIDA / COMPRA
      ======================================================== */}
      <AnimatePresence>
        {productoSeleccionado && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 font-sans">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setProductoSeleccionado(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`relative w-full max-w-4xl max-h-[95vh] sm:max-h-[96vh] flex flex-col md:flex-row shadow-2xl rounded-3xl overflow-y-auto md:overflow-hidden z-10 ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
              <button onClick={() => setProductoSeleccionado(null)} className="md:hidden absolute top-2 right-2 z-50 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20">✕</button>
              
              <div className={`w-full md:w-1/2 relative aspect-[4/3] sm:aspect-[4/5] md:aspect-[3/4] shrink-0 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <AnimatePresence initial={false}>
                  <motion.img 
                    key={idxImagenModal} 
                    initial={{ opacity: 0, scale: 1.05 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 1 }} 
                    transition={{ duration: 0.3, ease: "easeOut" }} 
                    src={productoSeleccionado.imagenes[idxImagenModal]} 
                    alt={productoSeleccionado.modelo} 
                    className="absolute inset-0 w-full h-full object-cover" 
                    decoding="async"
                  />
                </AnimatePresence>
                <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex flex-wrap gap-1 sm:gap-1.5 pointer-events-none max-w-[85%]">
                  <span className="inline-flex items-center justify-center text-[8px] sm:text-[9px] font-semibold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full uppercase tracking-wider leading-none shadow-sm bg-violet-600 text-white">{productoSeleccionado.estado}</span>
                  <span className="inline-flex items-center justify-center text-[8px] sm:text-[9px] font-semibold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full uppercase tracking-wider leading-none shadow-sm backdrop-blur-md truncate max-w-full bg-black/40 text-slate-200 border border-white/10">{productoSeleccionado.condicion_estetica}</span>
                </div>
                {productoSeleccionado.imagenes.length > 1 && (
                  <><button onClick={(e) => { e.stopPropagation(); setIdxImagenModal(p => p === 0 ? productoSeleccionado.imagenes.length - 1 : p - 1); }} className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-all z-30"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
                  <button onClick={(e) => { e.stopPropagation(); setIdxImagenModal(p => p === productoSeleccionado.imagenes.length - 1 ? 0 : p + 1); }} className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-all z-30"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></button></>
                )}
                {productoSeleccionado.tags && productoSeleccionado.tags.length > 0 && (
                  <div className={`absolute z-20 flex flex-wrap justify-start gap-1 sm:gap-1.5 pointer-events-none max-w-[70%] left-3 sm:left-4 ${productoSeleccionado.imagenes.length > 1 ? 'bottom-3 sm:bottom-24' : 'bottom-3 sm:bottom-4'}`}>
                    {productoSeleccionado.tags.map((tag: string) => (
                      <span key={tag} className="inline-flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[9px] font-medium px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full uppercase tracking-wider leading-none shadow-sm backdrop-blur-md max-w-full bg-black/40 text-slate-200 border border-white/10">
                        {tag === 'Touch' && <img src="https://i.imgur.com/QAPfztS.png" alt="" className="w-2.5 h-2.5 sm:w-3 sm:h-3 object-contain flex-shrink-0" />}{tag === '2 en 1' && <img src="https://i.imgur.com/LMqDtPC.png" alt="" className="w-4 h-4 sm:w-5 sm:h-5 object-contain flex-shrink-0 -my-1" />}{tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className={`absolute z-20 pointer-events-none right-3 sm:right-4 ${productoSeleccionado.imagenes.length > 1 ? 'bottom-3 sm:bottom-24' : 'bottom-3 sm:bottom-4'}`}>{getLogoBrand(productoSeleccionado.marca, productoSeleccionado.modelo, 'w-10 sm:w-12 h-auto object-contain drop-shadow-lg')}</div>
                {productoSeleccionado.imagenes.length > 1 && (
                  <div className="hidden sm:flex absolute bottom-4 left-0 right-0 z-30 justify-center gap-2 px-4 overflow-x-auto scrollbar-hide py-1">
                    {productoSeleccionado.imagenes.map((img: string, idx: number) => (
                      <button key={idx} onClick={() => setIdxImagenModal(idx)} className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 transition-all border-2 ${idxImagenModal === idx ? 'border-violet-500 scale-110 shadow-lg shadow-violet-500/40 z-10' : 'border-white/20 opacity-60 hover:opacity-100 hover:scale-105'}`}><img src={img} alt={`Miniatura ${idx}`} className="w-full h-full object-cover" /></button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-full md:w-1/2 p-4 sm:p-5 lg:p-6 flex flex-col relative flex-1 md:overflow-y-auto">
                <button onClick={() => setProductoSeleccionado(null)} className={`hidden md:flex absolute top-4 right-4 w-7 h-7 items-center justify-center rounded-full transition-colors font-medium z-10 ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'}`}>✕</button>
                <div className="flex flex-col flex-1">
                  <div className={`mb-3 py-3 md:py-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'} flex flex-col justify-center md:items-start items-center md:text-left text-center min-h-[90px]`}>
                    <h2 className={`text-xl sm:text-2xl md:text-3xl font-display font-bold tracking-tight leading-tight px-4 md:px-0 md:pr-10 ${isDark ? 'text-white' : 'text-slate-900'}`}>{productoSeleccionado.marca} {productoSeleccionado.modelo}</h2>
                    <div className="flex items-center justify-center md:justify-start gap-1.5 w-full mt-1.5">
                      <div className={`w-2 h-2 rounded-full shrink-0 shadow-sm ${productoSeleccionado.disponibilidad === 'En Stock' ? 'bg-emerald-500 animate-pulse shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'}`}></div>
                      <span className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider ${productoSeleccionado.disponibilidad === 'En Stock' ? 'text-emerald-500' : 'text-red-500'}`}>{productoSeleccionado.disponibilidad === 'En Stock' ? 'En stock, listo para entregar' : 'Agotado'}</span>
                    </div>
                  </div>

                  <div className={`flex items-start justify-between pb-4 mb-3 gap-1 sm:gap-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    {getSpecsList(productoSeleccionado).map((s, i) => (
                      <div key={i} className={`flex flex-col items-center justify-center flex-1 min-w-0 text-center ${i > 0 ? `border-l ${isDark ? 'border-slate-800' : 'border-slate-200'}` : ''}`}>
                        <img src={s.i} alt={s.l} className={`w-5 h-5 sm:w-6 sm:h-6 mb-1.5 object-contain shrink-0 ${isDark ? 'invert opacity-70' : 'opacity-70'}`} />
                        <span className={`text-[7px] sm:text-[8px] font-medium uppercase tracking-wider mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.l}</span>
                        <span className={`text-[9px] sm:text-[11px] font-semibold leading-none truncate w-full px-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{s.v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-4">
                    <p className={`text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Software Incluido</p>
                    <div className="flex flex-nowrap gap-1.5 sm:gap-2 justify-center overflow-hidden">
                      {[{ name: 'Windows 11', img: 'https://img.icons8.com/color/48/windows-11.png' }, { name: 'Word', img: 'https://img.icons8.com/color/48/microsoft-word-2019--v2.png' }, { name: 'Excel', img: 'https://img.icons8.com/color/48/microsoft-excel-2019--v1.png' }, { name: 'PowerPoint', img: 'https://img.icons8.com/color/48/microsoft-powerpoint-2019--v1.png' }].map(soft => (
                        <div key={soft.name} className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full border shadow-sm flex-shrink-0 ${isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-slate-50 border-slate-200/80'}`}><img src={soft.img} alt={soft.name} className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain flex-shrink-0" /><span className={`text-[10px] sm:text-[11px] font-medium whitespace-nowrap ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{soft.name}</span></div>
                      ))}
                    </div>
                  </div>

                  <div className={`text-[12px] sm:text-[13px] leading-relaxed whitespace-pre-line ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{productoSeleccionado.descripcion}</div>

                  <div className={`mt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} flex flex-col`}>
                    <div className="py-4 flex items-center justify-center w-full">
                      {productoSeleccionado.precio_oferta ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className={`inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#2a344e]`}><span className="text-base sm:text-lg text-white font-display font-bold tracking-tight leading-none">{formatearPrecio(productoSeleccionado.precio_oferta)}</span></div>
                          <span className={`text-xs sm:text-sm line-through font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{formatearPrecio(productoSeleccionado.precio)}</span>
                          {productoSeleccionado.descuento && <span className="bg-red-600 text-white text-[7px] sm:text-[9px] font-semibold px-1.5 py-0.5 rounded">-{productoSeleccionado.descuento}%</span>}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center"><div className={`inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#2a344e]`}><span className="text-base sm:text-lg text-white font-display font-bold tracking-tight leading-none">{formatearPrecio(productoSeleccionado.precio)}</span></div></div>
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-row gap-2 sm:gap-3 w-full">
                        <button onClick={() => { agregarAlCarrito(productoSeleccionado); setProductoSeleccionado(null); setCarritoAbierto(true); }} className={`flex-1 h-12 sm:h-11 px-1 sm:px-4 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center leading-tight ${isDark ? 'bg-slate-800 text-white hover:bg-slate-700 shadow-none' : 'bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-50 shadow-none'}`}>Añadir al carrito</button>
                        <button onClick={() => { agregarAlCarrito(productoSeleccionado); setProductoSeleccionado(null); setMostrandoCheckout(true); }} className={`flex-1 h-12 sm:h-11 px-1 sm:px-4 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-violet-200 flex items-center justify-center leading-tight ${isDark ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-none' : 'bg-violet-600 text-white hover:bg-violet-700'}`}>Comprar ahora</button>
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
                        <h3 className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.producto.marca} {item.producto.modelo}</h3>
                        <span className={`text-[10px] font-semibold mt-1 ${isDark ? 'text-blue-400' : 'text-[#005bd3]'}`}>{formatearPrecio(item.producto.precio_oferta || item.producto.precio)}</span>
                        <div className="flex items-center justify-between mt-auto pt-2">
                          <div className={`flex items-center rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                            <button onClick={() => restarCantidad(item.producto.id)} className={`w-6 h-6 flex items-center justify-center text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>-</button>
                            <span className={`w-6 text-center text-[10px] font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.cantidad}</span>
                            <button onClick={() => sumarCantidad(item.producto.id)} className={`w-6 h-6 flex items-center justify-center text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>+</button>
                          </div>
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
                      <div key={item.producto.id} className="flex justify-between items-center text-sm">
                        <span className={`truncate mr-2 font-medium text-xs sm:text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.cantidad}x {item.producto.marca} {item.producto.modelo}</span>
                        <span className={`font-semibold shrink-0 text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatearPrecio((item.producto.precio_oferta || item.producto.precio) * item.cantidad)}</span>
                      </div>
                    ))}
                    <div className={`pt-3 border-t flex justify-between items-center mt-3 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Total</span>
                      <span className={`text-lg font-display font-bold ${isDark ? 'text-blue-400' : 'text-[#005bd3]'}`}>{formatearPrecio(totalCarrito)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>1. Datos de Contacto</h3>
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
                        {tipoEnvio === op.id && <div className="absolute top-4 right-4 text-violet-600 dark:text-violet-400"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l7.07-7.071-1.414-1.414-5.656 5.657-2.829-2.829-1.414 1.414L11.003 16z"/></svg></div>}
                      </button>
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
                        {metodoPago === op.id && <div className="absolute top-4 right-4 text-violet-600 dark:text-violet-400"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l7.07-7.071-1.414-1.414-5.656 5.657-2.829-2.829-1.414 1.414L11.003 16z"/></svg></div>}
                      </button>
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
}
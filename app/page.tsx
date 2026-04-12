'use client';

  import { useState, useEffect } from 'react';
  import { motion, AnimatePresence } from 'framer-motion';
  import { supabase } from './supabase'; 

  // ========================================================
  // 🎨 ESTÉTICA MODULAR Y JERARQUÍA (CON MODO OSCURO)
  // ========================================================
  const RADIO_GENERAL = "rounded-2xl"; 

  const ESTETICA_LOGIN = (isDark: boolean) => ({
    contenedor: `w-full max-w-[300px] p-6 ${RADIO_GENERAL} transition-colors duration-300 border ${isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white shadow-xl shadow-slate-200/60 border-slate-200/80'}`,
    input: `w-full h-10 px-4 transition-all text-xs font-bold outline-none focus:ring-2 border ${isDark ? 'bg-slate-800 border-slate-700 focus:ring-violet-500 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 focus:ring-violet-300 text-slate-800 placeholder:text-slate-400'}`,
    boton: `font-black active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center text-xs w-full h-10 mt-1 ${RADIO_GENERAL} ${isDark ? 'bg-violet-600 text-white hover:bg-violet-500' : 'bg-violet-600 text-white shadow-md shadow-violet-200 hover:bg-violet-700'}`
  });

  const ESTETICA_FORMULARIO = (isDark: boolean) => ({
    contenedor: `w-full max-w-[360px] mx-auto p-6 min-h-[600px] h-[85vh] max-h-[740px] flex flex-col ${RADIO_GENERAL} transition-colors duration-300 border ${isDark ? 'bg-slate-900 shadow-none border-slate-800' : 'bg-white shadow-xl shadow-slate-200/60 border-slate-200/80'}`,
    input: `w-full h-10 px-4 transition-all text-xs font-bold outline-none focus:ring-2 border ${isDark ? 'bg-slate-800 border-slate-700 focus:ring-violet-500 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 focus:ring-violet-300 text-slate-800 placeholder:text-slate-400'}`,
    label: `text-[10px] font-bold ml-1 mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`,
    botonPrincipal: `font-black active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center text-xs w-full h-12 mt-2 ${RADIO_GENERAL} ${isDark ? 'bg-violet-600 text-white hover:bg-violet-500' : 'bg-violet-600 text-white shadow-md shadow-violet-200 hover:bg-violet-700'}`,
    btnOpcionInactivo: `flex-1 h-10 ${RADIO_GENERAL} text-[10px] font-black transition-all border-2 ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`,
    btnOpcionActivo: `flex-1 h-10 ${RADIO_GENERAL} text-[10px] font-black transition-all border-2 bg-violet-600 text-white border-violet-600`,
    uploadArea: `relative w-full rounded-xl flex items-center justify-center transition-colors cursor-pointer overflow-hidden border-2`
  });

  const ESTETICA_TARJETA = (isDark: boolean) => ({
    contenedor: `p-5 ${RADIO_GENERAL} border flex flex-col transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white shadow-xl shadow-slate-200/60 border-slate-200/80'}`,
  });

  const AMIGOS_FALLBACK = ['Tomas', 'Koke', 'Tito', 'Uli', 'Pablo', 'Oscarcito'];

  const TAGS_DISPONIBLES_IRL = [
    { label: 'PS5', emoji: '🎮' }, { label: 'Asado', emoji: '🥩' }, { label: 'Juegos de Mesa', emoji: '🎲' }, 
    { label: 'Novias Invitadas', emoji: '👩‍❤️‍👨' }, { label: 'Chupi', emoji: '🥃' }, { label: 'Minubis', emoji: '👩🏻‍🦰' },
    { label: 'Lowcost', emoji: '💸' }, { label: 'María', emoji: '🍁' }, { label: 'Fiesta', emoji: '🎉' }
  ];

  const TAGS_DISPONIBLES_DISCORD = [
    { label: 'Rocket League', emoji: '🚗' }, { label: 'Lol', emoji: '🧙‍♂️' }, { label: 'Impostor', emoji: '🔪' },
    { label: 'Make it Meme', emoji: '😂' }, { label: 'Pinturillo', emoji: '🎨' }
  ];

  const TODOS_LOS_TAGS = [...TAGS_DISPONIBLES_IRL, ...TAGS_DISPONIBLES_DISCORD];

  const obtenerTiempoRelativo = (timestamp: number) => {
    if (!timestamp) return 'Hace un rato';
    const diffMs = Date.now() - timestamp;
    const minutos = Math.floor(diffMs / 60000);
    const horas = Math.floor(diffMs / 3600000);
    const dias = Math.floor(diffMs / 86400000);

    if (minutos < 1) return 'Hace instantes';
    if (minutos < 60) return `Hace ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
    if (horas < 24) return `Hace ${horas} hora${horas !== 1 ? 's' : ''}`;
    return `Hace ${dias} día${dias !== 1 ? 's' : ''}`;
  };

  export default function Home() {
    const [usuarioLogueado, setUsuarioLogueado] = useState<string | null>(null);
    const [nombreSeleccionado, setNombreSeleccionado] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [errorLogin, setErrorLogin] = useState('');
    const [vistaPrincipal, setVistaPrincipal] = useState<'PROPUESTAS' | 'POSTEOS'>('PROPUESTAS');

    const [juntadas, setJuntadas] = useState<any[]>([]);
    const [usuariosDB, setUsuariosDB] = useState<any[]>([]);
    const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
    const [juntadaEnEdicion, setJuntadaEnEdicion] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const [isDark, setIsDark] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
    const [passwordVieja, setPasswordVieja] = useState('');
    const [nuevaPassword, setNuevaPassword] = useState('');
    const [nuevaFotoUrl, setNuevaFotoUrl] = useState('');
    const [fotoFile, setFotoFile] = useState<File | null>(null);
    const [fotoPreview, setFotoPreview] = useState<string | null>(null);
    const [comentariosInputs, setComentariosInputs] = useState<Record<number, string>>({});

    const [tipoJuntada, setTipoJuntada] = useState<'IRL' | 'DISCORD'>('IRL');
    const [nuevoTitulo, setNuevoTitulo] = useState('');
    const [fechaSel, setFechaSel] = useState(''); 
    const [horaSel, setHoraSel] = useState(''); 
    const [opcionSede, setOpcionSede] = useState<'FIJA' | 'VOTACION' | 'CUSTOM'>('FIJA');
    const [sedeFija, setSedeFija] = useState('Casa de Tomas');
    const [sedePersonalizadaInput, setSedePersonalizadaInput] = useState('');
    const [candidatosSede, setCandidatosSede] = useState<string[]>([]);
    const [tagsSel, setTagsSel] = useState<string[]>([]);
    const [notas, setNotas] = useState('');
    const [imagenJuntada, setImagenJuntada] = useState<File | null>(null);
    const [imagenJuntadaPreview, setImagenJuntadaPreview] = useState<string | null>(null);

    const [posteos, setPosteos] = useState<any[]>([]);
    const [limitePosteos, setLimitePosteos] = useState(6);
    const [mostrandoFormPosteo, setMostrandoFormPosteo] = useState(false);
    const [textoPost, setTextoPost] = useState('');
    const [imagenPost, setImagenPost] = useState<File | null>(null);
    const [imagenPostPreview, setImagenPostPreview] = useState<string | null>(null);
    const [esAnonimo, setEsAnonimo] = useState(false);
    const [comentariosPostInputs, setComentariosPostInputs] = useState<Record<number, string>>({});
    const [comentarioAnonimoPost, setComentarioAnonimoPost] = useState<Record<number, boolean>>({});

    const [discordData, setDiscordData] = useState<any>(null);
    const [discordLoading, setDiscordLoading] = useState(true);

    useEffect(() => {
      setIsMounted(true);
      setIsDark(localStorage.getItem('tema_juntadas') === 'dark');
      setUsuarioLogueado(localStorage.getItem('juntadas_user'));
      
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setLimitePosteos(4);
      }
    }, []);

    useEffect(() => {
      const cargarDatos = async () => {
        const [resJuntadas, resUsuarios, resPosteos] = await Promise.all([
          supabase.from('juntadas').select('*').order('id', { ascending: false }),
          supabase.from('usuarios').select('*'),
          supabase.from('posteos').select('*').order('id', { ascending: false })
        ]);
        
        if (resJuntadas.data) setJuntadas(resJuntadas.data);
        if (resUsuarios.data) setUsuariosDB(resUsuarios.data);
        
        if (!resPosteos.error && resPosteos.data) {
          setPosteos(resPosteos.data.map(p => ({ ...p, imagenUrl: p.imagenurl ?? p.imagenUrl })));
        } else if (resPosteos.error) console.error("Error al cargar posteos:", resPosteos.error.message);

        setLoading(false);
      };
      
      cargarDatos();

      const subs = ['juntadas', 'usuarios', 'posteos'].map(table => 
        supabase.channel(`${table}_channel`).on('postgres_changes', { event: '*', schema: 'public', table }, cargarDatos).subscribe()
      );

      const fetchDiscord = async () => {
        try {
          const res = await fetch(`/api/discord?t=${Date.now()}`);
          const data = await res.json();
          setDiscordData((prev: any) => data.errorMensaje ? (prev?.channels ? prev : data) : data);
        } catch (error) {
          setDiscordData((prev: any) => prev?.channels ? prev : { errorMensaje: 'ERROR DE CONEXIÓN LOCAL' });
        } finally {
          setDiscordLoading(false);
        }
      };
      
      fetchDiscord();
      const discordInterval = setInterval(fetchDiscord, 5000);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          fetchDiscord();
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        subs.forEach(s => supabase.removeChannel(s));
        clearInterval(discordInterval);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }, []); 

    useEffect(() => {
      const user = usuariosDB.find(u => u.nombre === usuarioLogueado);
      if (user?.tema_oscuro !== undefined) {
        setIsDark(user.tema_oscuro);
        localStorage.setItem('tema_juntadas', user.tema_oscuro ? 'dark' : 'light');
      }
    }, [usuarioLogueado, usuariosDB]);

    const toggleTema = async () => {
      const nuevoTema = !isDark;
      setIsDark(nuevoTema);
      localStorage.setItem('tema_juntadas', nuevoTema ? 'dark' : 'light');
      if (usuarioLogueado) await supabase.from('usuarios').update({ tema_oscuro: nuevoTema }).eq('nombre', usuarioLogueado);
    };

    const getFotoUsuario = (nombre: string) => {
      if (nombre === 'ANÓNIMO') return 'https://i.imgur.com/6oP3Kex.png';
      return usuariosDB.find(u => u.nombre === nombre)?.foto_perfil || `https://api.dicebear.com/7.x/avataaars/svg?seed=${nombre}`;
    };

    const intentarLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!nombreSeleccionado) return setErrorLogin('Falta elegir quién sos.');
      
      let user = usuariosDB.find(u => u.nombre === nombreSeleccionado) || (await supabase.from('usuarios').select('*').eq('nombre', nombreSeleccionado).single()).data;
      
      if (user?.password === passwordInput) {
        setUsuarioLogueado(nombreSeleccionado);
        localStorage.setItem('juntadas_user', nombreSeleccionado);
        setErrorLogin('');
        if(user.tema_oscuro !== undefined) {
          setIsDark(user.tema_oscuro);
          localStorage.setItem('tema_juntadas', user.tema_oscuro ? 'dark' : 'light');
        }
      } else setErrorLogin('Contraseña incorrecta');
    };

    const comprimirImagen = (file: File, maxWidth: number): Promise<File> => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = e => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(blob => blob ? resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg', lastModified: Date.now() })) : reject(new Error('Error al comprimir')), 'image/jpeg', 0.7);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });

    const subirImagenAlStorage = async (file: File, folder: string) => {
      try {
        const archivoComprimido = await comprimirImagen(file, folder === 'perfiles' ? 400 : 800);
        const filePath = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2,9)}.jpg`;
        const { error } = await supabase.storage.from('fotos').upload(filePath, archivoComprimido);
        return error ? null : supabase.storage.from('fotos').getPublicUrl(filePath).data.publicUrl;
      } catch { return null; }
    };

    const guardarPerfil = async () => {
      const userActual = usuariosDB.find(u => u.nombre === usuarioLogueado);
      if (!userActual || (nuevaPassword.trim() && passwordVieja !== userActual.password && !alert("❌ La contraseña actual es incorrecta."))) return;

      setIsUploading(true);
      let finalFotoUrl = userActual.foto_perfil;
      if (fotoFile) finalFotoUrl = await subirImagenAlStorage(fotoFile, 'perfiles') || alert("No se pudo subir la foto.") || finalFotoUrl;
      else if (nuevaFotoUrl.trim()) finalFotoUrl = nuevaFotoUrl.trim();

      const { error } = await supabase.from('usuarios').update({ password: nuevaPassword.trim() || userActual.password, foto_perfil: finalFotoUrl }).eq('nombre', usuarioLogueado);
      
      if (error) alert("❌ Error al guardar: " + error.message);
      else { setMenuPerfilAbierto(false); setPasswordVieja(''); setNuevaPassword(''); setNuevaFotoUrl(''); setFotoFile(null); setFotoPreview(null); }
      setIsUploading(false);
    };

    const abrirEdicion = (j: any) => {
      setJuntadaEnEdicion(j.id); setTipoJuntada(j.tipo || 'IRL'); setNuevoTitulo(j.titulo);
      const date = new Date(j.timestamp);
      setFechaSel(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
      setHoraSel(`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`);
      setOpcionSede(j.esSedePersonalizada ? 'CUSTOM' : (j.esSedeFija ? 'FIJA' : 'VOTACION'));
      setSedePersonalizadaInput(j.esSedePersonalizada ? j.sedeFinal || '' : '');
      setSedeFija(j.esSedeFija ? j.sedeFinal || 'Casa de Tomas' : 'Casa de Tomas');
      setCandidatosSede(j.candidatos?.map((c: any) => c.nombre) || []);
      setTagsSel(j.tags || []); setNotas(j.notas || ''); setImagenJuntada(null); setImagenJuntadaPreview(j.imagenUrl || null); setMostrandoFormulario(true);
    };

    const publicarJuntada = async () => {
      if (!nuevoTitulo.trim() || !fechaSel || !horaSel.trim()) return alert("Completá título, fecha y hora.");
      if (tipoJuntada === 'IRL' && opcionSede === 'CUSTOM' && !sedePersonalizadaInput.trim()) return alert("Ingresá la sede personalizada.");
      if (!juntadaEnEdicion && !imagenJuntada) return alert("¡Tenés que agregar una foto de portada sí o sí!");
      
      setIsUploading(true);
      let finalImageUrl = imagenJuntada ? (await subirImagenAlStorage(imagenJuntada, 'juntadas') || alert("Error subiendo foto.")) : juntadas.find(x => x.id === juntadaEnEdicion)?.imagenUrl;

      const [y, m, d] = fechaSel.split('-'); const [h, min] = horaSel.split(':');
      const targetDate = new Date(Number(y), Number(m) - 1, Number(d), Number(h) || 0, Number(min) || 0);
      const esSedeFija = opcionSede === 'FIJA'; const esSedePersonalizada = opcionSede === 'CUSTOM';
      const sedeFinalDeterminada = tipoJuntada === 'DISCORD' ? 'Discord' : (esSedeFija ? sedeFija : (esSedePersonalizada ? sedePersonalizadaInput.trim() : null));

      const jData = {
        tipo: tipoJuntada, titulo: nuevoTitulo, fechaDisplay: formatearFechaDisplay(fechaSel), horaDisplay: `${horaSel} PM`, timestamp: targetDate.getTime(),
        esSedeFija: tipoJuntada === 'DISCORD' || esSedeFija, esSedePersonalizada: tipoJuntada !== 'DISCORD' && esSedePersonalizada, sedeFinal: sedeFinalDeterminada,
        candidatos: (tipoJuntada === 'DISCORD' || opcionSede !== 'VOTACION') ? [] : candidatosSede.map(c => juntadas.find(x => x.id === juntadaEnEdicion)?.candidatos?.find((old: any) => old.nombre === c) || { nombre: c, votantes: [] }),
        tags: tagsSel, notas: notas.trim(), imagenUrl: finalImageUrl
      };

      if (juntadaEnEdicion) await supabase.from('juntadas').update(jData).eq('id', juntadaEnEdicion);
      else await supabase.from('juntadas').insert([{ ...jData, creador: usuarioLogueado, confirmados: [usuarioLogueado], dudosos: [], rechazados: [], excusas: [], pineado: false }]);
      
      setMostrandoFormulario(false); resetForm(); setIsUploading(false);
    };

    const votarSede = async (juntadaId: number, casaNombre: string) => {
      const j = juntadas.find(i => i.id === juntadaId);
      if (!j || j.esSedeFija || j.esSedePersonalizada || j.tipo === 'DISCORD') return;
      const nuevosCandidatos = j.candidatos.map((c: any) => ({ ...c, votantes: c.nombre === casaNombre ? [...(c.votantes ?? []).filter((v: string) => v !== usuarioLogueado), usuarioLogueado] : (c.votantes ?? []).filter((v: string) => v !== usuarioLogueado) }));
      setJuntadas(prev => prev.map(i => i.id === juntadaId ? { ...i, candidatos: nuevosCandidatos } : i));
      supabase.from('juntadas').update({ candidatos: nuevosCandidatos }).eq('id', juntadaId).then();
    };

    const toggleAsistencia = (juntadaId: number, estado: 'voy' | 'nose' | 'paso') => {
      const j = juntadas.find(i => i.id === juntadaId);
      if (!j) return;
      const [yaEsVoy, yaEsNose, yaEsPaso] = [estado === 'voy' && (j.confirmados ?? []).includes(usuarioLogueado), estado === 'nose' && (j.dudosos ?? []).includes(usuarioLogueado), estado === 'paso' && (j.rechazados ?? []).includes(usuarioLogueado)];
      let confirmados = (j.confirmados ?? []).filter((u: string) => u !== usuarioLogueado), dudosos = (j.dudosos ?? []).filter((u: string) => u !== usuarioLogueado), rechazados = (j.rechazados ?? []).filter((u: string) => u !== usuarioLogueado), candidatos = j.candidatos;

      if (!(yaEsVoy || yaEsNose || yaEsPaso)) {
        if (estado === 'voy') confirmados.push(usuarioLogueado);
        if (estado === 'nose') dudosos.push(usuarioLogueado);
        if (estado === 'paso') {
          rechazados.push(usuarioLogueado);
          if (!j.esSedeFija && !j.esSedePersonalizada && j.tipo !== 'DISCORD' && j.candidatos) candidatos = j.candidatos.map((c: any) => ({ ...c, votantes: (c.votantes ?? []).filter((v: string) => v !== usuarioLogueado) }));
        }
      }
      setJuntadas(prev => prev.map(i => i.id === juntadaId ? { ...i, confirmados, dudosos, rechazados, candidatos } : i));
      supabase.from('juntadas').update({ confirmados, dudosos, rechazados, candidatos }).eq('id', juntadaId).then();
    };

    const toggleReaccionPost = async (postId: number, tipo: 'like' | 'dislike') => {
      const p = posteos.find(x => x.id === postId);
      if (!p || !usuarioLogueado) return;

      let nuevosLikes = [...(p.likes ?? [])];
      let nuevosDislikes = [...(p.dislikes ?? [])];

      if (tipo === 'like') {
        if (nuevosLikes.includes(usuarioLogueado)) {
          nuevosLikes = nuevosLikes.filter(u => u !== usuarioLogueado);
        } else {
          nuevosLikes.push(usuarioLogueado);
          nuevosDislikes = nuevosDislikes.filter(u => u !== usuarioLogueado);
        }
      } else {
        if (nuevosDislikes.includes(usuarioLogueado)) {
          nuevosDislikes = nuevosDislikes.filter(u => u !== usuarioLogueado);
        } else {
          nuevosDislikes.push(usuarioLogueado);
          nuevosLikes = nuevosLikes.filter(u => u !== usuarioLogueado);
        }
      }

      setPosteos(prev => prev.map(i => i.id === postId ? { ...i, likes: nuevosLikes, dislikes: nuevosDislikes } : i));
      supabase.from('posteos').update({ likes: nuevosLikes, dislikes: nuevosDislikes }).eq('id', postId).then();
    };

    const agregarComentario = (id: number, isPost = false) => {
      const texto = (isPost ? comentariosPostInputs[id] : comentariosInputs[id])?.trim();
      if (!texto) return;
      
      if (isPost) {
        const p = posteos.find(item => item.id === id);
        if (!p) return;
        const nuevosComentarios = [...(p.comentarios ?? []), { usuario: comentarioAnonimoPost[id] ? 'ANÓNIMO' : usuarioLogueado, texto, creador_real: usuarioLogueado }];
        setPosteos(prev => prev.map(i => i.id === id ? { ...i, comentarios: nuevosComentarios } : i));
        setComentariosPostInputs(prev => ({ ...prev, [id]: '' })); setComentarioAnonimoPost(prev => ({ ...prev, [id]: false }));
        supabase.from('posteos').update({ comentarios: nuevosComentarios }).eq('id', id).then();
      } else {
        const j = juntadas.find(item => item.id === id);
        if (!j) return;
        const nuevasExcusas = [...(j.excusas ?? []), { usuario: usuarioLogueado, texto, tipo: 'comentario' }];
        setJuntadas(prev => prev.map(i => i.id === id ? { ...i, excusas: nuevasExcusas } : i));
        setComentariosInputs(prev => ({ ...prev, [id]: '' }));
        supabase.from('juntadas').update({ excusas: nuevasExcusas }).eq('id', id).then();
      }
    };

    const borrarComentario = (id: number, target: string | number, isPost = false) => {
      if (isPost) {
        const nuevos = (posteos.find(i => i.id === id)?.comentarios ?? []).filter((_: any, i: number) => i !== target);
        setPosteos(prev => prev.map(i => i.id === id ? { ...i, comentarios: nuevos } : i));
        supabase.from('posteos').update({ comentarios: nuevos }).eq('id', id).then();
      } else {
        const nuevos = (juntadas.find(i => i.id === id)?.excusas ?? []).filter((e: any) => !(e.usuario === usuarioLogueado && e.texto === target));
        setJuntadas(prev => prev.map(i => i.id === id ? { ...i, excusas: nuevos } : i));
        supabase.from('juntadas').update({ excusas: nuevos }).eq('id', id).then();
      }
    };

    const eliminarRegistro = async (id: number, isPost = false) => {
      if (!window.confirm(`¿Seguro que querés eliminar est${isPost ? 'a publicación' : 'a juntada'}?`)) return;
      if (isPost) { setPosteos(p => p.filter(x => x.id !== id)); await supabase.from('posteos').delete().eq('id', id); }
      else { await supabase.from('juntadas').delete().eq('id', id); }
    };

    const compartirWhatsApp = (j: any) => window.open(`https://wa.me/?text=${encodeURIComponent(`${j.tipo === 'DISCORD' ? '🎧 *PROPUESTA DISCORD:*' : '🍾 *PROPUESTA IRL:*'} ${j.titulo} ${j.tipo === 'DISCORD' ? '👾' : '🍾'}\n📆 *DÍA:* ${j.fechaDisplay}\n⏰ *HORA:* ${j.horaDisplay}${j.tipo === 'DISCORD' ? '' : `\n${j.esSedePersonalizada ? '📍' : '🏠'} *SEDE:* ${(j.esSedeFija || j.esSedePersonalizada) ? j.sedeFinal : 'A votar en la app'}`}\n\n👉 *Confirmá tu asistencia:* ${window.location.origin}`)}`, '_blank');

    const resetForm = () => { setJuntadaEnEdicion(null); setTipoJuntada('IRL'); setNuevoTitulo(''); setFechaSel(''); setHoraSel(''); setTagsSel([]); setCandidatosSede([]); setOpcionSede('FIJA'); setSedePersonalizadaInput(''); setNotas(''); setImagenJuntada(null); setImagenJuntadaPreview(null); };

    const publicarPosteo = async () => {
      if (!imagenPost) return alert("Tenés que agregar una foto sí o sí para publicar.");
      setIsUploading(true);
      const finalImageUrl = await subirImagenAlStorage(imagenPost, 'posteos');
      if (!finalImageUrl) { alert("Hubo un error subiendo la foto."); return setIsUploading(false); }

      const { data, error } = await supabase.from('posteos').insert([{ creador: usuarioLogueado, texto: textoPost.trim(), imagenurl: finalImageUrl, anonimo: esAnonimo, timestamp: Date.now(), likes: [], dislikes: [], comentarios: [] }]).select();
      if (error) { alert(`❌ Error al publicar: ${error.message}`); return setIsUploading(false); }
      if (data?.length) setPosteos(prev => [{ ...data[0], imagenUrl: data[0].imagenurl ?? data[0].imagenUrl }, ...prev]);
      
      setMostrandoFormPosteo(false); setTextoPost(''); setImagenPost(null); setImagenPostPreview(null); setEsAnonimo(false); setIsUploading(false);
    };

    const formatearFechaDisplay = (f: string) => f ? `${['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][new Date(Number(f.split('-')[0]), Number(f.split('-')[1]) - 1, Number(f.split('-')[2])).getDay()]} ${f.split('-')[2]} de ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][new Date(Number(f.split('-')[0]), Number(f.split('-')[1]) - 1, Number(f.split('-')[2])).getMonth()]}` : '';

    const calcularEstadoTiempo = (t: number) => {
      if (!t) return { texto: 'CALCULANDO... ⏳', color: 'bg-violet-600' };
      const diff = t - Date.now(), horas = Math.floor(diff / 3600000), dias = Math.floor(horas / 24);
      if (diff < 0) return Math.abs(diff) <= 10800000 ? { texto: 'EN CURSO 😄', color: 'bg-violet-600' } : { texto: 'EXPIRADO', color: 'bg-red-500' };
      return dias > 1 ? { texto: `FALTAN ${dias} DÍAS ⏳`, color: 'bg-violet-600' } : dias === 1 ? { texto: `MAÑANA 📆 `, color: 'bg-violet-600' } : horas >= 1 ? { texto: `FALTAN ${horas} HORAS ⏰`, color: 'bg-violet-600' } : { texto: '¡EN UN RATO! 🔥', color: 'bg-violet-600' };
    };

    if (loading || !isMounted) return <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-[#F4F6F8]'} flex items-center justify-center transition-colors duration-300`}><div className="animate-spin text-violet-600 text-2xl">⏳</div></div>;

    const ahoraMs = Date.now(), TRES_HORAS = 10800000;
    const juntadasOrdenadas = [...juntadas].sort((a, b) => (ahoraMs >= a.timestamp + TRES_HORAS && ahoraMs < b.timestamp + TRES_HORAS) ? 1 : (ahoraMs < a.timestamp + TRES_HORAS && ahoraMs >= b.timestamp + TRES_HORAS) ? -1 : (a.pineado && !b.pineado) ? -1 : (!a.pineado && b.pineado) ? 1 : b.id - a.id);
    const canalesConGente = discordData?.channels?.map((c: any) => ({ ...c, members: discordData.members?.filter((m: any) => m.channel_id === c.id) ?? [] })).filter((c: any) => c.members.length > 0) ?? [];

    const estForm = ESTETICA_FORMULARIO(isDark);

    return (
      <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-[#F4F6F8]'} transition-colors duration-300 font-sans`}>
        {!usuarioLogueado && (
          <main className="flex items-center justify-center p-4 min-h-screen">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={ESTETICA_LOGIN(isDark).contenedor}>
              <div className="flex justify-center mb-6"><img src="https://i.imgur.com/5hJH1kn.png" alt="Logo" className={`h-10 w-auto object-contain ${isDark ? 'invert opacity-90' : ''}`} /></div>
              <form onSubmit={intentarLogin} className="space-y-3">
                <select className={`${ESTETICA_LOGIN(isDark).input} ${RADIO_GENERAL} appearance-none cursor-pointer`} value={nombreSeleccionado} onChange={e => setNombreSeleccionado(e.target.value)}>
                  <option value="">¿Quién sos?</option>
                  {(usuariosDB.length > 0 ? usuariosDB.map(u => u.nombre) : AMIGOS_FALLBACK).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <input type="password" placeholder="Contraseña" className={`${ESTETICA_LOGIN(isDark).input} ${RADIO_GENERAL}`} value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
                {errorLogin && <p className="text-red-500 text-[10px] font-black text-center uppercase tracking-widest">{errorLogin}</p>}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className={ESTETICA_LOGIN(isDark).boton}>ENTRAR</motion.button>
              </form>
            </motion.div>
          </main>
        )}

        {/* FORMULARIO CREAR/EDITAR PROPUESTA */}
        {usuarioLogueado && mostrandoFormulario && (
          <main className="p-4 pb-10 min-h-screen flex flex-col items-center justify-center">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={estForm.contenedor}>
              <div className="shrink-0">
                <button onClick={() => { setMostrandoFormulario(false); resetForm(); }} className={`text-[10px] mb-4 uppercase tracking-widest transition-colors font-bold ${isDark ? 'text-slate-500 hover:text-violet-400' : 'text-slate-400 hover:text-violet-600'}`}>← Cancelar</button>
                <h2 className={`text-xl font-black mb-5 tracking-tighter uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>{juntadaEnEdicion ? 'EDITAR PROPUESTA' : 'NUEVA PROPUESTA'}</h2>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                <div className={`flex gap-2 p-1 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <button onClick={() => { setTipoJuntada('IRL'); setTagsSel([]); }} className={`flex-1 h-10 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${tipoJuntada === 'IRL' ? (isDark ? 'bg-slate-700 text-emerald-400 border-slate-600 border shadow-sm' : 'bg-white text-emerald-600 shadow-sm border border-slate-200') : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}>📍 IRL</button>
                  <button onClick={() => { setTipoJuntada('DISCORD'); setTagsSel([]); }} className={`flex-1 h-10 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center justify-center gap-1.5 ${tipoJuntada === 'DISCORD' ? 'bg-[#5865F2] text-white shadow-md' : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" fill="currentColor" className={`w-3.5 h-3.5 ${tipoJuntada === 'DISCORD' ? 'text-white' : (isDark ? 'text-white' : 'text-[#5865F2]')}`}><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14h0C127.86,52.43,121.56,29.1,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.3,46,96.19,53,91.08,65.69,84.69,65.69Z"/></svg>DISCORD</button>
                </div>

                <div><label className={estForm.label}>¿Qué se hace?</label><input type="text" placeholder={tipoJuntada === 'IRL' ? "Ej: Asadito en lo de Uli" : "Ej: Torneo de Rocket League"} className={`${estForm.input} ${RADIO_GENERAL}`} value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={estForm.label}>Día</label><input type="date" className={`${estForm.input} ${RADIO_GENERAL} text-xs`} value={fechaSel} onChange={e => setFechaSel(e.target.value)} /></div>
                  <div><label className={estForm.label}>Hora</label><div className="relative"><input type="text" placeholder="21:30" className={`${estForm.input} ${RADIO_GENERAL} pr-8`} value={horaSel} onChange={e => setHoraSel(e.target.value.replace(/\D/g, '').replace(/^(\d{2})(\d{1,2})/, '$1:$2').slice(0, 5))} /><span className={`absolute right-3 top-3 text-[10px] font-black ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>PM</span></div></div>
                </div>

                {tipoJuntada === 'IRL' && (
                    <div>
                      <label className={estForm.label}>Sede</label>
                      <div className="flex gap-2 mb-3"><button onClick={() => setOpcionSede('FIJA')} className={opcionSede === 'FIJA' ? estForm.btnOpcionActivo : estForm.btnOpcionInactivo}>FIJA</button><button onClick={() => setOpcionSede('VOTACION')} className={opcionSede === 'VOTACION' ? estForm.btnOpcionActivo : estForm.btnOpcionInactivo}>VOTACIÓN</button><button onClick={() => setOpcionSede('CUSTOM')} className={opcionSede === 'CUSTOM' ? estForm.btnOpcionActivo : estForm.btnOpcionInactivo}>CUSTOM</button></div>
                      <div className="mt-1">
                        {opcionSede === 'FIJA' && <div className="relative"><select className={`${estForm.input} ${RADIO_GENERAL} appearance-none cursor-pointer pr-8`} value={sedeFija} onChange={e => setSedeFija(e.target.value)}>{AMIGOS_FALLBACK.map(a => <option key={a} value={`Casa de ${a}`}>Casa de {a}</option>)}</select><div className="absolute inset-y-0 right-3 flex items-center pointer-events-none"><span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>▼</span></div></div>}
                        {opcionSede === 'VOTACION' && <div className={`pt-2 pb-3 px-3 rounded-2xl border ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-100'}`}><p className={`text-[10px] font-black mb-3 text-center uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Seleccionar casas candidatas:</p><div className="flex flex-wrap justify-center gap-2">{AMIGOS_FALLBACK.map(a => <motion.button key={a} whileTap={{ scale: 0.95 }} onClick={() => setCandidatosSede(p => p.includes(a) ? p.filter(c => c !== a) : [...p, a])} className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all border-2 ${candidatosSede.includes(a) ? 'bg-violet-600 text-white border-violet-600 shadow-md' : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-400 border-slate-200')}`}>{a.toUpperCase()}</motion.button>)}</div></div>}
                        {opcionSede === 'CUSTOM' && <input type="text" maxLength={20} placeholder="Ej: Vertigo, Consti" className={`${estForm.input} ${RADIO_GENERAL}`} value={sedePersonalizadaInput} onChange={e => setSedePersonalizadaInput(e.target.value)} />}
                      </div>
                    </div>
                )}

                <div><label className={estForm.label}>Notas (Opcional)</label><input type="text" placeholder={tipoJuntada === 'IRL' ? "Ej: Traigan hielo, falta coca" : "Ej: Superclásico de Rocket League"} className={`${estForm.input} ${RADIO_GENERAL}`} value={notas} onChange={e => setNotas(e.target.value)} /></div>
                <div><label className={estForm.label}>¿Qué onda?</label><div className="flex flex-wrap gap-1.5">{(tipoJuntada === 'IRL' ? TAGS_DISPONIBLES_IRL : TAGS_DISPONIBLES_DISCORD).map(t => <button key={t.label} onClick={() => setTagsSel(p => p.includes(t.label) ? p.filter(x => x !== t.label) : [...p, t.label])} className={`px-3 py-1 text-[8px] font-bold transition-all border-2 ${tagsSel.includes(t.label) ? 'bg-violet-600 text-white border-violet-600' : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-100')} ${RADIO_GENERAL}`}>{t.emoji} {t.label}</button>)}</div></div>
                
                <div className="pt-2">
                    <div className={`${estForm.uploadArea} h-40 shrink-0 ${imagenJuntadaPreview ? 'border-transparent shadow-sm' : (isDark ? 'border-dashed border-slate-700 bg-slate-800/50 hover:bg-slate-800' : 'border-dashed border-violet-200 bg-violet-50 hover:bg-violet-100')}`}>
                      <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setImagenJuntada(f); setImagenJuntadaPreview(URL.createObjectURL(f)); } }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      {imagenJuntadaPreview ? <><img src={imagenJuntadaPreview} className="w-full h-full object-cover" alt="Preview Juntada" /><div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><span className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">🔄 CAMBIAR FOTO</span></div></> : <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-violet-600'}`}>📸 AGREGAR FOTO (OBLIGATORIA)</span>}
                    </div>
                </div>
              </div>

              <div className="shrink-0 pt-4 mt-auto border-t border-slate-100 dark:border-slate-800">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={publicarJuntada} disabled={isUploading} className={`${estForm.botonPrincipal} ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>{isUploading ? '⏳ GUARDANDO...' : (juntadaEnEdicion ? '💾 GUARDAR CAMBIOS' : '🚀 PROPONER')}</motion.button>
              </div>
            </motion.div>
          </main>
        )}

        {/* FORMULARIO NUEVA PUBLICACIÓN (POST) */}
        {usuarioLogueado && mostrandoFormPosteo && !mostrandoFormulario && (
          <main className="p-4 pb-10 min-h-screen flex flex-col items-center justify-center">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={estForm.contenedor}>
              <div className="shrink-0">
                <button onClick={() => { setMostrandoFormPosteo(false); setImagenPost(null); setImagenPostPreview(null); setTextoPost(''); }} className={`text-[10px] mb-4 uppercase tracking-widest transition-colors font-bold ${isDark ? 'text-slate-500 hover:text-violet-400' : 'text-slate-400 hover:text-violet-600'}`}>← Cancelar</button>
                <h2 className={`text-xl font-black mb-5 tracking-tighter uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>NUEVA PUBLICACIÓN 📸</h2>
              </div>
              
              <div className="flex-1 flex flex-col overflow-y-auto pr-2 pb-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                <div className="flex-1 min-h-[240px] flex flex-col pt-1">
                    <div className={`${estForm.uploadArea} flex-1 ${imagenPostPreview ? 'border-transparent shadow-sm' : (isDark ? 'border-dashed border-slate-700 bg-slate-800/50 hover:bg-slate-800' : 'border-dashed border-violet-200 bg-violet-50 hover:bg-violet-100')}`}>
                        <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setImagenPost(f); setImagenPostPreview(URL.createObjectURL(f)); } }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        {imagenPostPreview ? <><img src={imagenPostPreview} className="w-full h-full object-cover" alt="Preview Posteo" /><div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><span className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">🔄 CAMBIAR FOTO</span></div></> : <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-violet-600'}`}>📸 AGREGAR FOTO (OBLIGATORIA)</span>}
                    </div>
                </div>

                <div className="shrink-0">
                  <label className={estForm.label}>Pie de foto (Opcional)</label>
                  <textarea 
                    placeholder="Escribí algo piola..." 
                    rows={3} 
                    className={`${estForm.input} ${RADIO_GENERAL} h-auto py-3 resize-none font-medium text-xs leading-relaxed`} 
                    value={textoPost} 
                    onChange={e => setTextoPost(e.target.value)} 
                  />
                </div>

                <div className={`shrink-0 flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <input type="checkbox" id="anonimo-check" checked={esAnonimo} onChange={e => setEsAnonimo(e.target.checked)} className="w-4 h-4 text-violet-600 bg-slate-100 border-slate-300 rounded focus:ring-violet-500 focus:ring-2 cursor-pointer" />
                  <label htmlFor="anonimo-check" className={`text-[10px] font-black uppercase tracking-widest cursor-pointer ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Publicar como Anónimo</label>
                </div>
              </div>

              <div className="shrink-0 pt-4 mt-auto border-t border-slate-100 dark:border-slate-800">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={publicarPosteo} disabled={isUploading} className={`${estForm.botonPrincipal} ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isUploading ? '⏳ SUBIENDO...' : '🚀 PUBLICAR'}
                </motion.button>
              </div>
            </motion.div>
          </main>
        )}

        {/* CONTENIDO PRINCIPAL (TARJETAS Y DISCORD) */}
        {usuarioLogueado && !mostrandoFormulario && !mostrandoFormPosteo && (
          <main className="pb-16 min-h-screen">
            <nav className="p-4 lg:p-6 flex justify-between items-center max-w-7xl mx-auto relative z-50">
              <img src="https://i.imgur.com/5hJH1kn.png" alt="Logo" className={`h-8 lg:h-10 w-auto object-contain transition-all ${isDark ? 'invert opacity-90' : ''}`} />
              <div className="flex items-center gap-3">
                  <button onClick={toggleTema} className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-400 hover:text-violet-500 hover:border-violet-300 shadow-sm'}`} title={isDark ? "Activar modo claro" : "Activar modo oscuro"}>{isDark ? <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> : <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}</button>
                  <div className="relative">
                      <button onClick={() => { setMenuPerfilAbierto(!menuPerfilAbierto); setPasswordVieja(''); setNuevaPassword(''); setFotoPreview(null); setFotoFile(null); }} className={`flex items-center gap-2 px-2 py-1.5 rounded-full border transition-colors shadow-sm ${isDark ? 'bg-slate-900 border-slate-700 hover:border-violet-500' : 'bg-white border-slate-200 hover:border-violet-300'}`}><img src={getFotoUsuario(usuarioLogueado)} className={`w-6 h-6 rounded-full object-cover border ${isDark ? 'border-slate-800 bg-slate-800' : 'border-slate-100 bg-slate-50'}`} alt="Avatar" /><span className={`text-[10px] font-black pr-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{usuarioLogueado} ▼</span></button>
                      <AnimatePresence>
                          {menuPerfilAbierto && (
                              <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.15 }} className={`absolute right-0 top-12 w-[260px] border shadow-xl rounded-2xl p-5 flex flex-col gap-4 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                  <p className={`text-[10px] font-black uppercase tracking-widest text-center border-b pb-3 ${isDark ? 'text-slate-400 border-slate-800' : 'text-slate-400 border-slate-100'}`}>Tu Perfil</p>
                                  <div className="flex flex-col items-center justify-center">
                                    <label htmlFor="perfil-upload" className="relative cursor-pointer group"><img src={fotoPreview || getFotoUsuario(usuarioLogueado)} className={`w-16 h-16 rounded-full object-cover border-2 transition-colors shadow-sm ${isDark ? 'border-slate-700 group-hover:border-violet-500' : 'border-slate-200 group-hover:border-violet-400'}`} alt="Tu perfil" /><div className="absolute inset-0 bg-slate-900/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><span className="text-white text-xl">📷</span></div></label>
                                    <input id="perfil-upload" type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if(f) { setFotoFile(f); setFotoPreview(URL.createObjectURL(f)); } }} />
                                    <p className={`text-[9px] font-bold mt-2 uppercase tracking-widest text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Tocar para subir</p>
                                  </div>
                                  <div className="flex flex-col gap-1.5"><label className={`text-[10px] font-bold ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>O Usar Link (Ej: Imgur)</label><input type="text" placeholder="https://..." value={nuevaFotoUrl} onChange={e => setNuevaFotoUrl(e.target.value)} className={`w-full h-8 px-3 rounded-lg text-[10px] font-bold outline-none focus:ring-1 border ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-violet-500 placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-violet-300 placeholder:text-slate-400'}`} /></div>
                                  <div className={`flex flex-col gap-1.5 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><label className={`text-[10px] font-bold ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cambiar Contraseña (Opcional)</label><input type="password" placeholder="Nueva contraseña..." value={nuevaPassword} onChange={e => setNuevaPassword(e.target.value)} className={`w-full h-8 px-3 rounded-lg text-[10px] font-bold outline-none focus:ring-1 border ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-violet-500 placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-800 focus:ring-violet-300 placeholder:text-slate-400'}`} /></div>
                                  <div className={`flex flex-col gap-1.5 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><label className={`text-[10px] font-black ml-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>🔒 Contraseña Actual (Opcional)</label><input type="password" placeholder="Solo requerida si cambiás tu clave" value={passwordVieja} onChange={e => setPasswordVieja(e.target.value)} className={`w-full h-8 px-3 rounded-lg text-[10px] font-bold outline-none focus:ring-1 border ${isDark ? 'bg-violet-900/30 border-violet-800 text-white focus:ring-violet-500 placeholder:text-slate-500' : 'bg-violet-50 border-violet-200 text-slate-800 focus:ring-violet-400 placeholder:text-slate-400'}`} /></div>
                                  <div className="flex flex-col gap-2 mt-2">
                                    <button onClick={guardarPerfil} disabled={isUploading} className={`w-full h-9 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase shadow-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-violet-700 active:scale-95 transition-all'}`}>{isUploading ? '⏳ GUARDANDO...' : 'GUARDAR CAMBIOS'}</button>
                                    <button onClick={() => { setUsuarioLogueado(null); localStorage.removeItem('juntadas_user'); }} className={`w-full h-8 rounded-xl text-[10px] font-black uppercase border transition-colors ${isDark ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'}`}>Cerrar Sesión</button>
                                  </div>
                              </motion.div>
                          )}
                      </AnimatePresence>
                  </div>
              </div>
            </nav>

            <div className="max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
              <div className="w-full lg:flex-1 order-2 lg:order-1 flex flex-col gap-6">
                <div className={`flex gap-2 p-1.5 rounded-2xl mx-auto w-full max-w-sm border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'}`}>
                  <button onClick={() => setVistaPrincipal('PROPUESTAS')} className={`flex-1 h-10 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${vistaPrincipal === 'PROPUESTAS' ? (isDark ? 'bg-slate-800 text-violet-400 border-slate-700 border shadow-sm' : 'bg-violet-50 text-violet-600 shadow-sm border border-violet-100') : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}>🗓️ Propuestas</button>
                  <button onClick={() => setVistaPrincipal('POSTEOS')} className={`flex-1 h-10 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${vistaPrincipal === 'POSTEOS' ? (isDark ? 'bg-slate-800 text-pink-400 border-slate-700 border shadow-sm' : 'bg-pink-50 text-pink-600 shadow-sm border border-pink-100') : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}>📸 Publicaciones</button>
                </div>

                {vistaPrincipal === 'PROPUESTAS' && (
                  <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between items-end mb-4 px-1"><h2 className={`text-2xl font-black tracking-tighter uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>PROPUESTAS</h2><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { resetForm(); setMostrandoFormulario(true); }} className={`bg-violet-600 text-white font-black shadow-md shadow-violet-200 hover:bg-violet-700 transition-all uppercase tracking-widest flex items-center justify-center text-[10px] px-4 h-8 ${RADIO_GENERAL} ${isDark ? 'shadow-none' : ''}`}>+ PROPONER</motion.button></div>
                    
                    {juntadasOrdenadas.length === 0 ? (
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`border-2 border-dashed ${RADIO_GENERAL} py-12 flex flex-col items-center justify-center text-center mt-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300/60'}`}><div className="text-3xl mb-3 opacity-30">🗓️</div><p className={`text-[10px] font-bold mb-5 uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Nada por acá...</p><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { resetForm(); setMostrandoFormulario(true); }} className={`bg-violet-600 text-white font-black shadow-md shadow-violet-200 hover:bg-violet-700 transition-all uppercase tracking-widest flex items-center justify-center text-xs px-6 h-10 ${RADIO_GENERAL} ${isDark ? 'shadow-none' : ''}`}>+ PROPONER</motion.button></motion.div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                        {juntadasOrdenadas.map((j) => {
                          const [voyYo, dudaYo, pasoYo, cantConfirmados, esCreador, esAdminTomas, esDiscord, esIRL] = [(j.confirmados ?? []).includes(usuarioLogueado), (j.dudosos ?? []).includes(usuarioLogueado), (j.rechazados ?? []).includes(usuarioLogueado), j.confirmados?.length ?? 0, usuarioLogueado === j.creador, usuarioLogueado === 'Tomas', j.tipo === 'DISCORD', j.tipo === 'IRL' || !j.tipo];
                          const puedeEliminarOEditar = esCreador || esAdminTomas, iconoSede = j.esSedePersonalizada ? '📍' : '🏠', estadoT = calcularEstadoTiempo(j.timestamp);
                          const totalVotosSede = j.candidatos?.reduce((a: number, c: any) => a + (c.votantes?.length ?? 0), 0) ?? 0, votosRestantes = Math.max(0, AMIGOS_FALLBACK.length - (j.rechazados?.length ?? 0) - totalVotosSede);
                          let sedeConfirmada = (j.esSedeFija || j.esSedePersonalizada) ? j.sedeFinal : null, esIrremontable = false;
                          
                          if (!j.esSedeFija && !j.esSedePersonalizada && j.candidatos?.length) {
                            const o = [...j.candidatos].sort((a, b) => (b.votantes?.length ?? 0) - (a.votantes?.length ?? 0));
                            if ((o[0]?.votantes?.length ?? 0) > ((o[1]?.votantes?.length ?? 0) + votosRestantes)) { sedeConfirmada = o[0].nombre; esIrremontable = true; }
                          }

                          return (
                            <motion.div key={j.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`relative ${ESTETICA_TARJETA(isDark).contenedor} ${estadoT.texto.includes('EXPIRADO') ? (isDark ? 'opacity-50' : 'opacity-60 grayscale-[30%]') : ''} ${j.pineado && !estadoT.texto.includes('EXPIRADO') ? (isDark ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-slate-950 border-transparent' : 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-100 border-transparent') : ''}`}>
                              <div className="absolute top-4 right-4 z-30 flex flex-col gap-1.5 items-center justify-center">
                                {puedeEliminarOEditar && <><motion.button whileHover={{ scale: 1.1 }} onClick={() => eliminarRegistro(j.id)} className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors font-bold cursor-pointer text-xs ${j.imagenUrl ? 'text-white/70 hover:bg-white/20 bg-black/20 hover:text-red-400' : (isDark ? 'text-slate-400 bg-slate-800 hover:bg-red-900/30 hover:text-red-400' : 'text-slate-400 hover:bg-red-50 bg-slate-100 hover:text-red-500')}`} title="Eliminar juntada">✕</motion.button><motion.button whileHover={{ scale: 1.1 }} onClick={() => abrirEdicion(j)} className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors cursor-pointer ${j.imagenUrl ? 'text-white/70 hover:text-white hover:bg-white/20 bg-black/20' : (isDark ? 'text-slate-400 bg-slate-800 hover:bg-violet-900/30 hover:text-violet-400' : 'text-slate-400 hover:text-violet-600 hover:bg-violet-50 bg-slate-100')}`} title="Editar juntada"><svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></motion.button></>}
                                {(esAdminTomas || j.pineado) && <motion.button whileHover={esAdminTomas ? { scale: 1.1 } : {}} onClick={() => esAdminTomas ? supabase.from('juntadas').update({ pineado: !j.pineado }).eq('id', j.id).then(()=>setJuntadas(p=>p.map(x=>x.id===j.id?{...x,pineado:!j.pineado}:x))) : null} className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors text-xs ${esAdminTomas ? 'cursor-pointer' : 'cursor-default'} ${j.pineado ? (j.imagenUrl ? 'text-yellow-400 bg-black/40' : (isDark ? 'text-yellow-500 bg-yellow-900/30' : 'text-yellow-600 bg-yellow-100')) : (j.imagenUrl ? 'text-white/70 hover:text-white hover:bg-white/20 bg-black/20' : (isDark ? 'text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-yellow-500' : 'text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 bg-slate-100'))}`} title={j.pineado ? "Evento destacado" : "Destacar evento"}><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" /></svg></motion.button>}
                              </div>

                              <div className="absolute top-4 left-4 z-20 flex flex-row gap-1.5 items-center">
                                <span className={`${j.imagenUrl ? 'bg-black/40 backdrop-blur-md text-white border-white/10' : (esDiscord ? (isDark ? 'bg-[#5865F2]/20 text-[#5865F2] border-[#5865F2]/30' : 'bg-[#5865F2]/10 text-[#5865F2] border-[#5865F2]/20') : (isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50' : 'bg-emerald-50 text-emerald-600 border-emerald-200'))} text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest inline-flex items-center justify-center leading-none shadow-sm border gap-1.5`}>{esDiscord ? <><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" fill="currentColor" className="w-3 h-3 text-white drop-shadow-sm"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14h0C127.86,52.43,121.56,29.1,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.3,46,96.19,53,91.08,65.69,84.69,65.69Z"/></svg> DISCORD</> : '📍 IRL'}</span>
                                <span className={`${j.imagenUrl ? 'bg-black/40 backdrop-blur-md text-white border-white/10' : (isDark ? 'bg-violet-900/30 text-violet-300 border-violet-800/50' : 'bg-violet-50 text-violet-600 border-violet-200')} text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest inline-flex items-center justify-center leading-none shadow-sm border gap-1.5`}><img src={getFotoUsuario(j.creador)} className="w-3.5 h-3.5 rounded-full object-cover" alt="creador" />{j.creador}</span>
                              </div>

                              {j.imagenUrl ? (
                                <div className="relative -mx-5 -mt-5 mb-5 p-5 rounded-t-2xl overflow-hidden min-h-[195px] flex flex-col justify-end group">
                                  <div className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 ease-out group-hover:scale-105" style={{ backgroundImage: `url(${j.imagenUrl})` }} />
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent z-10" />
                                  <div className="absolute bottom-4 left-5 right-16 z-20 flex flex-col gap-2 pt-16">
                                    <h3 className="text-2xl font-black text-white leading-none tracking-tight drop-shadow-lg pr-8">{j.titulo}</h3>
                                    
                                    {/* GRID PARA ALINEAR EMOJIS Y BURBUJAS (CON IMAGEN) */}
                                    <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-2 items-center">
                                      <span className="text-sm text-center w-4 drop-shadow-md">📅</span>
                                      <div className="flex items-center flex-wrap gap-2 text-slate-100 drop-shadow-md">
                                        <p className="text-[11px] font-bold">{j.fechaDisplay} — <span className="text-white">{j.horaDisplay}</span></p>
                                        <span className={`${estadoT.color} bg-opacity-90 text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest inline-flex items-center justify-center leading-none shadow-sm`}>{estadoT.texto}</span>
                                      </div>
                                      
                                      {esIRL && (
                                        <>
                                          <span className="text-sm text-center w-4 drop-shadow-md">{iconoSede}</span>
                                          <div className="flex items-center drop-shadow-md">
                                            {(j.esSedeFija || j.esSedePersonalizada || esIrremontable) ? (
                                              <span className="bg-white text-slate-900 text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest inline-flex items-center justify-center leading-none shadow-sm">
                                                {(j.esSedeFija || j.esSedePersonalizada) ? j.sedeFinal : `${sedeConfirmada} VOTADA COMO SEDE`}
                                              </span>
                                            ) : (
                                              <span className="bg-yellow-400 text-yellow-950 text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest inline-flex items-center justify-center leading-none shadow-sm">
                                                SEDE EN VOTACIÓN
                                              </span>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => compartirWhatsApp(j)} className="absolute bottom-4 right-4 z-30 w-8 h-8 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg shadow-black/20 hover:bg-[#1fb855] transition-colors" title="Avisar por WhatsApp">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.88-.653-1.473-1.46-1.646-1.757-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                  </motion.button>
                                </div>
                              ) : (
                                <>
                                  <div className="mb-2.5 mt-14 pr-12 relative flex items-center justify-between">
                                    <h3 className={`text-2xl font-black leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{j.titulo}</h3>
                                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => compartirWhatsApp(j)} className="shrink-0 w-8 h-8 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#1fb855] transition-colors" title="Avisar por WhatsApp">
                                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.88-.653-1.473-1.46-1.646-1.757-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                    </motion.button>
                                  </div>
                                  
                                  {/* GRID PARA ALINEAR EMOJIS Y BURBUJAS (SIN IMAGEN) */}
                                  <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-2 items-center mb-4">
                                    <span className="text-xs text-center w-4">📅</span>
                                    <div className={`flex items-center flex-wrap gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                      <p className="text-[11px] font-bold">{j.fechaDisplay} — <span className={isDark ? 'text-white' : 'text-slate-950'}>{j.horaDisplay}</span></p>
                                      <span className={`${estadoT.color} text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest inline-flex items-center justify-center leading-none shadow-sm`}>{estadoT.texto}</span>
                                    </div>
                                    
                                    {esIRL && (
                                      <>
                                        <span className={`text-xs text-center w-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{iconoSede}</span>
                                        <div className="flex items-center">
                                          {(j.esSedeFija || j.esSedePersonalizada || esIrremontable) ? (
                                            <span className="bg-white text-slate-900 border border-slate-200 text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest inline-flex items-center justify-center leading-none shadow-sm">
                                              {(j.esSedeFija || j.esSedePersonalizada) ? j.sedeFinal : `${sedeConfirmada} VOTADA COMO SEDE`}
                                            </span>
                                          ) : (
                                            <span className="bg-yellow-400 text-yellow-950 border border-yellow-400 text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest inline-flex items-center justify-center leading-none shadow-sm">
                                              SEDE EN VOTACIÓN
                                            </span>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </>
                              )}

                              {esIRL && (!j.esSedeFija && !j.esSedePersonalizada && !esIrremontable) && (
                                <div className="space-y-2 mb-4 mt-1">
                                  <div className={`p-2.5 border ${RADIO_GENERAL} ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200/80'}`}>
                                    <p className={`text-[8px] font-black uppercase tracking-widest mb-2 flex justify-between ${isDark ? 'text-slate-500' : 'text-slate-400'}`}><span>🗳️ Votación de sede</span><span className="normal-case tracking-normal">Quedan {votosRestantes} votos</span></p>
                                    <div className="space-y-1.5">
                                      {j.candidatos?.map((c: any) => {
                                        const vCount = c.votantes?.length ?? 0, yoVoteAca = (c.votantes ?? []).includes(usuarioLogueado);
                                        return (
                                          <button key={c.nombre} onClick={() => votarSede(j.id, c.nombre)} className={`relative overflow-hidden w-full flex justify-between items-center px-3 py-1.5 ${RADIO_GENERAL} border transition-all group/btn ${yoVoteAca ? (isDark ? 'border-violet-500 ring-1 ring-violet-900 bg-slate-900' : 'border-violet-400 ring-1 ring-violet-200 bg-violet-50/50') : (isDark ? 'border-slate-700 hover:border-violet-600 bg-slate-900' : 'border-slate-200 hover:border-violet-300 bg-white')}`}>
                                            <motion.div className={`absolute left-0 top-0 bottom-0 ${yoVoteAca ? (isDark ? 'bg-violet-900/30' : 'bg-violet-100') : (isDark ? 'bg-slate-800' : 'bg-slate-100/50')}`} initial={{ width: 0 }} animate={{ width: `${totalVotosSede ? Math.round((vCount / totalVotosSede) * 100) : 0}%` }} transition={{ duration: 0.3, ease: "easeOut" }} />
                                            <div className="relative z-10 flex justify-between items-center w-full"><span className={`text-[10px] font-bold ${yoVoteAca ? (isDark ? 'text-violet-400' : 'text-violet-700') : (isDark ? 'text-slate-300' : 'text-slate-700')}`}>{c.nombre}</span><div className="flex items-center gap-2"><div className="flex -space-x-1.5 mr-1">{c.votantes?.slice(0,3).map((v: string) => <img key={v} src={getFotoUsuario(v)} className={`w-3.5 h-3.5 rounded-full border object-cover ${isDark ? 'border-slate-800' : 'border-white'}`} alt="votante" />)}</div><span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${vCount > 0 ? (isDark ? 'text-violet-300 bg-violet-900/40' : 'text-violet-600 bg-violet-50') : (isDark ? 'text-slate-500 bg-slate-800/50' : 'text-slate-400 bg-slate-50')}`}>{vCount}</span></div></div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {j.notas && <div className={`mb-3 p-2.5 border ${RADIO_GENERAL} ${isDark ? 'bg-violet-900/20 border-violet-800/50' : 'bg-violet-50/50 border-violet-100'}`}><p className={`text-[8px] font-black uppercase tracking-widest mb-0.5 ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>📌 NOTAS:</p><p className={`text-[10px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{j.notas}</p></div>}
                              {j.tags?.length > 0 && <div className="flex flex-wrap gap-1.5 mb-4">{j.tags.map((t: string) => <span key={t} className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest inline-flex items-center justify-center leading-none shadow-sm border gap-1.5 ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200'}`}>{TODOS_LOS_TAGS.find(d => d.label === t)?.emoji} {t}</span>)}</div>}

                              <div className={`p-2.5 ${RADIO_GENERAL} border mb-3 ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50/50 border-slate-200/80'}`}>
                                <div className={`flex justify-between items-end border-b pb-1.5 mb-1.5 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}><p className={`text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Asistencia:</p><div className="flex gap-0.5">{Array.from({ length: AMIGOS_FALLBACK.length }).map((_, i) => <span key={i} className={`text-xs transition-all duration-300 ${i < cantConfirmados ? (isDark ? 'text-violet-500 opacity-100' : 'text-violet-500 opacity-100') : (isDark ? 'text-slate-600 opacity-30 grayscale' : 'text-slate-300 opacity-30 grayscale')}`}>👤</span>)}</div></div>
                                {(!j.confirmados?.length && !j.dudosos?.length && !j.rechazados?.length) && <p className={`text-[9px] italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Nadie respondió todavía</p>}
                                {j.confirmados?.length > 0 && <p className={`text-[9px] font-medium mb-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>✅ <span className={`font-bold ${isDark ? 'text-green-500' : 'text-green-600'}`}>VAN:</span> {j.confirmados.join(', ')}</p>}
                                {j.dudosos?.length > 0 && <p className={`text-[9px] font-medium mb-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>🤔 <span className={`font-bold ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`}>DUDAN:</span> {j.dudosos.join(', ')}</p>}
                                {j.rechazados?.length > 0 && <p className={`text-[9px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>❌ <span className={`font-bold text-red-500`}>PASAN:</span> {j.rechazados.join(', ')}</p>}
                              </div>

                              <div className="grid grid-cols-3 gap-2 mb-2 relative">
                                <button onClick={() => toggleAsistencia(j.id, 'voy')} className={`h-9 text-[9px] font-black uppercase tracking-widest flex items-center justify-center transition-all duration-200 ${RADIO_GENERAL} border ${voyYo ? (isDark ? 'bg-green-500 text-white border-green-500 shadow-none' : 'bg-green-500 text-white border-green-500 shadow-md shadow-green-200') : (isDark ? 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 shadow-sm')}`}>VOY</button>
                                <button onClick={() => toggleAsistencia(j.id, 'nose')} className={`h-9 text-[9px] font-black uppercase tracking-widest flex items-center justify-center transition-all duration-200 ${RADIO_GENERAL} border ${dudaYo ? (isDark ? 'bg-yellow-500 text-white border-yellow-500 shadow-none' : 'bg-yellow-500 text-white border-yellow-500 shadow-md shadow-yellow-200') : (isDark ? 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 shadow-sm')}`}>NO SÉ</button>
                                <button onClick={() => toggleAsistencia(j.id, 'paso')} className={`h-9 text-[9px] font-black uppercase tracking-widest flex items-center justify-center transition-all duration-200 ${RADIO_GENERAL} border ${pasoYo ? (isDark ? 'bg-red-500 text-white border-red-500 shadow-none' : 'bg-red-500 text-white border-red-500 shadow-md shadow-red-200') : (isDark ? 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 shadow-sm')}`}>PASO</button>
                              </div>

                              <div className={`mt-auto pt-3 border-t flex-1 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                <div className="space-y-1 mb-2 max-h-32 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                                  {(j.excusas ?? []).map((c: any, idx: number) => {
                                    const ringColor = (j.confirmados ?? []).includes(c.usuario) ? `ring-2 ring-green-500 ring-offset-1 ${isDark ? 'ring-offset-slate-900' : 'ring-offset-white'}` : (j.dudosos ?? []).includes(c.usuario) ? `ring-2 ring-yellow-400 ring-offset-1 ${isDark ? 'ring-offset-slate-900' : 'ring-offset-white'}` : (j.rechazados ?? []).includes(c.usuario) ? `ring-2 ring-red-500 ring-offset-1 ${isDark ? 'ring-offset-slate-900' : 'ring-offset-white'}` : 'border-transparent';
                                    return (
                                      <div key={idx} className={`flex items-center gap-2 group/comment relative py-1 rounded-lg px-1 transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                                        <img src={getFotoUsuario(c.usuario)} className={`w-5 h-5 rounded-full object-cover shadow-sm shrink-0 ${ringColor}`} alt="avatar" />
                                        <div className={`flex-1 text-[9px] font-medium leading-tight line-clamp-3 break-words ${isDark ? 'text-slate-300' : 'text-slate-600'}`}><span className={`font-black uppercase mr-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{c.usuario}:</span>{c.texto}</div>
                                        {c.usuario === usuarioLogueado && <button onClick={() => borrarComentario(j.id, c.texto)} className={`font-bold text-[9px] transition-colors ml-2 px-1 ${isDark ? 'text-slate-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`} title="Borrar comentario">✕</button>}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="relative w-full mt-2">
                                  <input type="text" maxLength={120} placeholder="Escribí un comentario..." value={comentariosInputs[j.id] || ''} onChange={e => setComentariosInputs(p => ({ ...p, [j.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && agregarComentario(j.id)} className={`w-full h-8 pl-3 pr-8 rounded-lg text-[9px] font-bold outline-none focus:ring-1 transition-all border ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:ring-violet-500 placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-violet-300 placeholder:text-slate-400'}`} />
                                  <button onClick={() => agregarComentario(j.id)} className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-violet-600 hover:bg-violet-700 text-white rounded-md flex items-center justify-center shadow-sm active:scale-95 transition-all"><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {vistaPrincipal === 'POSTEOS' && (
                  <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between items-end mb-4 px-1"><h2 className={`text-2xl font-black tracking-tighter uppercase flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>PUBLICACIONES <span className="text-lg">📸</span></h2><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setMostrandoFormPosteo(true)} className={`bg-violet-600 text-white font-black shadow-md shadow-violet-200 hover:bg-violet-700 transition-all uppercase tracking-widest flex items-center justify-center text-[10px] px-4 h-8 ${RADIO_GENERAL} ${isDark ? 'shadow-none' : ''}`}>+ PUBLICAR</motion.button></div>
                    
                    {posteos.length === 0 ? (
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`border-2 border-dashed ${RADIO_GENERAL} py-12 flex flex-col items-center justify-center text-center mt-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300/60'}`}><div className="text-3xl mb-3 opacity-30">👻</div><p className={`text-[10px] font-bold mb-5 uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Mucho silencio visual...</p><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setMostrandoFormPosteo(true)} className={`bg-violet-600 text-white font-black shadow-md shadow-violet-200 hover:bg-violet-700 transition-all uppercase tracking-widest flex items-center justify-center text-xs px-6 h-10 ${RADIO_GENERAL} ${isDark ? 'shadow-none' : ''}`}>+ PUBLICAR</motion.button></motion.div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                          {posteos.slice(0, limitePosteos).map(p => {
                            const yoLeDiLike = (p.likes ?? []).includes(usuarioLogueado);
                            const yoLeDiDislike = (p.dislikes ?? []).includes(usuarioLogueado);

                            return (
                              <motion.div key={p.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`${ESTETICA_TARJETA(isDark).contenedor} !p-0 overflow-hidden relative`}>
                                <div className="relative w-full aspect-square bg-slate-100 dark:bg-slate-800">
                                  <img src={p.imagenUrl} className="w-full h-full object-cover" alt="post" loading="lazy" /><div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent h-24 pointer-events-none z-10" />
                                  {p.texto && <><div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" /><div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col justify-end"><h2 className="text-white text-xl sm:text-2xl font-black leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{p.texto}</h2></div></>}
                                  <div className="absolute top-4 left-4 z-20"><span className="bg-black/40 backdrop-blur-md text-white border-white/10 text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest inline-flex items-center justify-center leading-none shadow-sm border gap-1.5"><img src={getFotoUsuario(p.anonimo ? 'ANÓNIMO' : p.creador)} className="w-3.5 h-3.5 rounded-full object-cover border border-white/20" alt="creador" />{p.anonimo ? 'ANÓNIMO' : p.creador}</span></div>
                                  {(usuarioLogueado === p.creador || usuarioLogueado === 'Tomas') && <div className="absolute top-4 right-4 z-20"><motion.button whileHover={{ scale: 1.1 }} onClick={() => eliminarRegistro(p.id, true)} className="flex items-center justify-center w-6 h-6 rounded-full transition-colors font-bold cursor-pointer text-xs text-white/70 hover:bg-white/20 bg-black/40 backdrop-blur-md hover:text-red-400" title="Eliminar publicación">✕</motion.button></div>}
                                </div>
                                <div className="p-4 flex flex-col gap-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggleReaccionPost(p.id, 'like')} className="flex items-center gap-1.5 focus:outline-none">
                                        <svg viewBox="0 0 24 24" width="22" height="22" fill={yoLeDiLike ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" className={`transition-colors duration-300 ${yoLeDiLike ? 'text-red-500' : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')}`}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                        {(p.likes?.length > 0) && <span className={`text-xs font-black ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{p.likes.length}</span>}
                                      </motion.button>
                                      <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggleReaccionPost(p.id, 'dislike')} className="flex items-center gap-1.5 focus:outline-none">
                                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors duration-300 ${yoLeDiDislike ? (isDark ? 'text-white' : 'text-slate-900') : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')}`}><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>
                                        {(p.dislikes?.length > 0) && <span className={`text-xs font-black ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{p.dislikes.length}</span>}
                                      </motion.button>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{obtenerTiempoRelativo(p.timestamp)}</span>
                                  </div>
                                  <div className={`pt-3 border-t flex-1 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                    <div className="space-y-1 mb-2 max-h-32 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                                      {(p.comentarios ?? []).map((c: any, idx: number) => (
                                        <div key={idx} className={`flex items-center gap-2 group/postcomment relative py-1 rounded-lg px-1 transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                                          <img src={getFotoUsuario(c.usuario)} className="w-5 h-5 rounded-full object-cover shadow-sm shrink-0 border-transparent" alt="avatar" />
                                          <div className={`flex-1 text-[9px] font-medium leading-tight line-clamp-3 break-words ${isDark ? 'text-slate-300' : 'text-slate-600'}`}><span className={`font-black uppercase mr-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{c.usuario}:</span>{c.texto}</div>
                                          {(c.usuario === usuarioLogueado || c.creador_real === usuarioLogueado) && <button onClick={() => borrarComentario(p.id, idx, true)} className={`font-bold text-[9px] transition-colors ml-2 px-1 ${isDark ? 'text-slate-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`} title="Borrar comentario">✕</button>}
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      <div className="relative w-full">
                                        <input type="text" maxLength={150} placeholder="Escribí un comentario..." value={comentariosPostInputs[p.id] || ''} onChange={e => setComentariosPostInputs(pr => ({ ...pr, [p.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && agregarComentario(p.id, true)} className={`w-full h-8 pl-3 pr-8 rounded-lg text-[9px] font-bold outline-none focus:ring-1 transition-all border ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:ring-violet-500 placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-violet-300 placeholder:text-slate-400'}`} />
                                        <button onClick={() => agregarComentario(p.id, true)} disabled={!comentariosPostInputs[p.id]?.trim()} className={`absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center transition-all ${comentariosPostInputs[p.id]?.trim() ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm active:scale-95' : (isDark ? 'text-slate-600' : 'text-slate-400')}`}><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
                                      </div>
                                      <div className="flex items-center gap-1.5 ml-1"><input type="checkbox" id={`anon-com-${p.id}`} checked={comentarioAnonimoPost[p.id] || false} onChange={e => setComentarioAnonimoPost(pr => ({ ...pr, [p.id]: e.target.checked }))} className="w-3 h-3 text-violet-600 bg-slate-100 border-slate-300 rounded focus:ring-violet-500 cursor-pointer" /><label htmlFor={`anon-com-${p.id}`} className={`text-[8px] font-black uppercase tracking-widest cursor-pointer ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Comentar Anónimo</label></div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                        
                        {posteos.length > limitePosteos && (
                          <div className="pt-4 flex justify-center">
                            <motion.button 
                              whileHover={{ scale: 1.05 }} 
                              whileTap={{ scale: 0.95 }} 
                              onClick={() => setLimitePosteos(prev => prev + (typeof window !== 'undefined' && window.innerWidth < 768 ? 4 : 6))} 
                              className={`h-10 px-6 ${RADIO_GENERAL} text-[10px] font-black uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700 hover:border-violet-500 hover:text-violet-400' : 'bg-white text-slate-500 border-slate-200 hover:border-violet-300 hover:text-violet-600 shadow-sm'}`}
                            >
                              ⬇ MOSTRAR MÁS ({posteos.length - limitePosteos})
                            </motion.button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Contenedor de Discord */}
              <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 order-1 lg:order-2 lg:sticky lg:top-6 mt-0 lg:mt-[134px]">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`p-5 ${RADIO_GENERAL} border transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-200/80 shadow-xl shadow-slate-200/60'}`}>
                  <div 
                    onClick={() => window.open('https://discord.gg/EvmuKpMjGA', '_blank')}
                    className={`flex justify-between items-center mb-4 pb-3 border-b cursor-pointer hover:opacity-80 transition-opacity ${isDark ? 'border-slate-800' : 'border-slate-100'}`}
                    title="Unirse al servidor de Discord"
                  >
                    <div className="flex items-center gap-3">
                      <img src="https://i.imgur.com/NZUspLh.png" className={`w-9 h-9 rounded-xl object-cover border ${isDark ? 'border-slate-700' : 'border-slate-200 shadow-sm'}`} alt="Server Logo" />
                      <div className="flex flex-col"><h3 className={`text-[11px] font-black uppercase tracking-widest leading-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{discordData?.name || 'TEAM SOLOMILLO'}</h3>{discordData && !discordData.errorMensaje && <div className="flex items-center gap-1.5 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]"></span><span className={`text-[8px] font-bold uppercase tracking-widest ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>En línea</span></div>}</div>
                    </div>
                  </div>
                  <div>
                    {discordLoading && !discordData ? (
                      <div className="animate-pulse flex gap-2"><div className={`w-7 h-7 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}></div><div className={`w-7 h-7 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}></div></div>
                    ) : canalesConGente.length > 0 ? (
                      <div className="space-y-4">
                        {canalesConGente.map((c: any) => (
                          <div key={c.id}>
                            <p className={`text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 ${isDark ? 'text-violet-400' : 'text-violet-600'}`}><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>{c.name}</p>
                            <div className="flex flex-wrap gap-2">
                              {c.members.map((m: any) => (
                                <div key={m.id} className={`w-fit inline-flex items-center gap-2 p-1 pr-3 rounded-full border transition-all cursor-default ${isDark ? 'bg-slate-800/50 border-slate-700 hover:border-violet-500/50 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:border-violet-300 hover:bg-white shadow-sm'}`}>
                                  <div className="relative shrink-0"><img src={m.avatar_url} className="w-5 h-5 rounded-full object-cover" alt={m.username} /><span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 ${isDark ? 'border-slate-800' : 'border-slate-50'} ${m.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span></div>
                                  <div className="flex flex-col justify-center">
                                    <div className="flex items-center gap-1"><span className={`text-[9px] font-black leading-none ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{m.username}</span><div className="flex items-center gap-0.5">{(m.deaf || m.self_deaf) && <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><line x1="2" y1="2" x2="22" y2="22" /><path d="M18.5 15.5A4.5 4.5 0 0 1 21 12V9a9 9 0 0 0-14.7-6.8" /><path d="M3 14v-2A9 9 0 0 1 7.2 4.8" /><path d="M21 12v4a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h3" /><path d="M3 12v4a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H3" /></svg>}{((m.mute || m.self_mute) && !(m.deaf || m.self_deaf)) && <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><line x1="2" y1="2" x2="22" y2="22" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>}</div></div>
                                    {m.game && <span className={`text-[6px] font-bold uppercase leading-none mt-0.5 truncate max-w-[70px] ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>{m.game.name}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <div className="py-3 text-center"><p className={`text-[9px] font-black uppercase tracking-widest opacity-40 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>NO HAY NADIE CONECTADO 🫤</p></div>}
                  </div>
                </motion.div>
              </div>
            </div>
          </main>
        )}
      </div>
    );
  }
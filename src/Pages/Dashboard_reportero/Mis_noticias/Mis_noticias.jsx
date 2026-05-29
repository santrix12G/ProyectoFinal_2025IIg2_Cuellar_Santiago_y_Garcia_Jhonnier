import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Mis_noticias.css';
import { supabase } from '../../../supabaseClient.js';

const Mis_noticias = () => {
  // Estados principales
  const [usuario, setUsuario] = useState(null);
  const [noticias, setNoticias] = useState([]);
  const [noticiasFiltradas, setNoticiasFiltradas] = useState([]);

  // Estados de filtros
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  // Estados de vista y selección
  const [vistaActual, setVistaActual] = useState('tabla');
  const [noticiasSeleccionadas, setNoticiasSeleccionadas] = useState(new Set());
  const [mostrarAccionesMasivas, setMostrarAccionesMasivas] = useState(false);

  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const noticiasPorPagina = 12;

  // Estados de UI
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);
  const dropdownRefs = useRef({});


  const [categories, setCategories] = useState([]);


  const navigate = useNavigate();

  // Obtener usuario actual
  useEffect(() => {
    const obtenerUsuario = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: usuarioData, error } = await supabase
            .from('Usuario')
            .select('*')
            .eq('id_user_autenticacion', user.id)
            .single();

          if (error) {
            console.error('Error al obtener usuario:', error);
          } else {
            setUsuario(usuarioData);
          }
        }
      } catch (error) {
        console.error('Error al obtener usuario:', error);
      }
    };

    obtenerUsuario();
  }, []);

  useEffect(() => {
    const obtenerCategorias = async () => {
      const secciones = await fetchCategories();
      setCategories(secciones);
    };

    obtenerCategorias();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("Seccion")
        .select("id_seccion, nombre, descripcion")
        .order("nombre", { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error al obtener categorías:", error.message);
      return [];
    }
  };

  // Obtener noticias del usuario
  useEffect(() => {
    const obtenerNoticias = async () => {
      if (!usuario?.id_usuario) return;

      try {
        const { data: noticiasData, error } = await supabase
          .from('Noticia')
          .select('*')
          .eq('id_usuario_creador', usuario.id_usuario);

        if (error) {
          console.error('Error al obtener noticias:', error);
        } else {
          setNoticias(noticiasData || []);
        }
      } catch (error) {
        console.error('Error al obtener noticias:', error);
      }
    };

    obtenerNoticias();
  }, [usuario]);

  // Aplicar filtros
  useEffect(() => {
    let filtradas = [...noticias];

    // Filtro de búsqueda
    if (terminoBusqueda) {
      const busqueda = terminoBusqueda.toLowerCase();
      filtradas = filtradas.filter(noticia =>
        noticia.titulo?.toLowerCase().includes(busqueda) ||
        noticia.extracto?.toLowerCase().includes(busqueda)
      );
    }

    // Filtro de estado
    if (filtroEstado) {
      filtradas = filtradas.filter(noticia => noticia.estado === filtroEstado);
    }

    // Filtro de categoría
    if (filtroCategoria) {
      filtradas = filtradas.filter(noticia => noticia.categoria === filtroCategoria);
    }

    // Filtro de fecha
    if (filtroFecha) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      filtradas = filtradas.filter(noticia => {
        const fechaNoticia = new Date(noticia.fecha_creacion || noticia.fecha);
        fechaNoticia.setHours(0, 0, 0, 0);

        switch (filtroFecha) {
          case 'today':
            return fechaNoticia.getTime() === hoy.getTime();
          case 'week':
            const semanaAtras = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
            return fechaNoticia >= semanaAtras;
          case 'month':
            const mesAtras = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
            return fechaNoticia >= mesAtras;
          default:
            return true;
        }
      });
    }

    setNoticiasFiltradas(filtradas);
    setPaginaActual(1); // Resetear a primera página al filtrar
    setNoticiasSeleccionadas(new Set()); // Limpiar selección
  }, [noticias, terminoBusqueda, filtroEstado, filtroCategoria, filtroFecha]);

  // Mostrar acciones masivas cuando hay selección
  useEffect(() => {
    setMostrarAccionesMasivas(noticiasSeleccionadas.size > 0);
  }, [noticiasSeleccionadas]);

  // Cerrar menú desplegable al hacer click fuera
  useEffect(() => {
    const manejarClickExterior = (event) => {
      if (menuAbiertoId && !dropdownRefs.current[menuAbiertoId]?.contains(event.target)) {
        setMenuAbiertoId(null);
      }
    };

    document.addEventListener('click', manejarClickExterior);
    return () => document.removeEventListener('click', manejarClickExterior);
  }, [menuAbiertoId]);

  // Funciones de utilidad
  const formatearFecha = (fechaString) => {
    if (!fechaString) return '';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatearVistas = (vistas) => {
    if (!vistas) return '0';
    if (vistas >= 1000) {
      return `${(vistas / 1000).toFixed(1)}k`;
    }
    return vistas.toString();
  };

  const obtenerClaseEstado = (estado) => {
    const estados = {
      borrador: 'badge-estado-borrador',
      terminada: 'badge-estado-revision',
      publicada: 'badge-estado-publicado',
    };
    return estados[estado] || 'badge-estado-borrador';
  };

  const obtenerTextoEstado = (estado) => {
    const estados = {
      borrador: 'Borrador',
      terminada: 'Terminada',
      publicada: 'Publicada',

    };
    return estados[estado] || estado;
  };

  const obtenerTextoCategoria = (id_categoria) => {
    if (!id_categoria) return "N/A";

    const categoriaEncontrada = categories.find(element =>
      element.id_seccion === id_categoria
    );

    // 2. Si se encuentra el objeto, devolvemos su nombre; si no, un fallback
    return categoriaEncontrada ? categoriaEncontrada.nombre : 'Categoría Desconocida';
  };

  // Funciones de manejo de eventos
  const manejarSeleccionarNoticia = (idNoticia) => {
    const nuevasSeleccionadas = new Set(noticiasSeleccionadas);
    if (nuevasSeleccionadas.has(idNoticia)) {
      nuevasSeleccionadas.delete(idNoticia);
    } else {
      nuevasSeleccionadas.add(idNoticia);
    }
    setNoticiasSeleccionadas(nuevasSeleccionadas);
  };

  const manejarSeleccionarTodas = () => {
    if (noticiasSeleccionadas.size === noticiasFiltradas.length) {
      setNoticiasSeleccionadas(new Set());
    } else {
      setNoticiasSeleccionadas(new Set(noticiasFiltradas.map(n => n.id_noticia || n.id)));
    }
  };

  const alternarMenu = (idNoticia) => {
    setMenuAbiertoId(menuAbiertoId === idNoticia ? null : idNoticia);
  };

  const editarNoticia = (id) => {

    navigate(`/dashboard-reportero/reportero-editar-noticia/${id}`);
  };

  const verPreview = (id) => {

    // navigate(`/preview-noticia/${id}`);
  };

  const duplicarNoticia = (id) => {

    // Implementar lógica de duplicación
  };

  const eliminarNoticia = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta noticia?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('Noticia')
        .delete()
        .eq('id_noticia', id);

      if (error) {
        console.error('Error al eliminar noticia:', error);
        alert('Error al eliminar la noticia');
      } else {
        setNoticias(noticias.filter(n => (n.id_noticia || n.id) !== id));
      }
    } catch (error) {
      console.error('Error al eliminar noticia:', error);
    }
  };


  // Paginación
  const indiceInicial = (paginaActual - 1) * noticiasPorPagina;
  const indiceFinal = indiceInicial + noticiasPorPagina;
  const noticiasPagina = noticiasFiltradas.slice(indiceInicial, indiceFinal);
  const totalPaginas = Math.ceil(noticiasFiltradas.length / noticiasPorPagina);

  const cambiarPagina = (pagina) => {
    setPaginaActual(pagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Renderizado de vista de tabla
  const renderizarVistaTabla = () => {
    if (noticiasFiltradas.length === 0) return null;

    return (
      <div className="contenedor-tabla">
        <table className="tabla-noticias">
          <thead>
            <tr>
              <th width="80">Imagen</th>
              <th>Título</th>
              <th width="120">Categoría</th>
              <th width="120">Estado</th>
              <th width="140">Fecha</th>
              <th width="60">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {noticiasPagina.map((noticia) => {
              const id = noticia.id_noticia || noticia.id;
              const estaSeleccionada = noticiasSeleccionadas.has(id);

              return (
                <tr key={id}>
                  <td>
                    <div className="miniatura-noticia">
                      {noticia.image_url ? (
                        <img src={noticia.image_url} alt={noticia.titulo || 'Sin título'} />
                      ) : (
                        '📰'
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="titulo-noticia-tabla">{noticia.titulo || 'Sin título'}</div>
                  </td>
                  <td>
                    <span className="etiqueta-categoria">
                      {noticia.id_categoria ? obtenerTextoCategoria(noticia.id_categoria) : "N/A"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge-estado-filtros ${obtenerClaseEstado(noticia.estado)}`}>
                      {noticia.estado ? noticia.estado : "N/A"}
                    </span>
                  </td>
                  <td>
                    <div className="informacion-fecha">
                      {formatearFecha(noticia.created_at)}
                    </div>
                  </td>

                  <td>
                    <div className="desplegable-acciones" ref={el => dropdownRefs.current[id] = el}>
                      <button
                        className="boton-acciones"
                        onClick={() => alternarMenu(id)}
                        aria-label="Acciones"
                      >
                        ⋮
                      </button>
                      {menuAbiertoId === id && (
                        <div className="menu-desplegable mostrar">
                          <button
                            className="item-desplegable"
                            onClick={() => {
                              editarNoticia(id);
                              setMenuAbiertoId(null);
                            }}
                          >
                            ✏️ Editar
                          </button>

                          <button
                            className="item-desplegable peligro"
                            onClick={() => {
                              eliminarNoticia(id);
                              setMenuAbiertoId(null);
                            }}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Renderizado de vista de tarjetas
  const renderizarVistaTarjetas = () => {
    if (noticiasFiltradas.length === 0) return null;

    return (
      <div className="grid-tarjetas">
        {noticiasPagina.map((noticia) => {
          const id = noticia.id_noticia || noticia.id;
          const estaSeleccionada = noticiasSeleccionadas.has(id);

          return (
            <div key={id} className="tarjeta-noticia">
              <div className="cabecera-tarjeta">
                <input
                  type="checkbox"
                  className="checkbox-tarjeta"
                  checked={estaSeleccionada}
                  onChange={() => manejarSeleccionarNoticia(id)}
                />
                <div className="estado-tarjeta">
                  <span className={`badge-estado-filtros ${obtenerClaseEstado(noticia.estado)}`}>
                    {obtenerTextoEstado(noticia.estado)}
                  </span>
                </div>
                {noticia.image_url ? (
                  <img src={noticia.image_url} alt={noticia.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  '📰'
                )}
              </div>
              <div className="contenido-tarjeta">
                <h3 className="titulo-tarjeta">{noticia.titulo || 'Sin título'}</h3>
                <p className="extracto-tarjeta">{noticia.extracto || ''}</p>
                <div className="meta-tarjeta">
                  <span className="etiqueta-categoria">
                    {obtenerTextoCategoria(noticia.categoria)}
                  </span>
                  <span>{formatearFecha(noticia.fecha_creacion || noticia.fecha)}</span>
                  <span>{formatearVistas(noticia.vistas || 0)} vistas</span>
                </div>
                <div className="botones-tarjeta">
                  <button
                    className="boton-accion-tarjeta principal"
                    onClick={() => editarNoticia(id)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="boton-accion-tarjeta"
                    onClick={() => verPreview(id)}
                  >
                    👁️ Preview
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mis-noticias-contenedor">
      <div className="contenedor-mis-noticias">
        {/* Cabecera de Página */}
        <header className="cabecera-pagina">
          <h1 className="titulo-pagina">Mis Noticias</h1>
          <button
            className="boton-nueva-noticia"
            onClick={() => navigate('/dashboard-reportero/crear-noticia')}
          >
            ➕ <span>Nueva Noticia</span>
          </button>
        </header>

        {/* Sección de Filtros */}
        <section className="seccion-filtros">
          <div className="grid-filtros">
            <div className="grupo-filtro">
              <label className="etiqueta-filtro">Buscar</label>
              <div className="contenedor-busqueda-filtros">
                <span className="icono-busqueda-filtros">🔍</span>
                <input
                  type="text"
                  className="input-busqueda-filtros"
                  placeholder="Buscar por título..."
                  value={terminoBusqueda}
                  onChange={(e) => setTerminoBusqueda(e.target.value)}
                />
              </div>
            </div>

            <div className="grupo-filtro">
              <label className="etiqueta-filtro">Estado</label>
              <select
                className="select-filtro"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="borrador">Edición</option>
                <option value="terminado">Terminado</option>
              </select>
            </div>

            <div className="grupo-filtro">
              <label className="etiqueta-filtro">Categoría</label>
              <select
                className="select-filtro"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="politica">Política</option>
                <option value="deportes">Deportes</option>
                <option value="tecnologia">Tecnología</option>
                <option value="cultura">Cultura</option>
                <option value="economia">Economía</option>
              </select>
            </div>

            <div className="grupo-filtro">
              <label className="etiqueta-filtro">Vista</label>
              <div className="alternador-vista">
                <button
                  className={`boton-vista ${vistaActual === 'tabla' ? 'activo' : ''}`}
                  onClick={() => setVistaActual('tabla')}
                >
                  📋
                </button>
                <button
                  className={`boton-vista ${vistaActual === 'tarjetas' ? 'activo' : ''}`}
                  onClick={() => setVistaActual('tarjetas')}
                >
                  🗂️
                </button>
              </div>
            </div>
          </div>
        </section>



        {/* Estado Vacío */}
        {noticiasFiltradas.length === 0 && (
          <div className="estado-vacio">
            <div className="icono-vacio">📰</div>
            <h2 className="titulo-vacio">
              {noticias.length === 0
                ? 'No tienes noticias aún'
                : 'No se encontraron noticias'}
            </h2>
            <p className="subtitulo-vacio">
              {noticias.length === 0
                ? 'Comienza creando tu primera noticia y comparte tus historias con el mundo'
                : 'Intenta ajustar los filtros para encontrar lo que buscas'}
            </p>
            {noticias.length === 0 && (
              <button
                className="boton-accion-vacio"
                onClick={() => navigate('/crear-noticia')}
              >
                ➕ Crear Primera Noticia
              </button>
            )}
          </div>
        )}

        {/* Vistas */}
        {vistaActual === 'tabla' && renderizarVistaTabla()}
        {vistaActual === 'tarjetas' && renderizarVistaTarjetas()}


      </div>
    </div>
  );
};

export default Mis_noticias;



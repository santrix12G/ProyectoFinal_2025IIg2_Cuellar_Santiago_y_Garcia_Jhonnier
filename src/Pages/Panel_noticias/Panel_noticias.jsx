import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js';
import './Panel_noticias.css';
import { logo_amazonia } from "../../../config.js"
import { useNavigate } from 'react-router-dom';
const Panel_noticias = () => {
  // Estados para las noticias
  const [noticias, setNoticias] = useState([]);
  const [noticiaPrincipal, setNoticiaPrincipal] = useState(null);
  const [noticiasRecientes, setNoticiasRecientes] = useState([]);
  const [noticiasTendencia, setNoticiasTendencia] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [secciones, setSecciones] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const obtenerSecciones = async () => {
      const { data, error } = await supabase.from('Seccion').select('*').eq("estado", 1);
      if (data) {
        //console.log(data);
        setSecciones(data);
      }
    }
    obtenerSecciones()
  }, [])

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';

    const fechaObj = new Date(fecha);
    const opciones = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return fechaObj.toLocaleDateString('es-ES', opciones);
  };

  // Función para formatear fecha corta (para las tarjetas)
  const formatearFechaCorta = (fecha) => {
    if (!fecha) return '';

    const fechaObj = new Date(fecha);
    const mes = fechaObj.toLocaleDateString('es-ES', { month: 'short' });
    const dia = fechaObj.getDate();
    return `${dia} ${mes}`;
  };

  // Función para calcular tiempo relativo (para tendencias)
  const calcularTiempoRelativo = (fecha) => {
    if (!fecha) return 'Fecha desconocida';

    const ahora = new Date();
    const fechaNoticia = new Date(fecha);
    const diferenciaMs = ahora - fechaNoticia;
    const diferenciaHoras = Math.floor(diferenciaMs / (1000 * 60 * 60));

    if (diferenciaHoras < 1) {
      return 'Hace menos de 1 hora';
    } else if (diferenciaHoras === 1) {
      return 'Hace 1 hora';
    } else {
      return `Hace ${diferenciaHoras} horas`;
    }
  };

  // Obtener todas las noticias publicadas
  useEffect(() => {
    const obtenerNoticias = async () => {
      try {
        setCargando(true);

        // Obtener noticias con estado 'publicada' o 'aprobada' (ajustar según tu esquema)
        const { data: noticiasData, error } = await supabase
          .from('Noticia')
          .select(`
          *,
          Seccion:Seccion (
            nombre
          )
        `)
          .eq('estado', 'publicada')
          .order('created_at', { ascending: false });


        if (error) {
          console.error('Error al obtener noticias:', error);
        } else {
          setNoticias(noticiasData);
        }
      } catch (error) {
        console.error('Error al obtener noticias:', error);
      } finally {
        setCargando(false);
      }
    };

    obtenerNoticias();
  }, []);

  // Separar noticia principal y recientes
  useEffect(() => {
    if (noticias.length > 0) {
      // La primera noticia es la principal (más reciente)
      setNoticiaPrincipal(noticias[0]);

      // Las siguientes 4 son las recientes
      setNoticiasRecientes(noticias.slice(1, 5));

      // Las siguientes 4 son las tendencias
      setNoticiasTendencia(noticias.slice(1, 5));
    }
  }, [noticias]);

  // Filtrar noticias por búsqueda
  const noticiasFiltradas = noticias.filter(noticia => {
    if (!terminoBusqueda) return true;
    const busqueda = terminoBusqueda.toLowerCase();
    return (
      noticia.titulo?.toLowerCase().includes(busqueda) ||
      noticia.extracto?.toLowerCase().includes(busqueda) ||
      noticia.categoria?.toLowerCase().includes(busqueda)
    );
  });

  // Manejar búsqueda
  const manejarBusqueda = () => {
    if (terminoBusqueda.trim()) {
      // Aquí puedes implementar navegación a una página de resultados

    }
  };



  return (
    <div className="panel-noticias">

      {/* buscador */}
      <div className="contenedor-busqueda">
        <input
          type="text"
          className="input-busqueda"
          placeholder="Buscar noticias..."
          value={terminoBusqueda}
          onChange={(e) => setTerminoBusqueda(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && manejarBusqueda()}
        />
        <button className="boton-buscar" onClick={manejarBusqueda}>
          Buscar
        </button>
      </div>
      {/* Contenido Principal */}
      <div className="contenido-principal">
        {/* Noticias Recientes */}
        <section className="noticias-recientes">
          <h2 className="titulo-seccion">Noticias Más Recientes</h2>
          {noticiasFiltradas.length === 0 ? (
            <div className="sin-noticias">
              <p>No se encontraron noticias.</p>
            </div>
          ) : (
            <div className="grid-noticias">
              {noticiasFiltradas.map((noticia, indice) => (
                <article key={noticia.id_noticia} className="tarjeta-noticia" onClick={() => navigate(`/noticia/${noticia.id_noticia}`)}>
                  <div
                    className="imagen-noticia"
                  >
                    {noticia.image_url ? (
                      <img
                        src={noticia.image_url}
                        alt={noticia.titulo}
                        className="imagen-noticia-real"

                      />
                    ) : (
                      <span className="emoji-noticia">
                        {'📰'}
                      </span>
                    )}
                  </div>
                  <div className="contenido-tarjeta">
                    <div className="meta-tarjeta">
                      <span className="categoria-tarjeta">{noticia.Seccion==null?"General":noticia.Seccion.nombre}</span>
                      <span className="fecha-tarjeta">
                        {formatearFechaCorta(noticia.fecha_creacion)}
                      </span>
                    </div>
                    <h3 className="titulo-tarjeta">{noticia.titulo || 'Sin título'}</h3>
                    <p className="extracto-tarjeta">
                      {noticia.extracto || noticia.contenido?.substring(0, 100) || 'Sin descripción'}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Barra Lateral */}
        <aside className="barra-lateral-panel-noticias">
          {/* Widget de Tendencias */}
          <div className="widget">
            <h3 className="titulo-widget">Tendencias</h3>
            {noticiasTendencia.length > 0 ? (
              noticiasTendencia.map((noticia) => (
                <div key={noticia.id_noticia} className="item-tendencia"
                  onClick={()=>{
                    navigate(`/noticia/${noticia.id_noticia}`)
                  }}
                >
                  <div className="contenido-tendencia">
                    <h4 className="titulo-tendencia">{noticia.titulo || 'Sin título'}</h4>
                    <p className="meta-tendencia">
                      {calcularTiempoRelativo(noticia.created_at)} • {noticia.Seccion==null?'General':noticia.Seccion.nombre}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="sin-tendencias">No hay tendencias disponibles</p>
            )}
          </div>

          {/* Espacio Publicitario */}
          <div className="widget">
            <div className="espacio-publicitario">
              <p>Espacio Publicitario</p>
              <p>300 x 250</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Categorías Destacadas */}
      <section className="seccion-categorias">
        <div className="contenedor-categorias">
          <h2 className="titulo-seccion">Categorías Destacadas</h2>
          <div className="grid-categorias">
            {secciones.map((seccion) => {
              return (
                <div
                  key={seccion.nombre}
                  className="tarjeta-categoria"
                  onClick={() => navigate(`/seccion/${seccion.nombre_id}`)}
                >
                  <img
                    className="icono-categoria"
                    // style={{ background: gradiente }}
                    src={seccion.url_image}
                  />
                  <h3 className="titulo-categoria">{seccion.nombre}</h3>
                  <p className="descripcion-categoria">{seccion.descripcion}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Panel_noticias;

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { Place } from '../types';

export function HomePage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.get('/places')
      .then((res) => {
        const dados = res.data.places || res.data || [];
        setPlaces(Array.isArray(dados) ? dados : []);
      })
      .catch((err) => console.error("Erro ao carregar locais:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredPlaces = places.filter((place) =>
    place.establishment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    place.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gelo" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* CABEÇALHO */}
      <header className="header">
        <Link to="/" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>♾️</span>
          <h1 style={{ margin: 0, fontSize: '22px', color: 'white' }}>TruAcess</h1>
        </Link>
        <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/" className="btn btn-ghost" style={{ color: 'white' }}>Início</Link>
          <Link to="/login" className="btn btn-primary">Entrar</Link>
        </nav>
      </header>

      <main style={{ flex: 1 }}>
        {/* ÁREA DE DESTAQUE */}
        <section className="bg-profundo" style={{ color: 'white', padding: '60px 20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '10px', color: 'white' }}>Descubra destinos acessíveis pelo Brasil</h2>
          <p style={{ fontSize: '18px', marginBottom: '30px', color: '#C1E8FF' }}>Turismo com autonomia, segurança e suporte sensorial.</p>
          
          <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Buscar por local ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ marginBottom: 0, border: 'none' }}
            />
            <button className="btn btn-primary" style={{ backgroundColor: '#2AC2D2', color: '#021024' }}>
              Buscar
            </button>
          </div>
        </section>

        {/* LISTA DE LOCAIS */}
        <section className="container">
          <h2 className="text-profundo" style={{ marginBottom: '20px' }}>
            {loading ? 'Carregando destinos...' : `${filteredPlaces.length} Destinos Encontrados`}
          </h2>

          {loading ? (
            <p>Buscando informações no banco de dados...</p>
          ) : (
            <div className="grid grid-3">
              {filteredPlaces.map((place) => (
                <article key={place.id} className="card">
                  <img 
                  src={place.main_image || undefined}          
                  alt={`Foto do local ${place.establishment_name}`} 
                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px 8px 0 0', marginBottom: '15px' }} 
                  />
                  <div style={{ padding: '0 5px' }}>
                    <h3 className="text-profundo">{place.establishment_name}</h3>
                    <p className="text-medio" style={{ fontSize: '14px', marginBottom: '10px' }}> {place.city} - {place.state}</p>
                    
                    {/* Etiqueta de Preço */}
                    <span className={`badge ${(!place.price || place.price === 0) ? 'badge-light' : 'badge-outline'}`} style={{ marginBottom: '15px', display: 'inline-block' }}>
                      {(!place.price || place.price === 0) ? "🆓 Gratuito" : `R$ ${place.price.toFixed(2)}`}
                    </span>

                    {/* Ícones de Acessibilidade */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                      {place.has_access_ramp && <span className="badge badge-outline">♿ Rampa</span>}
                      {place.has_asd_friendly_space && <span className="badge badge-outline">🧠 TEA</span>}
                      {place.has_sign_language_interpreter && <span className="badge badge-outline">🤟 Libras</span>}
                    </div>

                    <Link to={`/local/${place.id}`} className="btn btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                      Ver Detalhes
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* RODAPÉ */}
      <footer className="header" style={{ justifyContent: 'center', marginTop: 'auto' }}>
        <p style={{ margin: 0, color: '#C1E8FF' }}>TruAcess © 2026 - Turismo Acessível e Inclusivo</p>
      </footer>
    </div>
  );
}
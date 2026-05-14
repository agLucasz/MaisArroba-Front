import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, UserPlus, ArrowRight, Phone, Clock, MapPin } from 'lucide-react';

const InstagramIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import '../Styles/contato.css';

const WHATSAPP_NUMBER = '5514998513436';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20os%20produtos%20da%20Mais%20Arroba%20Brasil.`;
const INSTAGRAM_URL = 'https://www.instagram.com/maisarrobabrasil/';

const Contato: React.FC = () => {
  useEffect(() => { document.title = 'Contato — MaisArroba Brasil'; }, []);

  return (
    <div className="contato-page">
      <Header />

      <main className="contato-main">

        {/* Hero texto */}
        <div className="contato-hero">
          <p className="contato-eyebrow">Fale com a gente</p>
          <h1 className="contato-title">
            Vamos falar sobre<br />
            <span className="contato-title-accent">o seu rebanho.</span>
          </h1>
          <p className="contato-desc">
            Crie sua conta ou fale direto conosco pelo WhatsApp. Nossa equipe vai entender
            a necessidade do seu rebanho e indicar a melhor solução para melhorar a saúde
            dos animais, controlar parasitas e aumentar a produtividade.
            <br /><br />
            Atendimento rápido e suporte técnico especializado.
          </p>
        </div>

        {/* Cards de ação */}
        <div className="contato-cards">

          {/* WhatsApp */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="contato-card contato-card--whatsapp"
          >
            <div className="contato-card-icon">
              <MessageCircle size={28} />
            </div>
            <div className="contato-card-body">
              <p className="contato-card-label">Atendimento direto</p>
              <h2 className="contato-card-title">Falar pelo WhatsApp</h2>
              <p className="contato-card-desc">
                Tire dúvidas, solicite orçamentos e receba orientação técnica em tempo real.
              </p>
            </div>
            <span className="contato-card-arrow">
              <ArrowRight size={18} />
            </span>
          </a>

          {/* Instagram */}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="contato-card contato-card--instagram"
          >
            <div className="contato-card-icon">
              <InstagramIcon size={28} />
            </div>
            <div className="contato-card-body">
              <p className="contato-card-label">Redes sociais</p>
              <h2 className="contato-card-title">Seguir no Instagram</h2>
              <p className="contato-card-desc">
                Acompanhe dicas, resultados no campo e novidades dos produtos da Mais Arroba Brasil.
              </p>
            </div>
            <span className="contato-card-arrow">
              <ArrowRight size={18} />
            </span>
          </a>

          {/* Criar conta */}
          <Link to="/cadastro" className="contato-card contato-card--conta">
            <div className="contato-card-icon">
              <UserPlus size={28} />
            </div>
            <div className="contato-card-body">
              <p className="contato-card-label">Comprar online</p>
              <h2 className="contato-card-title">Criar uma conta</h2>
              <p className="contato-card-desc">
                Cadastre-se para acessar o catálogo completo, fazer pedidos e acompanhar suas compras.
              </p>
            </div>
            <span className="contato-card-arrow">
              <ArrowRight size={18} />
            </span>
          </Link>

        </div>

        {/* Info strip */}
        <div className="contato-info-strip">
          <div className="contato-info-item">
            <Phone size={16} />
            <span>(14) 99851-3436</span>
          </div>
      
          <div className="contato-info-sep" />
          <div className="contato-info-item">
            <MapPin size={16} />
            <span>Atendimento em todo o Brasil</span>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default Contato;

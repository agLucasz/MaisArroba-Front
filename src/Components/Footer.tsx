import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import logo from '../Assets/logo.png';
import '../Styles/footer.css';

const Footer: React.FC = () => (
  <footer className="site-footer">
    <div className="site-footer-inner">
      <Link to="/" className="footer-logo">
        <img src={logo} alt="MaisArroba Brasil" className="footer-logo-img" />
      </Link>
      <p className="footer-brand-name">Mais Arroba Brasil</p>
      <p className="footer-brand-desc">
        Suplementação mineral de alta performance para o agronegócio brasileiro.
        Tecnologia, nutrição e resultado em cada arroba.
      </p>
      <p className="footer-copy">
        © {new Date().getFullYear()} Mais Arroba Brasil — Todos os direitos reservados
      </p>
    </div>

    {/* WhatsApp FAB */}
    <a
      href="https://wa.me/5514998513436"
      target="_blank"
      rel="noopener noreferrer"
      className="footer-whatsapp-fab"
      aria-label="Falar no WhatsApp"
    >
      <MessageCircle size={22} />
    </a>
  </footer>
);

export default Footer;

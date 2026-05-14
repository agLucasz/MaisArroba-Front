import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus, ShieldCheck, MessageCircle, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { type ProdutoDTO } from '../Services/produtoService';
import { useCart } from '../Contexts/CartContext';
import Header from './Header';
import Footer from './Footer';
import '../Styles/produtoModal.css';

interface Props {
  produto: ProdutoDTO;
  onClose: () => void;
}

const WHATSAPP_NUMBER = '5514998513436';

const ProdutoModal: React.FC<Props> = ({ produto, onClose }) => {
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty]             = useState(1);
  const { addItem }               = useCart();
  const navigate                  = useNavigate();

  const images    = produto.imagemUrls ?? [];
  const hasImages = images.length > 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Trava o scroll da página de fundo
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const prev = () => setActiveImg(i => (i - 1 + images.length) % images.length);
  const next = () => setActiveImg(i => (i + 1) % images.length);

  const handleAddToCart = () => {
    addItem(produto, qty);
    onClose();
    navigate('/carrinho');
  };

  const buildWhatsApp = () => {
    const text = `Olá! Tenho interesse no produto: ${produto.nomeProduto}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  };

  // Sempre 4 slots de thumbnail (com placeholders se necessário)
  const THUMB_COUNT = 4;
  const thumbSlots  = Array.from({ length: THUMB_COUNT }, (_, i) => i);

  return (
    <div className="pm-page">
      <Header />

      {/* Barra de navegação */}
      <div className="pm-topbar">
        <div className="pm-topbar-inner">
          <button className="pm-back-btn" onClick={onClose}>
            <ChevronLeft size={16} />
            Voltar
          </button>
          <div className="pm-topbar-sep" />
          <nav className="pm-topbar-breadcrumb">
            <Link to="/"     onClick={onClose}>Início</Link>
            <span>/</span>
            <Link to="/loja" onClick={onClose}>Catálogo</Link>
            <span>/</span>
            <span className="pm-topbar-breadcrumb-current">{produto.nomeProduto}</span>
          </nav>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="pm-content">

        {/* ── GALERIA ── */}
        <div className="pm-gallery">

          {/* Imagem principal */}
          <div className="pm-main-img">
            {hasImages ? (
              <>
                <img src={images[activeImg]} alt={`${produto.nomeProduto} — foto ${activeImg + 1}`} />
                {images.length > 1 && (
                  <>
                    <button className="pm-nav pm-nav--prev" onClick={prev} aria-label="Anterior">
                      <ChevronLeft size={18} />
                    </button>
                    <button className="pm-nav pm-nav--next" onClick={next} aria-label="Próxima">
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="pm-main-placeholder">
                <span className="pm-placeholder-label">img/p{produto.produtoId}/1</span>
              </div>
            )}
          </div>

          {/* Thumbnails — sempre 4 slots */}
          <div className="pm-thumbs">
            {thumbSlots.map(i => {
              const url    = images[i];
              const active = activeImg === i;
              return url ? (
                <button
                  key={i}
                  className={`pm-thumb${active ? ' pm-thumb--active' : ''}`}
                  onClick={() => setActiveImg(i)}
                  aria-label={`Foto ${i + 1}`}
                >
                  <img src={url} alt={`Miniatura ${i + 1}`} />
                </button>
              ) : (
                <div
                  key={i}
                  className={`pm-thumb-ph${active ? ' pm-thumb--active' : ''}`}
                  onClick={() => hasImages && i < images.length && setActiveImg(i)}
                  role={i < images.length ? 'button' : undefined}
                  aria-label={i < images.length ? `Foto ${i + 1}` : undefined}
                >
                  <span className="pm-thumb-num">{i + 1}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── INFORMAÇÕES ── */}
        <div className="pm-info">

          {/* Tags de categoria */}
          {produto.categorias?.length > 0 && (
            <div className="pm-tags">
              {produto.categorias.map(cat => (
                <span key={cat} className="pm-tag">{cat}</span>
              ))}
            </div>
          )}

          {/* Nome */}
          <h1 className="pm-name">{produto.nomeProduto}</h1>

          {/* Descrição */}
          {produto.descricao && (
            <div
              className="pm-desc"
              dangerouslySetInnerHTML={{ __html: produto.descricao }}
            />
          )}

          {/* Embalagem */}
          {produto.embalagem && (
            <div className="pm-details">
              <div className="pm-detail-item">
                <span className="pm-detail-label">Embalagem</span>
                <span className="pm-detail-value">{produto.embalagem}</span>
              </div>
            </div>
          )}

          <div className="pm-divider" />

          {/* Quantidade */}
          <div className="pm-qty-row">
            <div className="pm-qty-ctrl">
              <button
                className="pm-qty-btn"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                aria-label="Diminuir"
              >
                <Minus size={14} />
              </button>
              <span className="pm-qty-val">{qty}</span>
              <button
                className="pm-qty-btn"
                onClick={() => setQty(q => q + 1)}
                aria-label="Aumentar"
              >
                <Plus size={14} />
              </button>
            </div>
            <span className="pm-qty-unit">
            </span>
          </div>

          {/* CTAs */}
          <div className="pm-ctas">
            <button className="pm-btn-primary" onClick={handleAddToCart}>
              Adicionar no Carrinho
            </button>
            <a
              href={buildWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className="pm-btn-whatsapp"
            >
              <MessageCircle size={17} />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProdutoModal;

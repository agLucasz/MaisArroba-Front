import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus, ShieldCheck, MessageCircle, ShoppingCart, Truck, MapPin, Loader2, QrCode, FileText, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { type ProdutoDTO } from '../Services/produtoService';
import { useCart } from '../Contexts/CartContext';
import { useCalculoFrete } from '../hooks/useCalculoFrete';
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

  const {
    cep, setCep,
    endereco, fretes, freteSelected, setFreteSelected,
    loadingEndereco, loadingFrete,
    erro: freteErro,
  } = useCalculoFrete({ produtoId: produto.freteHabilitado ? produto.produtoId : null });

  const cepMask = cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;

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

          {/* Preços */}
          <div className="pm-price">
            <div className="pm-price-avista">
              <span className="pm-price-avista-value">
                {produto.valorAVista.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <div className="pm-price-badges">
                <span className="pm-price-badge pm-price-badge--pix"><QrCode size={11} />PIX</span>
                <span className="pm-price-badge pm-price-badge--boleto"><FileText size={11} />Boleto</span>
              </div>
            </div>
            <div className="pm-price-card">
              <span className="pm-price-card-value">
                {produto.valorVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <span className="pm-price-card-label">
                <CreditCard size={12} />
                no cartão em até 12×
              </span>
            </div>
          </div>

          <div className="pm-divider" />

          {/* Calcular frete */}
          {produto.freteHabilitado ? (
            <div className="pm-frete">
              <div className="pm-frete-header">
                <Truck size={15} />
                <span>Calcular frete</span>
              </div>

              <div className="pm-frete-input-row">
                <input
                  className="pm-frete-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="00000-000"
                  maxLength={9}
                  value={cepMask}
                  onChange={e => setCep(e.target.value)}
                  aria-label="CEP para cálculo de frete"
                />
                {(loadingEndereco || loadingFrete) && (
                  <Loader2 size={15} className="pm-frete-spinner" />
                )}
              </div>

              {endereco && (
                <div className="pm-frete-endereco">
                  <MapPin size={11} />
                  <span>
                    {[endereco.logradouro, endereco.bairro].filter(Boolean).join(', ')}
                    {endereco.cidade ? ` — ${endereco.cidade}/${endereco.uf}` : ''}
                  </span>
                </div>
              )}

              {freteErro && (
                <p className="pm-frete-error">{freteErro}</p>
              )}

              {fretes.length > 0 && (
                <div className="pm-frete-opcoes">
                  {fretes.map((f, i) => (
                    <label
                      key={i}
                      className={`pm-frete-opcao${freteSelected === f ? ' pm-frete-opcao--active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="pm-frete"
                        checked={freteSelected === f}
                        onChange={() => setFreteSelected(f)}
                      />
                      <div className="pm-frete-opcao-info">
                        <span className="pm-frete-opcao-nome">
                          {f.transportadora} — {f.servico}
                        </span>
                        <span className="pm-frete-opcao-prazo">
                          {f.prazo} dia{f.prazo !== 1 ? 's' : ''} úteis
                        </span>
                      </div>
                      <span className="pm-frete-opcao-valor">
                        {f.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="pm-frete">
              <div className="pm-frete-header">
                <Truck size={15} />
                <span>Frete</span>
              </div>
              <div className="pm-frete-gratis">
                <div className="pm-frete-gratis-icon">
                  <Truck size={18} />
                </div>
                <div className="pm-frete-gratis-info">
                  <span className="pm-frete-gratis-titulo">Frete Grátis</span>
                  <span className="pm-frete-gratis-sub">Entrega sem custo adicional</span>
                </div>
                <span className="pm-frete-gratis-valor">R$ 0,00</span>
              </div>
            </div>
          )}

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

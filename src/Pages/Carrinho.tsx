import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, Trash2, MessageCircle, ChevronLeft } from 'lucide-react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import { useCart } from '../Contexts/CartContext';
import '../Styles/carrinho.css';

const WHATSAPP_NUMBER = '5514998513436';

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const Carrinho: React.FC = () => {
  const navigate = useNavigate();
  const { items, totalItems, removeItem, updateQty } = useCart();

  useEffect(() => {
    document.title = 'Carrinho — MaisArroba';
  }, []);

  const totalValor = items.reduce((sum, i) => sum + i.produto.valorAVista * i.qty, 0);

  const buildWhatsAppMsg = () => {
    const lines = items.map(
      i => `• ${i.produto.nomeProduto} — ${i.qty} ${i.qty === 1 ? 'saco' : 'sacos'}`
    );
    const body = [
      'Olá! Gostaria de solicitar um orçamento para os seguintes produtos:',
      '',
      ...lines,
      '',
      `Total: ${formatBRL(totalValor)}`,
    ].join('\n');
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(body)}`;
  };


  if (items.length === 0) {
    return (
      <div className="cart-page">
        <Header />
        <main className="cart-body">
          <div className="cart-empty">
            <div className="cart-empty-icon">
              <ShoppingCart size={32} />
            </div>
            <h1 className="cart-empty-title">Seu carrinho está vazio</h1>
            <p className="cart-empty-desc">
              Adicione produtos do catálogo para montar seu pedido e solicitar um orçamento.
            </p>
            <Link to="/loja" className="cart-empty-cta">
              <ChevronLeft size={16} />
              Ver produtos
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="cart-page">
      <Header />

      <main className="cart-body">
        <div className="cart-heading">
          <h1>Carrinho</h1>
          <span className="cart-count-badge">{totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
        </div>

        <div className="cart-layout">
          {/* Lista de itens */}
          <div className="cart-items">
            {items.map(({ produto, qty }) => {
              const img = produto.imagemUrls?.[0];
              return (
                <div key={produto.produtoId} className="cart-item">
                  {img
                    ? <img src={img} alt={produto.nomeProduto} className="cart-item-img" />
                    : <div className="cart-item-img-ph" />
                  }

                  <div className="cart-item-info">
                    <span className="cart-item-name">{produto.nomeProduto}</span>
                    <div className="cart-item-meta">
                      {produto.embalagem && (
                        <span className="cart-item-tag">{produto.embalagem}</span>
                      )}
                      {produto.categorias?.map(c => (
                        <span key={c} className="cart-item-tag">{c}</span>
                      ))}
                    </div>
                  </div>

                  <div className="cart-item-controls">
                    <div className="cart-qty-ctrl">
                      <button
                        className="cart-qty-btn"
                        onClick={() => updateQty(produto.produtoId, qty - 1)}
                        aria-label="Diminuir"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="cart-qty-val">{qty}</span>
                      <button
                        className="cart-qty-btn"
                        onClick={() => updateQty(produto.produtoId, qty + 1)}
                        aria-label="Aumentar"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <button
                      className="cart-remove-btn"
                      onClick={() => removeItem(produto.produtoId)}
                      aria-label="Remover produto"
                    >
                      <Trash2 size={13} />
                      Remover
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumo */}
          <aside className="cart-summary">
            <div className="cart-summary-header">
              <p className="cart-summary-title">Resumo do pedido</p>
            </div>

            <div className="cart-summary-body">
              {items.map(({ produto, qty }) => (
                <div key={produto.produtoId} className="cart-summary-row">
                  <span className="cart-summary-label">
                    {produto.nomeProduto}
                    <span style={{ color: 'var(--fg-3)', fontWeight: 400 }}> × {qty}</span>
                  </span>
                  <span className="cart-summary-value">{formatBRL(produto.valorAVista * qty)}</span>
                </div>
              ))}

              <div className="cart-summary-divider" />

              <div className="cart-summary-total-row">
                <span className="cart-summary-total-label">Total</span>
                <span className="cart-summary-total-value">{formatBRL(totalValor)}</span>
              </div>
            </div>

            <div className="cart-summary-footer">
              <button className="cart-btn-checkout" onClick={() => navigate('/checkout')}>
                Finalizar pedido
                <span style={{ fontSize: 16 }}>→</span>
              </button>

              <a
                href={buildWhatsAppMsg()}
                target="_blank"
                rel="noopener noreferrer"
                className="cart-btn-whatsapp"
              >
                <MessageCircle size={16} />
                Enviar pelo WhatsApp
              </a>

              <Link to="/loja" className="cart-btn-continue">
                <ChevronLeft size={14} />
                Continuar comprando
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <Footer />

    </div>
  );
};

export default Carrinho;

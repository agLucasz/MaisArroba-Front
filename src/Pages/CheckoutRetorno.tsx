import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, ChevronLeft, Loader } from 'lucide-react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import { mercadoPagoService, type PaymentStatusResponse } from '../Services/mercadoPagoService';
import '../Styles/checkout.css';

type Resultado = 'sucesso' | 'pendente' | 'erro';

const CONTEUDO: Record<Resultado, { titulo: string; desc: string; icon: React.ReactNode }> = {
  sucesso: {
    titulo: 'Pagamento aprovado!',
    desc: 'Seu pedido foi confirmado. Nossa equipe entrará em contato para combinar a entrega.',
    icon: <CheckCircle size={36} strokeWidth={1.8} />,
  },
  pendente: {
    titulo: 'Pagamento em análise',
    desc: 'Recebemos seu pedido e estamos aguardando a confirmação do pagamento (comum em PIX/boleto). Você será avisado assim que for aprovado.',
    icon: <Clock size={36} strokeWidth={1.8} />,
  },
  erro: {
    titulo: 'Pagamento não concluído',
    desc: 'Não foi possível concluir o pagamento. Você pode tentar novamente a partir do carrinho.',
    icon: <XCircle size={36} strokeWidth={1.8} />,
  },
};

interface Props {
  resultado: Resultado;
}

const CheckoutRetorno: React.FC<Props> = ({ resultado }) => {
  const [searchParams] = useSearchParams();
  const vendaId = searchParams.get('vendaId');

  const [status,  setStatus]  = useState<PaymentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Pagamento — MaisArroba';
  }, []);

  useEffect(() => {
    if (!vendaId) { setLoading(false); return; }

    mercadoPagoService.getStatus(Number(vendaId))
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, [vendaId]);

  const conteudo = CONTEUDO[resultado];

  return (
    <div className="ck-page">
      <Header />

      <div className="ck-result">
        <div className="ck-result-hero">
          <div className="ck-result-check">
            {conteudo.icon}
          </div>
          <h1 className="ck-result-title">{conteudo.titulo}</h1>
          {vendaId && <span className="ck-result-order">Pedido #{vendaId}</span>}
          <p className="ck-result-desc">{conteudo.desc}</p>

          {loading && (
            <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fg-3)' }}>
              <Loader size={14} /> Consultando status do pagamento…
            </p>
          )}

          {!loading && status && (
            <p style={{ fontSize: 13, color: 'var(--fg-3)' }}>
              Status atual: <strong>{status.status}</strong>
            </p>
          )}
        </div>

        <div className="ck-result-actions">
          <Link to="/" className="ck-btn-home">
            <ChevronLeft size={15} /> Início
          </Link>
          <Link to="/loja" className="ck-btn-shop">
            Continuar comprando
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CheckoutRetorno;

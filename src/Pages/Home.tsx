import React, { use, useEffect, useRef, useState } from 'react';
import hebertImg from '../Assets/hebert.png';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, TrendingUp, Leaf, Users, Volume2, VolumeX } from 'lucide-react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import { getCategorias, type CategoriaDTO } from '../Services/categoriaService';
import '../Styles/home.css';
import { getProdutos, type ProdutoDTO } from '../Services/produtoService';
import videoHome from '../Assets/video-home.mp4';


const TICKER_BASE = [
  'Frete para todo o Brasil',
  'Pagamento facilitado',
  'Suporte técnico especializado',
  'Maior desempenho no rebanho',
];

// Repete 6x para garantir cobertura total em qualquer tela
const TICKER_ITEMS = Array.from({ length: 6 }, () => TICKER_BASE).flat();

const Ticker: React.FC = () => (
  <div className="ticker" aria-hidden="true">
    <div className="ticker-track">
      {TICKER_ITEMS.map((item, i) => (
        <React.Fragment key={i}>
          <span className="ticker-item">{item}</span>
          <span className="ticker-sep" />
        </React.Fragment>
      ))}
    </div>
  </div>
);

/* ── Hero ── */

const Hero: React.FC = () => (
  <section className="hero">

    <div className="hero-left">

      <h1 className="hero-title">
        Tecnologia e desempenho<br />
        para seu<br />
        <span className="hero-title-accent">rebanho.</span>
      </h1>

      <p className="hero-desc">
       Soluções em suplementação e controle estratégico de parasitas, desenvolvidas para melhorar o aproveitamento nutricional, auxiliar no ganho de peso e aumentar a produtividade no campo.
       Mais resultado por arroba produzida.
      </p>

      <div className="hero-actions">
        <Link to="/loja" className="hero-btn-primary">
          Ver produtos <ArrowRight size={16} />
        </Link>
        <Link to="/sobre" className="hero-btn-outline">
          Sobre Nós
        </Link>
      </div>

      <div className="hero-divider" />

      <div className="hero-stats">
        <div className="hero-stat">
          <span className="hero-stat-value">Maior Desempenho</span>
          <span className="hero-stat-label">Melhor aproveitamento nutricional e suporte ao ganho de peso do rebanho.</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-value">Entrega para Todo Brasil</span>
          <span className="hero-stat-label">Logística eficiente para atender produtores rurais em todas as regiões.</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-value">Suporte Especializado</span>
          <span className="hero-stat-label">Atendimento próximo ao produtor com orientação técnica e acompanhamento.</span>
        </div>
      </div>
    </div>

    <div className="hero-right">
      <div className="hero-right-hatch" />
      <div className="hero-right-glow" />
      <img src={hebertImg} alt="Hebert" className="hero-right-img" />
      <div className="hero-right-overlay-title">
        <h2 className="hero-right-name">Conheça os produtos<br />que transformam<br />seu rebanho.</h2>
      </div>
    </div>

  </section>
);

  const ProductSection: React.FC = () => {
  const [produtos, setProdutos] = useState<ProdutoDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProdutos()
      .then(setProdutos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="cats-section">
      <div className="cats-header">
        <div>
          <p className="cats-eyebrow">Destaques</p>
          <h2 className="cats-title">Produtos<br />Mais Vendidos.</h2>
        </div>
        <p className="cats-desc">
          Encontre a fórmula certa para o objetivo da fazenda —
          do bezerro à terminação.
        </p>
      </div>

      <div className="cats-grid">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="cat-card">
                <div className="cat-card-image cat-card-skeleton" />
                <div className="cat-card-body">
                  <div style={{ height: 14, borderRadius: 6, background: 'var(--line)', width: '60%' }} />
                  <div style={{ height: 22, borderRadius: 6, background: 'var(--line)', width: '40%' }} />
                </div>
              </div>
            ))
          : produtos.map(prod => {
              const firstImg = prod.imagemUrls?.[0];
              return (
                <Link
                  key={prod.produtoId}
                  to={`/loja?produto=${prod.produtoId}`}
                  className="cat-card"
                >
                  <div className="cat-card-image">
                    {firstImg
                      ? <img src={firstImg} alt={prod.nomeProduto} loading="lazy" />
                      : <span className="pcard-img-label">img/{prod.produtoId}</span>}
                  </div>
                  <div className="cat-card-body">
                    <p className="cat-card-name">{prod.nomeProduto}</p>
                    <span className="cat-card-explore">
                      Explorar <ArrowRight size={11} />
                    </span>
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
};

/* ── Why section ── */

const WHY_FEATURES = [
  {
    icon: <ShieldCheck size={22} strokeWidth={1.5} />,
    title: 'Qualidade Garantida',
    desc:  'Produtos desenvolvidos com alto padrão de qualidade, garantindo segurança, eficiência e resultados consistentes no rebanho.',
  },
  {
    icon: <TrendingUp size={22} strokeWidth={1.5} />,
    title: 'Resultado no Campo',
    desc:  'Auxilia no ganho de peso, controle de parasitas, melhora do desempenho do rebanho e maior aproveitamento nutricional.',
  },
  {
    icon: <Leaf size={22} strokeWidth={1.5} />,
    title: 'Tecnologia no Cocho',
    desc:  'Soluções práticas para manejo no sal mineral, proteinado ou ração, facilitando o dia a dia da fazenda.',
  },
  {
    icon: <Users size={22} strokeWidth={1.5} />,
    title: 'Confiança do Produtor',
    desc:  'A Mais Arroba Brasil trabalha ao lado do pecuarista, oferecendo suporte, acompanhamento e soluções pensadas para a realidade do campo.',
  },
];

const WhySection: React.FC = () => (
  <section className="why-section">
    <div className="why-inner">

      {/* Left */}
      <div className="why-left">
        <p className="why-eyebrow">Por que escolher a Mais Arroba Brasil?</p>
        <h2 className="why-title">Tecnologia e Resultado<br />dentro da fazenda.</h2>
        <p className="why-desc">
          Desenvolvemos soluções voltadas para produtividade, desempenho do rebanho e controle eficiente de parasitas, sempre pensando na realidade do produtor rural.
          Mais eficiência no manejo, mais aproveitamento nutricional e mais resultado no campo.
        </p>
        <Link to="/sobre" className="why-btn">
          Conheça nossa história <ArrowRight size={15} />
        </Link>
      </div>

      {/* Right — 2×2 feature grid */}
      <div className="why-grid">
        {WHY_FEATURES.map((f, i) => (
          <div key={i} className="why-feature">
            <span className="why-feature-icon">{f.icon}</span>
            <p className="why-feature-title">{f.title}</p>
            <p className="why-feature-desc">{f.desc}</p>
          </div>
        ))}
      </div>

    </div>
  </section>
);

/* ── Testimonial section ── */

const TestimonialSection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  const toggleSound = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setMuted(vid.muted);
  };

  return (
    <section className="testi-section">
      <div className="testi-inner">

        {/* Left — quote */}
        <div className="testi-left">
          <p className="testi-eyebrow">Da fazenda</p>
          <blockquote className="testi-quote">
           "Produto excelente, chegou tudo certo aqui, Muito obrigado!"
          </blockquote>
          <div className="testi-author">
            <div>
              <p className="testi-author-name">Feedback de Clientes</p>
            </div>
          </div>
        </div>

        {/* Right — video */}
        <div className="testi-media">
          <video
            ref={videoRef}
            src={videoHome}
            autoPlay
            muted
            loop
            playsInline
            className="testi-video"
          />
          <button
            className="testi-sound-btn"
            onClick={toggleSound}
            aria-label={muted ? 'Ativar som' : 'Silenciar'}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>

      </div>
    </section>
  );
};

/* ── CTA banner ── */

const CtaBanner: React.FC = () => (
  <section className="cta-banner">
    <div className="cta-banner-inner">
      <div className="cta-banner-text">
        <h2 className="cta-banner-title">Pronto para elevar a<br />performance do rebanho?</h2>
        <p className="cta-banner-desc">
          Fale com Hebert e receba uma recomendação técnica
          para o perfil da sua fazenda.
        </p>
      </div>
      <div className="cta-banner-actions">
        <button className="cta-btn-primary">Solicitar orçamento</button>
        <Link to="/loja" className="cta-btn-outline">Ver catálogo</Link>
      </div>
    </div>
  </section>
);

const Home: React.FC = () => (
  <div className="home-page">
    <Header />
    <Hero />
    <Ticker />
    <ProductSection />
    <WhySection />
    <TestimonialSection />
    <CtaBanner />
    <Footer />
  </div>
);

export default Home;

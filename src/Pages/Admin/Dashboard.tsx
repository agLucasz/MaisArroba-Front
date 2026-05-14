import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TrendingUp, TrendingDown, ShoppingCart, Users, Package,
  AlertTriangle, BarChart2, ArrowRight, Banknote, Receipt,
  ChevronRight, UserCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../Components/Admin/AdminLayout';
import { getVendas, StatusVenda, type VendaDTO } from '../../Services/vendaService';
import { getProdutos, type ProdutoDTO } from '../../Services/produtoService';
import { getClientes } from '../../Services/clienteService';
import '../../Styles/Admin/dashboard.css';

/* ── Date helpers ── */

type Period = 'hoje' | '7d' | 'mes' | 'mes_ant' | 'custom';

function startOf(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function endOf(d: Date)   { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999); }

function getRange(p: Period, c: { from: string; to: string }): [Date, Date] {
  const now = new Date();
  if (p === 'hoje')    return [startOf(now), endOf(now)];
  if (p === '7d')      { const f = new Date(now); f.setDate(f.getDate() - 6); return [startOf(f), endOf(now)]; }
  if (p === 'mes')     return [new Date(now.getFullYear(), now.getMonth(), 1), endOf(now)];
  if (p === 'mes_ant') {
    const f = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const t = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return [f, t];
  }
  const f = c.from ? startOf(new Date(c.from + 'T12:00:00')) : startOf(now);
  const t = c.to   ? endOf(new Date(c.to   + 'T12:00:00')) : endOf(now);
  return [f, t];
}

function prevOf(from: Date, to: Date): [Date, Date] {
  const len = to.getTime() - from.getTime() + 1;
  return [new Date(from.getTime() - len), new Date(from.getTime() - 1)];
}

function inRange(v: VendaDTO, from: Date, to: Date) {
  if (!v.dataVenda) return false;
  const d = new Date(v.dataVenda);
  return d >= from && d <= to;
}

/* ── Number helpers ── */

function brl(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(s?: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('pt-BR');
}

/* ── Data computation ── */

interface Kpis { receita: number; pedidos: number; ticket: number; clientes: number; }

function computeKpis(vendas: VendaDTO[]): Kpis {
  const pagas  = vendas.filter(v => v.status === StatusVenda.Pago);
  const ativas = vendas.filter(v => v.status !== StatusVenda.Cancelado);
  const receita = pagas.reduce((s, v) => s + (v.valorVenda ?? 0), 0);
  return {
    receita,
    pedidos:  ativas.length,
    ticket:   pagas.length ? receita / pagas.length : 0,
    clientes: new Set(pagas.filter(v => v.clienteId).map(v => v.clienteId!)).size,
  };
}

function buildTrend(vendas: VendaDTO[], from: Date, to: Date) {
  const diffDays = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
  const days: { label: string; value: number }[] = [];
  const cur = new Date(from);
  for (let i = 0; i < Math.min(diffDays, 32); i++) {
    const ds = startOf(new Date(cur));
    const de = endOf(new Date(cur));
    const val = vendas
      .filter(v => v.status === StatusVenda.Pago && v.dataVenda)
      .filter(v => { const d = new Date(v.dataVenda!); return d >= ds && d <= de; })
      .reduce((s, v) => s + (v.valorVenda ?? 0), 0);
    days.push({ label: cur.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), value: val });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function getTopProdutos(vendas: VendaDTO[], n = 5) {
  const map = new Map<string, { nome: string; qty: number; receita: number }>();
  for (const v of vendas) {
    if (v.status === StatusVenda.Cancelado) continue;
    for (const item of v.itens) {
      const e = map.get(item.nomeProduto) ?? { nome: item.nomeProduto, qty: 0, receita: 0 };
      e.qty     += item.quantidadeItem;
      e.receita += item.valorItem ?? 0;
      map.set(item.nomeProduto, e);
    }
  }
  return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, n);
}

function getTopClientes(vendas: VendaDTO[], n = 5) {
  const map = new Map<string, { nome: string; pedidos: number; total: number }>();
  for (const v of vendas) {
    if (v.status === StatusVenda.Cancelado || !v.nomeCliente) continue;
    const e = map.get(v.nomeCliente) ?? { nome: v.nomeCliente, pedidos: 0, total: 0 };
    e.pedidos += 1;
    e.total   += v.valorVenda ?? 0;
    map.set(v.nomeCliente, e);
  }
  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, n);
}

/* ── Status badge ── */

const BADGE_LABEL: Record<number, string> = {
  [StatusVenda.Aberto]:    'Aberto',
  [StatusVenda.Pendente]:  'Pendente',
  [StatusVenda.Pago]:      'Pago',
  [StatusVenda.Cancelado]: 'Cancelado',
};
const BADGE_CLS: Record<number, string> = {
  [StatusVenda.Aberto]:    'dash-badge--aberto',
  [StatusVenda.Pendente]:  'dash-badge--pendente',
  [StatusVenda.Pago]:      'dash-badge--pago',
  [StatusVenda.Cancelado]: 'dash-badge--cancelado',
};

/* ── Sub-components ── */

const Delta: React.FC<{ curr: number; prev: number }> = ({ curr, prev }) => {
  if (prev === 0 || curr === 0) return <span className="kpi-meta-txt">período anterior</span>;
  const pct = ((curr - prev) / prev) * 100;
  const up = pct >= 0;
  return (
    <span className={`kpi-delta ${up ? 'kpi-delta--up' : 'kpi-delta--down'}`}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {Math.abs(pct).toFixed(1)}% vs período ant.
    </span>
  );
};

const TrendChart: React.FC<{ days: { label: string; value: number }[] }> = ({ days }) => {
  const max = Math.max(...days.map(d => d.value), 1);
  const hasAny = days.some(d => d.value > 0);
  const step = Math.ceil(days.length / 10);

  if (!hasAny) {
    return <p className="dash-trend-empty">Sem receita registrada no período.</p>;
  }

  return (
    <div className="dash-trend">
      <div className="dash-trend-bars">
        {days.map((d, i) => (
          <div key={i} className="dash-trend-col" title={`${d.label}: ${brl(d.value)}`}>
            <div
              className={`dash-trend-bar${d.value === 0 ? ' dash-trend-bar--zero' : ''}`}
              style={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0)}%` }}
            />
            {(days.length <= 10 || i % step === 0) && (
              <span className="dash-trend-label">{d.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const HBar: React.FC<{
  label: string; value: number; max: number;
  sub?: string; fmt: (v: number) => string;
}> = ({ label, value, max, sub, fmt }) => (
  <div className="dash-hbar-row">
    <div className="dash-hbar-info">
      <span className="dash-hbar-name">{label}</span>
      {sub && <span className="dash-hbar-sub">{sub}</span>}
    </div>
    <div className="dash-hbar-track">
      <div className="dash-hbar-fill" style={{ width: `${Math.max((value / max) * 100, 2)}%` }} />
    </div>
    <span className="dash-hbar-value">{fmt(value)}</span>
  </div>
);

const KpiSkeleton: React.FC = () => (
  <>
    {[1,2,3,4].map(i => (
      <div key={i} className="kpi-card">
        <div className="dash-sk" style={{ width: 80, height: 11 }} />
        <div className="dash-sk" style={{ width: 120, height: 28, marginTop: 12 }} />
        <div className="dash-sk" style={{ width: 100, height: 11, marginTop: 10 }} />
      </div>
    ))}
  </>
);

/* ── Shortcut card ── */
const Shortcut: React.FC<{
  icon: React.ReactNode; title: string; desc: string; path: string;
}> = ({ icon, title, desc, path }) => {
  const navigate = useNavigate();
  return (
    <button className="dash-shortcut" onClick={() => navigate(path)}>
      <div className="dash-shortcut-icon">{icon}</div>
      <div className="dash-shortcut-body">
        <p className="dash-shortcut-title">{title}</p>
        <p className="dash-shortcut-desc">{desc}</p>
      </div>
      <ChevronRight size={15} className="dash-shortcut-arrow" />
    </button>
  );
};

/* ── Period labels ── */
const PERIOD_TABS: { key: Period; label: string }[] = [
  { key: 'hoje',    label: 'Hoje' },
  { key: '7d',      label: '7 dias' },
  { key: 'mes',     label: 'Este mês' },
  { key: 'mes_ant', label: 'Mês passado' },
  { key: 'custom',  label: 'Personalizado' },
];

/* ── Dashboard ── */

const Dashboard: React.FC = () => {
  const [vendas,   setVendas]   = useState<VendaDTO[]>([]);
  const [produtos, setProdutos] = useState<ProdutoDTO[]>([]);
  const [totalClientes, setTotalClientes] = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [period,   setPeriod]   = useState<Period>('mes');
  const [custom,   setCustom]   = useState({ from: '', to: '' });

  const fetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [vs, ps, cs] = await Promise.all([getVendas(), getProdutos(), getClientes()]);
      setVendas(vs);
      setProdutos(ps);
      setTotalClientes(cs.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  /* ── Derived data ── */

  const [from, to] = useMemo(() => getRange(period, custom), [period, custom]);
  const [pFrom, pTo] = useMemo(() => prevOf(from, to), [from, to]);

  const filteredVendas = useMemo(() => vendas.filter(v => inRange(v, from, to)), [vendas, from, to]);
  const prevVendas     = useMemo(() => vendas.filter(v => inRange(v, pFrom, pTo)), [vendas, pFrom, pTo]);

  const curr = useMemo(() => computeKpis(filteredVendas), [filteredVendas]);
  const prev = useMemo(() => computeKpis(prevVendas),     [prevVendas]);

  const trendDays    = useMemo(() => buildTrend(filteredVendas, from, to), [filteredVendas, from, to]);
  const topProdutos  = useMemo(() => getTopProdutos(filteredVendas),        [filteredVendas]);
  const topCli       = useMemo(() => getTopClientes(filteredVendas),         [filteredVendas]);

  const recentes     = useMemo(() =>
    [...vendas].sort((a, b) => new Date(b.dataVenda ?? 0).getTime() - new Date(a.dataVenda ?? 0).getTime()).slice(0, 6),
    [vendas]
  );

  const alertas      = useMemo(() =>
    produtos.filter(p => p.ativo && p.quantidade <= 10).sort((a, b) => a.quantidade - b.quantidade).slice(0, 6),
    [produtos]
  );

  const maxProd = Math.max(...topProdutos.map(p => p.qty), 1);
  const maxCli  = Math.max(...topCli.map(c => c.total), 1);

  const periodLabel = period === 'custom'
    ? (custom.from && custom.to ? `${custom.from} a ${custom.to}` : 'Personalizado')
    : PERIOD_TABS.find(t => t.key === period)?.label ?? '';

  return (
    <AdminLayout>

      {/* ── Header + filtro ── */}
      <div className="dash-topbar">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral do negócio</p>
        </div>

        <div className="dash-period-bar">
          <div className="dash-period-tabs">
            {PERIOD_TABS.map(t => (
              <button
                key={t.key}
                className={`dash-period-tab${period === t.key ? ' dash-period-tab--active' : ''}`}
                onClick={() => setPeriod(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="dash-custom-range">
              <input
                type="date"
                value={custom.from}
                onChange={e => setCustom(c => ({ ...c, from: e.target.value }))}
                className="dash-date-input"
              />
              <span className="dash-custom-sep">até</span>
              <input
                type="date"
                value={custom.to}
                onChange={e => setCustom(c => ({ ...c, to: e.target.value }))}
                className="dash-date-input"
              />
            </div>
          )}
        </div>
      </div>

      {error && <div className="auth-error" role="alert" style={{ marginBottom: 20 }}>{error}</div>}

      {/* ── KPIs ── */}
      <div className="dashboard-kpis">
        {loading ? <KpiSkeleton /> : (
          <>
            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-label">Receita do período</span>
                <div className="kpi-icon kpi-icon--green"><Banknote size={15} /></div>
              </div>
              <div className="kpi-value">{brl(curr.receita)}</div>
              <div className="kpi-meta"><Delta curr={curr.receita} prev={prev.receita} /></div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-label">Pedidos</span>
                <div className="kpi-icon kpi-icon--blue"><ShoppingCart size={15} /></div>
              </div>
              <div className="kpi-value">{curr.pedidos}</div>
              <div className="kpi-meta"><Delta curr={curr.pedidos} prev={prev.pedidos} /></div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-label">Ticket médio</span>
                <div className="kpi-icon kpi-icon--gold"><Receipt size={15} /></div>
              </div>
              <div className="kpi-value">{brl(curr.ticket)}</div>
              <div className="kpi-meta"><Delta curr={curr.ticket} prev={prev.ticket} /></div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-label">Clientes compradores</span>
                <div className="kpi-icon kpi-icon--purple"><UserCheck size={15} /></div>
              </div>
              <div className="kpi-value">{curr.clientes}</div>
              <div className="kpi-meta">
                <span className="kpi-meta-txt">{totalClientes} clientes cadastrados</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Trend chart ── */}
      {!loading && trendDays.length > 1 && (
        <div className="section-card" style={{ marginBottom: 16 }}>
          <div className="section-card-header">
            <div>
              <p className="section-card-title">Receita por dia</p>
              <p className="section-card-sub">{periodLabel} · apenas pedidos pagos</p>
            </div>
            <span className="dash-chart-total">{brl(curr.receita)}</span>
          </div>
          <div style={{ padding: '16px 22px 20px' }}>
            <TrendChart days={trendDays} />
          </div>
        </div>
      )}

      {/* ── Grid: recentes + alertas ── */}
      <div className="dashboard-grid">

        {/* Pedidos recentes */}
        <div className="section-card">
          <div className="section-card-header">
            <div>
              <p className="section-card-title">Pedidos recentes</p>
              <p className="section-card-sub">Últimas movimentações</p>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3,4].map(i => <div key={i} className="dash-sk" style={{ height: 38 }} />)}
            </div>
          ) : recentes.length === 0 ? (
            <div className="dashboard-empty">
              <div className="dashboard-empty-icon"><ShoppingCart size={18} /></div>
              <p className="dashboard-empty-title">Sem pedidos</p>
            </div>
          ) : (
            <div className="dash-recents">
              {recentes.map(v => (
                <div key={v.vendaId} className="dash-recent-row">
                  <span className="dash-recent-id">#{v.vendaId}</span>
                  <div className="dash-recent-meta">
                    <span className="dash-recent-client">
                      {v.nomeCliente ?? <em className="dash-recent-anon">Sem cliente</em>}
                    </span>
                    <span className="dash-recent-date">{fmtDate(v.dataVenda)}</span>
                  </div>
                  <span className={`dash-badge ${BADGE_CLS[v.status]}`}>
                    {BADGE_LABEL[v.status]}
                  </span>
                  <span className="dash-recent-valor">{brl(v.valorVenda)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estoque em alerta */}
        <div className="section-card">
          <div className="section-card-header">
            <div>
              <p className="section-card-title">Estoque em alerta</p>
              <p className="section-card-sub">Produtos com 10 unidades ou menos</p>
            </div>
            {alertas.length > 0 && (
              <span className="dash-alert-count">
                <AlertTriangle size={12} /> {alertas.length}
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3,4].map(i => <div key={i} className="dash-sk" style={{ height: 38 }} />)}
            </div>
          ) : alertas.length === 0 ? (
            <div className="dashboard-empty">
              <div className="dashboard-empty-icon"><Package size={18} /></div>
              <p className="dashboard-empty-title">Estoque ok</p>
              <p className="dashboard-empty-desc">Nenhum produto em nível crítico.</p>
            </div>
          ) : (
            <div className="dash-alert-list">
              {alertas.map(p => (
                <div key={p.produtoId} className="dash-alert-row">
                  <div className="dash-alert-info">
                    <span className="dash-alert-name">{p.nomeProduto}</span>
                    {p.embalagem && <span className="dash-alert-emb">{p.embalagem}</span>}
                  </div>
                  <span className={`dash-alert-stock${p.quantidade === 0 ? ' dash-alert-stock--zero' : ' dash-alert-stock--low'}`}>
                    {p.quantidade === 0 ? 'Sem estoque' : `${p.quantidade} un`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Grid: top produtos + top clientes ── */}
      <div className="dashboard-grid">

        {/* Top produtos */}
        <div className="section-card">
          <div className="section-card-header">
            <div>
              <p className="section-card-title">Produtos mais vendidos</p>
              <p className="section-card-sub">{periodLabel} · por quantidade</p>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[1,2,3,4,5].map(i => <div key={i} className="dash-sk" style={{ height: 32 }} />)}
            </div>
          ) : topProdutos.length === 0 ? (
            <div className="dashboard-empty">
              <div className="dashboard-empty-icon"><BarChart2 size={18} /></div>
              <p className="dashboard-empty-title">Sem dados no período</p>
            </div>
          ) : (
            <div className="dash-hbar-list">
              {topProdutos.map(p => (
                <HBar
                  key={p.nome}
                  label={p.nome}
                  value={p.qty}
                  max={maxProd}
                  sub={brl(p.receita)}
                  fmt={v => `${v} un`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Top clientes */}
        <div className="section-card">
          <div className="section-card-header">
            <div>
              <p className="section-card-title">Clientes que mais compraram</p>
              <p className="section-card-sub">{periodLabel} · por valor total</p>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[1,2,3,4,5].map(i => <div key={i} className="dash-sk" style={{ height: 32 }} />)}
            </div>
          ) : topCli.length === 0 ? (
            <div className="dashboard-empty">
              <div className="dashboard-empty-icon"><Users size={18} /></div>
              <p className="dashboard-empty-title">Sem compras com cliente vinculado</p>
              <p className="dashboard-empty-desc">Vincule clientes às vendas para ver este ranking.</p>
            </div>
          ) : (
            <div className="dash-hbar-list">
              {topCli.map(c => (
                <HBar
                  key={c.nome}
                  label={c.nome}
                  value={c.total}
                  max={maxCli}
                  sub={`${c.pedidos} ${c.pedidos === 1 ? 'pedido' : 'pedidos'}`}
                  fmt={brl}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Atalhos rápidos ── */}
      <div className="dash-shortcuts">
        <Shortcut
          icon={<BarChart2 size={18} />}
          title="Relatório de pedidos"
          desc="Exportar PDF com filtros de período e status"
          path="/relatorios"
        />
        <Shortcut
          icon={<Package size={18} />}
          title="Relatório de produtos"
          desc="Estoque, preços e situação dos produtos"
          path="/relatorios"
        />
        <Shortcut
          icon={<Users size={18} />}
          title="Clientes"
          desc="Cadastro e histórico de clientes"
          path="/clientes"
        />
        <Shortcut
          icon={<AlertTriangle size={18} />}
          title="Entradas de estoque"
          desc="Registrar novas entradas e movimentações"
          path="/estoque"
        />
      </div>

    </AdminLayout>
  );
};

export default Dashboard;

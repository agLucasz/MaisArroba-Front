import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Tag } from 'lucide-react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import ProdutoModal from '../Components/ProdutoModal';
import { getProdutos, type ProdutoDTO } from '../Services/produtoService';
import { getCategorias, type CategoriaDTO } from '../Services/categoriaService';
import '../Styles/catalogo.css';

/* ── Helpers ── */

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

type SortKey = 'relevancia' | 'nome_asc' | 'nome_desc' | 'preco_asc' | 'preco_desc';

function sortProdutos(list: ProdutoDTO[], key: SortKey): ProdutoDTO[] {
  const copy = [...list];
  if (key === 'nome_asc')   return copy.sort((a, b) => a.nomeProduto.localeCompare(b.nomeProduto));
  if (key === 'nome_desc')  return copy.sort((a, b) => b.nomeProduto.localeCompare(a.nomeProduto));
  if (key === 'preco_asc')  return copy.sort((a, b) => a.valorAVista - b.valorAVista);
  if (key === 'preco_desc') return copy.sort((a, b) => b.valorAVista - a.valorAVista);
  return copy;
}

/* ── Skeleton card ── */

const SkeletonCard: React.FC = () => (
  <div className="pcard pcard-skeleton">
    <div className="pcard-image" />
    <div className="pcard-body" style={{ gap: 10 }}>
      <div className="pcard-skel-line" style={{ height: 10, width: '40%' }} />
      <div className="pcard-skel-line" style={{ height: 14, width: '80%' }} />
      <div className="pcard-skel-line" style={{ height: 11, width: '65%' }} />
      <div className="pcard-skel-line" style={{ height: 16, width: '35%', marginTop: 6 }} />
    </div>
  </div>
);

/* ── Product card ── */

const ProductCard: React.FC<{ produto: ProdutoDTO; onClick: () => void }> = ({ produto, onClick }) => {
  const firstImg  = produto.imagemUrls?.[0];
  const categoria = produto.categorias?.[0] ?? '';

  return (
    <article className="pcard" onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className="pcard-image">
        {firstImg
          ? <img src={firstImg} alt={produto.nomeProduto} loading="lazy" />
          : <div className="pcard-image-placeholder" />}
        {!firstImg && (
          <span className="pcard-img-label">img/{produto.produtoId}</span>
        )}
      </div>

      <div className="pcard-body">
        {categoria && (
          <p className="pcard-category">{categoria}</p>
        )}
        <div className="pcard-name-row">
          <p className="pcard-name">{produto.nomeProduto}</p>
          {produto.embalagem && (
            <span className="pcard-embalagem">{produto.embalagem}</span>
          )}
        </div>
        {produto.descricao && (
          <p className="pcard-desc">{produto.descricao}</p>
        )}
        <p className="pcard-price">{formatBRL(produto.valorAVista)}</p>
      </div>
    </article>
  );
};

/* ── Page ── */

const Catalogo: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [produtos, setProdutos]     = useState<ProdutoDTO[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [sort, setSort]             = useState<SortKey>('relevancia');
  const [selected, setSelected]     = useState<ProdutoDTO | null>(null);

  const activeCatId = Number(searchParams.get('categoria')) || null;

  useEffect(() => {
    Promise.all([getProdutos(), getCategorias()])
      .then(([prods, cats]) => {
        setProdutos(prods.filter(p => p.ativo));
        setCategorias(cats);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Erro ao carregar catálogo.'))
      .finally(() => setLoading(false));
  }, []);

  /* Count products per category */
  const countMap = useMemo(() => {
    const map: Record<number, number> = {};
    produtos.forEach(p => p.categoriaIds.forEach(id => {
      map[id] = (map[id] ?? 0) + 1;
    }));
    return map;
  }, [produtos]);

  /* Active filter + sort */
  const filtered = useMemo(() => {
    const base = activeCatId
      ? produtos.filter(p => p.categoriaIds.includes(activeCatId))
      : produtos;
    return sortProdutos(base, sort);
  }, [produtos, activeCatId, sort]);

  const setCategory = (id: number | null) => {
    if (id === null) {
      setSearchParams({});
    } else {
      setSearchParams({ categoria: String(id) });
    }
  };

  return (
    <div className="catalog-page">
      <Header />

      {/* Page header */}
      <div className="catalog-top">
        <nav className="catalog-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Início</Link>
          <span className="catalog-breadcrumb-sep">/</span>
          <span className="catalog-breadcrumb-current">Catálogo</span>
        </nav>

        <div className="catalog-title-row">
          <div>
            <h1 className="catalog-title">Catálogo</h1>
            <p className="catalog-subtitle">
              {loading
                ? 'Carregando produtos…'
                : `${produtos.length} ${produtos.length === 1 ? 'produto' : 'produtos'}`}
            </p>
          </div>

          <div className="catalog-sort">
            <span className="catalog-sort-label">Ordenar:</span>
            <select
              className="catalog-sort-select"
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              aria-label="Ordenar produtos"
            >
              <option value="relevancia">Mais relevantes</option>
              <option value="nome_asc">Nome: A → Z</option>
              <option value="nome_desc">Nome: Z → A</option>
              <option value="preco_asc">Menor preço</option>
              <option value="preco_desc">Maior preço</option>
            </select>
          </div>
        </div>
      </div>

      {/* Body: sidebar + grid */}
      <div className="catalog-body">

        {/* Sidebar */}
        <aside className="catalog-sidebar">
          <div className="sidebar-section">
            <p className="sidebar-section-title">Categorias</p>
            <div className="cat-filter-list">

              {/* "All" button */}
              <button
                className={`cat-filter-btn${activeCatId === null ? ' cat-filter-btn--active' : ''}`}
                onClick={() => setCategory(null)}
              >
                <span className="cat-filter-name">Todos os produtos</span>
                <span className="cat-filter-count">{produtos.length}</span>
              </button>

              {/* Per-category buttons */}
              {categorias.map(cat => {
                const count = countMap[cat.categoriaId] ?? 0;
                if (count === 0) return null;
                return (
                  <button
                    key={cat.categoriaId}
                    className={`cat-filter-btn${activeCatId === cat.categoriaId ? ' cat-filter-btn--active' : ''}`}
                    onClick={() => setCategory(cat.categoriaId)}
                  >
                    <span className="cat-filter-name">{cat.nomeCategoria}</span>
                    <span className="cat-filter-count">{count}</span>
                  </button>
                );
              })}

            </div>
          </div>
        </aside>

        {/* Product grid */}
        <section>
          {error && <div className="catalog-error" role="alert">{error}</div>}

          {!loading && !error && (
            <p className="catalog-result-count">
              {filtered.length} {filtered.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
              {activeCatId && categorias.find(c => c.categoriaId === activeCatId)
                ? ` em "${categorias.find(c => c.categoriaId === activeCatId)!.nomeCategoria}"`
                : ''}
            </p>
          )}

          <div className="prod-grid">
            {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

            {!loading && filtered.length === 0 && !error && (
              <div className="catalog-empty">
                <div className="catalog-empty-icon"><Tag size={22} /></div>
                <p className="catalog-empty-title">Nenhum produto encontrado</p>
                <p className="catalog-empty-desc">
                  Tente selecionar outra categoria ou aguarde novos produtos.
                </p>
              </div>
            )}

            {!loading && filtered.map(p => (
              <ProductCard key={p.produtoId} produto={p} onClick={() => setSelected(p)} />
            ))}
          </div>
        </section>

      </div>

      {selected && (
        <ProdutoModal produto={selected} onClose={() => setSelected(null)} />
      )}
      <Footer />
    </div>
  );
};

export default Catalogo;

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  calcularFrete,
  buscarEnderecoPorCep,
  type EnderecoFrete,
  type OpcaoFrete,
} from '../Services/freteService';

interface UseCalculoFreteOptions {
  produtoId: number | null;
  debounceMs?: number;
}

interface UseCalculoFreteResult {
  cep: string;
  setCep: (cep: string) => void;
  endereco: EnderecoFrete | null;
  fretes: OpcaoFrete[];
  freteSelected: OpcaoFrete | null;
  setFreteSelected: (frete: OpcaoFrete | null) => void;
  loadingEndereco: boolean;
  loadingFrete: boolean;
  erro: string | null;
}

const CEP_REGEX = /^\d{8}$/;

export function useCalculoFrete({
  produtoId,
  debounceMs = 600,
}: UseCalculoFreteOptions): UseCalculoFreteResult {
  const [cep, setCepRaw] = useState('');
  const [endereco, setEndereco] = useState<EnderecoFrete | null>(null);
  const [fretes, setFretes] = useState<OpcaoFrete[]>([]);
  const [freteSelected, setFreteSelected] = useState<OpcaoFrete | null>(null);
  const [loadingEndereco, setLoadingEndereco] = useState(false);
  const [loadingFrete, setLoadingFrete] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setCep = useCallback((valor: string) => {
    // Aceita apenas dígitos, máximo 8 caracteres
    const limpo = valor.replace(/\D/g, '').slice(0, 8);
    setCepRaw(limpo);
  }, []);

  useEffect(() => {
    // Limpa timer anterior
    if (timerRef.current) clearTimeout(timerRef.current);

    const cepLimpo = cep.replace(/\D/g, '');

    if (!CEP_REGEX.test(cepLimpo)) {
      // CEP incompleto: limpa resultados sem mostrar erro
      setEndereco(null);
      setFretes([]);
      setFreteSelected(null);
      setErro(null);
      return;
    }

    timerRef.current = setTimeout(async () => {
      // Cancela requisição anterior
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      setErro(null);

      // ── Buscar endereço ────────────────────────────────────────────────────
      setLoadingEndereco(true);
      try {
        const end = await buscarEnderecoPorCep(cepLimpo, signal);
        setEndereco(end);
      } catch (e: unknown) {
        if ((e as Error).name === 'AbortError') return;
        setErro((e as Error).message ?? 'CEP não encontrado.');
        setEndereco(null);
        setFretes([]);
        setLoadingEndereco(false);
        return;
      } finally {
        setLoadingEndereco(false);
      }

      // ── Calcular frete (somente se houver produtoId) ───────────────────────
      if (!produtoId) return;

      setLoadingFrete(true);
      try {
        const resultado = await calcularFrete(cepLimpo, produtoId, signal);
        setFretes(resultado.fretes);
        setFreteSelected(resultado.fretes[0] ?? null);
      } catch (e: unknown) {
        if ((e as Error).name === 'AbortError') return;
        setErro((e as Error).message ?? 'Erro ao calcular frete.');
        setFretes([]);
        setFreteSelected(null);
      } finally {
        setLoadingFrete(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cep, produtoId, debounceMs]);

  // Limpa ao desmontar
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    cep,
    setCep,
    endereco,
    fretes,
    freteSelected,
    setFreteSelected,
    loadingEndereco,
    loadingFrete,
    erro,
  };
}

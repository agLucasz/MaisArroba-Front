import React from 'react';
import { Loader, Truck, MapPin, AlertCircle } from 'lucide-react';
import { useCalculoFrete } from '../hooks/useCalculoFrete';
import type { OpcaoFrete } from '../Services/freteService';

interface FreteSelectorProps {
  produtoId: number | null;
  onFreteChange?: (frete: OpcaoFrete | null) => void;
  onEnderecoChange?: (cep: string, cidade: string, uf: string) => void;
}

export default function FreteSelector({
  produtoId,
  onFreteChange,
  onEnderecoChange,
}: FreteSelectorProps) {
  const {
    cep,
    setCep,
    endereco,
    fretes,
    freteSelected,
    setFreteSelected,
    loadingEndereco,
    loadingFrete,
    erro,
  } = useCalculoFrete({ produtoId });

  function handleCepChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCep(e.target.value);
  }

  function handleFreteSelect(frete: OpcaoFrete) {
    setFreteSelected(frete);
    onFreteChange?.(frete);
  }

  // Notifica o pai quando o endereço mudar
  React.useEffect(() => {
    if (endereco && cep.length === 8) {
      onEnderecoChange?.(cep, endereco.cidade, endereco.uf);
    }
  }, [endereco, cep, onEnderecoChange]);

  // Notifica o pai quando o frete selecionado mudar
  React.useEffect(() => {
    onFreteChange?.(freteSelected);
  }, [freteSelected, onFreteChange]);

  const cepFormatado = cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
  const loading = loadingEndereco || loadingFrete;

  return (
    <div className="frete-selector">
      {/* Input de CEP */}
      <div className="frete-cep-wrapper">
        <label htmlFor="frete-cep" className="frete-label">
          <MapPin size={14} /> CEP de entrega
        </label>
        <div className="frete-cep-input-row">
          <input
            id="frete-cep"
            type="text"
            inputMode="numeric"
            placeholder="00000-000"
            maxLength={9}
            value={cepFormatado}
            onChange={handleCepChange}
            className={`frete-cep-input ${erro ? 'frete-cep-error' : ''}`}
            aria-describedby={erro ? 'frete-erro' : undefined}
          />
          {loading && <Loader size={16} className="frete-spinner spin" />}
        </div>

        {/* Endereço encontrado */}
        {endereco && !loading && (
          <p className="frete-endereco-label">
            {endereco.logradouro && `${endereco.logradouro}, `}
            {endereco.bairro && `${endereco.bairro} — `}
            {endereco.cidade}/{endereco.uf}
          </p>
        )}

        {/* Mensagem de erro */}
        {erro && (
          <p id="frete-erro" className="frete-erro">
            <AlertCircle size={13} /> {erro}
          </p>
        )}
      </div>

      {/* Opções de frete */}
      {fretes.length > 0 && (
        <div className="frete-opcoes">
          <p className="frete-opcoes-titulo">
            <Truck size={14} /> Opções de entrega
          </p>
          {fretes.map((f, i) => (
            <label
              key={`${f.transportadora}-${f.servico}-${i}`}
              className={`frete-opcao ${freteSelected === f ? 'frete-opcao--selected' : ''}`}
            >
              <input
                type="radio"
                name="frete"
                checked={freteSelected === f}
                onChange={() => handleFreteSelect(f)}
                className="frete-opcao-radio"
              />
              <span className="frete-opcao-info">
                <strong>{f.transportadora}</strong>
                <span className="frete-opcao-servico">{f.servico}</span>
                {f.entregaEstimada && (
                  <span className="frete-opcao-prazo">Entrega estimada: {f.entregaEstimada}</span>
                )}
              </span>
              <span className="frete-opcao-valor">
                {f.valor === 0 ? 'Grátis' : `R$ ${f.valor.toFixed(2).replace('.', ',')}`}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Estado: CEP preenchido mas sem fretes disponíveis */}
      {cep.length === 8 && !loading && !erro && fretes.length === 0 && produtoId && endereco && (
        <p className="frete-sem-opcoes">
          Nenhuma opção de frete disponível para este CEP.
        </p>
      )}
    </div>
  );
}

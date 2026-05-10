'use client';

import { useState, useRef } from 'react';
import { ContagemPrazoForm } from './contagem-prazo-form';
import { maskCPF } from '@/lib/validators/cpf';

type Cliente = {
  id: string;
  nome_completo: string;
  cpf: string;
  data_nascimento: string | null;
  genero: string | null;
};

type ClienteInicial = {
  nome: string;
  cpf: string;
  dataNascimento: string;
  sexo: 'M' | 'F';
};

function mapGenero(genero: string | null): 'M' | 'F' {
  if (!genero) return 'M';
  const g = genero.toUpperCase();
  if (g === 'F' || g.startsWith('FEM')) return 'F';
  return 'M';
}

export function PlanejamentoWrapper({ clientes }: { clientes: Cliente[] }) {
  const [busca, setBusca] = useState('');
  const [aberta, setAberta] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteInicial | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtrados = busca.trim().length >= 2
    ? clientes.filter((c) =>
        c.nome_completo.toLowerCase().includes(busca.toLowerCase()) ||
        c.cpf.includes(busca.replace(/\D/g, ''))
      ).slice(0, 10)
    : [];

  function selecionar(c: Cliente) {
    setClienteSelecionado({
      nome: c.nome_completo,
      cpf: maskCPF(c.cpf),
      dataNascimento: c.data_nascimento ?? '',
      sexo: mapGenero(c.genero),
    });
    setBusca(c.nome_completo);
    setAberta(false);
  }

  function limpar() {
    setClienteSelecionado(null);
    setBusca('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div>
      {/* Seletor de cliente */}
      <div className="relative mb-8">
        <p className="text-sm font-medium text-foreground mb-2">Segurado</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setAberta(true);
                setClienteSelecionado(null);
              }}
              onFocus={() => setAberta(true)}
              onBlur={() => setTimeout(() => setAberta(false), 150)}
              placeholder="Buscar cliente por nome ou CPF…"
              className="w-full h-10 rounded-xl border border-input bg-background px-4 text-sm shadow-xs outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50 transition-all"
            />
            {aberta && filtrados.length > 0 && (
              <div className="absolute z-10 left-0 right-0 top-[calc(100%+4px)] bg-popover border border-border rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                {filtrados.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={() => selecionar(c)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-secondary/50 transition-colors text-left"
                  >
                    <span className="font-medium text-foreground truncate">{c.nome_completo}</span>
                    <span className="text-xs text-muted-foreground ml-3 shrink-0">{maskCPF(c.cpf)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {clienteSelecionado && (
            <button
              type="button"
              onClick={limpar}
              className="h-10 px-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors text-xs shrink-0"
            >
              Limpar
            </button>
          )}
        </div>
        {clienteSelecionado && (
          <p className="text-xs text-muted-foreground mt-1.5">
            Dados pré-preenchidos a partir do cadastro. Revise antes de prosseguir.
          </p>
        )}
        {busca.trim().length >= 2 && filtrados.length === 0 && !clienteSelecionado && (
          <p className="text-xs text-muted-foreground mt-1.5">
            Nenhum cliente encontrado. Preencha os dados manualmente no formulário abaixo.
          </p>
        )}
      </div>

      <ContagemPrazoForm
        key={clienteSelecionado?.cpf ?? 'manual'}
        clienteInicial={clienteSelecionado}
      />
    </div>
  );
}

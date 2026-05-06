'use client';

import { useState } from 'react';
import { Check, X, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TagSuggestion } from '@/lib/template-wizard/ai-tagger';

const CAMPOS_CONTEXTUAIS = [
  { value: 'representante_legal', label: 'Representante legal (menores)' },
  { value: 'testemunhas', label: 'Testemunhas (a rogo)' },
  { value: 'conjuge', label: 'Cônjuge (separação)' },
  { value: 'filho_dependente', label: 'Filho dependente (residência)' },
  { value: 'imovel', label: 'Imóvel (residência)' },
  { value: 'empresa_mei', label: 'Empresa MEI (inatividade)' },
];

type ReviewItem = TagSuggestion & { accepted: boolean };

type Props = {
  file: File;
  suggestions: TagSuggestion[];
  textPreview: string;
  nome: string;
  categoria: string;
  codigo: string;
  onBack: () => void;
  onSaved: () => void;
};

export function ReviewStep({ file, suggestions: initial, nome, categoria, codigo, onBack, onSaved }: Props) {
  const [items, setItems] = useState<ReviewItem[]>(
    initial.map((s) => ({ ...s, accepted: true })),
  );
  const [campos, setCampos] = useState<string[]>([]);
  const [newOriginal, setNewOriginal] = useState('');
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggle = (i: number) =>
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, accepted: !item.accepted } : item)));

  const addManual = () => {
    if (!newOriginal.trim() || !newTag.trim()) return;
    setItems((prev) => [...prev, { original: newOriginal.trim(), tag: newTag.trim(), accepted: true }]);
    setNewOriginal('');
    setNewTag('');
  };

  const toggleCampo = (v: string) =>
    setCampos((prev) => (prev.includes(v) ? prev.filter((c) => c !== v) : [...prev, v]));

  const handleSave = async () => {
    const accepted = items.filter((i) => i.accepted);
    setSaving(true);
    setError('');

    const fd = new FormData();
    fd.append('arquivo', file);
    fd.append('mappings', JSON.stringify(accepted.map(({ original, tag }) => ({ original, tag }))));
    fd.append('nome', nome);
    fd.append('categoria', categoria);
    fd.append('codigo', codigo);
    fd.append('campos_contextuais', JSON.stringify(campos));

    const res = await fetch('/api/configuracoes/templates/wizard/save', { method: 'POST', body: fd });
    const json = await res.json();
    setSaving(false);

    if (!res.ok) return setError(json.error ?? 'Erro ao salvar.');
    onSaved();
  };

  const accepted = items.filter((i) => i.accepted).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">2. Revise as sugestões da IA</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {accepted} de {items.length} substituições ativas. Aceite, rejeite ou adicione manualmente.
        </p>
      </div>

      {/* Lista de sugestões */}
      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground px-4 py-8 text-center">
            Nenhuma sugestão encontrada. Adicione manualmente abaixo.
          </p>
        )}
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 px-4 py-3 transition-colors ${
              item.accepted ? 'bg-background' : 'bg-secondary/30 opacity-50'
            }`}
          >
            <button
              onClick={() => toggle(i)}
              className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                item.accepted
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-border text-transparent'
              }`}
            >
              <Check className="w-3 h-3" />
            </button>
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-xs text-muted-foreground line-through truncate">{item.original}</p>
              <p className="text-sm font-mono text-primary truncate">{item.tag}</p>
            </div>
            <button onClick={() => toggle(i)} className="text-muted-foreground hover:text-foreground mt-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Adicionar manualmente */}
      <div className="bg-secondary/20 rounded-xl p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Adicionar substituição manual</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Texto original no documento</Label>
            <Input
              placeholder="ex: SERGIO EDROSO FALASHI"
              value={newOriginal}
              onChange={(e) => setNewOriginal(e.target.value)}
              className="text-sm h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tag a usar</Label>
            <Input
              placeholder="ex: {cliente.nome_completo}"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="text-sm h-8 font-mono"
            />
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={addManual}
          disabled={!newOriginal.trim() || !newTag.trim()}
          className="gap-1.5 h-8"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar
        </Button>
      </div>

      {/* Campos contextuais */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-foreground">Campos contextuais necessários</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Selecione os grupos de dados extras que este template requer.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CAMPOS_CONTEXTUAIS.map((c) => (
            <label key={c.value} className="flex items-center gap-2.5 cursor-pointer group">
              <div
                onClick={() => toggleCampo(c.value)}
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  campos.includes(c.value)
                    ? 'bg-primary border-primary'
                    : 'border-border group-hover:border-primary/50'
                }`}
              >
                {campos.includes(c.value) && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
              </div>
              <span className="text-sm text-foreground">{c.label}</span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando…
            </>
          ) : (
            `Salvar template (${accepted} substituições)`
          )}
        </Button>
        <Button variant="outline" onClick={onBack}>Voltar</Button>
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronDown, FileText, FileLock2 } from 'lucide-react';

export type DocDraft = {
  codigo: string;
  nome: string;
  html: string;
  editavel: boolean;
};

type Props = {
  clientId: string;
  docs: DocDraft[];
};

// ── Toolbar ──────────────────────────────────────────────────────────────────

type ToolbarProps = { editor: ReturnType<typeof useEditor> };

function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

  const btn = (active: boolean) =>
    `p-1.5 rounded text-sm transition-colors ${
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
    }`;

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-border bg-secondary/30">
      {/* Negrito */}
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))} title="Negrito (Ctrl+B)">
        <strong className="text-xs font-bold">N</strong>
      </button>
      {/* Itálico */}
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))} title="Itálico (Ctrl+I)">
        <em className="text-xs">I</em>
      </button>
      {/* Sublinhado */}
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive('underline'))} title="Sublinhado (Ctrl+U)">
        <span className="text-xs underline">S</span>
      </button>

      <div className="w-px h-4 bg-border mx-1" />

      {/* Títulos */}
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn(editor.isActive('heading', { level: 1 }))} title="Título 1">
        <span className="text-xs font-bold">T1</span>
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive('heading', { level: 2 }))} title="Título 2">
        <span className="text-xs font-bold">T2</span>
      </button>

      <div className="w-px h-4 bg-border mx-1" />

      {/* Alinhamento */}
      <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btn(editor.isActive({ textAlign: 'left' }))} title="Alinhar à esquerda">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h12M3 18h15" strokeLinecap="round"/></svg>
      </button>
      <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btn(editor.isActive({ textAlign: 'center' }))} title="Centralizar">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M6 12h12M4.5 18h15" strokeLinecap="round"/></svg>
      </button>
      <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btn(editor.isActive({ textAlign: 'right' }))} title="Alinhar à direita">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M9 12h12M6 18h15" strokeLinecap="round"/></svg>
      </button>
      <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={btn(editor.isActive({ textAlign: 'justify' }))} title="Justificar">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round"/></svg>
      </button>

      <div className="w-px h-4 bg-border mx-1" />

      {/* Desfazer / Refazer */}
      <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={btn(false) + ' disabled:opacity-30'} title="Desfazer (Ctrl+Z)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6M3.5 13A9 9 0 1 0 6 6.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={btn(false) + ' disabled:opacity-30'} title="Refazer (Ctrl+Shift+Z)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6M20.5 13A9 9 0 1 1 18 6.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );
}

// ── Editor individual ─────────────────────────────────────────────────────────

type DocEditorProps = {
  doc: DocDraft;
  onChange: (codigo: string, html: string) => void;
};

function DocEditor({ doc, onChange }: DocEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: doc.html,
    onUpdate: ({ editor }) => onChange(doc.codigo, editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] px-5 py-4 text-foreground leading-relaxed',
      },
    },
  });

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

// ── Accordion item ────────────────────────────────────────────────────────────

type AccordionItemProps = {
  doc: DocDraft;
  open: boolean;
  onToggle: () => void;
  onChange: (codigo: string, html: string) => void;
};

function AccordionItem({ doc, open, onToggle, onChange }: AccordionItemProps) {
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-secondary/30 transition-colors"
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          doc.editavel ? 'bg-primary/10' : 'bg-secondary'
        }`}>
          {doc.editavel
            ? <FileText className="w-4 h-4 text-primary" />
            : <FileLock2 className="w-4 h-4 text-muted-foreground" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{doc.nome}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {doc.editavel ? 'Editável' : 'Gerado automaticamente (PDF INSS)'}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-border px-5 py-4">
          {doc.editavel ? (
            <DocEditor doc={doc} onChange={onChange} />
          ) : (
            <div className="flex items-center gap-3 py-6 text-center justify-center">
              <FileLock2 className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Este documento é um formulário PDF do INSS e será gerado automaticamente sem edição.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function DocumentReviewer({ clientId, docs }: Props) {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState(0);
  const [htmlMap, setHtmlMap] = useState<Record<string, string>>(
    Object.fromEntries(docs.map((d) => [d.codigo, d.html])),
  );
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleChange = useCallback((codigo: string, html: string) => {
    setHtmlMap((prev) => ({ ...prev, [codigo]: html }));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');

    const payload = docs.map((d) => ({
      codigo: d.codigo,
      nome: d.nome,
      html: htmlMap[d.codigo] ?? d.html,
      editavel: d.editavel,
    }));

    const res = await fetch('/api/geracao/finalizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, docs: payload }),
    });

    const json = await res.json();
    setGenerating(false);

    if (!res.ok) {
      setError(json.error ?? 'Erro ao gerar documentos.');
      return;
    }

    router.push(`/clientes/${clientId}/gerar/resultado?packageId=${json.packageId}&modo=direto`);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {docs.map((doc, i) => (
          <AccordionItem
            key={doc.codigo}
            doc={doc}
            open={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            onChange={handleChange}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 px-1">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button onClick={handleGenerate} disabled={generating} className="flex-1 gap-2">
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Gerando PDFs…
            </>
          ) : (
            `Gerar ${docs.length} documento(s)`
          )}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

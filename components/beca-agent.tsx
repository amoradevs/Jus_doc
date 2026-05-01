'use client';

import Image from 'next/image';
import { useState, useRef, useEffect, useCallback } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

const GREETING =
  'Olá, Dra. Lidiane! Sou a consultora jurídica Beca, especializada em BPC/LOAS e Direito Previdenciário. Pode me perguntar sobre requisitos, jurisprudência, prazos ou procedimentos. Como posso ajudar?';

export function BecaAgent() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const initialized = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !initialized.current) {
      initialized.current = true;
      setMessages([{ role: 'assistant', content: GREETING }]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/lidi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      const json = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: json.content }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const copyMessage = useCallback((text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  }, []);

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3 sm:gap-4 pointer-events-none">

      {/* Chat panel */}
      <div
        className={`w-[calc(100vw-32px)] sm:w-[340px] flex flex-col rounded-2xl border border-border bg-card shadow-2xl shadow-black/15 overflow-hidden transition-all duration-200 origin-bottom-right pointer-events-auto ${
          open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ height: 'min(460px, calc(100svh - 140px))' }}
      >
        {/* Header do chat */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#2B1D2A]">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 shrink-0">
            <Image
              src="/Figurinha_Lidi.png"
              alt="Beca"
              fill
              className="object-cover"
              style={{ objectPosition: '50% 8%' }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-none">Beca</p>
            <p className="text-white/50 text-xs mt-0.5">Consultora Jurídica — BPC/LOAS</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-white/40 hover:text-white/80 transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`group flex items-end gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {m.role === 'assistant' && (
                <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 mb-0.5 border border-border">
                  <Image
                    src="/Figurinha_Lidi.png"
                    alt=""
                    fill
                    className="object-cover"
                    style={{ objectPosition: '50% 8%' }}
                  />
                </div>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-secondary text-foreground rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
              {m.role === 'assistant' && (
                <button
                  onClick={() => copyMessage(m.content, i)}
                  title="Copiar texto"
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mb-0.5 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  {copiedIdx === i ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-end gap-2">
              <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 mb-0.5 border border-border">
                <Image
                  src="/Figurinha_Lidi.png"
                  alt=""
                  fill
                  className="object-cover"
                  style={{ objectPosition: '50% 8%' }}
                />
              </div>
              <div className="bg-secondary rounded-2xl rounded-bl-sm px-3.5 py-3">
                <div className="flex gap-1 items-center">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-3 pb-3 pt-2 border-t border-border/60">
          <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Escreva sua dúvida jurídica…"
              className="flex-1 text-xs bg-transparent focus:outline-none placeholder:text-muted-foreground/60 text-foreground"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0 disabled:opacity-30 hover:bg-primary/85 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary-foreground">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* CTA + botão flutuante */}
      <div
        className="flex items-center gap-3 pointer-events-auto"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* CTA pill — só aparece no hover do avatar quando o chat está fechado (desktop only) */}
        <button
          onClick={() => setOpen(true)}
          className={`hidden sm:flex bg-card border border-border rounded-full pl-4 pr-3 py-2.5 shadow-lg items-center gap-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-all duration-200 whitespace-nowrap ${
            hovering && !open
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 translate-x-3 pointer-events-none'
          }`}
        >
          Fale com a Beca
          <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary-foreground">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>

        {/* Avatar */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Abrir assistente Beca"
          className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden border-[3px] shadow-2xl shadow-black/20 transition-all duration-200 hover:scale-110 ${
            open
              ? 'border-primary ring-4 ring-primary/25 scale-[1.06]'
              : 'border-white ring-2 ring-primary/20 hover:ring-primary/40'
          }`}
        >
          <div className="relative w-full h-full">
            <Image
              src="/Figurinha_Lidi.png"
              alt="Beca"
              fill
              className="object-cover"
              style={{ objectPosition: '50% 8%' }}
            />
          </div>
        </button>
      </div>
    </div>
  );
}

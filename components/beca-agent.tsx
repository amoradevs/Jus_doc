'use client';

import Image from 'next/image';
import { useState, useRef, useEffect, useCallback } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

const GREETING = 'Olá, Dra. Lidiane! Sou o Consultor JusDoc, especializado em BPC/LOAS e Direito Previdenciário. Pode me perguntar sobre requisitos, jurisprudência, prazos ou procedimentos. Como posso ajudar?';

export function BecaAgent() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
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
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.' }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  return (
    <>
      {/* Chat panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-80 flex flex-col rounded-2xl border border-border bg-white shadow-2xl shadow-black/10 overflow-hidden transition-all duration-200 origin-bottom-right ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ height: '460px' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#2B1D2A]">
          <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-white/20 shrink-0">
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
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
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-secondary text-foreground rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-end gap-2">
              <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 mb-0.5 border border-border">
                <Image src="/Figurinha_Lidi.png" alt="" fill className="object-cover" style={{ objectPosition: '50% 8%' }} />
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
              className="flex-1 text-xs bg-transparent focus:outline-none placeholder:text-muted-foreground/70 text-foreground"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0 disabled:opacity-30 hover:bg-primary/85 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Abrir assistente Beca"
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full overflow-hidden border-[3px] shadow-xl shadow-black/15 transition-all duration-200 hover:scale-[1.28] ${
          open
            ? 'border-primary ring-2 ring-primary/30 scale-[1.08]'
            : 'border-white ring-2 ring-primary/15 hover:ring-primary/35'
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
    </>
  );
}

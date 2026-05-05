'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mail, Copy, RefreshCw, Inbox, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const DOMAINS = ['1secmail.com', '1secmail.net', '1secmail.org'] as const;
const API = 'https://www.1secmail.com/api/v1/';
const POLL_INTERVAL = 6000;

type EmailHeader = {
  id: number;
  from: string;
  subject: string;
  date: string;
};

type EmailBody = EmailHeader & {
  body: string;
  textBody: string;
  htmlBody: string;
};

function randomLogin() {
  return 'adv' + Math.random().toString(36).slice(2, 9);
}

function randomDomain() {
  return DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
}

function relativeTime(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  return `${Math.floor(diff / 3600)}h atrás`;
}

export function TempEmail() {
  const [login, setLogin] = useState('');
  const [domain, setDomain] = useState('');
  const [inbox, setInbox] = useState<EmailHeader[]>([]);
  const [selected, setSelected] = useState<EmailBody | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const address = login && domain ? `${login}@${domain}` : '';

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    toast.success('E-mail copiado!');
  };

  const fetchInbox = useCallback(async (l: string, d: string) => {
    const res = await fetch(`${API}?action=getMessages&login=${l}&domain=${d}`);
    if (!res.ok) return;
    const data: EmailHeader[] = await res.json();
    setInbox(data);
  }, []);

  const startPolling = useCallback((l: string, d: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setPolling(true);
    pollRef.current = setInterval(() => fetchInbox(l, d), POLL_INTERVAL);
  }, [fetchInbox]);

  const generate = useCallback(async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    const l = randomLogin();
    const d = randomDomain();
    setLogin(l);
    setDomain(d);
    setInbox([]);
    setSelected(null);
    setLoading(true);
    await fetchInbox(l, d);
    setLoading(false);
    startPolling(l, d);
  }, [fetchInbox, startPolling]);

  const openEmail = async (id: number) => {
    if (!login || !domain) return;
    const res = await fetch(`${API}?action=readMessage&login=${login}&domain=${domain}&id=${id}`);
    if (!res.ok) return;
    setSelected(await res.json());
  };

  const discard = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setLogin('');
    setDomain('');
    setInbox([]);
    setSelected(null);
    setPolling(false);
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  return (
    <div className="bg-white dark:bg-card border border-border rounded-xl p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">E-mail Temporário</h2>
          <p className="text-xs text-muted-foreground">Gere um endereço descartável para códigos de verificação</p>
        </div>
      </div>

      {/* Sem endereço gerado */}
      {!address && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
            <Inbox className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Gere um endereço temporário e receba e-mails aqui mesmo, sem usar sua caixa oficial.
          </p>
          <Button onClick={generate} className="gap-2">
            <Mail className="w-4 h-4" />
            Gerar E-mail Temporário
          </Button>
        </div>
      )}

      {/* Com endereço gerado */}
      {address && (
        <div className="flex flex-col gap-4">
          {/* Endereço */}
          <div className="bg-secondary/50 rounded-lg px-4 py-3 flex items-center gap-2">
            <p className="text-sm font-mono font-medium text-foreground flex-1 truncate">{address}</p>
            <button onClick={copyAddress} className="text-muted-foreground hover:text-foreground transition-colors" title="Copiar">
              <Copy className="w-4 h-4" />
            </button>
          </div>

          {/* Ações */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={generate}>
              <RefreshCw className="w-3.5 h-3.5" />
              Novo endereço
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={discard}>
              <X className="w-3.5 h-3.5" />
              Descartar
            </Button>
            <div className="flex-1" />
            {polling && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Aguardando e-mails
              </span>
            )}
          </div>

          {/* Inbox */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/30 border-b border-border flex items-center gap-2">
              <Inbox className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Caixa de entrada
              </span>
              {inbox.length > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 font-medium">
                  {inbox.length}
                </span>
              )}
            </div>

            {loading && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">Carregando…</div>
            )}

            {!loading && inbox.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhum e-mail ainda. Cole o endereço acima no site externo e aguarde.
              </div>
            )}

            {!loading && inbox.map((msg) => (
              <div key={msg.id}>
                <button
                  className="w-full px-4 py-3 text-left hover:bg-secondary/30 transition-colors border-b border-border last:border-0 flex items-start gap-3"
                  onClick={() => { if (selected?.id === msg.id) { setSelected(null); } else { openEmail(msg.id); } }}
                >
                  <Mail className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-foreground truncate">{msg.from}</p>
                      <span className="text-xs text-muted-foreground shrink-0 ml-auto">{relativeTime(msg.date)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.subject || '(sem assunto)'}</p>
                  </div>
                  {selected?.id === msg.id ? (
                    <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                </button>

                {/* Corpo do e-mail expandido */}
                {selected?.id === msg.id && (
                  <div className="px-4 py-4 bg-secondary/20 border-b border-border">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{selected.subject || '(sem assunto)'}</p>
                        <p className="text-xs text-muted-foreground">De: {selected.from}</p>
                      </div>
                      <button
                        onClick={() => {
                          const text = selected.textBody || selected.body || '';
                          navigator.clipboard.writeText(text);
                          toast.success('Conteúdo copiado!');
                        }}
                        className="text-xs text-primary hover:underline shrink-0"
                      >
                        Copiar tudo
                      </button>
                    </div>
                    {selected.htmlBody ? (
                      <iframe
                        srcDoc={selected.htmlBody}
                        className="w-full rounded border border-border bg-white"
                        style={{ minHeight: 120, maxHeight: 320 }}
                        sandbox="allow-same-origin"
                        title="corpo do e-mail"
                      />
                    ) : (
                      <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                        {selected.textBody || selected.body || '(sem conteúdo)'}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

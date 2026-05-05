'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mail, Copy, RefreshCw, Inbox, ChevronDown, ChevronUp, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const MAILTM = 'https://api.mail.tm';
const POLL_INTERVAL = 7000;

type EmailHeader = {
  id: string;
  from: { address: string; name: string };
  subject: string;
  createdAt: string;
  seen: boolean;
};

type EmailBody = EmailHeader & {
  html: string[];
  text: string;
};

async function mailtm(path: string, options?: RequestInit) {
  const res = await fetch(`${MAILTM}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) throw new Error(`mail.tm: ${res.status}`);
  return res.json();
}

function randomStr(len = 8) {
  return Math.random().toString(36).slice(2, 2 + len);
}

function relativeTime(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  return `${Math.floor(diff / 3600)}h atrás`;
}

export function TempEmail() {
  const [address, setAddress] = useState('');
  const [token, setToken] = useState('');
  const [inbox, setInbox] = useState<EmailHeader[]>([]);
  const [selected, setSelected] = useState<EmailBody | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    toast.success('E-mail copiado!');
  };

  const fetchInbox = useCallback(async (jwt: string) => {
    try {
      const data = await mailtm('/messages?page=1', {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      setInbox(Array.isArray(data['hydra:member']) ? data['hydra:member'] : []);
    } catch {
      // falha silenciosa durante polling
    }
  }, []);

  const startPolling = useCallback((jwt: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setPolling(true);
    pollRef.current = setInterval(() => fetchInbox(jwt), POLL_INTERVAL);
  }, [fetchInbox]);

  const generate = useCallback(async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setAddress('');
    setToken('');
    setInbox([]);
    setSelected(null);
    setError('');
    setPolling(false);
    setLoading(true);

    try {
      // 1. Domínio disponível
      const domains = await mailtm('/domains');
      const domain: string = domains['hydra:member']?.[0]?.domain;
      if (!domain) throw new Error('Nenhum domínio disponível.');

      // 2. Cria conta
      const addr = `adv${randomStr(7)}@${domain}`;
      const pass = randomStr(16);
      await mailtm('/accounts', {
        method: 'POST',
        body: JSON.stringify({ address: addr, password: pass }),
      });

      // 3. Obtém token
      const { token: jwt } = await mailtm('/token', {
        method: 'POST',
        body: JSON.stringify({ address: addr, password: pass }),
      });

      setAddress(addr);
      setToken(jwt);
      await fetchInbox(jwt);
      startPolling(jwt);
    } catch {
      setError('Não foi possível gerar o endereço. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [fetchInbox, startPolling]);

  const openEmail = async (id: string) => {
    if (!token) return;
    if (selected?.id === id) { setSelected(null); return; }
    try {
      const data: EmailBody = await mailtm(`/messages/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelected(data);
    } catch {
      toast.error('Não foi possível carregar o e-mail.');
    }
  };

  const discard = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setAddress('');
    setToken('');
    setInbox([]);
    setSelected(null);
    setPolling(false);
    setError('');
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

      {/* Sem endereço */}
      {!address && !loading && (
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
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        </div>
      )}

      {/* Gerando */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Criando endereço…</p>
        </div>
      )}

      {/* Com endereço */}
      {address && !loading && (
        <div className="flex flex-col gap-4">
          <div className="bg-secondary/50 rounded-lg px-4 py-3 flex items-center gap-2">
            <p className="text-sm font-mono font-medium text-foreground flex-1 truncate">{address}</p>
            <button onClick={copyAddress} className="text-muted-foreground hover:text-foreground transition-colors" title="Copiar">
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
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

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-secondary/30 border-b border-border flex items-center gap-2">
              <Inbox className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Caixa de entrada</span>
              {inbox.length > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 font-medium">
                  {inbox.length}
                </span>
              )}
            </div>

            {inbox.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhum e-mail ainda. Cole o endereço acima em um site externo e aguarde.
              </div>
            )}

            {inbox.map((msg) => (
              <div key={msg.id}>
                <button
                  className="w-full px-4 py-3 text-left hover:bg-secondary/30 transition-colors border-b border-border last:border-0 flex items-start gap-3"
                  onClick={() => openEmail(msg.id)}
                >
                  <Mail className={`w-4 h-4 mt-0.5 shrink-0 ${msg.seen ? 'text-muted-foreground' : 'text-blue-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-foreground truncate">{msg.from.name || msg.from.address}</p>
                      <span className="text-xs text-muted-foreground shrink-0 ml-auto">{relativeTime(msg.createdAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.subject || '(sem assunto)'}</p>
                  </div>
                  {selected?.id === msg.id
                    ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  }
                </button>

                {selected?.id === msg.id && (
                  <div className="px-4 py-4 bg-secondary/20 border-b border-border">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{selected.subject || '(sem assunto)'}</p>
                        <p className="text-xs text-muted-foreground">De: {selected.from.address}</p>
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText(selected.text || ''); toast.success('Conteúdo copiado!'); }}
                        className="text-xs text-primary hover:underline shrink-0"
                      >
                        Copiar tudo
                      </button>
                    </div>
                    {selected.html?.length > 0 ? (
                      <iframe
                        srcDoc={selected.html.join('')}
                        className="w-full rounded border border-border bg-white"
                        style={{ minHeight: 120, maxHeight: 320 }}
                        sandbox="allow-same-origin"
                        title="corpo do e-mail"
                      />
                    ) : (
                      <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                        {selected.text || '(sem conteúdo)'}
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

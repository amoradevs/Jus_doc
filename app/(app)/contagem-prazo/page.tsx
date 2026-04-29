export default function ContagemPrazoPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">Contagem de Prazo</h1>
      </div>

      <div className="bg-white rounded-2xl border border-border p-14 text-center">
        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-foreground font-medium mb-1">Em breve</p>
        <p className="text-muted-foreground text-sm">Esta funcionalidade está sendo desenvolvida.</p>
      </div>
    </div>
  );
}

export default function PlanejamentoPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Planejamento</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ferramentas de planejamento previdenciário para seus clientes.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-dashed border-border p-14 text-center">
        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground mb-1">Planejamento</p>
        <p className="text-xs text-muted-foreground">
          Em construção. Em breve disponível aqui.
        </p>
      </div>
    </div>
  );
}

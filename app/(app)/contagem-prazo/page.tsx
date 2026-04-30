import { ContagemPrazoForm } from '@/components/contagem-prazo/contagem-prazo-form';

export default function ContagemPrazoPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Planejamento Previdenciário</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Calcule as datas de aposentadoria conforme as regras da EC 103/2019 e gere o relatório para o cliente.
        </p>
      </div>
      <ContagemPrazoForm />
    </div>
  );
}

import { ClientForm } from '@/components/client-form';

export default function NovoClientePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">Novo cliente</h1>
      <ClientForm mode="create" />
    </div>
  );
}

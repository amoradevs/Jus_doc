import { PdfCompressor } from '@/components/ferramentas/pdf-compressor';
import { TempEmail } from '@/components/ferramentas/temp-email';

export const metadata = { title: 'Ferramentas — Rocha & Alencar' };

export default function FerramentasPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Ferramentas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Utilitários para agilizar a rotina do escritório.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PdfCompressor />
        <TempEmail />
      </div>
    </div>
  );
}

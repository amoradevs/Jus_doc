'use client';

import { WizardCenario } from './wizard-cenario';

type Props = { clientId: string; processoId?: string };

export function GerarModo({ clientId, processoId }: Props) {
  return <WizardCenario clientId={clientId} processoId={processoId} />;
}

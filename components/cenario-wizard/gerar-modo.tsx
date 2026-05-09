'use client';

import { WizardCenario } from './wizard-cenario';

type Props = { clientId: string; templates?: unknown[] };

export function GerarModo({ clientId }: Props) {
  return <WizardCenario clientId={clientId} />;
}

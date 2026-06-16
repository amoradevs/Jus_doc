'use client';

import { WizardCenario } from './wizard-cenario';

type AdvSettings = { adv1Nome: string; adv1NomeCurto: string; adv1Oab: string; adv2Nome: string; adv2NomeCurto: string; adv2Oab: string };
type Props = { clientId: string; processoId?: string; advSettings?: AdvSettings };

export function GerarModo({ clientId, processoId, advSettings }: Props) {
  return <WizardCenario clientId={clientId} processoId={processoId} advSettings={advSettings} />;
}

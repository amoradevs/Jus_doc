'use client';

import { useState } from 'react';

type CepData = { logradouro: string; bairro: string; localidade: string; uf: string };

export function useCepLookup(onSuccess: (data: CepData) => void) {
  const [loading, setLoading] = useState(false);

  const lookupCep = async (raw: string) => {
    const cep = raw.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cep/${cep}`);
      if (res.ok) {
        const data: CepData = await res.json();
        onSuccess(data);
      }
    } finally {
      setLoading(false);
    }
  };

  return { lookupCep, loading };
}

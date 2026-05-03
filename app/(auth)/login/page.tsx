'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    if (result?.error) {
      setError('E-mail ou senha incorretos.');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="w-full max-w-[820px] mx-4">
      <div className="bg-white rounded-2xl shadow-xl shadow-[rgba(166,102,138,0.14)] border border-[#F0E4EC] overflow-hidden flex flex-col sm:flex-row min-h-[420px]">

        {/* Painel esquerdo — imagem capa */}
        <div className="relative hidden sm:flex sm:w-[340px] shrink-0 flex-col justify-end overflow-hidden">
          {/* Imagem de fundo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/capa_login.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: '50% center' }}
          />
          {/* Overlay gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#3a1035]/85 via-[#3a1035]/30 to-transparent" />
          {/* Texto sobre a imagem */}
          <div className="relative z-10 p-6 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60 mb-1">
              Sistema de gestão
            </p>
            <p className="text-base font-bold leading-snug">
              Rocha & Alencar Advocacia
            </p>
            <p className="text-xs text-white/70 mt-0.5">
              Advocacia Previdenciária
            </p>
          </div>
        </div>

        {/* Painel direito — formulário */}
        <div className="flex-1 px-8 py-10 sm:px-10 flex flex-col justify-center">

          {/* Marca */}
          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-3">
              <Image
                src="/Claro.png"
                alt="Logo"
                width={500}
                height={500}
                className="h-11 w-auto shrink-0"
                priority
              />
              <div>
                <p className="text-lg font-bold text-foreground tracking-tight leading-none">
                  Rocha & Alencar Advocacia
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Advocacia Previdenciária</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Consultoria Jurídica Previdenciária
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3.5 py-2.5">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 rounded-xl mt-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Rocha & Alencar · Advocacia Previdenciária
      </p>
    </div>
  );
}

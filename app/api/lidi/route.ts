import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `Você é Lidi, assistente virtual de Lidiane Rocha Abreu, advogada especializada em direito previdenciário (OAB/SP 220305).

Suas especialidades:
- BPC/LOAS, aposentadoria por invalidez e incapacidade permanente
- Auxílio por incapacidade temporária (auxílio doença)
- Aposentadoria por tempo de contribuição, por idade urbana e rural (FUNRURAL)
- Pensão por morte, salário maternidade, auxílio reclusão
- Recursos administrativos no INSS, mandados de segurança, tutelas antecipadas
- Revisão e cumprimento de sentença de benefícios
- Documentação necessária para cada tipo de benefício
- Prazos processuais e administrativos previdenciários

Responda de forma concisa e profissional, sempre em português. Para questões jurídicas complexas ou que exijam análise do caso concreto, oriente a consultar a Dra. Lidiane diretamente. Não invente informações — se não souber, diga isso com clareza.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      content: 'O serviço de IA ainda não está configurado. Solicite ao administrador que configure a chave ANTHROPIC_API_KEY.',
    });
  }

  try {
    const { messages } = await req.json();
    const client = new Anthropic();

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ content });
  } catch (err) {
    console.error('[lidi-api]', err);
    return NextResponse.json({ content: 'Ocorreu um erro. Tente novamente em instantes.' });
  }
}

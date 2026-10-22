import OpenAI from 'openai';

const SUPPORTED_MODELS = new Set([
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-5',
  'gpt-5-mini',
  'gpt-5-nano',
]);
const DEFAULT_MODEL = 'gpt-4o-mini';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });

export default async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    // Older clients request models the AI Gateway doesn't support (e.g. gpt-3.5-turbo)
    const model = SUPPORTED_MODELS.has(body.model) ? body.model : DEFAULT_MODEL;

    const openai = new OpenAI();
    const completion = await openai.chat.completions.create({
      model,
      messages: body.messages || [],
      max_tokens: body.max_tokens || 150,
      temperature: body.temperature || 0.7,
    });

    return json({
      content: completion.choices[0]?.message?.content || 'No response generated',
      usage: completion.usage,
    });
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    const message =
      error?.status === 429
        ? 'Rate limit exceeded - please try again later'
        : error instanceof Error
          ? error.message
          : 'Failed to generate AI response';
    return json({ error: message, fallback: true }, 500);
  }
};

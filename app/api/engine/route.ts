import { chat, createServices } from '@/lib/chat-engine.mjs';

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: 'Origin not allowed' }, { status: 403 });
  try {
    const raw = await request.text();
    if (raw.length > 12000) return Response.json({ error: 'Request too large' }, { status: 413 });
    const config = { ...process.env } as Record<string, string | undefined>;
    const result = await chat(JSON.parse(raw), createServices(config));
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return Response.json({ error: e instanceof TypeError || e instanceof SyntaxError ? 'Invalid message' : 'Chat unavailable' }, { status: e instanceof TypeError || e instanceof SyntaxError ? 400 : 503 });
  }
}

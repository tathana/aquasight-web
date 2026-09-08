'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Waves, MapPin, MessageCircle, RotateCcw, ChevronRight, Layers, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InteractiveMap from '@/components/interactive-map';

type Action = { label: string; value: string };
type Context = { station?: string; year?: number; intent?: string };
type Reply = { text: string; actions?: Action[]; context?: Context; source?: string; image?: string; error?: boolean };
type Message = Reply & { role: 'user' | 'bot'; id: number };

const menus = [
  ['ตรวจสอบคุณภาพน้ำ','ข้อมูลรายปีและรายเดือน'],
  ['ดูข้อมูลย้อนหลัง','เปรียบเทียบข้อมูลแต่ละปี'],
  ['ดูแผนที่','ภาพ Chlorophyll-a ของสถานี'],
  ['พยากรณ์คุณภาพน้ำ','ผลพยากรณ์จากระบบเดิม'],
  ['คุยกับ AI','ถามความรู้เกี่ยวกับคุณภาพน้ำ'],
  ['เกณฑ์คุณภาพน้ำ','เกณฑ์อ้างอิงในระบบเดิม']
];

const greeting: Message = {
  id: 0,
  role: 'bot',
  text: 'สวัสดีครับ ผม Aqua Sight\nวันนี้อยากดูข้อมูลน้ำที่ไหนครับ?',
  actions: [
    { label: 'ตรวจสอบคุณภาพน้ำ', value: 'ตรวจสอบคุณภาพน้ำ' },
    { label: 'ดูแผนที่', value: 'ดูแผนที่' },
    { label: 'ถาม AI', value: 'คุยกับ AI' }
  ]
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<'chat' | 'interactive-map'>('chat');
  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [context, setContext] = useState<Context>({});
  
  const bottom = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const counter = useRef(1);
  const contextRef = useRef(context);
  contextRef.current = context;

  useEffect(() => {
    if (activeTab === 'chat') {
      bottom.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, busy, activeTab]);

  async function send(value: string) {
    if (lock.current || !value.trim()) return;
    lock.current = true;
    setBusy(true);
    setInput('');
    setMessages((m) => [...m, { id: counter.current++, role: 'user', text: value }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: value, context: contextRef.current }),
        signal: AbortSignal.timeout(65000)
      });
      if (!res.ok) throw new Error('request');
      const reply: Reply = await res.json();
      if (typeof reply.text !== 'string') throw new Error('response');

      setContext(reply.context || {});
      setMessages((m) => [...m, { ...reply, role: 'bot', id: counter.current++ }]);
      return { text: reply.text, context: reply.context, error: !!reply.error };
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: counter.current++,
          role: 'bot',
          text: 'ยังเชื่อมต่อไม่ได้ครับ กรุณาลองอีกครั้ง',
          error: true,
          actions: [
            { label: 'ลองอีกครั้ง', value },
            { label: 'หน้าแรก', value: 'หน้าแรก' }
          ]
        }
      ]);
      return { error: true };
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  useEffect(() => {
    const mc = (document as unknown as { modelContext?: { registerTool: (tool: unknown, options: unknown) => unknown } }).modelContext;
    if (!mc) return;
    const life = new AbortController();
    try {
      Promise.resolve(
        mc.registerTool(
          {
            name: 'send_aquasight_message',
            description: 'Send a message and show the Aqua Sight reply.',
            inputSchema: {
              type: 'object',
              properties: { message: { type: 'string', minLength: 1, maxLength: 2000 } },
              required: ['message'],
              additionalProperties: false
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (args: unknown) => {
              const v = args as { message?: unknown };
              if (typeof v?.message !== 'string' || !v.message.trim() || v.message.length > 2000) throw new Error('Invalid message');
              if (lock.current) throw new Error('Chat is busy');
              return send(v.message);
            }
          },
          { signal: life.signal }
        )
      ).catch(() => {});
    } catch {}
    return () => life.abort();
  }, []);

  return (
    <main className="workspace">
      <aside className="guide">
        <div className="brand">
          <div className="brand-icon">
            <Waves size={28} />
          </div>
          <div>
            Aqua Sight
            <small>ผู้ช่วยข้อมูลคุณภาพน้ำ</small>
          </div>
        </div>

        {/* View Toggle Bar */}
        <div style={{ padding: '8px 12px', background: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>เลือกโหมดการทำงาน</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button
              variant={activeTab === 'chat' ? 'default' : 'ghost'}
              size="sm"
              style={{ flex: 1, fontSize: '12px', padding: '6px' }}
              onClick={() => setActiveTab('chat')}
            >
              <MessageCircle size={14} style={{ marginRight: '4px' }} /> แชทบอท
            </Button>
            <Button
              variant={activeTab === 'interactive-map' ? 'default' : 'ghost'}
              size="sm"
              style={{ flex: 1, fontSize: '12px', padding: '6px' }}
              onClick={() => setActiveTab('interactive-map')}
            >
              <MapIcon size={14} style={{ marginRight: '4px' }} /> แผนที่
            </Button>
          </div>
        </div>

        <div className="guide-label">เริ่มต้นการสนทนา</div>
        <nav aria-label="เมนูแชท">
          {menus.map(([title, desc]) => (
            <Button
              variant="ghost"
              className="menu-item"
              key={title}
              disabled={busy}
              onClick={() => {
                if (title === 'ดูแผนที่') {
                  // Switch to interactive map if clicked, or send chat
                  send(title);
                } else {
                  send(title);
                }
              }}
            >
              <span>
                <strong>{title}</strong>
                <small>{desc}</small>
              </span>
              <ChevronRight size={16} />
            </Button>
          ))}
        </nav>

        <div className="guide-note">
          <MapPin size={18} />
          <p>
            9 สถานีภาคใต้
            <br />
            <span>เลือกสถานีและปีผ่านบทสนทนา</span>
          </p>
        </div>
        <Button variant="ghost" className="about" disabled={busy} onClick={() => send('เกี่ยวกับ')}>
          เกี่ยวกับ Aqua Sight
        </Button>
      </aside>

      {/* Main Panel View */}
      {activeTab === 'interactive-map' ? (
        <section className="chat" style={{ padding: 0 }}>
          <header style={{ padding: '12px 16px', background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
            <div>
              <span className="eyebrow">AQUA SIGHT MAP</span>
              <h1>แผนที่โต้ตอบ 9 สถานี (Interactive Map)</h1>
            </div>
            <Button variant="outline" onClick={() => setActiveTab('chat')}>
              <MessageCircle size={15} style={{ marginRight: '4px' }} /> สลับไปหน้าแชท
            </Button>
          </header>
          <div style={{ flex: 1, height: 'calc(100vh - 70px)' }}>
            <InteractiveMap
              selectedStation={context.station}
              selectedYear={context.year}
              onSelectStation={(st) => setContext((c) => ({ ...c, station: st }))}
              onSelectYear={(yr) => setContext((c) => ({ ...c, year: yr }))}
            />
          </div>
        </section>
      ) : (
        <section className="chat" aria-label="บทสนทนา Aqua Sight">
          <header>
            <div>
              <span className="eyebrow">AQUA SIGHT CHAT</span>
              <h1>คุยเรื่องน้ำ</h1>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('interactive-map')}>
                <MapIcon size={15} style={{ marginRight: '4px' }} /> เปิดแผนที่โต้ตอบ
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setMessages([greeting]);
                  setContext({});
                  setInput('');
                }}
              >
                <RotateCcw size={15} /> เริ่มใหม่
              </Button>
            </div>
          </header>

          <div className="context-bar">
            <span>
              <MessageCircle size={16} /> แชทข้อมูลคุณภาพน้ำ
            </span>
            <span>
              {context.station || 'ยังไม่ได้เลือกสถานี'}
              {context.year ? ` · ${context.year}` : ''}
            </span>
          </div>

          <div className="conversation" role="log" aria-live="polite" aria-relevant="additions">
            <div className="date-divider">Aqua Sight พร้อมช่วยค้นหาข้อมูล</div>
            {messages.map((m) => (
              <article key={m.id} className={`message ${m.role}`}>
                {m.role === 'bot' && (
                  <div className="avatar">
                    <Waves size={19} />
                  </div>
                )}
                <div className="message-content">
                  <div className={`bubble ${m.error ? 'error' : ''}`}>{m.text}</div>
                  {m.image && (
                    <a href={m.image} target="_blank" rel="noreferrer" className="map-image">
                      <img src={m.image} alt="ภาพแผนที่ Chlorophyll-a จากบริการ Aqua Sight" onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} />
                      <span>เปิดภาพแผนที่ขนาดเต็ม ↗</span>
                    </a>
                  )}
                  {m.source && <small className="source">{m.source}</small>}
                  {!!m.actions?.length && (
                    <div className="actions">
                      {m.actions.map((a) => (
                        <Button variant="outline" key={a.value} disabled={busy} onClick={() => send(a.value)}>
                          {a.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
            {busy && (
              <div className="pending" role="status">
                <span className="pulse" /> กำลังเตรียมคำตอบ อาจใช้เวลาสักครู่…
              </div>
            )}
            <div ref={bottom} />
          </div>

          <footer>
            <div className="mobile-menu">
              {menus.map(([title]) => (
                <Button variant="outline" disabled={busy} key={title} onClick={() => send(title)}>
                  {title}
                </Button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <input aria-label="ข้อความถึง Aqua Sight" maxLength={2000} value={input} onChange={(e) => setInput(e.target.value)} placeholder="พิมพ์ข้อความ เช่น Summary CP01 2026" />
              <Button type="submit" disabled={busy || !input.trim()} aria-label="ส่งข้อความ">
                <ArrowUp size={22} />
              </Button>
            </form>
            <p>ข้อมูลตามช่วงเวลาที่แหล่งข้อมูลมีให้ · ผลพยากรณ์แสดงแยกจากข้อมูลย้อนหลัง</p>
          </footer>
        </section>
      )}
    </main>
  );
}

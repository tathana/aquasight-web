'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Waves, MapPin, MessageCircle, RotateCcw, ChevronRight, Map as MapIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InteractiveMap from '@/components/interactive-map';

type Action = { label: string; value: string };
type Context = { station?: string; year?: number; intent?: string };
type Reply = { text: string; actions?: Action[]; context?: Context; source?: string; image?: string; error?: boolean };
type Message = Reply & { role: 'user' | 'bot'; id: number };

const menus = [
  ['ตรวจสอบคุณภาพน้ำ','ข้อมูลสรุปรายปีและรายเดือน'],
  ['ดูข้อมูลย้อนหลัง','เปรียบเทียบข้อมูลย้อนหลังแต่ละปี'],
  ['ดูแผนที่','แผนที่ดาวเทียมการกระจายตัว Chlorophyll-a'],
  ['พยากรณ์คุณภาพน้ำ','ผลคาดการณ์แนวโน้มคุณภาพน้ำล่วงหน้า'],
  ['คุยกับ AI','สอบถามความรู้เกี่ยวกับคุณภาพน้ำและตัวชี้วัด'],
  ['เกณฑ์คุณภาพน้ำ','คู่มือและเกณฑ์อ้างอิงมาตรฐานคุณภาพน้ำ']
];

const greeting: Message = {
  id: 0,
  role: 'bot',
  text: 'สวัสดีครับ ยินดีต้อนรับสู่ Aqua Sight\nระบบบริการข้อมูลและติดตามคุณภาพน้ำภาคใต้แบบครบวงจร\n\nท่านต้องการตรวจสอบข้อมูลสถานีใด หรือสอบถามเกณฑ์คุณภาพน้ำ สามารถเลือกเมนูด้านล่างได้เลยครับ',
  actions: [
    { label: 'ตรวจสอบคุณภาพน้ำ', value: 'ตรวจสอบคุณภาพน้ำ' },
    { label: 'ดูแผนที่', value: 'ดูแผนที่' },
    { label: 'ถาม AI', value: 'คุยกับ AI' }
  ]
};

function formatBubbleText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

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

  return (
    <main className="workspace">
      {/* Desktop Sidebar */}
      <aside className="guide">
        <div className="brand">
          <div className="brand-icon">
            <Waves size={26} />
          </div>
          <div>
            Aqua Sight
            <small>ระบบข้อมูลคุณภาพน้ำภาคใต้</small>
          </div>
        </div>

        {/* Desktop View Switcher */}
        <div style={{ padding: '8px 10px', background: '#091822', borderRadius: '12px', border: '1px solid #1a384c', margin: '18px 0 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#789cb0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>เลือกโหมดการทำงาน</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button
              variant={activeTab === 'chat' ? 'default' : 'ghost'}
              size="sm"
              style={{ flex: 1, fontSize: '12px', padding: '6px', background: activeTab === 'chat' ? '#0284c7' : 'transparent', color: '#ffffff' }}
              onClick={() => setActiveTab('chat')}
            >
              <MessageCircle size={14} style={{ marginRight: '4px' }} /> แชทบอท
            </Button>
            <Button
              variant={activeTab === 'interactive-map' ? 'default' : 'ghost'}
              size="sm"
              style={{ flex: 1, fontSize: '12px', padding: '6px', background: activeTab === 'interactive-map' ? '#0284c7' : 'transparent', color: activeTab === 'interactive-map' ? '#ffffff' : '#94a3b8' }}
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
                if (activeTab !== 'chat') setActiveTab('chat');
                send(title);
              }}
            >
              <span>
                <strong>{title}</strong>
                <small>{desc}</small>
              </span>
              <ChevronRight size={15} style={{ color: '#38bdf8' }} />
            </Button>
          ))}
        </nav>

        <div className="guide-note">
          <MapPin size={18} style={{ color: '#38bdf8', flexShrink: 0, marginTop: '2px' }} />
          <p>
            9 สถานีภาคใต้
            <br />
            <span>เลือกสถานีและปีผ่านบทสนทนา</span>
          </p>
        </div>
        
        <Button variant="ghost" className="about" disabled={busy} onClick={() => { if (activeTab !== 'chat') setActiveTab('chat'); send('เกี่ยวกับ'); }}>
          เกี่ยวกับ Aqua Sight
        </Button>
      </aside>

      {/* Main Panel View */}
      {activeTab === 'interactive-map' ? (
        <section className="chat" style={{ padding: 0, height: '100dvh', display: 'flex', flexDirection: 'column' }}>
          {/* Mobile-Friendly Header with High Contrast Mode Switcher */}
          <header style={{ padding: '12px 20px', background: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#0369a1', padding: '8px', borderRadius: '10px', color: '#fff', display: 'flex' }}>
                <Waves size={20} />
              </div>
              <div>
                <span className="eyebrow" style={{ color: '#38bdf8', fontSize: '10px' }}>AQUA SIGHT MAP</span>
                <h1 style={{ fontSize: '17px', margin: 0, color: '#f8fafc' }}>แผนที่โต้ตอบ 9 สถานีตรวจวัด</h1>
              </div>
            </div>
            
            {/* Mobile Mode Switcher Bar */}
            <div className="mobile-header-switcher" style={{ display: 'flex', gap: '4px', background: '#1e293b', padding: '4px', borderRadius: '10px', border: '1px solid #334155' }}>
              <Button
                variant="ghost"
                size="sm"
                style={{ fontSize: '12px', padding: '4px 12px', height: '28px', color: '#e2e8f0', background: 'transparent' }}
                onClick={() => setActiveTab('chat')}
              >
                <MessageCircle size={14} style={{ marginRight: '4px', color: '#38bdf8' }} /> แชท
              </Button>
              <Button
                variant="default"
                size="sm"
                style={{ fontSize: '12px', padding: '4px 12px', height: '28px', background: '#0284c7', color: '#ffffff', fontWeight: 'bold' }}
                onClick={() => setActiveTab('interactive-map')}
              >
                <MapIcon size={14} style={{ marginRight: '4px' }} /> แผนที่
              </Button>
            </div>
          </header>

          <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
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
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Mobile Mode Switcher Bar */}
              <div className="mobile-header-switcher" style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                <Button
                  variant="default"
                  size="sm"
                  style={{ fontSize: '12px', padding: '4px 12px', height: '28px', background: '#0284c7', color: '#ffffff', fontWeight: 'bold' }}
                  onClick={() => setActiveTab('chat')}
                >
                  <MessageCircle size={14} style={{ marginRight: '4px' }} /> แชท
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ fontSize: '12px', padding: '4px 12px', height: '28px', color: '#475569', background: 'transparent' }}
                  onClick={() => setActiveTab('interactive-map')}
                >
                  <MapIcon size={14} style={{ marginRight: '4px', color: '#0284c7' }} /> แผนที่
                </Button>
              </div>

              {/* Reset Button */}
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => {
                  setMessages([greeting]);
                  setContext({});
                  setInput('');
                }}
                style={{ fontSize: '12px', borderRadius: '10px', height: '34px', borderColor: '#cbd5e1' }}
              >
                <RotateCcw size={14} style={{ marginRight: '4px' }} /> <span>เริ่มใหม่</span>
              </Button>
            </div>
          </header>

          <div className="context-bar">
            <span>
              <MessageCircle size={16} style={{ color: '#0284c7' }} /> แชทข้อมูลคุณภาพน้ำ
            </span>
            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
              {context.station ? `สถานี ${context.station}` : 'ยังไม่ได้เลือกสถานี'}
              {context.year ? ` · ปี ${context.year}` : ''}
            </span>
          </div>

          <div className="conversation" role="log" aria-live="polite" aria-relevant="additions">
            <div className="date-divider">Aqua Sight พร้อมช่วยค้นหาและประมวลผลข้อมูล</div>
            {messages.map((m) => (
              <article key={m.id} className={`message ${m.role}`}>
                {m.role === 'bot' && (
                  <div className="avatar">
                    <Waves size={19} />
                  </div>
                )}
                <div className="message-content">
                  <div className={`bubble ${m.error ? 'error' : ''}`}>{formatBubbleText(m.text)}</div>
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
            {/* Mobile Scrollable Quick Menu Pills */}
            <div className="mobile-menu">
              <Button variant="outline" size="sm" onClick={() => setActiveTab('interactive-map')} style={{ background: '#0284c7', color: '#ffffff', fontWeight: 'bold', border: 'none' }}>
                <MapIcon size={14} style={{ marginRight: '4px' }} /> แผนที่ 9 สถานี
              </Button>
              {menus.map(([title]) => (
                <Button variant="outline" size="sm" disabled={busy} key={title} onClick={() => send(title)} style={{ whiteSpace: 'nowrap' }}>
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
                <ArrowUp size={20} />
              </Button>
            </form>
            <p>ข้อมูลประมวลผลจากภาพดาวเทียมและแบบจำลองพยากรณ์ · ไม่ใช่การรับรองความปลอดภัยของน้ำโดยตรง</p>
          </footer>
        </section>
      )}
    </main>
  );
}

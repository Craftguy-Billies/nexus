'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Zap, Users } from 'lucide-react';
import { scenarios } from '@/lib/api';
import type { Scenario } from '@/types';

interface SceneMessage {
  id: string;
  sender: string;
  senderType: 'user' | 'ai' | 'narrator';
  content: string;
  timestamp: string;
}

export default function ScenarioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState<SceneMessage[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    scenarios.get(id).then(setScenario).catch(() => {});
  }, [id]);

  const handleJoin = async () => {
    if (!id) return;
    try {
      await scenarios.join(id);
      setJoined(true);
      if (scenario) {
        setMessages([{
          id: 'narrator-0',
          sender: 'Narrator',
          senderType: 'narrator',
          content: scenario.sceneSetting,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch {
      // handle
    }
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, {
      id: `user-${Date.now()}`,
      sender: 'You',
      senderType: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }]);
    setInput('');
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  if (!scenario) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
          <button onClick={() => router.back()} className="text-black">
            <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
          </button>
          <h1 className="text-[16px] font-semibold text-black">Scenario</h1>
        </header>

        <div className="flex-1 px-4 py-6">
          <div className="h-32 rounded-xl bg-neutral-200 mb-4" />
          <h2 className="text-[20px] font-semibold text-black">{scenario.title}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">{scenario.description}</p>
          <p className="mt-2 text-[13px] italic text-neutral-500">&ldquo;{scenario.sceneSetting}&rdquo;</p>

          <div className="mt-4">
            <p className="mb-2 text-[13px] font-semibold text-black">Participating Characters</p>
            <div className="flex gap-3">
              {scenario.characters.map((char) => (
                <div key={char.id} className="flex flex-col items-center gap-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 text-[16px] font-semibold text-neutral-500">
                    {char.displayName.charAt(0)}
                  </div>
                  <span className="text-[11px] text-black">{char.displayName}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[13px] text-neutral-500">
            <Users className="h-4 w-4" />
            <span>{scenario._count?.participants || 0}/{scenario.maxParticipants} participants</span>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <Zap className="h-4 w-4 text-black" />
            <span className="text-[13px] text-black">{scenario.energyCost} energy to join</span>
          </div>

          <button onClick={handleJoin} className="mt-4 w-full rounded-lg bg-black py-3 text-[14px] font-semibold text-white">
            Join Scenario
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
        <button onClick={() => router.back()} className="text-black">
          <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
        </button>
        <h1 className="flex-1 text-[14px] font-semibold text-black">{scenario.title}</h1>
        <div className="flex items-center gap-1 text-[12px] text-neutral-500">
          <Users className="h-3.5 w-3.5" />
          {scenario._count?.participants || 0}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`mb-3 ${msg.senderType === 'narrator' ? 'text-center' : msg.senderType === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
            {msg.senderType === 'narrator' ? (
              <p className="text-[13px] italic text-neutral-500">{msg.content}</p>
            ) : (
              <div className={`max-w-[75%] ${msg.senderType === 'user' ? '' : ''}`}>
                {msg.senderType === 'ai' && (
                  <p className="mb-0.5 text-[11px] font-semibold text-neutral-500">{msg.sender}</p>
                )}
                <div className={`rounded-2xl px-3.5 py-2.5 text-[14px] ${
                  msg.senderType === 'user' ? 'bg-black text-white' : 'bg-neutral-100 text-black'
                }`}>
                  {msg.content}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-neutral-200 px-4 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-neutral-200 px-4 py-2 text-[14px] text-black outline-none focus:border-black"
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        {input.trim() && (
          <button onClick={sendMessage} className="text-black">
            <Send className="h-5 w-5" strokeWidth={1.8} />
          </button>
        )}
      </div>
    </div>
  );
}

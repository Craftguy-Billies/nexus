'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Zap, ImageIcon } from 'lucide-react';
import { dm, energy } from '@/lib/api';
import type { DirectMessage, EnergyStatus } from '@/types';

export default function DMConversationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [energyStatus, setEnergyStatus] = useState<EnergyStatus | null>(null);
  const [charName, setCharName] = useState('AI Character');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    dm.messages(id).then((r) => {
      setMessages(r.items);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }).catch(() => {});
    energy.status().then(setEnergyStatus).catch(() => {});
  }, [id]);

  const sendMessage = async () => {
    if (!input.trim() || !id || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    const userMsg: DirectMessage = {
      id: `temp-${Date.now()}`,
      conversationId: id,
      content: text,
      senderType: 'user',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setAiTyping(true);
    try {
      const response = await dm.send(id, text);
      setMessages((prev) => [...prev.filter((m) => m.id !== userMsg.id), userMsg, response]);
      if (energyStatus) {
        setEnergyStatus({ ...energyStatus, currentEnergy: Math.max(0, energyStatus.currentEnergy - 1) });
      }
    } catch {
      // handle
    } finally {
      setAiTyping(false);
      setSending(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const noEnergy = energyStatus && energyStatus.currentEnergy <= 0;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
        <button onClick={() => router.back()} className="text-black">
          <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-[12px] font-semibold text-neutral-500">
            {charName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[14px] font-semibold text-black">{charName}</span>
              <span className="rounded bg-neutral-100 px-1 py-0.5 text-[8px] font-medium text-neutral-500">AI</span>
            </div>
            <span className="text-[11px] text-green-500">Active now</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`mb-3 flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
                msg.senderType === 'user'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-black'
              }`}
            >
              <p>{msg.content}</p>
              <p className={`mt-1 text-[10px] ${msg.senderType === 'user' ? 'text-neutral-400' : 'text-neutral-400'}`}>
                {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {aiTyping && (
          <div className="mb-3 flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl bg-neutral-100 px-4 py-3">
              <div className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Energy indicator */}
      {energyStatus && (
        <div className="flex items-center justify-center gap-1 border-t border-neutral-100 py-1.5 text-[11px] text-neutral-400">
          <Zap className="h-3 w-3" />
          1 energy per message · {energyStatus.currentEnergy} remaining
        </div>
      )}

      {/* Input */}
      {noEnergy ? (
        <div className="border-t border-neutral-200 px-4 py-4 text-center">
          <p className="mb-2 text-[14px] font-medium text-black">Out of energy!</p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const s = await energy.watchAd();
                setEnergyStatus(s);
              }}
              className="flex-1 rounded-lg border border-neutral-200 py-2.5 text-[13px] font-semibold text-black"
            >
              Watch Ad (+5)
            </button>
            <button
              onClick={() => router.push('/subscription')}
              className="flex-1 rounded-lg bg-black py-2.5 text-[13px] font-semibold text-white"
            >
              Get Premium
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-t border-neutral-200 px-4 py-3">
          <button className="text-neutral-400"><ImageIcon className="h-5 w-5" /></button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-neutral-200 px-4 py-2 text-[14px] text-black outline-none focus:border-black"
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          {input.trim() && (
            <button onClick={sendMessage} disabled={sending} className="text-black disabled:opacity-30">
              <Send className="h-5 w-5" strokeWidth={1.8} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

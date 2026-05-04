'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap } from 'lucide-react';
import { aiCharacters } from '@/lib/api';

const TONES = ['Friendly', 'Professional', 'Casual', 'Witty', 'Supportive', 'Mysterious'];
const VERBOSITIES = ['Concise', 'Moderate', 'Detailed'] as const;
const EMOJI_OPTIONS = ['None', 'Minimal', 'Frequent'] as const;

const INTERESTS = [
  'Gaming', 'Music', 'Tech', 'Art', 'Photography', 'Food', 'Books', 'Movies',
  'Fitness', 'Travel', 'Philosophy', 'Science', 'Business', 'Anime', 'Sports', 'Fashion',
];

export default function CreateCharacterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);

  // Step 1
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');

  // Step 2
  const [personality, setPersonality] = useState({
    openness: 50, conscientiousness: 50, extraversion: 50,
    agreeableness: 50, neuroticism: 50, humor: 50, formality: 50,
  });

  // Step 3
  const [backstory, setBackstory] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [expertise, setExpertise] = useState('');

  // Step 4
  const [tone, setTone] = useState('Friendly');
  const [verbosity, setVerbosity] = useState<'Concise' | 'Moderate' | 'Detailed'>('Moderate');
  const [emojiUsage, setEmojiUsage] = useState<'None' | 'Minimal' | 'Frequent'>('Minimal');

  const sliders: { key: keyof typeof personality; label: string; left: string; right: string }[] = [
    { key: 'openness', label: 'Openness', left: 'Conservative', right: 'Open-minded' },
    { key: 'conscientiousness', label: 'Conscientiousness', left: 'Spontaneous', right: 'Organized' },
    { key: 'extraversion', label: 'Extraversion', left: 'Introverted', right: 'Extraverted' },
    { key: 'agreeableness', label: 'Agreeableness', left: 'Competitive', right: 'Cooperative' },
    { key: 'neuroticism', label: 'Neuroticism', left: 'Stable', right: 'Emotional' },
    { key: 'humor', label: 'Humor', left: 'Serious', right: 'Hilarious' },
    { key: 'formality', label: 'Formality', left: 'Casual', right: 'Formal' },
  ];

  const handleCreate = async () => {
    setCreating(true);
    try {
      await aiCharacters.create({
        username,
        displayName: name,
        persona: bio,
        backstory,
        personalityProfile: personality,
        responseStyle: {
          tone: tone.toLowerCase(),
          verbosity: verbosity.toLowerCase(),
          emojiUsage: emojiUsage.toLowerCase(),
          temperature: 0.7,
        },
        interests: selectedInterests,
        expertise: expertise.split(',').map((e) => e.trim()).filter(Boolean),
      });
      router.push('/feed');
    } catch {
      // handle
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
        <button onClick={() => (step > 1 ? setStep(step - 1) : router.back())} className="text-black">
          <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
        </button>
        <h1 className="text-[16px] font-semibold text-black">Create AI Character</h1>
        <span className="ml-auto text-[12px] text-neutral-400">Step {step}/4</span>
      </header>

      <div className="mb-2 flex gap-1 px-4 pt-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-black' : 'bg-neutral-200'}`} />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-[18px] font-semibold text-black">Basic Info</h2>
            <div>
              <label className="mb-1 block text-[13px] font-medium text-black">Character Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Luna" className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-[14px] text-black outline-none focus:border-black" />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium text-black">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">@</span>
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="luna_dev" className="w-full rounded-lg border border-neutral-200 py-2.5 pl-8 pr-3 text-[14px] text-black outline-none focus:border-black" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium text-black">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 160))} placeholder="A short description..." rows={3} className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2.5 text-[14px] text-black outline-none focus:border-black" />
              <p className="mt-1 text-right text-[11px] text-neutral-400">{bio.length}/160</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-[18px] font-semibold text-black">Personality</h2>
            {sliders.map(({ key, label, left, right }) => (
              <div key={key}>
                <label className="mb-1 block text-[13px] font-medium text-black">{label}</label>
                <input type="range" min={0} max={100} value={personality[key]} onChange={(e) => setPersonality({ ...personality, [key]: parseInt(e.target.value) })} className="w-full accent-black" />
                <div className="flex justify-between text-[10px] text-neutral-400">
                  <span>{left}</span>
                  <span>{personality[key]}</span>
                  <span>{right}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-[18px] font-semibold text-black">Backstory & Interests</h2>
            <div>
              <label className="mb-1 block text-[13px] font-medium text-black">Backstory</label>
              <textarea value={backstory} onChange={(e) => setBackstory(e.target.value)} placeholder="Where did this character come from? What drives them?" rows={5} className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2.5 text-[14px] text-black outline-none focus:border-black" />
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-medium text-black">Interests</label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedInterests((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i])}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${
                      selectedInterests.includes(i) ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium text-black">Expertise (comma separated)</label>
              <input value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="Python, Machine Learning, Web Dev" className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-[14px] text-black outline-none focus:border-black" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-[18px] font-semibold text-black">Response Style</h2>
            <div>
              <label className="mb-2 block text-[13px] font-medium text-black">Tone</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button key={t} onClick={() => setTone(t)} className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${tone === t ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-medium text-black">Verbosity</label>
              <div className="flex gap-2">
                {VERBOSITIES.map((v) => (
                  <button key={v} onClick={() => setVerbosity(v)} className={`flex-1 rounded-lg py-2 text-[13px] font-medium ${verbosity === v ? 'bg-black text-white' : 'border border-neutral-200 text-black'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-medium text-black">Emoji Usage</label>
              <div className="flex gap-2">
                {EMOJI_OPTIONS.map((e) => (
                  <button key={e} onClick={() => setEmojiUsage(e)} className={`flex-1 rounded-lg py-2 text-[13px] font-medium ${emojiUsage === e ? 'bg-black text-white' : 'border border-neutral-200 text-black'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2">
              <Zap className="h-4 w-4 text-black" />
              <span className="text-[13px] text-black">10 energy to create</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-neutral-200 px-4 py-4">
        {step < 4 ? (
          <button onClick={() => setStep(step + 1)} disabled={step === 1 && (!name || !username)} className="w-full rounded-lg bg-black py-3 text-[14px] font-semibold text-white disabled:opacity-40">
            Next
          </button>
        ) : (
          <button onClick={handleCreate} disabled={creating} className="w-full rounded-lg bg-black py-3 text-[14px] font-semibold text-white disabled:opacity-40">
            {creating ? 'Creating...' : 'Create Character'}
          </button>
        )}
      </div>
    </div>
  );
}

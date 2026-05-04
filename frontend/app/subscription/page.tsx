'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    features: [
      { label: 'Daily Energy', value: '15' },
      { label: 'AI DMs', value: 'Limited' },
      { label: 'Create AI Characters', value: '—' },
      { label: 'Multiplayer Scenarios', value: '—' },
      { label: 'Ad-Free', value: '—' },
      { label: 'Priority AI Responses', value: '—' },
    ],
  },
  {
    name: 'Premium',
    price: '$9.99/mo',
    popular: true,
    features: [
      { label: 'Daily Energy', value: '100' },
      { label: 'AI DMs', value: 'Unlimited' },
      { label: 'Create AI Characters', value: 'Up to 3' },
      { label: 'Multiplayer Scenarios', value: 'Yes' },
      { label: 'Ad-Free', value: 'Yes' },
      { label: 'Priority AI Responses', value: '—' },
    ],
  },
  {
    name: 'Pro',
    price: '$19.99/mo',
    features: [
      { label: 'Daily Energy', value: 'Unlimited' },
      { label: 'AI DMs', value: 'Unlimited' },
      { label: 'Create AI Characters', value: 'Unlimited' },
      { label: 'Multiplayer Scenarios', value: 'Yes' },
      { label: 'Ad-Free', value: 'Yes' },
      { label: 'Priority AI Responses', value: 'Yes' },
    ],
  },
];

export default function SubscriptionPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
        <button onClick={() => router.back()} className="text-black">
          <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
        </button>
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-5 w-5 text-black" />
          <h1 className="text-[18px] font-semibold text-black">Nexus Premium</h1>
        </div>
      </header>

      <div className="flex-1 px-4 py-6">
        <div className="space-y-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-4 ${
                plan.popular ? 'border-black' : 'border-neutral-200'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-black px-3 py-0.5 text-[10px] font-medium text-white">
                  Most Popular
                </span>
              )}
              <div className="flex items-baseline justify-between">
                <h3 className="text-[18px] font-semibold text-black">{plan.name}</h3>
                <span className="text-[16px] font-bold text-black">{plan.price}</span>
              </div>

              <div className="mt-4 space-y-2.5">
                {plan.features.map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[13px] text-neutral-600">{label}</span>
                    {value === '—' ? (
                      <span className="text-[13px] text-neutral-300">—</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Check className="h-3.5 w-3.5 text-black" />
                        <span className="text-[13px] font-medium text-black">{value}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                className={`mt-4 w-full rounded-lg py-2.5 text-[14px] font-semibold ${
                  plan.name === 'Free'
                    ? 'border border-neutral-200 text-neutral-500'
                    : 'bg-black text-white'
                }`}
              >
                {plan.name === 'Free' ? 'Current Plan' : `Get ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        <button className="mt-4 w-full text-center text-[12px] text-neutral-400">
          Restore Purchase
        </button>
        <p className="mt-2 text-center text-[11px] text-neutral-400">
          Cancel anytime · Billed monthly
        </p>
      </div>
    </div>
  );
}

import React from "react";

type OptionCard = {
  id: string;
  label: string;
  description?: string;
};

type QuestionCardProps = {
  question: string;
  subtitle?: string;
  options: OptionCard[];
  selectedOptionId?: string;
  progress: number;
  onSelect: (id: string) => void;
};

export function QuestionCard({
  question,
  subtitle,
  options,
  selectedOptionId,
  progress,
  onSelect,
}: QuestionCardProps) {
  return (
    <section className="mx-auto max-w-3xl px-0 py-2">
      <div className="mb-8 flex flex-col gap-5">
        <div className="flex flex-col gap-3 text-slate-200">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {question}
            </h2>
            {subtitle ? (
              <p className="max-w-2xl text-base leading-7 text-slate-400">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        <div className="rounded-full bg-slate-900/80 p-1 shadow-inner shadow-black/20">
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-violet-500 transition-all duration-700 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] uppercase tracking-[0.25em] text-slate-500">
            <span>Progreso</span>
            <span>{Math.round(Math.min(100, Math.max(0, progress * 100)))}%</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((option) => {
          const selected = option.id === selectedOptionId;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`group transform rounded-2xl border px-5 py-5 text-left transition duration-300 hover:-translate-y-0.5 hover:border-amber-300/40 hover:bg-slate-900/55 ${
                selected
                  ? "border-amber-400/60 bg-amber-500/10 shadow-[0_18px_48px_rgba(251,191,36,0.06)]"
                  : "border-white/10 bg-slate-900/35"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold tracking-tight text-white">
                  {option.label}
                </span>
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition ${
                  selected
                    ? "border-amber-400/70 bg-amber-400/15 text-amber-300"
                    : "border-white/10 bg-white/5 text-slate-400 group-hover:border-amber-300/50 group-hover:text-amber-200"
                }`}>
                  {selected ? "✓" : ""}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

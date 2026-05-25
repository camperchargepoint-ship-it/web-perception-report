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
    <section className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-slate-950/90 px-6 py-8 shadow-[0_40px_120px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:px-8 sm:py-10">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 text-slate-200">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300 shadow-sm shadow-black/10">
            Resumen premium
          </span>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {question}
            </h2>
            {subtitle ? (
              <p className="max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
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
              className={`group transform rounded-3xl border px-5 py-6 text-left transition duration-300 hover:-translate-y-0.5 hover:border-amber-300/40 hover:bg-slate-900/80 ${
                selected
                  ? "border-amber-400/60 bg-amber-500/10 shadow-[0_24px_60px_rgba(251,191,36,0.08)]"
                  : "border-white/10 bg-slate-900/70"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold tracking-tight text-white">
                  {option.label}
                </span>
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl border text-xs font-semibold transition ${
                  selected
                    ? "border-amber-400/70 bg-amber-400/15 text-amber-300"
                    : "border-white/10 bg-white/5 text-slate-400 group-hover:border-amber-300/50 group-hover:text-amber-200"
                }`}>
                  {selected ? "✓" : ""}
                </span>
              </div>
              {option.description ? (
                <p className="mt-4 text-sm leading-6 text-slate-400">
                  {option.description}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-900/70 p-5 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Qué esperar</p>
          <p className="mt-2 max-w-2xl text-base leading-7 text-slate-200">
            Selecciona la opción que mejor describe tu sitio. Cada elección afina la estrategia y mantiene el tono premium.
          </p>
        </div>
        <div className="rounded-3xl bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-100 shadow-lg shadow-black/30 ring-1 ring-white/5">
          {selectedOptionId ? "Opción seleccionada" : "Selecciona una opción"}
        </div>
      </div>
    </section>
  );
}

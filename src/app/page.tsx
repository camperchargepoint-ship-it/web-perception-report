"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { QuestionCard } from "../components/questions/QuestionCard";
import type { Answers } from "../lib/scoring";
import { generateReport } from "../lib/report";
import type { WebsiteAnalysis } from "../lib/webAnalysis";

type QuestionKey = "claridad" | "percepcionMarca" | "conversion" | "experienciaMovil";

type QuestionStep = {
  key: QuestionKey;
  question: string;
  subtitle: string;
  options: Array<{
    id: string;
    label: string;
    description: string;
  }>;
};

const questionSteps: QuestionStep[] = [
  {
    key: "claridad",
    question: "Cuando alguien entra en tu web… ¿crees que entiende rápidamente lo que haces?",
    subtitle: "Evalúa si tu propuesta de valor se comunica con claridad desde el primer instante.",
    options: [
      { id: "10", label: "Sí, totalmente", description: "La propuesta es inmediata y muy comprensible." },
      { id: "7", label: "Más o menos", description: "Se entiende a grandes rasgos, pero hay puntos que confunden." },
      { id: "4", label: "No realmente", description: "El mensaje principal no queda claro al entrar." },
      { id: "1", label: "No lo sé", description: "No estás seguro de si el usuario capta el propósito del sitio." },
    ],
  },
  {
    key: "percepcionMarca",
    question: "¿Cómo crees que percibe un usuario tu marca al entrar en tu web?",
    subtitle: "Piensa en la calidad percibida y la diferencia frente a la competencia.",
    options: [
      { id: "10", label: "Profesional y cuidada", description: "La marca se siente sólida, distinguida y confiable." },
      { id: "7", label: "Correcta, pero poco diferencial", description: "Funciona, aunque no transmite una ventaja clara." },
      { id: "4", label: "Algo genérica", description: "El diseño y tono no logran destacar completamente." },
      { id: "1", label: "Poco alineada con el valor real de la marca", description: "Existe una desconexión entre la promesa de marca y la experiencia." },
      { id: "2", label: "No lo sé realmente", description: "Aún no tienes claridad sobre la percepción de marca." },
    ],
  },
  {
    key: "conversion",
    question: "¿Tu web está generando actualmente los resultados que esperas?",
    subtitle: "Valora si la experiencia activa a tus visitantes y los conduce a la acción.",
    options: [
      { id: "10", label: "Sí, claramente", description: "Los visitantes actúan casi como esperabas." },
      { id: "6", label: "En parte", description: "Hay resultados, pero quedan márgenes importantes de mejora." },
      { id: "3", label: "Muy poco", description: "Los resultados son insuficientes frente a tus objetivos." },
      { id: "1", label: "No realmente", description: "La web no está generando el impacto esperado." },
    ],
  },
  {
    key: "experienciaMovil",
    question: "¿Cómo es actualmente la experiencia móvil de tu web?",
    subtitle: "Considera usabilidad, rapidez y sensación general en dispositivos móviles.",
    options: [
      { id: "10", label: "Muy fluida", description: "La experiencia móvil es ágil y natural." },
      { id: "7", label: "Correcta, pero mejorable", description: "Funciona, aunque algunos detalles necesitan pulido." },
      { id: "4", label: "Bastante incómoda", description: "Existen fricciones importantes en móvil." },
      { id: "1", label: "No lo sé", description: "No tienes una percepción clara del estado móvil." },
    ],
  },
];

const initialAnswers: Answers = {
  claridad: 5,
  percepcionMarca: 5,
  conversion: 5,
  experienciaMovil: 5,
};

const getHostnameFromUrl = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) return "marca";

  try {
    const normalizedUrl = trimmedValue.includes("://")
      ? trimmedValue
      : `https://${trimmedValue}`;

    return new URL(normalizedUrl).hostname;
  } catch {
    return trimmedValue;
  }
};

export default function Home() {
  const [stage, setStage] = useState<
    | "hero"
    | "url"
    | "questions"
    | "loading"
    | "email"
    | "results"
  >("hero");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [selectedOptionId, setSelectedOptionId] = useState<string>(questionSteps[0].options[1].id);
  const [siteUrl, setSiteUrl] = useState("");
  const [report, setReport] = useState<ReturnType<typeof generateReport> | null>(null);
  const [gateFormData, setGateFormData] = useState({
    nombre: "",
    email: "",
    web: "",
  });
  const [leadSubmissionStatus, setLeadSubmissionStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [leadSubmissionMessage, setLeadSubmissionMessage] = useState("");
  const [websiteAnalysis, setWebsiteAnalysis] = useState<WebsiteAnalysis | null>(null);

  const progressLabel = useMemo(
    () => `${currentQuestion + 1} / ${questionSteps.length}`,
    [currentQuestion]
  );

  const stageTitle = useMemo(() => {
    switch (stage) {
      case "hero":
        return "Auditoría de lujo diseñada para sitios premium.";
      case "url":
        return "Comienza con la página que deseas fortalecer.";
      case "questions":
        return questionSteps[currentQuestion].question;
      case "loading":
        return "Afinando tu auditoría premium…";
      case "email":
        return "Un último paso antes de recibir tu informe.";
      case "results":
        return "Tu reporte estratégico está listo.";
    }
  }, [stage, currentQuestion]);

  useEffect(() => {
    if (stage === "loading") {
      const timer = window.setTimeout(() => setStage("email"), 1400);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [stage]);

  const handleStart = () => setStage("url");

  const handleUrlNext = () => {
    const trimmedSiteUrl = siteUrl.trim();

    setAnswers((prev) => ({
      ...prev,
      brandPositioning: getHostnameFromUrl(trimmedSiteUrl),
      strategicFocus: "audiencia premium",
    }));
    setGateFormData((prev) => ({
      ...prev,
      web: prev.web || trimmedSiteUrl,
    }));
    setStage("questions");
  };

  const handleOptionSelect = (optionId: string) => {
    const currentStep = questionSteps[currentQuestion];
    const value = Number(optionId);

    setSelectedOptionId(optionId);
    setAnswers((prev) => ({
      ...prev,
      [currentStep.key]: value,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questionSteps.length - 1) {
      const nextIndex = currentQuestion + 1;
      const nextStep = questionSteps[nextIndex];
      const existingId = String(answers[nextStep.key] || 5);
      setSelectedOptionId(nextStep.options.some((option) => option.id === existingId) ? existingId : nextStep.options[1].id);
      setCurrentQuestion(nextIndex);
      return;
    }

    const generated = generateReport(answers);
    setReport(generated);
    setStage("loading");
  };

  const handleSubmitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const submittedGateData = {
      nombre: gateFormData.nombre.trim(),
      email: gateFormData.email.trim(),
      web: gateFormData.web.trim(),
    };

    if (!submittedGateData.nombre || !submittedGateData.email || !submittedGateData.web || !report) return;

    setLeadSubmissionStatus("submitting");
    setLeadSubmissionMessage("");
    setGateFormData(submittedGateData);

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...submittedGateData,
          kpiScores: report.kpiScores,
          diagnosisSummary: report.summary,
          opportunities: report.improvementOpportunities,
        }),
      });

      const responseText = await response.text();
      let data: { error?: string; websiteAnalysis?: WebsiteAnalysis } | null = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        console.error("[lead-form] Error al enviar el lead", {
          status: response.status,
          statusText: response.statusText,
          body: data ?? responseText,
        });

        throw new Error(data?.error || "No se pudo enviar el lead.");
      }

      setWebsiteAnalysis(data?.websiteAnalysis ?? null);
      setLeadSubmissionStatus("success");
      setLeadSubmissionMessage("Datos enviados correctamente. Tu informe completo ya está desbloqueado.");
      setStage("results");
    } catch (error) {
      console.error("[lead-form] Fallo en el envío del lead", error);
      setLeadSubmissionStatus("error");
      setLeadSubmissionMessage("No hemos podido enviar tus datos. Revisa la información e inténtalo de nuevo.");
    }
  };

  const renderHero = () => (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 rounded-[32px] border border-white/10 bg-slate-950/95 p-10 shadow-[0_40px_120px_rgba(10,14,28,0.45)] backdrop-blur-xl md:p-14">
      <div className="space-y-4 text-center sm:text-left">
        <p className="text-sm uppercase tracking-[0.28em] text-amber-300/90">Auditoría ejecutiva</p>
        <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
          Diagnóstico web para una presencia digital refinada.
        </h1>
        <p className="max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
          Avanza por un flujo diagnóstico premium, descubre oportunidades estratégicas y recibe un informe diseñado para marcas de alto nivel.
        </p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={handleStart}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-400/20"
        >
          Iniciar auditoría
        </button>
        <p className="max-w-xl text-sm leading-6 text-slate-500">
          El flujo es ligero, responsivo y diseñado para sentirse como una revisión editorial y sofisticada.
        </p>
      </div>
    </div>
  );

  const renderUrlScreen = () => (
    <div className="mx-auto w-full max-w-3xl rounded-[32px] border border-white/10 bg-slate-950/95 p-8 shadow-[0_40px_120px_rgba(10,14,28,0.45)] backdrop-blur-xl sm:p-10">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Entrada de sitio</p>
        <h2 className="text-3xl font-semibold text-white">Introduce la página que quieres revisar.</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-400">
          Este paso enmarca el análisis, mientras las siguientes pantallas se centran en señales clave de experiencia.
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-2 block text-sm font-medium uppercase tracking-[0.18em] text-slate-500">URL</span>
          <input
            value={siteUrl}
            onChange={(event) => setSiteUrl(event.target.value)}
            placeholder="https://tumarca.com"
            className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm text-slate-100 outline-none transition focus:border-amber-300/70 focus:ring-2 focus:ring-amber-300/15"
          />
        </label>
        <button
          type="button"
          onClick={handleUrlNext}
          disabled={!siteUrl}
          className="inline-flex items-center justify-center rounded-full bg-white/10 px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition duration-300 enabled:hover:-translate-y-0.5 enabled:hover:bg-amber-400 enabled:hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </div>
  );

  const renderQuestionScreen = () => {
    const current = questionSteps[currentQuestion];
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-3 rounded-[28px] border border-white/10 bg-slate-950/95 p-6 shadow-[0_30px_80px_rgba(10,14,28,0.35)] sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Pregunta</p>
              <p className="mt-2 text-sm text-slate-400">{progressLabel} de {questionSteps.length}</p>
            </div>
            <div className="rounded-full bg-slate-900/80 px-4 py-2 text-xs uppercase tracking-[0.22em] text-amber-300 ring-1 ring-white/10">
              {Math.round(((currentQuestion + 1) / questionSteps.length) * 100)}%
            </div>
          </div>
          <QuestionCard
            question={current.question}
            subtitle={current.subtitle}
            options={current.options}
            selectedOptionId={selectedOptionId}
            progress={(currentQuestion + 1) / questionSteps.length}
            onSelect={handleOptionSelect}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleNextQuestion}
            className="inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-400/25"
          >
            {currentQuestion === questionSteps.length - 1 ? "Generar auditoría" : "Siguiente pregunta"}
          </button>
        </div>
      </div>
    );
  };

  const renderLoading = () => (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center rounded-[32px] border border-white/10 bg-slate-950/95 px-10 py-16 text-center shadow-[0_40px_120px_rgba(10,14,28,0.45)] backdrop-blur-xl">
      <div className="mb-6 h-20 w-20 rounded-full bg-gradient-to-br from-amber-400 via-rose-400 to-violet-500 shadow-[0_20px_80px_rgba(251,191,36,0.18)]">
        <div className="mx-auto mt-6 h-8 w-8 animate-pulse rounded-full bg-slate-950" />
      </div>
      <h2 className="text-3xl font-semibold text-white">Preparando tu auditoría de lujo</h2>
      <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
        El sistema está alineando tus respuestas con una revisión estratégica y de alto nivel. Esto solo tarda un momento.
      </p>
    </div>
  );

  const renderEmailGate = () => {
    const isFormValid = Object.values(gateFormData).every((value) => value.trim().length > 0);
    const isSubmitting = leadSubmissionStatus === "submitting";

    return (
      <div className="mx-auto w-full max-w-3xl rounded-[32px] border border-white/10 bg-slate-950/95 p-10 shadow-[0_40px_120px_rgba(10,14,28,0.45)] backdrop-blur-xl">
        <div className="space-y-5 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-amber-300/90">Acceso exclusivo</p>
          <h2 className="text-4xl font-semibold text-white">Recibe tu informe estratégico personalizado.</h2>
          <p className="max-w-2xl mx-auto text-sm leading-7 text-slate-400">
            Completa los datos para desbloquear tu auditoría premium y conservar los hallazgos para futuras consultas.
          </p>
        </div>
        <form className="mt-10 space-y-4" onSubmit={handleSubmitEmail}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Nombre</span>
              <input
                name="nombre"
                value={gateFormData.nombre}
                onChange={(event) => setGateFormData((prev) => ({ ...prev, nombre: event.target.value }))}
                type="text"
                placeholder="Tu nombre completo"
                autoComplete="name"
                required
                className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm text-slate-100 outline-none transition focus:border-amber-300/70 focus:ring-2 focus:ring-amber-300/15"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Email</span>
              <input
                name="email"
                value={gateFormData.email}
                onChange={(event) => setGateFormData((prev) => ({ ...prev, email: event.target.value }))}
                type="email"
                placeholder="tu@empresa.com"
                autoComplete="email"
                required
                className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm text-slate-100 outline-none transition focus:border-amber-300/70 focus:ring-2 focus:ring-amber-300/15"
              />
            </label>
          </div>
          <label>
            <span className="mb-2 block text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Web</span>
            <input
              name="web"
              value={gateFormData.web}
              onChange={(event) => setGateFormData((prev) => ({ ...prev, web: event.target.value }))}
              type="url"
              placeholder="https://tumarca.com"
              autoComplete="url"
              required
              className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm text-slate-100 outline-none transition focus:border-amber-300/70 focus:ring-2 focus:ring-amber-300/15"
            />
          </label>
          <div className="pt-4">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400 px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition duration-300 enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg enabled:hover:shadow-amber-400/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Enviando acceso" : "Desbloquear informe completo"}
            </button>
          </div>
        </form>
        {leadSubmissionStatus === "error" ? (
          <div className="mt-5 rounded-3xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm leading-6 text-rose-100">
            {leadSubmissionMessage}
          </div>
        ) : null}
        <div className="mt-8 rounded-3xl border border-white/10 bg-slate-900/70 p-5 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Privacidad protegida</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Tu información se conservará de forma confidencial y solo se utilizará para enviar tu informe y futuras actualizaciones relevantes.
          </p>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const labels: Record<string, string> = {
      claridad: "Claridad",
      confianza: "Confianza",
      percepcionDeMarca: "Percepción de marca",
      conversion: "Conversión",
      experienciaMovil: "Experiencia móvil",
    };

    const renderWebsiteAnalysis = () => (
      <section className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)] sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-300/80">Lectura técnica</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Análisis automático del sitio</h3>
          </div>
          <div className="rounded-full bg-slate-950/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-400 ring-1 ring-white/10">
            {websiteAnalysis?.normalizedUrl ? "Sitio analizado" : "Análisis no disponible"}
          </div>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/5 bg-slate-950/75 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Título de página</p>
            <p className="mt-3 text-base leading-7 text-slate-100">
              {websiteAnalysis?.pageTitle || "No detectado"}
            </p>
          </div>
          <div className="rounded-3xl border border-white/5 bg-slate-950/75 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">H1 detectado</p>
            <p className="mt-3 text-base leading-7 text-slate-100">
              {websiteAnalysis?.hasH1
                ? websiteAnalysis.h1Text || "Sí, sin texto disponible"
                : "No detectado"}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/5 bg-slate-950/75 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">CTA detectados</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              {websiteAnalysis?.ctaCandidates.length ? (
                websiteAnalysis.ctaCandidates.map((item) => (
                  <li key={item} className="rounded-2xl bg-white/[0.03] px-4 py-3">
                    {item}
                  </li>
                ))
              ) : (
                <li className="rounded-2xl bg-white/[0.03] px-4 py-3">
                  No se han detectado CTA claros.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-3xl border border-white/5 bg-slate-950/75 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Notas automáticas</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              {websiteAnalysis?.notes.length ? (
                websiteAnalysis.notes.map((item) => (
                  <li key={item} className="rounded-2xl bg-white/[0.03] px-4 py-3">
                    {item}
                  </li>
                ))
              ) : (
                <li className="rounded-2xl bg-white/[0.03] px-4 py-3">
                  No hay notas automáticas disponibles.
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>
    );

    return (
      <div className="mx-auto w-full max-w-5xl space-y-8 rounded-[32px] border border-white/10 bg-slate-950/95 p-6 shadow-[0_40px_120px_rgba(10,14,28,0.45)] backdrop-blur-xl sm:p-8 lg:p-10">
        <div className="space-y-5">
          <p className="text-sm uppercase tracking-[0.28em] text-amber-300/90">Resultado premium</p>
          <h2 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">Resumen de auditoría</h2>
          {leadSubmissionStatus === "success" ? (
            <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 px-5 py-4 text-sm leading-6 text-emerald-100">
              {leadSubmissionMessage}
            </div>
          ) : null}
          <p className="max-w-3xl text-base leading-7 text-slate-400">
            {report?.summary || "Tu revisión premium está lista."}
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <h3 className="text-xl font-semibold text-white">Indicadores clave</h3>
            <div className="mt-6 space-y-4">
              {report &&
                Object.entries(report.kpiScores).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-4 rounded-3xl bg-slate-950/80 px-4 py-4">
                    <span className="text-sm uppercase tracking-[0.18em] text-slate-400">{labels[key] ?? key}</span>
                    <span className="font-semibold text-white">{Math.round(value * 100)}%</span>
                  </div>
                ))}
            </div>
          </section>
          <section className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <h3 className="text-xl font-semibold text-white">Visión estratégica</h3>
            <p className="mt-4 text-sm leading-7 text-slate-400">{report?.diagnosis.emotionalSummary}</p>
          </section>
        </div>

        {renderWebsiteAnalysis()}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <h3 className="text-xl font-semibold text-white">Áreas débiles</h3>
            <ul className="mt-5 space-y-3 text-slate-300">
              {report?.weakAreas.map((item) => (
                <li key={item} className="rounded-3xl border border-white/5 bg-slate-950/80 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <h3 className="text-xl font-semibold text-white">Oportunidades de mejora</h3>
            <ul className="mt-5 space-y-3 text-slate-300">
              {report?.improvementOpportunities.map((item) => (
                <li key={item} className="rounded-3xl border border-white/5 bg-slate-950/80 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-14">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.32em] text-amber-300/80">Diagnóstico premium</p>
          <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Revisión web de alto nivel con un tono editorial y minimalista.
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
            El flujo está diseñado para sentirse calmado, cuidado y excepcional en cada pantalla.
          </p>
        </div>

        <div key={stage} aria-label={stageTitle} className="flex-1 animate-stage-in">
          {stage === "hero" && renderHero()}
          {stage === "url" && renderUrlScreen()}
          {stage === "questions" && renderQuestionScreen()}
          {stage === "loading" && renderLoading()}
          {stage === "email" && renderEmailGate()}
          {stage === "results" && renderResults()}
        </div>
      </div>
    </main>
  );
}

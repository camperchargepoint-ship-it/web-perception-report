"use client";

import Image from "next/image";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { QuestionCard } from "../components/questions/QuestionCard";
import type { Answers } from "../lib/scoring";
import { generateReport } from "../lib/report";
import type { WebsiteAnalysis } from "../lib/webAnalysis";
import type { WebsiteScreenshot } from "../lib/screenshots";

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

type ScreenshotUrls = {
  desktop: string;
  mobile: string;
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

const createScreenshotFallback = (
  label: WebsiteScreenshot["label"],
  width: number,
  height: number,
  error = "Captura no disponible."
): WebsiteScreenshot => ({
  dataUrl: "",
  hasScreenshot: false,
  width,
  height,
  label,
  error,
});

const createWebsiteAnalysisFallback = (web = ""): WebsiteAnalysis => ({
  normalizedUrl: web,
  pageTitle: "",
  h1Text: "",
  hasH1: false,
  ctaCandidates: [],
  hasCTA: false,
  notes: ["No se ha podido mostrar el análisis automático del sitio."],
  screenshotUrls: {
    desktop: "",
    mobile: "",
  },
  screenshots: {
    desktopUrl: "",
    mobileUrl: "",
    desktop: createScreenshotFallback("desktop", 1440, 1100),
    mobile: createScreenshotFallback("mobile", 390, 844),
    notes: ["No hay capturas automáticas disponibles."],
  },
});

const normalizeWebsiteAnalysis = (
  analysis: Partial<WebsiteAnalysis> | null | undefined,
  web: string
): WebsiteAnalysis => ({
  normalizedUrl: analysis?.normalizedUrl || web,
  pageTitle: analysis?.pageTitle || "",
  h1Text: analysis?.h1Text || "",
  hasH1: Boolean(analysis?.hasH1),
  ctaCandidates: Array.isArray(analysis?.ctaCandidates) ? analysis.ctaCandidates : [],
  hasCTA: Boolean(analysis?.hasCTA),
  notes: Array.isArray(analysis?.notes) && analysis.notes.length > 0
    ? analysis.notes
    : createWebsiteAnalysisFallback(web).notes,
  screenshotUrls: {
    desktop: analysis?.screenshotUrls?.desktop || analysis?.screenshots?.desktopUrl || "",
    mobile: analysis?.screenshotUrls?.mobile || analysis?.screenshots?.mobileUrl || "",
  },
  screenshots: analysis?.screenshots || createWebsiteAnalysisFallback(web).screenshots,
});

const normalizeScreenshotUrls = (
  value: Partial<ScreenshotUrls> | null | undefined,
  analysis: WebsiteAnalysis
): ScreenshotUrls => ({
  desktop: value?.desktop || analysis.screenshotUrls?.desktop || analysis.screenshots?.desktopUrl || "",
  mobile: value?.mobile || analysis.screenshotUrls?.mobile || analysis.screenshots?.mobileUrl || "",
});

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
  const [screenshotUrls, setScreenshotUrls] = useState<ScreenshotUrls>({
    desktop: "",
    mobile: "",
  });

  const progressLabel = useMemo(
    () => `${currentQuestion + 1} de ${questionSteps.length}`,
    [currentQuestion]
  );

  const stageTitle = useMemo(() => {
    switch (stage) {
      case "hero":
        return "Diagnóstico web estratégico";
      case "url":
        return "Comienza con la página que deseas fortalecer.";
      case "questions":
        return questionSteps[currentQuestion].question;
      case "loading":
        return "Preparando diagnóstico";
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
      strategicFocus: "claridad, conversión y experiencia móvil",
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
      let data: {
        error?: string;
        websiteAnalysis?: WebsiteAnalysis;
        screenshotUrls?: ScreenshotUrls;
      } | null = null;

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

      const receivedWebsiteAnalysis = normalizeWebsiteAnalysis(
        data?.websiteAnalysis,
        submittedGateData.web
      );
      const receivedScreenshotUrls = normalizeScreenshotUrls(
        data?.screenshotUrls,
        receivedWebsiteAnalysis
      );

      console.log("[lead-form] websiteAnalysis returned by /api/lead", receivedWebsiteAnalysis);
      setWebsiteAnalysis(receivedWebsiteAnalysis);
      setScreenshotUrls(receivedScreenshotUrls);
      setLeadSubmissionStatus("success");
      setLeadSubmissionMessage("Datos enviados correctamente. Tu informe está listo.");
      setStage("results");
    } catch (error) {
      console.error("[lead-form] Fallo en el envío del lead", error);
      setLeadSubmissionStatus("error");
      setLeadSubmissionMessage("No hemos podido enviar tus datos. Revisa la información e inténtalo de nuevo.");
    }
  };

  const renderHero = () => (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-8 py-6 sm:py-10">
      <div className="h-px w-full bg-white/10" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleStart}
          className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:bg-amber-200"
        >
          Empezar
        </button>
      </div>
    </div>
  );

  const renderUrlScreen = () => (
    <div className="mx-auto w-full max-w-3xl py-4 sm:py-8">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Sitio web</p>
        <h2 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">Introduce la URL.</h2>
      </div>
      <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-2 block text-sm font-medium uppercase tracking-[0.18em] text-slate-500">URL</span>
          <input
            value={siteUrl}
            onChange={(event) => setSiteUrl(event.target.value)}
            placeholder="https://tumarca.com"
            className="w-full rounded-2xl border border-white/10 bg-slate-900/45 px-4 py-4 text-sm text-slate-100 outline-none transition focus:border-amber-300/70 focus:ring-2 focus:ring-amber-300/15"
          />
        </label>
        <button
          type="button"
          onClick={handleUrlNext}
          disabled={!siteUrl}
          className="inline-flex items-center justify-center rounded-full bg-white px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition duration-300 enabled:hover:-translate-y-0.5 enabled:hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </div>
  );

  const renderQuestionScreen = () => {
    const current = questionSteps[currentQuestion];
    return (
      <div className="space-y-10">
        <div className="flex flex-col gap-8 py-2 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Pregunta</p>
              <p className="mt-2 text-sm text-slate-400">{progressLabel}</p>
            </div>
          </div>
          <QuestionCard
            question={current.question}
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
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:bg-amber-200"
          >
            {currentQuestion === questionSteps.length - 1 ? "Generar auditoría" : "Siguiente pregunta"}
          </button>
        </div>
      </div>
    );
  };

  const renderLoading = () => (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-8 py-20 text-center">
      <div className="mb-8 h-2 w-36 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-amber-300" />
      </div>
      <h2 className="text-3xl font-semibold text-white">Preparando diagnóstico</h2>
    </div>
  );

  const renderEmailGate = () => {
    const isFormValid = Object.values(gateFormData).every((value) => value.trim().length > 0);
    const isSubmitting = leadSubmissionStatus === "submitting";

    return (
      <div className="mx-auto w-full max-w-3xl py-4 sm:py-8">
        <div className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-amber-300/90">Informe</p>
          <h2 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">Recibe tu diagnóstico.</h2>
        </div>
        <form className="mt-12 space-y-5" onSubmit={handleSubmitEmail}>
          <div className="grid gap-5 sm:grid-cols-2">
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
                className="w-full rounded-2xl border border-white/10 bg-slate-900/45 px-4 py-4 text-sm text-slate-100 outline-none transition focus:border-amber-300/70 focus:ring-2 focus:ring-amber-300/15"
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
                className="w-full rounded-2xl border border-white/10 bg-slate-900/45 px-4 py-4 text-sm text-slate-100 outline-none transition focus:border-amber-300/70 focus:ring-2 focus:ring-amber-300/15"
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
              className="w-full rounded-2xl border border-white/10 bg-slate-900/45 px-4 py-4 text-sm text-slate-100 outline-none transition focus:border-amber-300/70 focus:ring-2 focus:ring-amber-300/15"
            />
          </label>
          <div className="pt-4">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full inline-flex items-center justify-center rounded-full bg-white px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition duration-300 enabled:hover:-translate-y-0.5 enabled:hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Enviando" : "Ver informe"}
            </button>
          </div>
        </form>
        {leadSubmissionStatus === "error" ? (
          <div className="mt-5 rounded-3xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm leading-6 text-rose-100">
            {leadSubmissionMessage}
          </div>
        ) : null}
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

    const getKpiDiagnostic = (key: string, value: number) => {
      const level = value >= 0.8 ? "high" : value >= 0.55 ? "medium" : "low";
      const copy: Record<string, Record<typeof level, string>> = {
        claridad: {
          high: "El mensaje principal se entiende rápidamente y transmite una propuesta clara.",
          medium: "La propuesta se percibe, aunque algunos bloques generan fricción visual o conceptual.",
          low: "El usuario necesita demasiado esfuerzo para comprender qué ofrece realmente la marca.",
        },
        confianza: {
          high: "La presencia visual transmite profesionalidad y coherencia.",
          medium: "La base es correcta, aunque algunos elementos reducen la percepción de solidez.",
          low: "La experiencia actual puede generar dudas en la primera impresión.",
        },
        percepcionDeMarca: {
          high: "La identidad visual tiene personalidad y una dirección clara.",
          medium: "La marca funciona, aunque todavía resulta algo genérica.",
          low: "La percepción visual no refleja todavía el valor real del proyecto.",
        },
        conversion: {
          high: "La estructura acompaña correctamente al usuario hacia la acción.",
          medium: "Existen oportunidades para mejorar foco y llamadas a la acción.",
          low: "El flujo actual no guía claramente hacia la conversión.",
        },
        experienciaMovil: {
          high: "La experiencia móvil se percibe fluida y bien resuelta.",
          medium: "La navegación funciona, aunque algunos elementos podrían optimizarse.",
          low: "La experiencia móvil presenta fricción visual o funcional.",
        },
      };

      return copy[key]?.[level] ?? "Este indicador requiere una lectura más precisa.";
    };

    const renderWebsiteAnalysis = () => (
      <section className="border-t border-white/10 pt-10 sm:pt-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-300/80">Lectura técnica</p>
            <h3 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">Análisis automático del sitio</h3>
          </div>
          <div className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-400">
            {websiteAnalysis?.normalizedUrl ? "Sitio analizado" : "Análisis no disponible"}
          </div>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div className="border-l border-amber-300/30 pl-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Título de página</p>
            <p className="mt-4 text-lg leading-8 text-slate-100">
              {websiteAnalysis?.pageTitle || "No detectado"}
            </p>
          </div>
          <div className="border-l border-amber-300/30 pl-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">H1 detectado</p>
            <p className="mt-4 text-lg leading-8 text-slate-100">
              {websiteAnalysis?.hasH1
                ? websiteAnalysis.h1Text || "Sí, sin texto disponible"
                : "No detectado"}
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">CTA detectados</p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
              {websiteAnalysis?.ctaCandidates.length ? (
                websiteAnalysis.ctaCandidates.map((item) => (
                  <li key={item} className="border-b border-white/10 pb-3">
                    {item}
                  </li>
                ))
              ) : (
                <li className="border-b border-white/10 pb-3">
                  No se han detectado CTA claros.
                </li>
              )}
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Notas automáticas</p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
              {websiteAnalysis?.notes.length ? (
                websiteAnalysis.notes.map((item) => (
                  <li key={item} className="border-b border-white/10 pb-3">
                    {item}
                  </li>
                ))
              ) : (
                <li className="border-b border-white/10 pb-3">
                  No hay notas automáticas disponibles.
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>
    );

    const renderScreenshotCard = (
      screenshot: WebsiteScreenshot | undefined,
      title: string,
      description: string
    ) => (
      <article className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-900/45">
        <div className="border-b border-white/10 px-6 py-6 sm:px-7">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-300/80">{title}</p>
          <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p>
        </div>
        <div className="bg-slate-950/60 p-4 sm:p-5">
          {screenshot?.hasScreenshot && screenshot.dataUrl ? (
            <Image
              src={screenshot.dataUrl}
              alt={title}
              width={screenshot.width}
              height={screenshot.height}
              unoptimized
              className="h-auto w-full rounded-[20px] border border-white/10 object-cover"
            />
          ) : (
            <div className="flex min-h-64 items-center justify-center rounded-[20px] border border-dashed border-white/15 bg-white/[0.03] px-6 text-center text-sm leading-6 text-slate-400">
              {screenshot?.error || "Captura no disponible."}
            </div>
          )}
        </div>
      </article>
    );

    const renderScreenshotUrls = () => (
      <div className="grid gap-6 border-t border-white/10 pt-6 text-xs leading-6 text-slate-400 md:grid-cols-2">
        <div className="min-w-0">
          <p className="uppercase tracking-[0.18em] text-slate-500">Desktop screenshot URL</p>
          <p className="mt-2 break-all font-mono text-slate-300">
            {screenshotUrls.desktop || "No disponible"}
          </p>
        </div>
        <div className="min-w-0">
          <p className="uppercase tracking-[0.18em] text-slate-500">Mobile screenshot URL</p>
          <p className="mt-2 break-all font-mono text-slate-300">
            {screenshotUrls.mobile || "No disponible"}
          </p>
        </div>
      </div>
    );

    const renderWebsiteScreenshots = () => (
      <section className="space-y-8 border-t border-white/10 pt-10 sm:pt-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-300/80">Vista visual</p>
            <h3 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">Capturas automáticas del sitio</h3>
          </div>
          <p className="max-w-md text-sm leading-7 text-slate-500">
            Referencias visuales generadas para revisar la primera impresión en escritorio y móvil.
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.75fr]">
          {renderScreenshotCard(
            websiteAnalysis?.screenshots?.desktop,
            "Vista de escritorio",
            "Lectura amplia de la composición, jerarquía y presencia visual."
          )}
          {renderScreenshotCard(
            websiteAnalysis?.screenshots?.mobile,
            "Vista móvil",
            "Revisión compacta de claridad, foco y experiencia en pantalla pequeña."
          )}
        </div>
        {renderScreenshotUrls()}
      </section>
    );

    return (
      <div className="mx-auto w-full max-w-6xl space-y-14 rounded-[28px] bg-slate-950/70 px-6 py-10 shadow-[0_40px_120px_rgba(10,14,28,0.28)] backdrop-blur-xl sm:px-10 sm:py-14 lg:px-14">
        <div className="space-y-7">
          <p className="text-sm uppercase tracking-[0.28em] text-amber-300/90">Resultado</p>
          <h2 className="max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-5xl">Una lectura estratégica de tu presencia digital.</h2>
          {leadSubmissionStatus === "success" ? (
            <div className="max-w-3xl rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-5 py-4 text-sm leading-7 text-emerald-100">
              {leadSubmissionMessage}
            </div>
          ) : null}
          <p className="max-w-3xl text-lg leading-9 text-slate-300">
            {report?.summary || "Tu informe está listo."}
          </p>
        </div>
        <div className="grid gap-12 border-t border-white/10 pt-10 lg:grid-cols-[1.15fr_0.85fr] sm:pt-14">
          <section>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-300/80">Indicadores clave</p>
            <h3 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">Diagnóstico por dimensión</h3>
            <div className="mt-10 grid gap-5">
              {report &&
                Object.entries(report.kpiScores).map(([key, value]) => (
                  <div key={key} className="grid gap-5 border-b border-white/10 pb-6 sm:grid-cols-[7rem_1fr_4rem] sm:items-start">
                    <span className="text-sm uppercase tracking-[0.18em] text-slate-400">{labels[key] ?? key}</span>
                    <p className="text-base leading-8 text-slate-200">{getKpiDiagnostic(key, value)}</p>
                    <span className="text-left text-2xl font-semibold text-white sm:text-right">{Math.round(value * 100)}%</span>
                  </div>
                ))}
            </div>
          </section>
          <section className="self-start border-l border-amber-300/25 pl-6 sm:pl-8">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-300/80">Visión estratégica</p>
            <h3 className="mt-4 text-2xl font-semibold leading-tight text-white">Lectura editorial</h3>
            <p className="mt-6 text-base leading-8 text-slate-300">{report?.diagnosis.emotionalSummary}</p>
          </section>
        </div>

        {renderWebsiteAnalysis()}
        {renderWebsiteScreenshots()}

        <div className="grid gap-12 border-t border-white/10 pt-10 sm:pt-14 lg:grid-cols-2">
          <section>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-300/80">Fracciones de fricción</p>
            <h3 className="mt-4 text-3xl font-semibold leading-tight text-white">Áreas que piden atención</h3>
            <ul className="mt-8 space-y-4 text-slate-300">
              {report?.weakAreas.map((item) => (
                <li key={item} className="border-b border-white/10 pb-4 text-sm leading-7">
                  {item}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-300/80">Siguiente nivel</p>
            <h3 className="mt-4 text-3xl font-semibold leading-tight text-white">Oportunidades de mejora</h3>
            <ul className="mt-8 space-y-4 text-slate-300">
              {report?.improvementOpportunities.map((item) => (
                <li key={item} className="border-b border-white/10 pb-4 text-sm leading-7">
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
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
        <div className="space-y-5">
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Diagnóstico web estratégico
          </h1>
          <p className="max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
            Selecciona las opciones que mejor describen la situación actual de tu sitio.
          </p>
          <p className="text-sm leading-6 text-slate-500">
            Este análisis evalúa claridad, percepción, conversión y experiencia móvil.
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

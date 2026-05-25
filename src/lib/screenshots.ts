export type WebsiteScreenshot = {
  dataUrl: string;
  hasScreenshot: boolean;
  width: number;
  height: number;
  label: "desktop" | "mobile";
  error: string;
};

export type WebsiteScreenshots = {
  desktopUrl: string;
  mobileUrl: string;
  desktop: WebsiteScreenshot;
  mobile: WebsiteScreenshot;
  notes: string[];
};

type ScreenshotTarget = Pick<WebsiteScreenshot, "label" | "width" | "height">;

const SCREENSHOTONE_API_URL = "https://api.screenshotone.com/take";
const IMAGE_FORMAT = "jpg";
const IMAGE_CONTENT_TYPE = "image/jpeg";
const REQUEST_TIMEOUT_MS = 12000;

const targets: ScreenshotTarget[] = [
  { label: "desktop", width: 1440, height: 1100 },
  { label: "mobile", width: 390, height: 844 },
];

const emptyScreenshot = (
  target: ScreenshotTarget,
  error = "Captura no disponible."
): WebsiteScreenshot => ({
  dataUrl: "",
  hasScreenshot: false,
  width: target.width,
  height: target.height,
  label: target.label,
  error,
});

const normalizeUrl = (url: string) => {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) return "";

  const urlWithProtocol = trimmedUrl.includes("://")
    ? trimmedUrl
    : `https://${trimmedUrl}`;

  return new URL(urlWithProtocol).toString();
};

const createScreenshotOneUrl = (
  targetUrl: string,
  target: ScreenshotTarget,
  accessKey: string
) => {
  const params = new URLSearchParams({
    access_key: accessKey,
    url: targetUrl,
    viewport_width: String(target.width),
    viewport_height: String(target.height),
    format: IMAGE_FORMAT,
    image_quality: "82",
    full_page: "false",
  });

  return `${SCREENSHOTONE_API_URL}?${params.toString()}`;
};

const fetchScreenshot = async (
  targetUrl: string,
  target: ScreenshotTarget,
  accessKey: string
): Promise<WebsiteScreenshot> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const screenshotUrl = createScreenshotOneUrl(targetUrl, target, accessKey);
    const response = await fetch(screenshotUrl, {
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      return emptyScreenshot(
        target,
        `ScreenshotOne respondió con estado ${response.status}.`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return {
      dataUrl: `data:${IMAGE_CONTENT_TYPE};base64,${base64}`,
      hasScreenshot: true,
      width: target.width,
      height: target.height,
      label: target.label,
      error: "",
    };
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "ScreenshotOne ha tardado demasiado en responder."
      : "No se ha podido generar la captura automática.";

    return emptyScreenshot(target, message);
  } finally {
    clearTimeout(timeout);
  }
};

export async function generateWebsiteScreenshots(url: string): Promise<WebsiteScreenshots> {
  let normalizedUrl = "";

  try {
    normalizedUrl = normalizeUrl(url);
  } catch {
    return {
      desktopUrl: "",
      mobileUrl: "",
      desktop: emptyScreenshot(targets[0], "La URL no es válida para generar capturas."),
      mobile: emptyScreenshot(targets[1], "La URL no es válida para generar capturas."),
      notes: ["No se han podido generar capturas porque la URL no es válida."],
    };
  }

  if (!normalizedUrl) {
    return {
      desktopUrl: "",
      mobileUrl: "",
      desktop: emptyScreenshot(targets[0], "No se ha recibido una URL para capturar."),
      mobile: emptyScreenshot(targets[1], "No se ha recibido una URL para capturar."),
      notes: ["No se ha recibido una URL para generar capturas automáticas."],
    };
  }

  const accessKey = process.env.SCREENSHOTONE_ACCESS_KEY;

  if (!accessKey) {
    return {
      desktopUrl: "",
      mobileUrl: "",
      desktop: emptyScreenshot(targets[0], "Falta configurar SCREENSHOTONE_ACCESS_KEY."),
      mobile: emptyScreenshot(targets[1], "Falta configurar SCREENSHOTONE_ACCESS_KEY."),
      notes: ["Las capturas automáticas necesitan configurar SCREENSHOTONE_ACCESS_KEY."],
    };
  }

  const [desktop, mobile] = await Promise.all(
    targets.map((target) => fetchScreenshot(normalizedUrl, target, accessKey))
  );

  const notes = [
    desktop.hasScreenshot
      ? "Captura de escritorio generada correctamente."
      : desktop.error,
    mobile.hasScreenshot
      ? "Captura móvil generada correctamente."
      : mobile.error,
  ].filter(Boolean);

  return {
    desktopUrl: desktop.dataUrl,
    mobileUrl: mobile.dataUrl,
    desktop,
    mobile,
    notes,
  };
}

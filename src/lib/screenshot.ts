import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium, type Browser, type ViewportSize } from "playwright";

export type WebsiteScreenshot = {
  label: "desktop" | "mobile";
  path: string;
  dataUrl: string;
  base64: string;
  contentType: "image/jpeg";
  width: number;
  height: number;
  hasScreenshot: boolean;
  error: string;
};

export type WebsiteScreenshots = {
  desktop: WebsiteScreenshot;
  mobile: WebsiteScreenshot;
};

const SCREENSHOT_TIMEOUT = 12000;
const SCREENSHOT_DIR = path.join(tmpdir(), "web-perception-report");

const emptyScreenshot = (
  label: WebsiteScreenshot["label"],
  width: number,
  height: number,
  error: string
): WebsiteScreenshot => ({
  label,
  path: "",
  dataUrl: "",
  base64: "",
  contentType: "image/jpeg",
  width,
  height,
  hasScreenshot: false,
  error,
});

export const emptyScreenshots = (error = "No se pudo generar la captura."): WebsiteScreenshots => ({
  desktop: emptyScreenshot("desktop", 1440, 1000, error),
  mobile: emptyScreenshot("mobile", 390, 844, error),
});

const normalizeUrl = (url: string) => {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return "";

  const urlWithProtocol = trimmedUrl.includes("://")
    ? trimmedUrl
    : `https://${trimmedUrl}`;

  return new URL(urlWithProtocol).toString();
};

const captureViewport = async ({
  browser,
  normalizedUrl,
  label,
  viewport,
}: {
  browser: Browser;
  normalizedUrl: string;
  label: WebsiteScreenshot["label"];
  viewport: ViewportSize;
}): Promise<WebsiteScreenshot> => {
  const context = await browser.newContext({
    deviceScaleFactor: 1,
    isMobile: label === "mobile",
    viewport,
  });

  try {
    const page = await context.newPage();
    page.setDefaultTimeout(SCREENSHOT_TIMEOUT);

    await page.goto(normalizedUrl, {
      timeout: SCREENSHOT_TIMEOUT,
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle", { timeout: 4000 }).catch(() => undefined);

    await mkdir(SCREENSHOT_DIR, { recursive: true });
    const filePath = path.join(
      SCREENSHOT_DIR,
      `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
    );
    const buffer = await page.screenshot({
      fullPage: false,
      path: filePath,
      quality: 72,
      timeout: SCREENSHOT_TIMEOUT,
      type: "jpeg",
    });
    const base64 = buffer.toString("base64");

    return {
      label,
      path: filePath,
      dataUrl: `data:image/jpeg;base64,${base64}`,
      base64,
      contentType: "image/jpeg",
      width: viewport.width,
      height: viewport.height,
      hasScreenshot: true,
      error: "",
    };
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "No se pudo generar la captura.";

    return emptyScreenshot(label, viewport.width, viewport.height, message);
  } finally {
    await context.close().catch(() => undefined);
  }
};

export async function captureWebsiteScreenshots(url: string): Promise<WebsiteScreenshots> {
  let normalizedUrl = "";

  try {
    normalizedUrl = normalizeUrl(url);
  } catch {
    return emptyScreenshots("La URL no tiene un formato válido para generar capturas.");
  }

  if (!normalizedUrl) {
    return emptyScreenshots("No se ha recibido una URL para generar capturas.");
  }

  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      timeout: SCREENSHOT_TIMEOUT,
    });

    const [desktop, mobile] = await Promise.all([
      captureViewport({
        browser,
        normalizedUrl,
        label: "desktop",
        viewport: { width: 1440, height: 1000 },
      }),
      captureViewport({
        browser,
        normalizedUrl,
        label: "mobile",
        viewport: { width: 390, height: 844 },
      }),
    ]);

    return { desktop, mobile };
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "No se pudo iniciar Playwright para generar capturas.";

    return emptyScreenshots(message);
  } finally {
    await browser?.close().catch(() => undefined);
  }
}

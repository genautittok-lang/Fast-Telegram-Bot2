import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, AlertTriangle } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

type Lang = "en" | "uk" | "ru" | "es" | "de";

interface PdfPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  fileName?: string;
  lang?: Lang;
}

const labels: Record<Lang, Record<string, string>> = {
  en: { title: "Report preview", page: "Page", of: "of", download: "Download PDF", loading: "Loading PDF…", error: "Failed to load PDF", zoomIn: "Zoom in", zoomOut: "Zoom out", prev: "Previous page", next: "Next page" },
  uk: { title: "Перегляд звіту", page: "Сторінка", of: "з", download: "Завантажити PDF", loading: "Завантаження PDF…", error: "Не вдалося відкрити PDF", zoomIn: "Збільшити", zoomOut: "Зменшити", prev: "Попередня сторінка", next: "Наступна сторінка" },
  ru: { title: "Просмотр отчёта", page: "Страница", of: "из", download: "Скачать PDF", loading: "Загрузка PDF…", error: "Не удалось открыть PDF", zoomIn: "Увеличить", zoomOut: "Уменьшить", prev: "Предыдущая страница", next: "Следующая страница" },
  es: { title: "Vista del informe", page: "Página", of: "de", download: "Descargar PDF", loading: "Cargando PDF…", error: "Error al cargar PDF", zoomIn: "Acercar", zoomOut: "Alejar", prev: "Página anterior", next: "Página siguiente" },
  de: { title: "Berichtsvorschau", page: "Seite", of: "von", download: "PDF herunterladen", loading: "PDF wird geladen…", error: "PDF konnte nicht geladen werden", zoomIn: "Vergrößern", zoomOut: "Verkleinern", prev: "Vorherige Seite", next: "Nächste Seite" },
};

export default function PdfPreview({ open, onOpenChange, pdfUrl, fileName = "report.pdf", lang = "en" }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadingTaskRef = useRef<ReturnType<typeof pdfjsLib.getDocument> | null>(null);
  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = labels[lang];

  useEffect(() => {
    if (!open || !pdfUrl) {
      // Cleanup when closing
      if (pdfRef.current) {
        try { pdfRef.current.destroy(); } catch {}
        pdfRef.current = null;
        setPdf(null);
      }
      if (loadingTaskRef.current) {
        try { loadingTaskRef.current.destroy(); } catch {}
        loadingTaskRef.current = null;
      }
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPageNum(1);
    setPdf(null);

    // Destroy any prior doc/task before starting new one
    if (pdfRef.current) {
      try { pdfRef.current.destroy(); } catch {}
      pdfRef.current = null;
    }
    if (loadingTaskRef.current) {
      try { loadingTaskRef.current.destroy(); } catch {}
      loadingTaskRef.current = null;
    }

    const loadingTask = pdfjsLib.getDocument({ url: pdfUrl, withCredentials: true });
    loadingTaskRef.current = loadingTask;

    (async () => {
      try {
        const doc = await loadingTask.promise;
        if (cancelled) {
          try { doc.destroy(); } catch {}
          return;
        }
        pdfRef.current = doc;
        setPdf(doc);
      } catch (err: any) {
        if (!cancelled && err?.name !== "WorkerMessageHandler" && err?.message !== "Worker was destroyed") {
          setError(err?.message || t.error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      try { loadingTask.destroy(); } catch {}
    };
  }, [open, pdfUrl, t.error]);

  // Final unmount cleanup
  useEffect(() => () => {
    if (pdfRef.current) {
      try { pdfRef.current.destroy(); } catch {}
      pdfRef.current = null;
    }
    if (loadingTaskRef.current) {
      try { loadingTaskRef.current.destroy(); } catch {}
      loadingTaskRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    let cancelled = false;
    let renderTask: pdfjsLib.RenderTask | null = null;

    (async () => {
      try {
        const page = await pdf.getPage(pageNum);
        if (cancelled || !canvasRef.current) return;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderTask = page.render({ canvasContext: ctx, viewport, canvas });
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException" && !cancelled) {
          setError(err?.message || t.error);
        }
      }
    })();

    return () => {
      cancelled = true;
      try { renderTask?.cancel(); } catch {}
    };
  }, [pdf, pageNum, scale, t.error]);

  const totalPages = pdf?.numPages || 0;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = fileName;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl bg-zinc-950 border border-cyan-500/20 p-0 overflow-hidden"
        data-testid="dialog-pdf-preview"
      >
        <DialogHeader className="px-4 py-3 border-b border-zinc-800 flex flex-row items-center justify-between gap-2 space-y-0">
          <DialogTitle className="text-sm sm:text-base text-cyan-300 font-display tracking-wide">
            {t.title}
          </DialogTitle>
        </DialogHeader>

        <div className="bg-zinc-900/40 px-3 py-2 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={pageNum <= 1 || loading}
              onClick={() => setPageNum((n) => Math.max(1, n - 1))}
              aria-label={t.prev}
              data-testid="button-pdf-prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-zinc-300 tabular-nums px-1">
              {t.page} <span className="text-cyan-300 font-medium">{pageNum}</span> {t.of} {totalPages || "—"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={pageNum >= totalPages || loading}
              onClick={() => setPageNum((n) => Math.min(totalPages, n + 1))}
              aria-label={t.next}
              data-testid="button-pdf-next"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
              aria-label={t.zoomOut}
              data-testid="button-pdf-zoom-out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-zinc-400 tabular-nums w-10 text-center">{Math.round(scale * 100)}%</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setScale((s) => Math.min(2.5, s + 0.25))}
              aria-label={t.zoomIn}
              data-testid="button-pdf-zoom-in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              className="h-7 ml-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-medium gap-1.5"
              data-testid="button-pdf-download"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.download}</span>
            </Button>
          </div>
        </div>

        <div className="bg-zinc-950/80 max-h-[70vh] overflow-auto p-4 flex items-start justify-center">
          {loading && (
            <div className="flex flex-col items-center gap-2 py-12 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <span className="text-xs">{t.loading}</span>
            </div>
          )}
          {error && !loading && (
            <div className="flex flex-col items-center gap-2 py-12 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <span className="text-xs">{error}</span>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className={`${loading || error ? "hidden" : "block"} shadow-[0_0_24px_rgba(34,211,238,0.08)] bg-white rounded-sm`}
            data-testid="canvas-pdf-page"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

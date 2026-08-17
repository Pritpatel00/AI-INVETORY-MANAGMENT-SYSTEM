"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  ImagePlus,
  Loader2,
  RefreshCcw,
  X,
} from "lucide-react";

import {
  fetchEvidenceObjectUrl,
  fetchTransactionEvidence,
  type ApiEvidence,
} from "../api/inventory-api";

interface TransactionEvidenceProps {
  transactionId: string;
  /** Known photo count from the transaction summary (shown on the badge). */
  evidenceCount?: number;
  /** Inline mode auto-loads and renders the section (used in details panels). */
  inline?: boolean;
}

/**
 * Manager photo-evidence viewer for one transaction.
 *
 * The metadata list comes from GET /transactions/:id/evidence (which never
 * exposes the physical storage path) and the pixels are fetched through the
 * authenticated file endpoint as object URLs. Every object URL created here is
 * revoked when the preview closes or the component unmounts.
 */
export function TransactionEvidence({
  transactionId,
  evidenceCount = 0,
  inline = false,
}: TransactionEvidenceProps) {
  const [open, setOpen] = useState(inline);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<ApiEvidence[]>([]);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<{
    evidence: ApiEvidence;
    url: string;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const createdUrlsRef = useRef<Set<string>>(new Set());

  const revokeAll = useCallback(() => {
    createdUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    createdUrlsRef.current.clear();
  }, []);

  // Revoke every object URL this component created when it unmounts.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      revokeAll();
    };
  }, [revokeAll]);

  const loadEvidence = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchTransactionEvidence(transactionId);
      if (!mountedRef.current) return;
      setEvidence(rows);
      // Refresh thumbnails: revoke previous URLs before creating new ones.
      revokeAll();
      const next: Record<string, string> = {};
      await Promise.all(
        rows.slice(0, 12).map(async (entry) => {
          try {
            const url = await fetchEvidenceObjectUrl(entry.id);
            if (!mountedRef.current) {
              URL.revokeObjectURL(url);
              return;
            }
            next[entry.id] = url;
            createdUrlsRef.current.add(url);
          } catch {
            // Leave the placeholder; the preview will surface the error.
          }
        }),
      );
      if (mountedRef.current) setThumbnailUrls(next);
    } catch (caught) {
      if (mountedRef.current) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Photo evidence could not be loaded.",
        );
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [transactionId, revokeAll]);

  // Inline mode (an open transaction details panel) loads right after mount.
  // Deferred past the synchronous effect body so the initial state updates
  // happen after the first render.
  useEffect(() => {
    if (!inline) return undefined;
    const timer = window.setTimeout(() => void loadEvidence(), 0);
    return () => window.clearTimeout(timer);
  }, [inline, loadEvidence]);

  function openViewer() {
    setOpen(true);
    void loadEvidence();
  }

  async function openPreview(entry: ApiEvidence) {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const url = await fetchEvidenceObjectUrl(entry.id);
      if (!mountedRef.current) {
        URL.revokeObjectURL(url);
        return;
      }
      setPreview({ evidence: entry, url });
    } catch (caught) {
      if (mountedRef.current) {
        setPreviewError(
          caught instanceof Error ? caught.message : "The photo could not be opened.",
        );
      }
    } finally {
      if (mountedRef.current) setPreviewLoading(false);
    }
  }

  function closePreview() {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setPreviewError(null);
  }

  const hasPhotos = (evidence.length > 0 || evidenceCount > 0) && !loading;

  return (
    <>
      {!inline && evidenceCount > 0 && (
        <button
          type="button"
          onClick={openViewer}
          className="inline-flex items-center gap-2 rounded-lg border border-[#b9d0f8] bg-[#f2f6ff] px-3 py-1.5 text-[11px] font-extrabold text-[#155eef] transition hover:bg-[#eaf2ff]"
        >
          <Camera size={14} />
          View evidence
          <span className="rounded-full bg-[#155eef] px-1.5 py-0.5 text-[9px] font-extrabold text-white">
            {evidence.length > 0 ? evidence.length : evidenceCount}
          </span>
        </button>
      )}

      {open && (
        <section
          aria-label="Photo evidence"
          className="rounded-xl border border-[#e6edf5] bg-[#f9fbfd] px-4 py-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0e7490]">
              <Camera size={13} /> Photo evidence
              {hasPhotos && (
                <span className="rounded-full bg-[#e0f7fb] px-2 py-0.5 text-[10px]">
                  {evidence.length > 0 ? evidence.length : evidenceCount}
                </span>
              )}
            </p>
            {!inline && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close photo evidence"
                className="rounded-lg border border-[#d5e1f0] bg-white p-1.5 text-[#66809f] transition hover:text-[#155eef]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {loading ? (
            <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#9aabc1]">
              <Loader2 size={14} className="animate-spin" />
              Loading photo evidence…
            </p>
          ) : error ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f3c0c0] bg-[#fff1f1] px-4 py-3">
              <p className="flex items-center gap-2 text-xs font-semibold text-[#a12f2f]">
                <AlertTriangle size={14} />
                {error}
              </p>
              <button
                type="button"
                onClick={() => void loadEvidence()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#a12f2f] px-3 py-1.5 text-[10px] font-extrabold text-white"
              >
                <RefreshCcw size={12} /> Try again
              </button>
            </div>
          ) : evidence.length === 0 ? (
            <p className="mt-3 text-xs font-semibold text-[#9aabc1]">
              No photo evidence attached to this transaction.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {evidence.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => void openPreview(entry)}
                  aria-label={`Preview ${entry.originalFilename}`}
                  className="group overflow-hidden rounded-lg border border-[#d5e1f0] bg-white text-left transition hover:border-[#155eef]"
                >
                  {thumbnailUrls[entry.id] ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- Authenticated object URL cannot be optimized by next/image. */
                    <img
                      src={thumbnailUrls[entry.id]}
                      alt={entry.originalFilename}
                      className="h-16 w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-16 w-full place-items-center bg-[#eef3f9] text-[#9aabc1]">
                      <ImagePlus size={16} />
                    </div>
                  )}
                  <span className="block truncate px-1.5 py-1 text-[9px] font-bold text-[#6c829f]">
                    {entry.originalFilename}
                  </span>
                  <span className="block truncate px-1.5 pb-1.5 text-[9px] font-semibold text-[#9aabc1]">
                    {entry.uploadedBy?.displayName ?? "Unknown"} ·{" "}
                    {new Intl.DateTimeFormat("en", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(entry.createdAt))}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo preview — ${preview.evidence.originalFilename}`}
          className="fixed inset-0 z-50 grid place-items-center bg-[#0a1a33]/80 p-4 backdrop-blur-sm"
          onClick={closePreview}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-[#e6edf6] px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-[#17345f]">
                  {preview.evidence.originalFilename}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-[#7b8fa9]">
                  Uploaded by {preview.evidence.uploadedBy?.displayName ?? "Unknown"} ·{" "}
                  {new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(preview.evidence.createdAt))}
                </p>
              </div>
              <button
                type="button"
                onClick={closePreview}
                aria-label="Close photo preview"
                className="rounded-lg border border-[#d5e1f0] bg-white p-2 text-[#66809f] transition hover:text-[#155eef]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid max-h-[70vh] place-items-center overflow-auto bg-[#0f1e38] p-3">
              {previewLoading ? (
                <p className="flex items-center gap-2 py-16 text-sm font-bold text-[#a9c6ff]">
                  <Loader2 size={18} className="animate-spin" /> Loading photo…
                </p>
              ) : previewError ? (
                <p className="py-16 text-sm font-bold text-[#ffb4b4]">
                  {previewError}
                </p>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element -- Authenticated object URL cannot be optimized by next/image. */
                <img
                  src={preview.url}
                  alt={preview.evidence.originalFilename}
                  className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

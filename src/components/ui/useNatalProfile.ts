"use client";
import { useEffect, useRef, useState } from "react";
import type { NatalProfileReport, ProfileDepth } from "@/lib/natalProfile";
import { publicMessage } from "./chartPresentation";

export function useNatalProfile(birthKey: string, contextId?: string) {
  const [depth, setDepth] = useState<ProfileDepth>("standard");
  const [saved, setSaved] = useState<{ key: string; reports: Partial<Record<ProfileDepth, NatalProfileReport>> }>({ key: birthKey, reports: {} });
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const generation = useRef<AbortController | null>(null);
  const download = useRef<AbortController | null>(null);
  const currentKey = useRef(birthKey);
  currentKey.current = birthKey;
  useEffect(() => {
    generation.current?.abort(); generation.current = null;
    download.current?.abort(); download.current = null;
    setSaved({ key: birthKey, reports: {} }); setBusy(false); setPdfBusy(false); setError(null); setPdfError(null);
    return () => { generation.current?.abort(); download.current?.abort(); };
  }, [birthKey]);
  const report = saved.key === birthKey ? saved.reports[depth] ?? null : null;
  async function generate() {
    if (!contextId || generation.current) return;
    const key = birthKey;
    const controller = new AbortController(); generation.current = controller;
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/astrology/natal-profile", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contextId, depth }), signal: controller.signal });
      const data = await response.json();
      if (!response.ok || data.report?.kind !== "natal-profile" || data.report?.depth !== depth) throw new Error(data.error || "Could not prepare your birth profile. Please retry.");
      if (controller.signal.aborted || currentKey.current !== key) return;
      setSaved(previous => ({ key, reports: { ...(previous.key === key ? previous.reports : {}), [depth]: data.report } }));
    } catch (err) {
      if (!controller.signal.aborted && currentKey.current === key) setError(publicMessage(err, "Could not prepare your birth profile. Please retry."));
    } finally {
      if (generation.current === controller) { generation.current = null; setBusy(false); }
    }
  }
  async function exportPdf() {
    if (!report || download.current) return;
    const key = birthKey;
    const controller = new AbortController(); download.current = controller;
    setPdfBusy(true); setPdfError(null);
    try {
      const response = await fetch("/api/astrology/natal-profile/pdf", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.id }), signal: controller.signal });
      if (!response.ok) { const data = await response.json().catch(() => null); throw new Error(data?.error || "Could not export your profile. Please retry."); }
      const blob = await response.blob();
      if (controller.signal.aborted || currentKey.current !== key) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `myAeon-birth-profile-${report.depth}.pdf`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      if (!controller.signal.aborted && currentKey.current === key) setPdfError(publicMessage(err, "Could not export your profile. Please retry."));
    } finally {
      if (download.current === controller) { download.current = null; setPdfBusy(false); }
    }
  }
  return { report, depth, setDepth, busy, pdfBusy, error, pdfError, generate, exportPdf };
}
export type NatalProfileControls = ReturnType<typeof useNatalProfile>;

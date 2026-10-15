"use client";
import { Download, LoaderCircle, Sparkles } from "lucide-react";
import type { NatalProfileControls } from "./useNatalProfile";

export default function NatalProfilePanel({ controls, available, onRecalculate, chartLoading }: { controls: NatalProfileControls; available: boolean; onRecalculate?: () => void; chartLoading?: boolean }) {
  const { report, depth, setDepth, busy, pdfBusy, error, pdfError, generate, exportPdf } = controls;
  return <section aria-label="Independent birth profile" className="space-y-5 text-sm leading-6">
    <p>Explore the personality, interests, strengths and communication patterns traditionally associated with your natal chart. This is a symbolic reflection, shaped by your lived experience.</p>
    <div className="chart-segments" role="group" aria-label="Profile depth">
      <button type="button" disabled={busy} aria-pressed={depth === "standard"} onClick={() => setDepth("standard")}>Standard</button>
      <button type="button" disabled={busy} aria-pressed={depth === "deep"} onClick={() => setDepth("deep")}>Deep analysis</button>
    </div>
    <p className="text-xs opacity-70">{depth === "deep" ? "A fuller exploration of interacting placements, tensions, everyday examples and constructive reflection." : "An accessible overview of eight areas of your natal profile, with supporting chart facts."} Generated independently of your daily or full reading.</p>
    {!available && !report && <p role="status">Calculate a chart with a known or estimated birth time to generate your profile.</p>}
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={() => void generate()} disabled={!available || busy} aria-busy={busy} className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--panel-border)] px-4 disabled:opacity-50">
        {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
        {busy ? "Preparing your profile…" : report ? "Refresh saved profile" : error ? "Retry profile" : depth === "deep" ? "Generate deep analysis" : "Generate birth profile"}
      </button>
      {report && <button type="button" onClick={() => void exportPdf()} disabled={pdfBusy} aria-busy={pdfBusy} className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--panel-border)] px-4 disabled:opacity-50"><Download size={16} />{pdfBusy ? "Preparing PDF…" : "Download profile PDF"}</button>}
    </div>
    {onRecalculate && <button type="button" disabled={busy || chartLoading} onClick={onRecalculate} className="min-h-11 text-xs underline underline-offset-4 disabled:opacity-50">{chartLoading ? "Calculating chart…" : "Confirm details / recalculate chart"}</button>}
    {busy && <p role="status" className="text-xs opacity-70">This can take up to two minutes. You can close this panel while it prepares.</p>}
    {error && <p role="alert" className="text-red-400">{error}</p>}
    {pdfError && <p role="alert" className="text-red-400">{pdfError}</p>}
    {report && <article className="space-y-6" aria-label="Generated birth profile">
      <div><h3 className="text-xl font-medium text-astral-gold">{report.title}</h3><p className="mt-1 text-xs opacity-65">{report.depth === "deep" ? "Deep analysis" : "Standard profile"} · {report.birth.date} · {report.birth.localTime} {report.birth.timezone} · {report.birth.confidence} time</p><p className="mt-3 whitespace-pre-line">{report.overview}</p></div>
      <aside className="rounded-lg border border-[var(--panel-border)] p-3 text-xs opacity-80">{report.limitations.map(line => <p key={line} className="mb-2 last:mb-0">{line}</p>)}</aside>
      {report.sections.map(section => <section key={section.key}>
        <h4 className="mb-2 text-base font-medium text-astral-cyan">{section.title}</h4><p className="whitespace-pre-line">{section.body}</p>
        <details className="mt-2 text-xs opacity-75"><summary className="cursor-pointer py-2">Supporting chart facts</summary><ul className="list-disc space-y-1 pl-5">{section.evidence.map(item => <li key={item.id}>{item.text}</li>)}</ul></details>
      </section>)}
      <section><h4 className="mb-2 text-base font-medium text-astral-cyan">Bringing the patterns together</h4><p className="whitespace-pre-line">{report.synthesis}</p></section>
      <section><h4 className="mb-2 text-base font-medium text-astral-cyan">Questions for reflection</h4><ul className="list-disc space-y-2 pl-5">{report.reflections.map((question, index) => <li key={index}>{question}</li>)}</ul></section>
      <p className="text-xs opacity-60">Prepared {new Date(report.generatedAt).toLocaleString("en-GB")}.</p>
    </article>}
    <p className="text-xs opacity-65">Profiles are held temporarily for up to 24 hours and may expire earlier after a restart or cache cleanup. Save the PDF to keep a copy. Refresh reuses a saved result when available; an expired result is generated again.</p>
  </section>;
}

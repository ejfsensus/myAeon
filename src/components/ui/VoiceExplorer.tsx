"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AudioLines, X, Mic, MicOff, Volume2, VolumeX, Send } from "lucide-react";
import { AgentProvider, Orb, useAgentContext } from "@deepgram/ui";
import type { AgentSessionConfig } from "@deepgram/agents";
import type { ReadingPayload } from "./types";
import Link from "next/link";
import { publicMessage } from "./chartPresentation";
type Props = { selectedFeature?: {name:string;frame:"natal"|"transit";date:string}|null; theme?: "dark" | "light"; profileId?: string; contextId?: string; onUsageRefresh: () => void; reading: ReadingPayload | null; viewedDate: string; selectedPlanet: string | null; onStart: () => void; open: boolean; onOpen: () => void; onClose: () => void };

function Conversation({ theme, onEnd }: { theme: "dark" | "light"; onEnd: (error?: string) => void }) {
  const agent = useAgentContext();
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [compact, setCompact] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const active = agent.state === "connected";
  const connecting = agent.state === "connecting" || agent.state === "reconnecting";
  useEffect(() => {
    const update = () => setCompact((window.visualViewport?.height || window.innerHeight) < 600);
    update(); window.addEventListener("resize", update); window.visualViewport?.addEventListener("resize", update);
    return () => { window.removeEventListener("resize", update); window.visualViewport?.removeEventListener("resize", update); };
  }, []);
  useEffect(() => {
    const failed = () => { agent.stop(); onEnd("Voice connection interrupted. Check microphone access and try again."); };
    agent.session.on("error", failed); agent.session.on("sdk-error", failed);
    return () => { agent.session.off("error", failed); agent.session.off("sdk-error", failed); };
  }, [agent.session, agent.stop, onEnd]);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [agent.conversation]);
  return <>
    <div className={`flex shrink-0 items-center gap-3 ${compact ? "flex-row justify-center px-4 py-2" : "flex-col py-3"}`}>
      <div className="zeus-portrait" data-speaking={agent.isSpeaking}><img src={`/zeus/${theme}.png`} width={compact ? 64 : 180} height={compact ? 64 : 180} alt="Zeus, your wise celestial guide" /></div><Orb size={compact ? 28 : 42} colors={["#d4a437", "#38b8c9"]} state={agent.isSpeaking ? "talking" : agent.isListening ? "listening" : "idle"} getInputVolume={agent.getInputVolume} getOutputVolume={agent.getOutputVolume} />
      <div className="flex flex-col items-center gap-3">
      <p aria-live="polite" className="h-5 text-sm opacity-70">{connecting ? "Connecting..." : active ? agent.isSpeaking ? "Zeus is speaking" : agent.micMuted ? "Microphone muted" : "Listening" : ""}</p>
      <div className="flex items-center gap-3">
        <button disabled={connecting} onClick={async () => { setError(null); if (active) { agent.stop(); onEnd(); } else try { await agent.start(); } catch { onEnd("Allow microphone access in your browser and try again."); } }} className="flex min-h-12 items-center justify-center rounded-lg bg-[#d4a437] px-5 text-sm font-semibold text-[#15120b] disabled:opacity-50">{active ? "End" : connecting ? "Connecting..." : "Start conversation"}</button>
        {active && <><button title={agent.micMuted ? "Unmute microphone" : "Mute microphone"} aria-label={agent.micMuted ? "Unmute microphone" : "Mute microphone"} aria-pressed={agent.micMuted} onClick={() => agent.setMicMuted(!agent.micMuted)} className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--panel-border)]">{agent.micMuted ? <MicOff size={20} /> : <Mic size={20} />}</button><button title={agent.outputMuted ? "Unmute speaker" : "Mute speaker"} aria-label={agent.outputMuted ? "Unmute speaker" : "Mute speaker"} aria-pressed={agent.outputMuted} onClick={() => agent.setOutputMuted(!agent.outputMuted)} className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--panel-border)]">{agent.outputMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}</button></>}
      </div>
      </div>
    </div>
    {error && <p role="alert" className="mx-5 mb-3 text-sm text-red-500">{error}</p>}
    <div role="log" aria-label="Conversation transcript" className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 text-base leading-7">{agent.conversation.map(turn => <div key={turn.id} className="border-b border-[var(--panel-border)] py-4"><p className="mb-1 text-xs font-medium opacity-60">{turn.role === "user" ? "You" : "Zeus"}</p><p>{turn.content}</p></div>)}<div ref={end} /></div>
    {active && <form className="mx-5 mb-3 flex shrink-0 gap-2" onSubmit={event => { event.preventDefault(); if (input.trim()) { agent.sendUserMessage(input.trim()); setInput(""); } }}><input aria-label="Message Zeus" placeholder="Ask Zeus..." maxLength={2000} value={input} onChange={event => setInput(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-[var(--panel-border)] bg-[var(--field-bg)] px-3 text-base" /><button title="Send message" aria-label="Send message" disabled={!input.trim()} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[var(--panel-border)] disabled:opacity-40"><Send size={18} /></button></form>}
  </>;
}

export default function VoiceExplorer({ selectedFeature, theme = "dark", profileId, contextId, onUsageRefresh, reading, viewedDate, selectedPlanet, onStart, open, onOpen, onClose }: Props) {
  const [textMode, setTextMode] = useState(false);
  const [question,setQuestion] = useState('');
  const [messages,setMessages] = useState<Array<{role:string;text:string}>>([]);
  const [asking,setAsking] = useState(false);
  const textRequest=useRef<AbortController|null>(null);
  useEffect(()=>{if(!open){textRequest.current?.abort();setAsking(false);}return()=>textRequest.current?.abort();},[open]);
  const ask = async (value:string) => {
    if(!value.trim()||asking)return;
    const controller=new AbortController();textRequest.current=controller;setAsking(true);setError(null);setQuestion('');
    setMessages(items=>[...items,{role:'You',text:value}]);
    try {startRef.current();const response=await fetch('/api/explore/session',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({context:context.current,message:value,history:messages.slice(-6)})});const result=await response.json();if(!response.ok)throw new Error(result.error);setMessages(items=>[...items,{role:'Zeus',text:result.reply}]);}
    catch(error){if(!controller.signal.aborted)setError(publicMessage(error,'Could not reach Zeus. Please retry.'));}
    finally{if(textRequest.current===controller)setAsking(false);}
  };
  const [error, setError] = useState<string | null>(null);
  const [sessionVersion, setSessionVersion] = useState(0);
  const [viewportHeight, setViewportHeight] = useState<number>();
  const context = useRef({ reading, viewedDate, selectedPlanet, selectedFeature, profileId, contextId });
  const token = useRef<string | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const launchButton = useRef<HTMLButtonElement>(null);
  const startRef = useRef(onStart);
  startRef.current = onStart; context.current = { reading, viewedDate, selectedPlanet, selectedFeature, profileId, contextId };
  const config = useMemo<AgentSessionConfig>(() => ({
    url: `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/explore`, reconnect: { enabled: false },
    auth: { tokenFactory: async () => {
      startRef.current(); setError(null);
      const response = await fetch("/api/explore/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ context: context.current }) });
      const data = await response.json();
      if (!response.ok) { setError(publicMessage(data.error, "Could not start conversation. Please try again.")); throw new Error("Session unavailable"); }
      token.current = data.token; return data.token;
    } },
    agent: { think: { provider: { type: "anthropic", model: "claude-sonnet-4-6" } } },
    audio: { input: { encoding: "linear16", sampleRate: 16000 }, output: { encoding: "linear16", sampleRate: 24000 } },
  }), []);
  useEffect(() => {
    if (!open || !token.current) return;
    const controller = new AbortController();
    void fetch("/api/explore/session", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: token.current, context: context.current }) }).then(res => { if (!res.ok && res.status !== 410) setError("Restart the conversation to use your latest reading."); }).catch(() => { if (!controller.signal.aborted) setError("Could not refresh conversation context."); });
    return () => controller.abort();
  }, [reading, viewedDate, selectedPlanet, selectedFeature, profileId, contextId, open]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const updateHeight = () => setViewportHeight(window.visualViewport?.height || window.innerHeight);
    updateHeight(); window.visualViewport?.addEventListener("resize", updateHeight); window.addEventListener("resize", updateHeight);
    setError(null); token.current = null; closeButton.current?.focus();
    return () => { onUsageRefresh(); window.visualViewport?.removeEventListener("resize", updateHeight); window.removeEventListener("resize", updateHeight); token.current = null; requestAnimationFrame(() => previous?.isConnected ? previous.focus() : launchButton.current?.focus()); };
  }, [open, onUsageRefresh]);
  return <>
    <button ref={launchButton} type="button" onClick={onOpen} aria-label="Talk to Zeus" className="zeus-legacy-launch fixed left-1/2 top-6 z-40 hidden min-h-11 -translate-x-1/2 items-center gap-2 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-strong-bg)] px-3 text-sm text-[var(--app-text)] shadow-lg md:flex"><AudioLines size={18} /> Talk to Zeus</button>
    {open && <div className="fixed inset-0 z-[100] flex justify-end bg-black/45 backdrop-blur-sm" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="voice-heading" style={{ height: viewportHeight ?? "100dvh" }} className="flex w-full flex-col bg-[var(--app-bg)] text-[var(--app-text)] shadow-2xl md:max-w-md" onClick={event => event.stopPropagation()} onKeyDown={event => {
        if (event.key === "Escape") onClose();
        if (event.key === "Tab") { const elements = event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex="0"], a[href]'); const first = elements[0]; const last = elements[elements.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }
      }}>
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--panel-border)] px-5 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)]"><div><h2 id="voice-heading" className="text-lg font-medium">Talk to Zeus</h2><p className="mt-1 text-xs opacity-60">{reading ? "Your reading and the sky" : "The sky and astrology"}</p></div><button ref={closeButton} onClick={onClose} aria-label="Close and end conversation" className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10"><X size={20} /></button></header>
        {error && <p role="alert" className="mx-5 mt-3 text-sm text-red-500">{error}</p>}
        <div className="zeus-mode" role="group" aria-label="Conversation mode"><button aria-pressed={!textMode} onClick={()=>{textRequest.current?.abort();setTextMode(false);}}>Voice</button><button aria-pressed={textMode} onClick={()=>{token.current=null;setTextMode(true);}}>Text · no microphone</button></div>
        {textMode ? <><div className="zeus-suggestions">{['Explain today’s sky','Help me understand my reading','Explore the selected placement'].map(q=><button key={q} disabled={asking} onClick={()=>void ask(q)}>{q}</button>)}</div><div className="zeus-text-log" role="log" aria-label="Conversation transcript">{messages.map((m,i)=><div key={i}><strong>{m.role}</strong><p>{m.text}</p></div>)}{asking&&<p role="status">Zeus is reflecting…</p>}</div><form className="zeus-text-form" onSubmit={e=>{e.preventDefault();void ask(question);}}><input aria-label="Message Zeus without a microphone" value={question} onChange={e=>setQuestion(e.target.value)} maxLength={2000} placeholder="What would you like to explore?"/><button disabled={asking||!question.trim()}>Send</button></form></> : <AgentProvider key={sessionVersion} config={config} tts><Conversation theme={theme} onEnd={message => { token.current = null; onUsageRefresh(); setError(message || null); setSessionVersion(value => value + 1); }} /></AgentProvider>}
        <p style={{ display: viewportHeight && viewportHeight < 320 ? "none" : undefined }} className="shrink-0 border-t border-[var(--panel-border)] px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 text-xs leading-5 opacity-60">Audio, messages and selected chart facts are processed remotely when you start a conversation. Astrology offers reflection, not certainty. <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Privacy policy</Link></p>
      </section>
    </div>}
  </>;
}

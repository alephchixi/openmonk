"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { OpenMonkMode, OpenMonkParams, OpenMonkSession } from "@/lib/openmonk/types";
import { MODE_DEFAULTS } from "@/lib/openmonk/constants";
import { createSession, transitionSession } from "@/lib/openmonk/session";
import { getAudioRoute } from "@/lib/openmonk/audio-prompts";
import { OpenMonkAudioEngine } from "@/lib/openmonk/audio-engine";
import { parseCommand, isParseError, resolveDuration } from "@/lib/openmonk/commands";
import { generateAudio } from "@/lib/openmonk/providers";
import type { AudioProvider } from "@/lib/openmonk/providers/types";
import { UI_COPY, translateCommandError, type UiLanguage } from "@/lib/openmonk/i18n";
import { ModeSelector } from "./ModeSelector";
import { ParameterControls } from "./ParameterControls";
import { ProviderSelector } from "./ProviderSelector";
import { ParticleGlyph } from "./ParticleGlyph";
import { SessionDisplay } from "./SessionDisplay";
import { CommandInput } from "./CommandInput";
import { InfoModal } from "./InfoModal";

export function OpenMonkPanel() {
  const [selectedMode, setSelectedMode] = useState<OpenMonkMode>("zen");
  const [durationMin, setDurationMin] = useState(5);
  const [params, setParams] = useState<OpenMonkParams>(MODE_DEFAULTS.zen.params);
  const [provider, setProvider] = useState<AudioProvider>("synth");
  const [session, setSession] = useState<OpenMonkSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [engine] = useState(() => new OpenMonkAudioEngine());
  const [volume] = useState(0.7);
  const [muted] = useState(false);
  const [commandError, setCommandError] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [language, setLanguage] = useState<UiLanguage>("en");

  const sessionRef = useRef<OpenMonkSession | null>(null);
  const engineRef = useRef(engine);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const operationRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const isActive = session !== null && session.state !== "idle" && session.state !== "complete" && session.state !== "error";
  const copy = UI_COPY[language];

  useEffect(() => { sessionRef.current = session; }, [session]);

  useEffect(() => {
    const stored = window.localStorage.getItem("openmonk-language");
    if (stored === "en" || stored === "es") setLanguage(stored);
  }, []);

  // Theme toggle on background click
  function handleBackgroundClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.closest("button, input, a, .modal-overlay")) return;
    if (target !== e.currentTarget && !target.classList.contains("particle-canvas-wrapper") && !target.classList.contains("particle-canvas")) return;
    document.documentElement.classList.toggle("light");
  }

  const clearEndTimeout = useCallback(() => {
    if (endTimeoutRef.current) {
      clearTimeout(endTimeoutRef.current);
      endTimeoutRef.current = null;
    }
  }, []);

  const completeSession = useCallback((sessionId?: string) => {
    engineRef.current.stop({ fadeOutMs: 2000 });
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    clearEndTimeout();
    setSession((prev) => {
      if (!prev) return null;
      if (sessionId && prev.id !== sessionId) return prev;
      const result = transitionSession(prev, "complete");
      if (!result) return prev;
      return { ...prev, state: result.state, status: result.status, endedAt: new Date().toISOString() };
    });
  }, [clearEndTimeout]);

  const stopSession = useCallback(() => {
    operationRef.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    engineRef.current.stop({ fadeOutMs: 0 });
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    clearEndTimeout();
    setSession((prev) => {
      if (!prev) return null;
      const result = transitionSession(prev, "stop");
      if (!result) return prev;
      return { ...prev, state: result.state, status: result.status, endedAt: new Date().toISOString() };
    });
  }, [clearEndTimeout]);

  // Timer
  useEffect(() => {
    if (!session || !isActive) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    if (session.durationSeconds === 0) return;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        const cur = sessionRef.current;
        if (cur && next >= cur.durationSeconds) {
          setTimeout(() => completeSession(cur.id), 0);
          return cur.durationSeconds;
        }
        return next;
      });
    }, 1000);

    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [session?.id, isActive, completeSession]);

  // Escape
  useEffect(() => {
    if (!isActive) return;
    function onKeyDown(e: KeyboardEvent) { if (e.key === "Escape") stopSession(); }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isActive, stopSession]);

  // Cleanup
  useEffect(() => {
    return () => {
      operationRef.current++;
      abortRef.current?.abort();
      engineRef.current.dispose();
      if (timerRef.current) clearInterval(timerRef.current);
      clearEndTimeout();
    };
  }, [clearEndTimeout]);

  const handleModeChange = useCallback((mode: OpenMonkMode) => {
    setSelectedMode(mode);
    setParams(MODE_DEFAULTS[mode].params);
    const defaultDur = MODE_DEFAULTS[mode].durationSeconds;
    setDurationMin(defaultDur > 0 ? defaultDur / 60 : 5);
    setCommandError("");
  }, []);

  const handleLanguageToggle = useCallback(() => {
    setLanguage((current) => {
      const next = current === "en" ? "es" : "en";
      window.localStorage.setItem("openmonk-language", next);
      return next;
    });
  }, []);

  const handleParamChange = useCallback((key: keyof OpenMonkParams, value: string) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const beginSession = useCallback(async (
    mode: OpenMonkMode,
    durationSeconds: number,
    sessionParams: OpenMonkParams
  ) => {
    operationRef.current++;
    abortRef.current?.abort();
    clearEndTimeout();

    const operationId = operationRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    const newSession = createSession(mode, durationSeconds, sessionParams);

    const prepResult = transitionSession(newSession, "prepare");
    if (prepResult) { newSession.state = prepResult.state; newSession.status = prepResult.status; }
    newSession.startedAt = new Date().toISOString();
    setElapsed(0);
    setCommandError("");

    const audioRoute = getAudioRoute(mode);

    if (audioRoute === "none") {
      const playResult = transitionSession(newSession, "silence");
      if (playResult) { newSession.state = playResult.state; newSession.status = playResult.status; }
      setSession({ ...newSession });
      return;
    }

    setSession({ ...newSession });

    try {
      await engine.prepare();
      if (operationRef.current !== operationId || controller.signal.aborted) return;

      const result = await generateAudio(provider, {
        mode,
        durationSeconds,
        params: sessionParams,
        signal: controller.signal,
      });

      if (operationRef.current !== operationId || controller.signal.aborted) return;

      await engine.start(result.buffer, {
        loop: result.loop,
        fadeInMs: 2000,
        volume,
      });

      if (operationRef.current !== operationId || controller.signal.aborted) {
        await engine.stop({ fadeOutMs: 0 });
        return;
      }

      if (muted) engine.mute();

      const playResult = transitionSession(newSession, "play");
      if (playResult) { newSession.state = playResult.state; newSession.status = playResult.status; }
      setSession({ ...newSession });

    } catch (err) {
      if (operationRef.current !== operationId || controller.signal.aborted) return;
      console.error("[OpenMonk]", err);
      setCommandError(err instanceof Error ? err.message : "Audio generation failed.");
      const errResult = transitionSession(newSession, "error");
      if (errResult) { newSession.state = errResult.state; newSession.status = errResult.status; }
      setSession({ ...newSession });
    } finally {
      if (operationRef.current === operationId) abortRef.current = null;
    }
  }, [provider, volume, muted, engine, completeSession, clearEndTimeout]);

  const handleBegin = useCallback(() => {
    const durationSec = durationMin * 60;
    void beginSession(selectedMode, durationSec, params);
  }, [selectedMode, durationMin, params, beginSession]);

  const handleCommand = useCallback((input: string) => {
    const result = parseCommand(input);
    if (isParseError(result)) { setCommandError(result.message); return; }
    setCommandError("");
    const nextParams = { ...MODE_DEFAULTS[result.mode].params, ...result.params };
    const durationSec = resolveDuration(result);
    setSelectedMode(result.mode);
    setParams(nextParams);
    setDurationMin(durationSec > 0 ? durationSec / 60 : 5);
    void beginSession(result.mode, durationSec, nextParams);
  }, [beginSession]);

  return (
    <div className="instrument" onClick={handleBackgroundClick}>
      <h1 className="instrument-heading">
        <button
          type="button"
          className="instrument-title"
          onClick={() => setShowInfo(true)}
          aria-haspopup="dialog"
        >
          OpenMonk
        </button>
      </h1>

      <ParticleGlyph
        mode={isActive ? (session?.mode ?? selectedMode) : selectedMode}
        active={isActive}
        elapsed={elapsed}
        duration={session?.durationSeconds ?? 0}
      />

      <SessionDisplay
        state={session?.state ?? "idle"}
        status={session?.status}
        elapsed={elapsed}
        duration={session?.durationSeconds ?? 0}
        copy={copy}
      />

      {!isActive && (
        <>
          <ModeSelector selected={selectedMode} onChange={handleModeChange} copy={copy} />

          <div className="controls-group">
            <ParameterControls
              mode={selectedMode}
              durationMin={durationMin}
              params={params}
              onDurationChange={setDurationMin}
              onParamChange={handleParamChange}
              copy={copy}
            />
            <ProviderSelector selected={provider} onChange={setProvider} copy={copy} />
          </div>

          <button type="button" className="begin-btn" onClick={handleBegin} id="begin-btn">
            <span className="begin-glow" aria-hidden="true" />
            {copy.begin}
          </button>
        </>
      )}

      {isActive && (
        <button
          type="button"
          className="stop-btn"
          onClick={stopSession}
          id="stop-btn"
          aria-label={copy.stopSession}
        >
          {copy.stop}
        </button>
      )}

      <div className="footer-area">
        <CommandInput
          onSubmit={handleCommand}
          error={translateCommandError(commandError, language)}
          disabled={isActive}
          copy={copy}
        />

        <button
          type="button"
          className="language-toggle"
          onClick={handleLanguageToggle}
          aria-label={copy.languageToggleLabel}
        >
          {copy.languageToggle}
        </button>
      </div>

      <InfoModal open={showInfo} onClose={() => setShowInfo(false)} copy={copy} />
    </div>
  );
}

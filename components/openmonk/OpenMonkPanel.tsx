"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { OpenMonkMode, OpenMonkParams, OpenMonkSession } from "@/lib/openmonk/types";
import { MODE_DEFAULTS } from "@/lib/openmonk/constants";
import { createSession, transitionSession } from "@/lib/openmonk/session";
import { getAudioRoute } from "@/lib/openmonk/audio-prompts";
import { OpenMonkAudioEngine, AudioUnavailableError } from "@/lib/openmonk/audio-engine";
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
import { SettingsSheet } from "./SettingsSheet";

export function OpenMonkPanel() {
  const [selectedMode, setSelectedMode] = useState<OpenMonkMode>("zen");
  const [durationMin, setDurationMin] = useState(5);
  const [params, setParams] = useState<OpenMonkParams>(MODE_DEFAULTS.zen.params);
  const [provider, setProvider] = useState<AudioProvider>("synth");
  const [session, setSession] = useState<OpenMonkSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [engine] = useState(() => new OpenMonkAudioEngine());
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [commandError, setCommandError] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState<UiLanguage>("en");
  const [isDark, setIsDark] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const sessionRef = useRef<OpenMonkSession | null>(null);
  const engineRef = useRef(engine);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const operationRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const persistDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const instrumentRef = useRef<HTMLDivElement | null>(null);
  const amplitudeRef = useRef(0);

  const isActive = session !== null && session.state !== "idle" && session.state !== "complete" && session.state !== "error";
  const copy = UI_COPY[language];

  useEffect(() => { sessionRef.current = session; }, [session]);

  // P3.12: Amplitude polling for particle reactivity
  useEffect(() => {
    if (!isActive) return;
    let running = true;
    function poll() {
      if (!running) return;
      amplitudeRef.current = engineRef.current.getAmplitude();
      requestAnimationFrame(poll);
    }
    poll();
    return () => { running = false; };
  }, [isActive]);

  // Hydrate persisted state
  useEffect(() => {
    const stored = window.localStorage.getItem("openmonk-language");
    if (stored === "en" || stored === "es") setLanguage(stored);

    const storedTheme = window.localStorage.getItem("openmonk-theme");
    if (storedTheme === "light") {
      document.documentElement.classList.add("light");
      setIsDark(false);
    } else if (storedTheme === "dark") {
      document.documentElement.classList.remove("light");
      setIsDark(true);
    }

    const storedMode = window.localStorage.getItem("openmonk-last-mode");
    if (storedMode && ["zen", "om", "air", "ear"].includes(storedMode)) {
      const mode = storedMode as OpenMonkMode;
      setSelectedMode(mode);
      setParams(MODE_DEFAULTS[mode].params);
    }
    const storedDuration = window.localStorage.getItem("openmonk-last-duration");
    if (storedDuration) {
      const dur = parseInt(storedDuration, 10);
      if (dur > 0 && dur <= 60) setDurationMin(dur);
    }
  }, []);

  // Persist settings (debounced)
  const persistSettings = useCallback((mode: OpenMonkMode, dur: number, p: OpenMonkParams) => {
    if (persistDebounceRef.current) clearTimeout(persistDebounceRef.current);
    persistDebounceRef.current = setTimeout(() => {
      window.localStorage.setItem("openmonk-last-mode", mode);
      window.localStorage.setItem("openmonk-last-duration", String(dur));
      window.localStorage.setItem("openmonk-last-params", JSON.stringify(p));
    }, 200);
  }, []);

  const handleThemeToggle = useCallback(() => {
    const isCurrentlyLight = document.documentElement.classList.contains("light");
    if (isCurrentlyLight) {
      document.documentElement.classList.remove("light");
      window.localStorage.setItem("openmonk-theme", "dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.add("light");
      window.localStorage.setItem("openmonk-theme", "light");
      setIsDark(false);
    }
  }, []);

  function handleBackgroundClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.closest("button, input, a, .modal-overlay, .settings-overlay")) return;
    if (target !== e.currentTarget && !target.classList.contains("particle-canvas-wrapper") && !target.classList.contains("particle-canvas")) return;
    handleThemeToggle();
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
    setIsPaused(false);
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
    setIsPaused(false);
    setSession((prev) => {
      if (!prev) return null;
      const result = transitionSession(prev, "stop");
      if (!result) return prev;
      return { ...prev, state: result.state, status: result.status, endedAt: new Date().toISOString() };
    });
  }, [clearEndTimeout]);

  // P3.2: Pause/Resume
  const handlePause = useCallback(() => {
    engine.pause();
    setIsPaused(true);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, [engine]);

  const handleResume = useCallback(() => {
    engine.resume();
    setIsPaused(false);
    // Restart timer
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        const cur = sessionRef.current;
        if (cur && next >= cur.durationSeconds) {
          engineRef.current.stop({ fadeOutMs: 2000 });
          endTimeoutRef.current = setTimeout(() => completeSession(cur.id), 2000);
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
          return cur.durationSeconds;
        }
        return next;
      });
    }, 1000);
  }, [engine, completeSession]);

  // Timer
  useEffect(() => {
    if (!session || !isActive || isPaused) {
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
          engineRef.current.stop({ fadeOutMs: 2000 });
          endTimeoutRef.current = setTimeout(() => completeSession(cur.id), 2000);
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
          return cur.durationSeconds;
        }
        return next;
      });
    }, 1000);

    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [session?.id, isActive, isPaused, completeSession]);

  // Escape to stop + Enter to begin
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isActive) {
        stopSession();
        return;
      }
      if (e.key === "Enter" && !isActive) {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
        e.preventDefault();
        const durationSec = durationMin * 60;
        void beginSession(selectedMode, durationSec, params);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isActive, stopSession, selectedMode, durationMin, params]);

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

  // Modal inert
  useEffect(() => {
    const el = instrumentRef.current;
    if (!el) return;
    if (showInfo || showSettings) {
      el.setAttribute("inert", "");
    } else {
      el.removeAttribute("inert");
    }
  }, [showInfo, showSettings]);

  // Volume/mute handlers for settings
  const handleVolumeChange = useCallback((v: number) => {
    setVolume(v);
    engine.setVolume(v);
  }, [engine]);

  const handleMuteToggle = useCallback(() => {
    setMuted((prev) => {
      if (prev) { engine.unmute(); } else { engine.mute(); }
      return !prev;
    });
  }, [engine]);

  const handleModeChange = useCallback((mode: OpenMonkMode) => {
    setSelectedMode(mode);
    setParams(MODE_DEFAULTS[mode].params);
    const defaultDur = MODE_DEFAULTS[mode].durationSeconds;
    const dur = defaultDur > 0 ? defaultDur / 60 : 5;
    setDurationMin(dur);
    setCommandError("");
    persistSettings(mode, dur, MODE_DEFAULTS[mode].params);
  }, [persistSettings]);

  const handleLanguageToggle = useCallback(() => {
    setLanguage((current) => {
      const next = current === "en" ? "es" : "en";
      window.localStorage.setItem("openmonk-language", next);
      return next;
    });
  }, []);

  const handleParamChange = useCallback((key: keyof OpenMonkParams, value: string) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      persistSettings(selectedMode, durationMin, next);
      return next;
    });
  }, [selectedMode, durationMin, persistSettings]);

  const handleDurationChange = useCallback((dur: number) => {
    setDurationMin(dur);
    persistSettings(selectedMode, dur, params);
  }, [selectedMode, params, persistSettings]);

  const beginSession = useCallback(async (
    mode: OpenMonkMode,
    durationSeconds: number,
    sessionParams: OpenMonkParams
  ) => {
    operationRef.current++;
    abortRef.current?.abort();
    clearEndTimeout();
    setIsPaused(false);

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
        decode: engine.decode.bind(engine),
      });

      if (operationRef.current !== operationId || controller.signal.aborted) return;

      if (controller.signal.aborted) return;

      await engine.start(result.buffer, {
        loop: result.loop,
        fadeInMs: 2000,
        volume,
      });

      if (operationRef.current !== operationId || controller.signal.aborted) {
        engine.stop({ fadeOutMs: 0 });
        return;
      }

      if (muted) engine.mute();

      const playResult = transitionSession(newSession, "play");
      if (playResult) { newSession.state = playResult.state; newSession.status = playResult.status; }
      setSession({ ...newSession });

    } catch (err) {
      if (operationRef.current !== operationId || controller.signal.aborted) return;
      console.error("[OpenMonk]", err);
      const errorMessage = err instanceof AudioUnavailableError
        ? err.message
        : err instanceof Error ? err.message : "Audio generation failed.";
      setCommandError(errorMessage);
      const errResult = transitionSession(newSession, "error");
      if (errResult) { newSession.state = errResult.state; newSession.status = errResult.status; }
      setSession({ ...newSession });
    } finally {
      if (operationRef.current === operationId) abortRef.current = null;
    }
  }, [provider, volume, muted, engine]);

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
    <>
      <div className="instrument" onClick={handleBackgroundClick} ref={instrumentRef}>
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
          active={isActive && !isPaused}
          elapsed={elapsed}
          duration={session?.durationSeconds ?? 0}
          amplitudeRef={amplitudeRef}
        />

        <SessionDisplay
          state={isPaused ? "paused" : (session?.state ?? "idle")}
          status={isPaused ? "Paused." : session?.status}
          elapsed={elapsed}
          duration={session?.durationSeconds ?? 0}
          durationMin={durationMin}
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
                onDurationChange={handleDurationChange}
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
          <div className="active-controls">
            {!isPaused && session?.mode !== "zen" && (
              <button
                type="button"
                className="pause-btn"
                onClick={handlePause}
                aria-label="Pause session"
              >
                ❚❚
              </button>
            )}
            {isPaused && (
              <button
                type="button"
                className="resume-btn"
                onClick={handleResume}
                aria-label="Resume session"
              >
                ▶
              </button>
            )}
            <button
              type="button"
              className="stop-btn"
              onClick={stopSession}
              id="stop-btn"
              aria-label={copy.stopSession}
            >
              {copy.stop}
            </button>
          </div>
        )}

        <div className="footer-area">
          <CommandInput
            onSubmit={handleCommand}
            error={translateCommandError(commandError, language)}
            disabled={isActive}
            copy={copy}
          />

          <div className="footer-toggles">
            <button
              type="button"
              className="language-toggle"
              onClick={handleLanguageToggle}
              aria-label={copy.languageToggleLabel}
            >
              {copy.languageToggle}
            </button>
            <button
              type="button"
              className="theme-toggle"
              onClick={handleThemeToggle}
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            >
              {isDark ? "☀" : "☾"}
            </button>
            <button
              type="button"
              className="settings-trigger"
              onClick={() => setShowSettings(true)}
              aria-label="Open settings"
            >
              ⚙
            </button>
          </div>
        </div>
      </div>

      <InfoModal open={showInfo} onClose={() => setShowInfo(false)} copy={copy} language={language} onCommand={handleCommand} />
      <SettingsSheet
        open={showSettings}
        onClose={() => setShowSettings(false)}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        muted={muted}
        onMuteToggle={handleMuteToggle}
        isDark={isDark}
        onThemeToggle={handleThemeToggle}
        language={language}
        onLanguageToggle={handleLanguageToggle}
      />
    </>
  );
}

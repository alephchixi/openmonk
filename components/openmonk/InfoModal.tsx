"use client";

import { useEffect, useRef } from "react";
import type { UiCopy } from "@/lib/openmonk/i18n";

type Props = {
  open: boolean;
  onClose: () => void;
  copy: UiCopy;
};

const COMMANDS_EN = [
  { cmd: "/zen 5", desc: "5 min silent timer" },
  { cmd: "/om 10 --low --sparse", desc: "10 min drone, low pitch, sparse" },
  { cmd: "/air 3 --breathy", desc: "3 min breath pulse" },
  { cmd: "/ear 15 --granular", desc: "15 min mood soundscape" },
];

const COMMANDS_ES = [
  { cmd: "/zen 5", desc: "temporizador silencioso 5 min" },
  { cmd: "/om 10 --low --sparse", desc: "drone 10 min, tono bajo, escaso" },
  { cmd: "/air 3 --breathy", desc: "pulso de aire 3 min" },
  { cmd: "/ear 15 --granular", desc: "paisaje sonoro 15 min" },
];

const FLAGS = [
  { flag: "--low / --mid / --high", desc: "pitch" },
  { flag: "--sparse / --regular / --dense", desc: "density" },
  { flag: "--near / --room / --far", desc: "distance" },
  { flag: "--clean / --breathy / --granular / --resonant", desc: "texture" },
];

export function InfoModal({ open, onClose, copy }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const isSpanish = copy.languageToggle === "EN";
  const commands = isSpanish ? COMMANDS_ES : COMMANDS_EN;

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="openmonk-info-title"
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title" id="openmonk-info-title">OpenMonk</h2>
        <p className="modal-text">
          {copy.info.text}
        </p>

        {/* Command cheatsheet */}
        <div className="modal-cheatsheet">
          <h3 className="cheatsheet-title">{isSpanish ? "Comandos" : "Commands"}</h3>
          <div className="cheatsheet-list">
            {commands.map((c) => (
              <div key={c.cmd} className="cheatsheet-row">
                <code className="cheatsheet-cmd">{c.cmd}</code>
                <span className="cheatsheet-desc">{c.desc}</span>
              </div>
            ))}
          </div>
          <h3 className="cheatsheet-title">{isSpanish ? "Parámetros" : "Flags"}</h3>
          <div className="cheatsheet-list">
            {FLAGS.map((f) => (
              <div key={f.flag} className="cheatsheet-row">
                <code className="cheatsheet-cmd">{f.flag}</code>
                <span className="cheatsheet-desc">{f.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-links">
          <a
            className="modal-link"
            href="https://github.com/memeMonterey/openmonk"
            target="_blank"
            rel="noopener noreferrer"
          >
            {copy.info.repository}
          </a>
          <a
            className="modal-link"
            href="https://github.com/memeMonterey/openmonk/blob/main/docs/manifesto.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            {copy.info.manifesto}
          </a>
        </div>
        <span className="modal-version">{copy.info.version}</span>
        <button type="button" className="modal-close" onClick={onClose} ref={closeRef}>{copy.info.close}</button>
      </div>
    </div>
  );
}

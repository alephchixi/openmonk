// OpenMonk — UI Translations
// Internal commands remain slash-command based; this maps visible interface copy.

import type { AllowedStatusPhrase, Density, Distance, OpenMonkMode, Texture } from "./types";

export type UiLanguage = "en" | "es";

export const UI_COPY = {
  en: {
    languageToggle: "ES",
    languageToggleLabel: "Switch interface to Spanish",
    begin: "Begin",
    stop: "Stop",
    stopSession: "Stop session",
    mute: "Mute",
    unmute: "Unmute",
    volume: "Volume",
    remaining: "remaining",
    commandInput: "Command input",
    commandPlaceholder: "/om 5 --low --sparse --far...",
    modeGroup: "Mode",
    labels: {
      duration: "Duration",
      density: "Density",
      distance: "Distance",
      texture: "Texture",
      audio: "Audio",
    },
    modes: {
      zen: { label: "Zen", desc: "Silent timer" },
      om: { label: "OM", desc: "Sustained vocal drone" },
      air: { label: "Air", desc: "Breath-like pulse" },
      ear: { label: "Ear", desc: "Mood soundscape" },
      mauna: { label: "Mauna", desc: "Non-discursive mode" },
      vow: { label: "Vow", desc: "Temporary constraint" },
    } satisfies Record<OpenMonkMode, { label: string; desc: string }>,
    density: {
      sparse: "sparse",
      regular: "regular",
      dense: "dense",
    } satisfies Record<Density, string>,
    distance: {
      near: "near",
      room: "room",
      far: "far",
    } satisfies Record<Distance, string>,
    texture: {
      clean: "clean",
      breathy: "breathy",
      granular: "granular",
      resonant: "resonant",
    } satisfies Record<Texture, string>,
    providers: {
      synth: {
        label: "Synth",
        desc: "Local synthesis - instant, no API needed",
      },
      elevenlabs: {
        label: "Voice API",
        desc: "ElevenLabs - richer, requires API key",
      },
    },
    status: {
      "Silence begins.": "Silence begins.",
      "Breath reference starts.": "Breath reference starts.",
      "Session complete.": "Session complete.",
      "Returning.": "Returning.",
      "Paused.": "Paused.",
      "Stopped.": "Stopped.",
      "Preparing.": "Preparing.",
    } satisfies Record<AllowedStatusPhrase, string>,
    info: {
      text: "A non-discursive sound companion for repetition, breath, silence, and attention. Not a chatbot. Not a coach. It holds. It fades. It stops.",
      repository: "Repository",
      manifesto: "Manifesto",
      close: "Close",
      version: "v0.1.0 - MIT License",
    },
  },
  es: {
    languageToggle: "EN",
    languageToggleLabel: "Cambiar interfaz a ingles",
    begin: "Comenzar",
    stop: "Detener",
    stopSession: "Detener sesion",
    mute: "Silenciar",
    unmute: "Activar audio",
    volume: "Volumen",
    remaining: "restantes",
    commandInput: "Entrada de comando",
    commandPlaceholder: "/om 5 --low --sparse --far...",
    modeGroup: "Modo",
    labels: {
      duration: "Duracion",
      density: "Densidad",
      distance: "Distancia",
      texture: "Textura",
      audio: "Audio",
    },
    modes: {
      zen: { label: "Zen", desc: "Temporizador silencioso" },
      om: { label: "OM", desc: "Drone vocal sostenido" },
      air: { label: "Aire", desc: "Pulso parecido a respiracion" },
      ear: { label: "Oido", desc: "Paisaje sonoro de estado" },
      mauna: { label: "Mauna", desc: "Modo no discursivo" },
      vow: { label: "Voto", desc: "Restriccion temporal" },
    } satisfies Record<OpenMonkMode, { label: string; desc: string }>,
    density: {
      sparse: "escasa",
      regular: "regular",
      dense: "densa",
    } satisfies Record<Density, string>,
    distance: {
      near: "cerca",
      room: "sala",
      far: "lejos",
    } satisfies Record<Distance, string>,
    texture: {
      clean: "limpia",
      breathy: "aireada",
      granular: "granular",
      resonant: "resonante",
    } satisfies Record<Texture, string>,
    providers: {
      synth: {
        label: "Sintesis",
        desc: "Sintesis local - instantanea, sin API",
      },
      elevenlabs: {
        label: "API de Voz",
        desc: "ElevenLabs - mas rico, requiere API key",
      },
    },
    status: {
      "Silence begins.": "Comienza el silencio.",
      "Breath reference starts.": "Comienza la referencia de aire.",
      "Session complete.": "Sesion completa.",
      "Returning.": "Regresando.",
      "Paused.": "Pausado.",
      "Stopped.": "Detenido.",
      "Preparing.": "Preparando.",
    } satisfies Record<AllowedStatusPhrase, string>,
    info: {
      text: "Un acompanante sonoro no discursivo para repeticion, respiracion, silencio y atencion. No es chatbot. No es coach. Sostiene. Se desvanece. Se detiene.",
      repository: "Repositorio",
      manifesto: "Manifiesto",
      close: "Cerrar",
      version: "v0.1.0 - Licencia MIT",
    },
  },
} as const;

export type UiCopy = (typeof UI_COPY)[UiLanguage];

export function translateCommandError(message: string, language: UiLanguage): string {
  if (language === "en") return message;

  if (message === "Commands must start with /.") return "Los comandos deben empezar con /.";
  if (message === "Missing mode.") return "Falta el modo.";
  if (message === "Vow text must be quoted.") return "El texto del voto debe ir entre comillas.";

  const unknownMode = message.match(/^Unknown mode: (.+)\.$/);
  if (unknownMode) return `Modo desconocido: ${unknownMode[1]}.`;

  const unavailableMode = message.match(/^Mode \/(.+) is not available yet\.$/);
  if (unavailableMode) return `El modo /${unavailableMode[1]} no esta disponible.`;

  const unknownFlag = message.match(/^Unknown flag: (.+)\.$/);
  if (unknownFlag) return `Parametro desconocido: ${unknownFlag[1]}.`;

  const unknownMood = message.match(/^Unknown mood: (.+)\.$/);
  if (unknownMood) return `Estado desconocido: ${unknownMood[1]}.`;

  const unknownArgument = message.match(/^Unknown argument: (.+)\.$/);
  if (unknownArgument) return `Argumento desconocido: ${unknownArgument[1]}.`;

  if (message === "Audio generation failed.") return "Fallo la generacion de audio.";

  return message;
}

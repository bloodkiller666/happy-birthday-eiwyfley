"use client";

/**
 * Avatar de Eiwy con degradado seguro:
 * si `/assets/eiwy/eiwy-avatar.png` todavía no existe (o falla al cargar),
 * se muestra la silueta SVG de dragona con los colores del tema.
 */
import Image from "next/image";
import { useState } from "react";
import { birthday } from "@/config/birthday";
import { cn } from "@/lib/utils";

interface AvatarProps {
  className?: string;
  /** Aplica marco blanco tipo calcomanía. */
  framed?: boolean;
  /** Prioridad de carga (para el prólogo / primer render). */
  priority?: boolean;
}

export function DragonAvatar({ className, framed = true, priority = false }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          "grid aspect-square place-items-center rounded-[2rem] bg-eiwy-soft/60",
          framed && "sticker-lg bg-white/70",
          className,
        )}
        role="img"
        aria-label={birthday.assets.avatarAlt}
      >
        <DragonSilhouette className="w-3/4" />
      </div>
    );
  }

  return (
    <Image
      src={birthday.assets.avatar}
      alt={birthday.assets.avatarAlt}
      width={birthday.assets.avatarWidth}
      height={birthday.assets.avatarHeight}
      priority={priority}
      onError={() => setFailed(true)}
      className={cn("h-auto w-full rounded-[2rem] object-cover", framed && "sticker-lg", className)}
    />
  );
}

interface DragonProps {
  className?: string;
  /** Llama saliendo del hocico. */
  flame?: boolean;
  /** Alas desplegadas (vuelo) o plegadas (quieta). */
  spread?: boolean;
}

/**
 * Silueta de dragona simple, dibujada con los tokens del tema.
 * Pensada como PLACEHOLDER: reemplazable por el recorte real del avatar.
 */
export function DragonSilhouette({ className, flame = true, spread = true }: DragonProps) {
  return (
    <svg viewBox="0 0 340 230" className={cn("h-auto w-full", className)} aria-hidden="true">
      <defs>
        <linearGradient id="dragonBody" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#a8f0ee" />
          <stop offset="55%" stopColor="#71cfce" />
          <stop offset="100%" stopColor="#2a9fae" />
        </linearGradient>
        <linearGradient id="dragonWing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8ee8e8" />
          <stop offset="100%" stopColor="#27c9ee" />
        </linearGradient>
      </defs>

      {/* cola */}
      <path
        d="M58 150 C 34 148 20 128 14 108 C 26 118 42 122 52 128 C 40 106 44 84 58 70 C 54 96 62 118 76 132 Z"
        fill="url(#dragonBody)"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {spread && (
        <g className="dragon-wing">
          <path
            d="M150 128 C 122 84 108 48 118 26 C 136 46 152 60 168 68 C 186 50 208 38 232 34 C 218 58 208 84 204 104 C 222 96 244 96 262 104 C 236 118 210 130 190 148 Z"
            fill="url(#dragonWing)"
            stroke="#ffffff"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path d="M150 128 C 160 100 170 84 190 68" stroke="#ffffff" strokeWidth="3" opacity="0.6" fill="none" />
          <path d="M168 140 C 178 116 190 104 206 92" stroke="#ffffff" strokeWidth="3" opacity="0.6" fill="none" />
        </g>
      )}

      {/* cuerpo */}
      <path
        d="M74 152 C 82 126 116 112 152 112 C 190 112 216 126 228 146 C 214 168 184 180 150 180 C 114 180 86 170 74 152 Z"
        fill="url(#dragonBody)"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M108 166 C 124 158 148 156 170 158 C 152 172 122 176 108 166 Z"
        fill="#fdf0e8"
        stroke="#ffffff"
        strokeWidth="4"
      />

      {/* patas */}
      <path d="M104 176 l-6 24 h18 l6 -20 Z" fill="#2a9fae" stroke="#ffffff" strokeWidth="4" strokeLinejoin="round" />
      <path d="M186 176 l6 24 h-18 l-6 -20 Z" fill="#2a9fae" stroke="#ffffff" strokeWidth="4" strokeLinejoin="round" />

      {/* cuello + cabeza */}
      <path
        d="M212 150 C 224 132 234 118 250 108 L286 118 C 288 138 280 152 264 160 C 244 168 224 164 212 150 Z"
        fill="url(#dragonBody)"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M252 108 C 262 96 280 90 296 94 L312 108 C 304 118 288 124 272 122 Z"
        fill="url(#dragonBody)"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* cuernos */}
      <path d="M262 96 C 258 76 266 62 280 56 C 276 72 278 84 284 92 Z" fill="#d8e02a" stroke="#ffffff" strokeWidth="4" strokeLinejoin="round" />
      <path d="M280 92 C 282 74 292 64 306 62 C 298 74 296 84 298 92 Z" fill="#d8e02a" stroke="#ffffff" strokeWidth="4" strokeLinejoin="round" />

      {/* ojo */}
      <circle cx="284" cy="106" r="7" fill="#ffffff" />
      <circle cx="285" cy="106" r="4" fill="#7cc43a" />
      <path d="M276 98 q8 -5 16 -2" stroke="#38444c" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* crin / puntas de pelo */}
      <path d="M244 118 C 236 106 236 94 244 84 C 246 98 252 108 258 114 Z" fill="#ff9d4d" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" />
      <path d="M228 108 C 218 100 216 88 222 78 C 226 92 232 100 238 106 Z" fill="#ff9d4d" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" />

      {/* flores en la crin */}
      <g transform="translate(232 96)">
        <circle r="4.5" fill="#d8e02a" />
        {[0, 72, 144, 216, 288].map((angle) => (
          <ellipse key={angle} cx="0" cy="-7" rx="3.4" ry="6" fill="#fdf0e8" transform={`rotate(${angle})`} />
        ))}
        <circle r="3" fill="#d8e02a" />
      </g>

      {/* llama turquesa → naranja */}
      {flame && (
        <g className="dragon-flame" transform="translate(312 100)">
          <path
            d="M0 0 C 16 -10 34 -6 44 4 C 34 12 16 16 4 10 C 12 6 10 2 0 0 Z"
            fill="#8ee8e8"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M0 2 C 12 -2 24 0 32 6 C 24 10 12 10 4 8 Z" fill="#ff9d4d" />
        </g>
      )}
    </svg>
  );
}

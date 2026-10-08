"use client";

import { cn } from "@/lib/utils";

interface CakeProps {
  className?: string;
  /** Cantidad de velas. Es decorativa: nunca representa una edad. */
  candles?: number;
}

/**
 * Pastel de la travesía, ilustrado a mano con los tokens del tema.
 * Las velas NO llevan número ni edad: son sólo adornos encendidos.
 * Cada vela tiene un `.candle-flame` que se enciende desde el minijuego final.
 */
export function Cake({ className, candles = 5 }: CakeProps) {
  const total = Math.max(1, Math.min(candles, 7));
  const spacing = 34;
  const firstX = 200 - ((total - 1) * spacing) / 2;

  return (
    <svg viewBox="0 0 400 360" className={cn("h-auto w-full", className)} aria-label="Pastel de cumpleaños" role="img">
      <defs>
        <linearGradient id="cakeTierA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8ee8e8" />
          <stop offset="100%" stopColor="#71cfce" />
        </linearGradient>
        <linearGradient id="cakeTierB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdf0e8" />
          <stop offset="100%" stopColor="#ffe0cf" />
        </linearGradient>
      </defs>

      {/* sombra */}
      <ellipse cx="200" cy="336" rx="150" ry="18" fill="#38444c" opacity="0.16" />

      {/* piso inferior */}
      <rect x="56" y="238" width="288" height="90" rx="20" fill="url(#cakeTierA)" stroke="#ffffff" strokeWidth="7" />
      <path
        d="M56 262 q26 22 52 0 q26 22 52 0 q26 22 52 0 q26 22 52 0 q26 22 24 0 L344 238 H56 Z"
        fill="#fdf0e8"
        stroke="#ffffff"
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* piso del medio */}
      <rect x="96" y="162" width="208" height="78" rx="18" fill="url(#cakeTierB)" stroke="#ffffff" strokeWidth="7" />
      <path
        d="M96 184 q22 20 44 0 q22 20 44 0 q22 20 44 0 q22 20 32 0 L308 162 H96 Z"
        fill="#fdf0e8"
        stroke="#ffffff"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <g fill="#27c9ee" opacity="0.85">
        <circle cx="140" cy="214" r="6" />
        <circle cx="200" cy="222" r="6" />
        <circle cx="260" cy="214" r="6" />
      </g>

      {/* piso superior */}
      <rect x="132" y="98" width="136" height="66" rx="16" fill="url(#cakeTierA)" stroke="#ffffff" strokeWidth="7" />

      {/* flores decorativas */}
      <g transform="translate(96 250)">
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <ellipse key={angle} cx="0" cy="-8" rx="5" ry="8" fill="#fdf0e8" transform={`rotate(${angle})`} />
        ))}
        <circle r="5" fill="#d8e02a" />
      </g>
      <g transform="translate(304 262) scale(0.9)">
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <ellipse key={angle} cx="0" cy="-8" rx="5" ry="8" fill="#fdf0e8" transform={`rotate(${angle})`} />
        ))}
        <circle r="5" fill="#f05a63" />
      </g>

      {/* velas (sin números ni edad) */}
      {Array.from({ length: total }, (_, index) => {
        const x = firstX + index * spacing;
        return (
          <g key={index} transform={`translate(${x} 98)`}>
            <rect x="-6" y="-44" width="12" height="46" rx="5" fill={index % 2 === 0 ? "#f05a63" : "#27c9ee"} stroke="#ffffff" strokeWidth="4" />
            <rect x="-6" y="-44" width="12" height="46" rx="5" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.5" />
            <path d="M0 -46 v-7" stroke="#38444c" strokeWidth="3" strokeLinecap="round" />
            <g className="candle-flame" opacity="0" transform="translate(0 -62)">
              <circle className="candle-glow" r="18" fill="#ff9d4d" opacity="0.35" />
              <path
                d="M0 -14 C 9 -4 12 3 12 8 A 12 12 0 0 1 -12 8 C -12 3 -9 -4 0 -14 Z"
                fill="#ff9d4d"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <path d="M0 -6 C 5 1 6 5 6 8 A 6 6 0 0 1 -6 8 C -6 5 -5 1 0 -6 Z" fill="#27c9ee" />
              <path d="M0 1 C 2.6 4 3 6 3 8 A 3 3 0 0 1 -3 8 C -3 6 -2.6 4 0 1 Z" fill="#fff6cf" />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

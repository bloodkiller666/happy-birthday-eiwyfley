/**
 * Biblioteca de arte SVG del proyecto.
 *
 * Todo está hecho con los tokens del tema y bordes blancos tipo calcomanía,
 * para que combine con la imagen del avatar. Las siluetas son INTERCAMBIABLES:
 * ver README.md para reemplazarlas por los recortes reales.
 */
import { cn } from "@/lib/utils";

interface ArtProps {
  className?: string;
  /** Desactiva detalles decorativos (útil con prefers-reduced-motion). */
  simple?: boolean;
}

/* ------------------------------------------------------------------ nubes */

export function Cloud({ className, tone = "#ffffff" }: ArtProps & { tone?: string }) {
  return (
    <svg viewBox="0 0 220 110" className={cn("h-auto w-40", className)} aria-hidden="true">
      <g fill={tone} stroke="#ffffff" strokeWidth="5" strokeLinejoin="round">
        <ellipse cx="62" cy="70" rx="52" ry="34" />
        <ellipse cx="118" cy="56" rx="46" ry="40" />
        <ellipse cx="166" cy="76" rx="40" ry="28" />
      </g>
    </svg>
  );
}

/* --------------------------------------------------------------- montañas */

interface MountainProps extends ArtProps {
  /** 0 = lejana (más clara), 1 = media, 2 = cercana (más oscura). */
  depth?: 0 | 1 | 2;
}

export function MountainRange({ className, depth = 0, simple = false }: MountainProps) {
  const palette: Record<0 | 1 | 2, [string, string]> = {
    0: ["#a9e6ea", "#7fd3dd"],
    1: ["#63c3cf", "#439fb2"],
    2: ["#2a9fae", "#1f7f92"],
  };
  const [fill, shade] = palette[depth];

  return (
    <svg
      viewBox="0 0 1200 380"
      preserveAspectRatio="none"
      className={cn("h-full w-full", className)}
      aria-hidden="true"
    >
      <path
        d="M0 380 L150 190 L250 260 L420 90 L560 250 L700 140 L850 265 L980 170 L1200 380 Z"
        fill={fill}
      />
      <path
        d="M420 90 L470 150 L400 175 L370 150 Z M980 170 L1020 225 L950 240 L930 210 Z"
        fill={shade}
        opacity="0.75"
      />
      {!simple && (
        <g fill="#ffffff" opacity="0.85">
          <path d="M420 90 L462 142 L436 152 L414 128 L392 150 L378 142 Z" />
          <path d="M980 170 L1014 218 L992 226 L980 208 L962 224 L950 214 Z" />
        </g>
      )}
    </svg>
  );
}

/* ---------------------------------------------------------------- pradera */

export function Meadow({ className, flowers = true }: ArtProps & { flowers?: boolean }) {
  return (
    <svg
      viewBox="0 0 1200 320"
      preserveAspectRatio="none"
      className={cn("h-full w-full", className)}
      aria-hidden="true"
    >
      <path d="M0 150 C 220 70 380 190 600 150 C 820 110 1000 40 1200 120 L1200 320 L0 320 Z" fill="#7cc43a" />
      <path d="M0 220 C 260 170 420 250 660 220 C 880 192 1040 150 1200 210 L1200 320 L0 320 Z" fill="#57a52a" />
      {flowers && (
        <g>
          {[
            [120, 250],
            [260, 285],
            [420, 262],
            [600, 292],
            [760, 258],
            [930, 288],
            [1080, 252],
            [520, 240],
          ].map(([x, y], index) => (
            <g key={index} transform={`translate(${x} ${y})`}>
              {[0, 60, 120, 180, 240, 300].map((angle) => (
                <ellipse
                  key={angle}
                  cx="0"
                  cy="-9"
                  rx="5"
                  ry="9"
                  fill="#fdf0e8"
                  stroke="#ffffff"
                  strokeWidth="1.4"
                  transform={`rotate(${angle})`}
                />
              ))}
              <circle r="4" fill="#d8e02a" />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

/* -------------------------------------------------------------------- sol */

export function Sun({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 200 200" className={cn("h-32 w-32", className)} aria-hidden="true">
      <circle cx="100" cy="100" r="62" fill="#fff6cf" opacity="0.55" />
      <circle cx="100" cy="100" r="44" fill="#fdf0e8" stroke="#ffffff" strokeWidth="6" />
      <circle cx="100" cy="100" r="44" fill="url(#sunGrad)" />
      <defs>
        <radialGradient id="sunGrad">
          <stop offset="0%" stopColor="#fff6cf" />
          <stop offset="100%" stopColor="#ff9d4d" stopOpacity="0.55" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/* -------------------------------------------------------------------- gema */

export function GemSVG({ color, className }: ArtProps & { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-6 w-6", className)} aria-hidden="true">
      <path
        d="M12 2.5 21 9l-3.6 12.5H6.6L3 9z"
        fill={color}
        stroke="#ffffff"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M12 2.5 8.4 9l3.6 12.5L15.6 9z" fill="#ffffff" opacity="0.4" />
    </svg>
  );
}

/* ------------------------------------------------------------------- huevo */

export function EggSVG({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 220 300" className={cn("h-auto w-52", className)} aria-hidden="true">
      <defs>
        <linearGradient id="eggGrad" x1="0" y1="0" x2="0.45" y2="1">
          <stop offset="0%" stopColor="#a8f0ee" />
          <stop offset="45%" stopColor="#71cfce" />
          <stop offset="100%" stopColor="#2a9fae" />
        </linearGradient>
        <clipPath id="eggClip">
          <path d="M110 12c46 0 84 92 84 166 0 63-38 110-84 110S26 241 26 178C26 104 64 12 110 12Z" />
        </clipPath>
      </defs>

      <g className="egg-body">
        <path
          d="M110 12c46 0 84 92 84 166 0 63-38 110-84 110S26 241 26 178C26 104 64 12 110 12Z"
          fill="url(#eggGrad)"
          stroke="#ffffff"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        <g clipPath="url(#eggClip)" opacity="0.85">
          {[
            [70, 90, 15, 10],
            [140, 70, 12, 8],
            [96, 150, 17, 11],
            [158, 168, 11, 8],
            [58, 205, 13, 9],
            [132, 246, 15, 10],
            [172, 110, 9, 6],
          ].map(([cx, cy, rx, ry], index) => (
            <ellipse key={index} cx={cx} cy={cy} rx={rx} ry={ry} fill="#d8e02a" transform={`rotate(-18 ${cx} ${cy})`} />
          ))}
        </g>
        <ellipse cx="82" cy="96" rx="20" ry="30" fill="#ffffff" opacity="0.35" transform="rotate(-20 82 96)" />
      </g>

      {/* Grietas: se dibujan con strokeDashoffset (pathLength=1). */}
      <g
        className="egg-cracks"
        fill="none"
        stroke="#38444c"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          className="egg-crack"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset="1"
          d="M108 52 L88 96 L114 126 L92 166 L110 206"
        />
        <path
          className="egg-crack"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset="1"
          d="M54 130 L86 152 L66 190 L92 214"
        />
        <path
          className="egg-crack"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset="1"
          d="M164 112 L130 142 L160 176 L136 214"
        />
        <path
          className="egg-crack"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset="1"
          d="M108 52 L128 84 L164 74"
        />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ flores */

interface FlowerProps extends ArtProps {
  /** Abierta (true) o capullo cerrado (false). */
  open?: boolean;
  color?: string;
}

export function FlowerArt({ className, open = false, color = "#fdf0e8" }: FlowerProps) {
  return (
    <svg viewBox="0 0 120 155" className={cn("h-auto w-24", className)} aria-hidden="true">
      {/* Tallo que llega hasta la base de la flor */}
      <path
        d="M60 152 C 58 122 62 102 60 78"
        stroke="#57a52a"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Hojas laterales */}
      <path d="M60 126 C 38 120 30 106 28 94 C 44 94 58 106 60 126 Z" fill="#7cc43a" stroke="#ffffff" strokeWidth="2" />
      <path d="M60 134 C 82 128 90 114 92 102 C 76 102 62 114 60 134 Z" fill="#7cc43a" stroke="#ffffff" strokeWidth="2" />

      {/* Sépalos / Cáliz verde en la base de la flor */}
      <path
        className="flower-calyx"
        d="M46 80 C 53 88 67 88 74 80 C 66 74 54 74 46 80 Z"
        fill="#57a52a"
        stroke="#ffffff"
        strokeWidth="2.5"
      />

      {/* Cabeza de la flor: capullo cerrado o flor abierta radiante */}
      {open ? (
        <g className="flower-petals" transform="translate(60 64)">
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <ellipse
              key={angle}
              className="flower-petal"
              cx="0"
              cy="-19"
              rx="11"
              ry="18"
              fill={color}
              stroke="#ffffff"
              strokeWidth="3"
              transform={`rotate(${angle})`}
              style={{ transformOrigin: "0px 0px" }}
            />
          ))}
          {/* Centro dorado de la flor abierta */}
          <circle className="flower-core" r="9" fill="#d8e02a" stroke="#ffffff" strokeWidth="3" />
          <circle r="4" fill="#ff9d4d" opacity="0.8" />
        </g>
      ) : (
        <g className="flower-bud" transform="translate(60 64)">
          {/* Pétalo asomando por la parte superior del capullo */}
          <ellipse cx="0" cy="-14" rx="7" ry="12" fill={color} stroke="#ffffff" strokeWidth="2" />
          {/* Sépalos verdes que abrazan el capullo */}
          <path
            className="flower-sepal"
            d="M0 -22 C -14 -6 -12 14 0 18 C 12 14 14 -6 0 -22 Z"
            fill="#7cc43a"
            stroke="#ffffff"
            strokeWidth="3"
          />
          {/* Línea divisoria suave del capullo */}
          <path d="M0 -18 L0 16" stroke="#57a52a" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------- cofre */

export function ChestArt({ className, open = false }: ArtProps & { open?: boolean }) {
  return (
    <svg viewBox="0 0 200 170" className={cn("h-auto w-32", className)} aria-hidden="true">
      <ellipse cx="100" cy="152" rx="78" ry="14" fill="#38444c" opacity="0.18" />
      <g className="chest-glow" opacity={open ? 1 : 0}>
        <ellipse cx="100" cy="70" rx="60" ry="46" fill="#fdf0e8" opacity="0.5" />
      </g>
      <rect x="26" y="80" width="148" height="66" rx="10" fill="#6b2a14" stroke="#ffffff" strokeWidth="5" />
      <rect x="26" y="104" width="148" height="10" fill="#d8e02a" opacity="0.85" />
      <g className="chest-lid" style={{ transformOrigin: "100px 82px" }} transform={open ? "rotate(-32 100 82)" : undefined}>
        <path
          d="M26 82 C 26 46 60 30 100 30 C 140 30 174 46 174 82 Z"
          fill="#8a3c1c"
          stroke="#ffffff"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <rect x="88" y="34" width="24" height="46" rx="6" fill="#d8e02a" stroke="#ffffff" strokeWidth="4" />
      </g>
      <circle cx="100" cy="112" r="11" fill="#d8e02a" stroke="#ffffff" strokeWidth="4" />
    </svg>
  );
}

/* ------------------------------------------------------------ duendecillo */

export function SpriteArt({ className, tone = "#d8e02a" }: ArtProps & { tone?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn("h-14 w-14", className)} aria-hidden="true">
      <ellipse cx="50" cy="88" rx="22" ry="6" fill="#38444c" opacity="0.2" />
      <path d="M50 12 C 70 24 74 48 62 62 L38 62 C 26 48 30 24 50 12 Z" fill={tone} stroke="#ffffff" strokeWidth="4" />
      <path d="M34 34 C 18 30 14 42 22 52 C 28 44 32 40 38 40 Z" fill="#ffffff" opacity="0.9" />
      <path d="M66 34 C 82 30 86 42 78 52 C 72 44 68 40 62 40 Z" fill="#ffffff" opacity="0.9" />
      <circle cx="41" cy="40" r="4" fill="#38444c" />
      <circle cx="59" cy="40" r="4" fill="#38444c" />
      <path d="M42 52 q8 8 16 0" stroke="#38444c" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* --------------------------------------------------------------- cristales */

export function CrystalArt({ className, color = "#27c9ee" }: ArtProps & { color?: string }) {
  return (
    <svg viewBox="0 0 120 140" className={cn("h-auto w-24", className)} aria-hidden="true">
      <path d="M60 6 96 56 60 134 24 56 Z" fill={color} stroke="#ffffff" strokeWidth="5" strokeLinejoin="round" />
      <path d="M60 6 60 134 96 56 Z" fill="#ffffff" opacity="0.35" />
      <path d="M24 56 H96" stroke="#ffffff" strokeWidth="3" opacity="0.7" />
    </svg>
  );
}

/** Seis glifos distintos para el juego de memoria. */
export function GemGlyphCollage({ variant, color, className }: ArtProps & { variant: number; color: string }) {
  const shapes = [
    <path key="d" d="M24 4 44 20 36 44H12L4 20z" />,
    <path key="h" d="M24 3 43 14v20L24 45 5 34V14z" />,
    <path key="s" d="M24 3 30 18l16 2-11 11 3 16-14-8-14 8 3-16L2 20l16-2z" />,
    <path key="t" d="M4 10h40L24 45z" />,
    <path key="c" d="M24 4a20 20 0 1 1-0.01 40A20 20 0 0 1 24 4z" />,
    <path key="r" d="M24 3 43 22 24 45 5 22z" />,
  ];
  return (
    <svg viewBox="0 0 48 48" className={cn("h-10 w-10", className)} aria-hidden="true">
      <g fill={color} stroke="#ffffff" strokeWidth="3" strokeLinejoin="round">
        {shapes[variant % shapes.length]}
      </g>
    </svg>
  );
}

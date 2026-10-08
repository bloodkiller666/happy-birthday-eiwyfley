# La Travesía de Eiwy Fley 🐉✨

Web de cumpleaños **interactiva y cinematográfica** para **Eiwy Fley**: un
recorrido por capítulos tipo videojuego, con scroll animado (vertical y
horizontal), cuatro minijuegos, gemas que se acumulan y una celebración final
con velas, confeti y fuegos artificiales.

> **Cuidado con la privacidad.** El sitio **nunca** menciona edad, número de
> velas ni cantidad de años. Se usan frases como “un año más de aventuras” u
> “otra vuelta al sol”. Tampoco hay chistes internos ni referencias a personas
> reales: el contenido es universal para la comunidad.

---

## Cómo se usa

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # compilación de producción
pnpm start    # sirve la build de producción
pnpm lint     # ESLint (eslint-config-next + reglas de React 19)
npx tsc --noEmit   # TypeScript en modo estricto
```

El audio sólo arranca cuando se toca el botón **“Comenzar aventura”** (nunca hay
autoplay). El botón de silencio queda siempre visible en la esquina inferior
derecha.

### El recorrido

| Momento | Qué pasa |
| --- | --- |
| **Carga** | Pantalla de carga con barra de progreso y botón de inicio (desbloquea el audio). |
| **Prólogo · El Huevo** | Mantenés presionado el huevo: vibra, se agrieta (`strokeDashoffset`), estalla en partículas y eclosiona. La transición al Capítulo 1 usa una máscara circular (`clip-path`). |
| **Capítulo 1 · El Vuelo** | Parallax vertical de 6 capas con `scrub`, la dragona cruza el cielo siguiendo una `MotionPath` atada al scroll, el cielo pasa de día a atardecer animando variables del tema y las frases épicas se revelan palabra por palabra con **SplitText**. |
| **Capítulo 2 · El Mapa de Desafíos** | Escena fija donde el scroll vertical mueve un mapa enorme en horizontal, con snap por estación, camino SVG que se traza y un indicador de progreso. Cada reto superado entrega una gema que **vuela hasta el HUD** (MotionPath + `Flip.fit`). |
| **Capítulo 3 · La Cueva del Tesoro** | Zoom de cámara hacia la entrada (scale + velo) y cuatro cofres que se abren con las gemas conseguidas. |
| **Final · La Gran Celebración** | Pastel ilustrado con velas **sin número**, encendidas manteniendo presionado “Aliento de fuego”, confeti y fuegos artificiales en canvas, mensaje final revelado con SplitText y firma. Botones para repetir el final o volver a volar. |

Los cuatro minijuegos son: **Hazlas florecer** (mantener presionado), **Aliento
de Fuego / Esquivar** (20 s de reflejos), **Memoria de gemas** (12 cartas con
flip 3D) y **Travesura** (atrapar duendecillos + mini quiz de dragones).

---

## Todo lo editable está en un solo archivo

`src/config/birthday.ts` — mensaje final, firma, textos de cada capítulo,
instrucciones de los juegos, preguntas del quiz, mensajes de la comunidad y
rutas de assets. **No hace falta tocar componentes para cambiar el contenido.**

```ts
// src/config/birthday.ts
export const birthday: BirthdayConfig = {
  from: "De parte de: tus amigas y amigos de la comunidad",
  celebration: { message: ["¡Otra vuelta al sol, Eiwy!", /* … */] },
  communityMessages: [], // ← completá acá los mensajes de la comunidad
  // …capítulos, estaciones, quiz y textos de los juegos
};
```

Los cuatro colores principales también viven en un único lugar:
`src/app/globals.css` (bloque `:root`), expuestos como utilidades de Tailwind
(`bg-eiwy`, `text-ink`, `bg-lime`, …) vía `@theme inline`.

---

## Assets: qué reemplazar y con qué medidas

Todo el arte es SVG generado con la paleta del tema y funciona como
**placeholder intercambiable**. La guía completa está en
[`public/assets/README.md`](public/assets/README.md); el resumen:

| Archivo | Medidas | Notas |
| --- | --- | --- |
| `public/assets/eiwy/eiwy-avatar.png` | **1024 × 1024 px** (cuadrada, PNG con transparencia, < 400 KB) | Si no existe, se muestra la **silueta de dragona SVG** de `src/components/art/DragonAvatar.tsx`. Cero configuración: al copiar el archivo, aparece solo (con `pnpm dev` al instante; con `pnpm start` reiniciá el servidor, no hace falta recompilar). |
| `public/assets/audio/*.mp3` | — | Ver la tabla de nombres en `public/assets/README.md`. Si faltan, suena un **sintetizador WebAudio integrado**: la web nunca se queda muda ni tira errores. |

Para cambiar la silueta placeholder por un dibujo propio, editá
`DragonSilhouette` en `src/components/art/DragonAvatar.tsx`.

---

## Estructura

```
src/
  app/                 layout.tsx · page.tsx · globals.css (tokens del tema)
  components/
    chapters/          Prologue · Flight · ChallengeMap · TreasureCave · Celebration
    games/             StationPanel + GameShell + BloomGame · DodgeGame · MemoryGame · SpriteCatchGame
    ui/                Loader · Hud · GemCounter · ProgressBar · SoundToggle · CustomCursor
    effects/           ParticlesCanvas (partículas + ráfagas) · confetti.ts (confeti/fuegos)
    art/               DragonAvatar · Cake · scenery (nubes, montañas, pradera, huevo, cofre…)
    Adventure.tsx      orquesta fases, scroll, HUD y capítulos
  hooks/               useLenis · useAudio · useReducedMotion · useViewportWidth · useParticleBudget
  lib/                 gsap.ts (registro único de plugins) · lenis.ts · audio.ts · gemFlight.ts · device.ts · utils.ts
  store/               useAdventureStore.ts (fase, capítulo, gemas, intentos, sonido, bloqueos de scroll)
  config/birthday.ts   ★ todo el texto y la configuración
public/assets/         eiwy/ · audio/ · backgrounds/
```

### Decisiones de diseño (y por qué)

- **Los plugins GSAP se registran una sola vez** en `src/lib/gsap.ts`
  (importá siempre desde ahí). Incluye `ScrollTrigger`, `SplitText`, `Flip`,
  `MotionPathPlugin`, `Draggable` y `CustomEase` — todos libres desde GSAP 3.13.
- **Escenas fijas con `position: sticky` en lugar de `pin: true`.** El resultado
  visual es el mismo (la escena queda fija mientras el scroll avanza) pero sin
  pin-spacers: la geometría es determinista, no hay saltos de layout y se
  comporta igual en móvil. El `scrub`, los `snap` y el trazado del camino siguen
  siendo ScrollTrigger. *(Decisión tomada porque `pin` desplazaba la sección y
  dejaba la tarjeta del reto fuera de pantalla.)*
- **Geometría exacta del mapa.** Cada panel mide el ancho real del viewport
  (`useViewportWidth`, con `ResizeObserver`) y el recorrido se calcula a partir
  de eso: los snaps caen justo en los bordes y nada depende de `100vw`.
- **Snap direccional por estación** (comportamiento por defecto de ScrollTrigger):
  avanzás de estación en estación. Mientras un reto está en curso, el snap se
  **desactiva** (`snapTo` devuelve el progreso real) y el mapa se alinea a la
  estación antes de montar el juego, así nadie juega con la tarjeta fuera de
  pantalla.
- **El vuelo de la gema** usa `MotionPathPlugin` para el arco y `Flip.fit` para
  encajar la forma en el slot del HUD.
- **Nada de autoplay**: el audio se desbloquea con el botón de inicio y los
  archivos faltantes caen a un sintetizador WebAudio (sin dependencias extra).
- **Un solo loop de animación** (`gsap.ticker`) para el scroll de Lenis, y los
  minijuegos usan su propio `requestAnimationFrame` que se cancela al desmontar.
- **Accesibilidad de los retos**: todos se pueden jugar con teclado
  (mantener `Espacio`/`Enter`, flechas en el volcán, tabulación en las cartas y
  los duendecillos) y hay un botón discreto **“Saltar reto”** que aparece tras
  dos intentos fallidos para que nadie quede bloqueado. También hay una **✕**
  para volver al mapa si alguien empieza un reto sin querer.

### `prefers-reduced-motion`

Se mantiene toda la historia y los juegos, pero se simplifica la forma:

- no se instancia Lenis (scroll nativo) y el bloqueo de scroll se hace por CSS;
- el vuelo muestra las cuatro frases juntas, sin parallax ni SplitText;
- el mapa se recorre deslizando la escena a mano (scroll horizontal nativo);
- no hay confeti continuo, ni cursor personalizado, ni partículas ambientales;
- las aperturas y transiciones duran milisegundos.

### Rendimiento

- Sólo se animan `transform` y `opacity`; `will-change` se usa con criterio.
- La cantidad de partículas se ajusta por dispositivo (`resolveParticleBudget`) y
  el canvas se pausa cuando la pestaña no está visible.
- Los capítulos son componentes independientes y los efectos pesados
  (confeti, fuegos) sólo se crean en la celebración.

---

## Verificación

Además de `pnpm lint`, `tsc --noEmit` y `pnpm build` (los tres limpios), el
recorrido se probó **de punta a punta en un navegador real** (Chrome headless vía
DevTools Protocol), con clics y toques reales:

- **29/29** comprobaciones del recorrido completo: carga → eclosión del huevo →
  desbloqueo del scroll → parallax y cambio de cielo → mapa horizontal con snap
  → minijuego jugable con el scroll congelado → salida con ✕ → cueva con cuatro
  cofres → velas encendidas → mensaje, firma y botones → “Repetir el final” →
  sin errores ni advertencias en consola.
- **12/12** comprobaciones de las variantes: `prefers-reduced-motion` y móvil
  (390 × 844 con emulación táctil: sin desbordes horizontales, mapa con el ancho
  correcto, minijuego completo dentro de la pantalla y “mantener presionado”
  funcionando).

Comprobación de contenido: el texto final pasa un test que verifica que **no
aparezca ningún número acompañado de “años”**.

---

## Estado por fases

| Fase | Estado |
| --- | --- |
| 1 · Setup, tokens, fuentes, GSAP, Lenis, store, loader y HUD | ✅ |
| 2 · Prólogo (huevo) + Capítulo 1 (parallax vertical) | ✅ |
| 3 · Mapa horizontal + estaciones + contador de gemas | ✅ |
| 4 · Los cuatro minijuegos | ✅ |
| 5 · Cueva del tesoro + Final (pastel, velas, fuegos, mensaje) | ✅ |
| 6 · Pulido: audio, cursor, reduced-motion, responsive, README | ✅ |

**Pendiente sólo de tu lado:** copiar la imagen real del avatar en
`public/assets/eiwy/eiwy-avatar.png`, los mp3 opcionales en
`public/assets/audio/` y completar `communityMessages` en
`src/config/birthday.ts`. Nada de eso requiere tocar componentes.

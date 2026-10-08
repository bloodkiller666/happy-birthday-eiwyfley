# Assets

Esta carpeta está pensada para que **vos** dejes los archivos definitivos.
Mientras un archivo no exista, la web usa un placeholder SVG con los colores
del tema y **no se rompe nada**.

```
public/assets/
  eiwy/        · avatar y recortes de Eiwy Fley
  backgrounds/ · fondos propios (opcional, hoy todo es SVG generado)
  audio/       · música ambiental y efectos
```

## `eiwy/eiwy-avatar.png` (el único archivo imprescindible)

| Detalle | Valor |
| --- | --- |
| Ruta exacta | `public/assets/eiwy/eiwy-avatar.png` |
| Tamaño recomendado | **1024 × 1024 px** (cuadrada) |
| Formato | PNG con transparencia (o WebP renombrado a `.png`; también sirve `.jpg`) |
| Peso objetivo | menos de 400 KB |
| Encuadre | el rostro/medio cuerpo centrado, con margen alrededor |

La web la busca automáticamente (ver `src/config/birthday.ts` → `assets.avatar`).
Si el archivo no existe o falla la carga, se muestra la **silueta de dragona
SVG** (`src/components/art/DragonAvatar.tsx`), así que podés publicar la web
antes de tener el dibujo listo.

Cambiar de formato o de medida:

1. Copiá el archivo a `public/assets/eiwy/`.
2. Ajustá en `src/config/birthday.ts`:
   ```ts
   assets: {
     avatar: "/assets/eiwy/eiwy-avatar.png", // tu ruta
     avatarWidth: 1024,                      // ancho real en px
     avatarHeight: 1024,                     // alto real en px
     avatarAlt: "Retrato de Eiwy Fley: ...", // texto alternativo
     ambientAudio: "/assets/audio/ambient.mp3",
   }
   ```

### Silueta placeholder

Si preferís reemplazar el dibujo vectorial por uno propio, editá
`src/components/art/DragonAvatar.tsx` (`DragonSilhouette`). Es un SVG chico y
autocontenido, con la paleta del tema en variables.

## `audio/` (opcional)

| Archivo | Uso |
| --- | --- |
| `ambient.mp3` | música de fondo en loop (arranca sólo después de "Comenzar aventura") |
| `sfx-click.mp3`, `sfx-hover.mp3` | micro-interacciones |
| `sfx-hatch.mp3` | eclosión del huevo |
| `sfx-gem.mp3`, `sfx-match.mp3`, `sfx-bloom.mp3` | gemas y minijuegos |
| `sfx-pop.mp3`, `sfx-win.mp3` | impactos y victorias |
| `sfx-whoosh.mp3`, `sfx-sparkle.mp3` | transiciones |
| `sfx-candle.mp3`, `sfx-firework.mp3` | velas y fuegos artificiales |

Si un archivo falta, `src/lib/audio.ts` lo detecta (una sola comprobación por
ruta) y usa un **sintetizador WebAudio mínimo** integrado: la experiencia suena
igual, sin errores en consola y sin dependencias extra. No hace falta tocar
código para agregar los mp3: alcanza con copiarlos con esos nombres.

Volumen de referencia: música al 35 %, efectos al 60 % (`Howler.volume(0.6)`).

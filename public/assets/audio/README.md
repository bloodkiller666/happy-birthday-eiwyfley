# Audio (opcional)

Dejá acá los mp3 con **estos nombres exactos** y la web los usa sola:

| Archivo | Cuándo suena |
| --- | --- |
| `ambient.mp3` | música de fondo en loop (arranca sólo tras “Comenzar aventura”, al 35 %) |
| `sfx-click.mp3` | cualquier clic |
| `sfx-hover.mp3` | hover en controles |
| `sfx-hatch.mp3` | eclosión del huevo |
| `sfx-gem.mp3` | gema conseguida / brasa recogida |
| `sfx-bloom.mp3` | flor que se abre |
| `sfx-match.mp3` | par encontrado en la memoria |
| `sfx-pop.mp3` | golpe, fallo, carta equivocada |
| `sfx-win.mp3` | reto superado / velas encendidas |
| `sfx-whoosh.mp3` | transiciones |
| `sfx-sparkle.mp3` | respuesta correcta del quiz |
| `sfx-candle.mp3` | cada vela que se enciende |
| `sfx-firework.mp3` | fuegos artificiales |

**No es obligatorio**: si falta un archivo, `src/lib/audio.ts` lo detecta una
sola vez (sin errores en consola) y usa un sintetizador WebAudio integrado para
ese sonido. La experiencia nunca queda muda ni rota.

Volumen: música 35 %, efectos 60 %. Todo se puede silenciar con el botón fijo
de la esquina inferior derecha. Nunca hay autoplay.

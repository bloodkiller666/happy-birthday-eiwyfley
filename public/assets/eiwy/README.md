# Avatar de Eiwy Fley

Copiá acá la imagen del avatar con este nombre exacto:

```
public/assets/eiwy/eiwy-avatar.png
```

| Detalle | Valor |
| --- | --- |
| Tamaño | **1024 × 1024 px** (cuadrada) |
| Formato | PNG con transparencia (o WebP/JPEG renombrado a `.png`) |
| Peso | menos de 400 KB |
| Encuadre | rostro o medio cuerpo centrado, con margen alrededor |

Mientras el archivo no exista, la web muestra un **placeholder SVG** con la
silueta de dragona y la paleta del tema (`src/components/art/DragonAvatar.tsx`).
Al copiar la imagen, se usa automáticamente: no hay que tocar ningún componente.

> **Para que se vea:** con `pnpm dev` el cambio es inmediato. Con `pnpm start`
> hay que **reiniciar el servidor** (los archivos de `public/` se resuelven al
> arrancar); no hace falta recompilar. Verificado: un archivo nuevo en `public/`
> devuelve 200 tras reiniciar, y un archivo ausente devuelve 404 (por eso
> funciona el fallback a la silueta).

Si usás otra ruta, otra medida o querés cambiar el texto alternativo, editá
`assets` en `src/config/birthday.ts`.

Recortes adicionales (opcional): si más adelante tenés versiones recortadas
(por ejemplo `eiwy-head.png`, `eiwy-wing.png`), dejalas también acá y avisá para
integrarlas en los capítulos.

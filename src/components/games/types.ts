/** Props compartidas por los cuatro minijuegos. */
export interface GameProps {
  /** Color de acento de la estación. */
  accent: string;
  reducedMotion: boolean;
  /** Se muestra el botón "Saltar reto" (tras 2 intentos fallidos). */
  canSkip: boolean;
  onSkip: () => void;
  /** Volver a la estación sin jugar (abandona el reto, sin gema). */
  onClose: () => void;
  /** Reto superado: otorga la gema. */
  onComplete: () => void;
  /** Intento fallido: suma intentos y permite reintentar sin penalización. */
  onFail: () => void;
}

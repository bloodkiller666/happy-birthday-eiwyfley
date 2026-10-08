/**
 * ============================================================================
 *  CONFIGURACIÓN EDITABLE — La Travesía de Eiwy Fley
 * ============================================================================
 *  Este es el ÚNICO archivo que hace falta tocar para cambiar textos, mensaje
 *  final, firma, preguntas del quiz y mensajes de la comunidad.
 *
 *  Reglas de contenido (importantes):
 *   - NUNCA mencionar su edad, número de velas ni cuenta de años.
 *   - Sin chistes internos ni referencias a personas reales.
 * ============================================================================
 */

/** Identificadores de las cuatro gemas / estaciones del mapa. */
export type GemId = "flowers" | "volcano" | "crystals" | "city";

export interface QuizQuestion {
  question: string;
  options: string[];
  /** Índice de la opción correcta dentro de `options`. */
  answer: number;
  /** Dato simpático que se muestra tras responder. */
  fact: string;
}

export interface CommunityMessage {
  author: string;
  message: string;
}

export interface StationConfig {
  id: GemId;
  eyebrow: string;
  title: string;
  challenge: string;
  description: string;
  /** Se muestra como ayuda dentro del minijuego. */
  hint: string;
  gemLabel: string;
  /** Color de acento (hex) usado en el HUD y las partículas de esa estación. */
  accent: string;
}

export interface BirthdayConfig {
  honoree: string;
  title: string;
  subtitle: string;
  documentTitle: string;
  description: string;
  /** Firma que aparece al final y en el HUD. */
  from: string;
  loader: {
    title: string;
    loading: string;
    hint: string;
    start: string;
    readyLabel: string;
  };
  prologue: {
    eyebrow: string;
    title: string;
    intro: string;
    press: string;
    loadingLabel: string;
    readyLabel: string;
    hatched: string;
  };
  flight: {
    eyebrow: string;
    title: string;
    lines: string[];
    hint: string;
    dawnLabel: string;
    duskLabel: string;
  };
  map: {
    eyebrow: string;
    title: string;
    intro: string;
    hint: string;
    gemsLabel: string;
    completeLabel: string;
    lockedLabel: string;
    doorLabel: string;
  };
  stations: StationConfig[];
  games: {
    bloom: {
      title: string;
      instruction: string;
      holdLabel: string;
      releaseLabel: string;
      completeLabel: string;
      petalsLeft: string;
    };
    dodge: {
      title: string;
      instruction: string;
      scoreLabel: string;
      timeLabel: string;
      completeLabel: string;
      failLabel: string;
    };
    memory: {
      title: string;
      instruction: string;
      pairsLabel: string;
      completeLabel: string;
      matchLabel: string;
    };
    catch: {
      title: string;
      instruction: string;
      caughtLabel: string;
      quizLabel: string;
      completeLabel: string;
      correctLabel: string;
      wrongLabel: string;
    };
  };
  cave: {
    eyebrow: string;
    title: string;
    intro: string;
    hint: string;
    chestLabel: string;
    openedLabel: string;
    completeLabel: string;
    enterLabel: string;
  };
  celebration: {
    eyebrow: string;
    title: string;
    cakeLabel: string;
    candleHint: string;
    blowingLabel: string;
    litLabel: string;
    message: string[];
    communityTitle: string;
    communityEmpty: string;
    replayLabel: string;
    replayFinalLabel: string;
  };
  buttons: {
    play: string;
    retry: string;
    skip: string;
    continue: string;
    nextStation: string;
    backToMap: string;
    close: string;
    reveal: string;
  };
  /** Preguntas del mini quiz de la Ciudad Flotante. */
  quiz: QuizQuestion[];
  /** Mensajes de la comunidad (vacío por defecto). */
  communityMessages: CommunityMessage[];
  assets: {
    /** Reemplazar por la imagen real del avatar (ver README.md). */
    avatar: string;
    /** Alto/ancho recomendado para el avatar. */
    avatarWidth: number;
    avatarHeight: number;
    avatarAlt: string;
    ambientAudio: string;
  };
}

export const birthday: BirthdayConfig = {
  honoree: "Eiwy Fley",
  title: "La Travesía de Eiwy Fley",
  subtitle: "Un año más de aventuras, otra vuelta al sol",
  documentTitle: "La Travesía de Eiwy Fley · Feliz cumpleaños",
  description:
    "Un recorrido interactivo por capítulos para celebrar otra vuelta al sol de Eiwy Fley: vuela por el cielo, supera cuatro desafíos, reúne las gemas y enciende las velas.",
  from: "De parte de: tus amigas y amigos de la comunidad",

  loader: {
    title: "La Travesía de Eiwy Fley",
    loading: "Preparando alas, flores y un poquito de fuego…",
    hint: "Con sonido se siente más épico. Podés silenciarlo cuando quieras.",
    start: "Comenzar aventura",
    readyLabel: "Todo listo",
  },

  prologue: {
    eyebrow: "Prólogo",
    title: "El Huevo",
    intro: "Algo se mueve dentro del cascarón. Hay aventuras que no esperan.",
    press: "Mantené presionado el huevo (o tocalo) para romper el cascarón",
    loadingLabel: "Cascarón",
    readyLabel: "¡Ahí viene!",
    hatched: "¡Despertó! Y ya tiene ganas de volar.",
  },

  flight: {
    eyebrow: "Capítulo 1",
    title: "El Vuelo",
    lines: [
      "Hay quienes nacen para quedarse… y hay quienes nacen para volar.",
      "Nadie te regaló un mapa. Te diste alas.",
      "Cada vuelta al sol, el cielo te queda un poco más chico.",
      "Dicen que las tormentas se apartan cuando pasás. O será que te encantan.",
    ],
    hint: "Deslizá para volar",
    dawnLabel: "Amanecer",
    duskLabel: "Atardecer",
  },

  map: {
    eyebrow: "Capítulo 2",
    title: "El Mapa de Desafíos",
    intro: "Cuatro estaciones, cuatro retos, cuatro gemas. Sólo llega al final quien se anima a jugar.",
    hint: "Deslizá a los costados para recorrer el mapa",
    gemsLabel: "Gemas",
    completeLabel: "¡Mapa completado!",
    lockedLabel: "Reto pendiente",
    doorLabel: "La cueva se abre más adelante",
  },

  stations: [
    {
      id: "flowers",
      eyebrow: "Estación 1",
      title: "Prado de Flores",
      challenge: "Hazlas florecer",
      description:
        "Los capullos están dormidos y tienen frío. Soplá tu aliento de dragona encima de cada uno y despertalos.",
      hint: "Mantené presionado sobre un capullo y soltá cuando la barra se llene.",
      gemLabel: "Gema de las flores",
      accent: "#7cc43a",
    },
    {
      id: "volcano",
      eyebrow: "Estación 2",
      title: "Volcán",
      challenge: "Aliento de Fuego",
      description:
        "Esquivá las rocas que caen y recogé brasas con la punta del ala. Sin apuro: acá se viene a jugar, no a sufrir.",
      hint: "Movés a la dragona con el mouse o el dedo. Recogé brasas, evitá las rocas.",
      gemLabel: "Gema de la brasa",
      accent: "#ff9d4d",
    },
    {
      id: "crystals",
      eyebrow: "Estación 3",
      title: "Cueva de Cristales",
      challenge: "Memoria de gemas",
      description:
        "Doce cartas, seis pares de gemas. La cueva se apaga de a poco, así que acordate bien de dónde brilla cada una.",
      hint: "Tocá dos cartas para buscar un par. Podés usar las flechas y Enter.",
      gemLabel: "Gema de cristal",
      accent: "#27c9ee",
    },
    {
      id: "city",
      eyebrow: "Estación 4",
      title: "Ciudad Flotante",
      challenge: "Travesura",
      description:
        "Los duendecillos se robaron las gemas del mapa y se esconden entre las nubes. Atrapalos antes de que se metan en sus madrigueras.",
      hint: "Tocá cada duendecillo antes de que se esconda. Después, unas preguntas de dragones.",
      gemLabel: "Gema traviesa",
      accent: "#d8e02a",
    },
  ],

  games: {
    bloom: {
      title: "Hazlas florecer",
      instruction: "Mantené presionado y soltá en el momento justo.",
      holdLabel: "Soplando…",
      releaseLabel: "¡Soltá el aliento!",
      completeLabel: "¡El prado entero floreció!",
      petalsLeft: "Capullos dormidos",
    },
    dodge: {
      title: "Aliento de Fuego",
      instruction: "Movete con el mouse o el dedo. Recogé brasas, esquivá rocas.",
      scoreLabel: "Brasas",
      timeLabel: "Tiempo",
      completeLabel: "¡Sobreviviste al volcán!",
      failLabel: "¡Casi! Los dragones también se caen… y se vuelven a levantar.",
    },
    memory: {
      title: "Memoria de gemas",
      instruction: "Encontrá los seis pares.",
      pairsLabel: "Pares",
      completeLabel: "¡Memoria de dragona!",
      matchLabel: "¡Par encontrado!",
    },
    catch: {
      title: "Travesura",
      instruction: "Atrapá a los duendecillos antes de que se escondan.",
      caughtLabel: "Duendecillos",
      quizLabel: "Preguntas de dragones",
      completeLabel: "¡Los atrapaste a todos!",
      correctLabel: "¡Correcto!",
      wrongLabel: "Casi… pero los dragones aprenden rápido.",
    },
  },

  cave: {
    eyebrow: "Capítulo 3",
    title: "La Cueva del Tesoro",
    intro: "Cuatro cerraduras, cuatro gemas. El tesoro no se abre con llaves: se abre con aventuras.",
    hint: "Deslizá para acercarte a la cueva.",
    chestLabel: "Cofre",
    openedLabel: "Cofre abierto",
    completeLabel: "¡Los cuatro cofres brillan!",
    enterLabel: "Entrar a la celebración",
  },

  celebration: {
    eyebrow: "Final",
    title: "La Gran Celebración",
    cakeLabel: "Pastel de la travesía",
    candleHint: "Mantené presionado para encender las velas con tu aliento de fuego",
    blowingLabel: "Encendiendo…",
    litLabel: "¡Todas las velas encendidas!",
    message: [
      "¡Otra vuelta al sol, Eiwy!",
      "Este año volaste más alto, te reíste más fuerte y encontraste flores hasta en los rincones más grises.",
      "Que nunca te falte un desafío que te haga brillar, ni una amiga con quien hacer travesuras.",
      "Ningún desafío es demasiado grande para una dragona que jamás deja de intentarlo.",
      "¡Feliz cumpleaños!",
    ],
    communityTitle: "Mensajes de la comunidad",
    communityEmpty: "Todavía no hay mensajes por aquí. Este espacio está reservado para tu gente.",
    replayLabel: "Volver a volar",
    replayFinalLabel: "Repetir el final",
  },

  buttons: {
    play: "Jugar",
    retry: "Reintentar",
    skip: "Saltar reto",
    continue: "Continuar",
    nextStation: "Siguiente estación",
    backToMap: "Volver al mapa",
    close: "Cerrar",
    reveal: "Soplar las velas",
  },

  quiz: [
    {
      question: "¿Qué es lo que más brilla en el tesoro de una dragona?",
      options: ["Las gemas", "El aburrimiento", "Las piedras comunes"],
      answer: 0,
      fact: "Obvio. Ninguna dragona presume de aburrimiento.",
    },
    {
      question: "¿Cuál es la mejor forma de ganarse a una dragona?",
      options: ["Regalarle flores", "Desafiarla a un reto", "Robarle el tesoro"],
      answer: 1,
      fact: "Reto aceptado. Siempre.",
    },
    {
      question: "¿Qué escupe una dragona cuando está realmente orgullosa?",
      options: ["Humo gris", "Llamas turquesa", "Confeti"],
      answer: 1,
      fact: "Turquesa, con las puntas naranjas. Es su firma.",
    },
    {
      question: "¿Cuál es el mejor día para volar?",
      options: ["Cuando hay tormenta", "Hoy", "Cuando ya no queda nada por descubrir"],
      answer: 1,
      fact: "Hoy. Siempre hoy.",
    },
  ],

  /** Completar cuando la comunidad mande sus mensajes. */
  communityMessages: [],

  assets: {
    avatar: "/assets/eiwy/eiwy-avatar.png",
    avatarWidth: 1024,
    avatarHeight: 1024,
    avatarAlt: "Retrato de Eiwy Fley: una dragona turquesa con cuernos lima y flores entre el pelo",
    ambientAudio: "/assets/audio/ambient.mp3",
  },
};

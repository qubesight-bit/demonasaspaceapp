export type Resources = { energy: number; food: number; safety: number };
export type ResourceKey = keyof Resources;

export const START: Resources = { energy: 35, food: 70, safety: 80 };
/** A resource at or below this level ends the mission in defeat. */
export const CRITICAL = 10;

export type Choice = {
  id: string;
  title: string;
  subtitle: string;
  effects: Partial<Resources>;
  positive: string;
  cost: string;
};

export type Mission = {
  id: number;
  code: string;
  title: string;
  alert: string;
  sensor: string;
  headline: string;
  body: string;
  fact: string;
  choices: [Choice, Choice];
};

export const MISSIONS: Mission[] = [
  {
    id: 1,
    code: "MISIÓN 01",
    title: "PANELES CON POLVO",
    alert: "¡ALERTA! FALTA ENERGÍA",
    sensor: "Aviso de la Base Lunar Alfa",
    headline: "¡El polvo lunar cubre los paneles!",
    body: "Los paneles usan la luz del Sol para producir energía. Ahora están cubiertos de polvo y producen menos.\n¡La base necesita energía!",
    fact: "El suelo lunar tiene polvo y trocitos de roca. Se llama regolito. Su polvo puede rayar los equipos. También se pega por la electricidad estática, como un globo que atrae el pelo.",
    choices: [
      { id: "clean", title: "Limpiar los paneles", subtitle: "Salir con traje espacial a quitar el polvo", effects: { energy: 45, safety: -25 }, positive: "¡Los paneles limpios producen más energía!", cost: "Salir de la base tiene riesgos para el equipo." },
      { id: "save", title: "Ahorrar energía", subtitle: "Apagar las luces de las plantas", effects: { food: -30 }, positive: "La energía se mantiene. El equipo no necesita salir.", cost: "Sin luz, las plantas producen menos comida." },
    ],
  },
  {
    id: 2,
    code: "MISIÓN 02",
    title: "INVERNADERO HELADO",
    alert: "¡ALERTA! LLEGÓ LA NOCHE",
    sensor: "Aviso del invernadero",
    headline: "¡Las plantas se están congelando!",
    body: "En muchas zonas de la Luna, la noche dura unos 14 días terrestres.\nAfuera, el suelo puede bajar hasta −170 °C.\n¡El invernadero pierde calor y las plantas están en peligro!",
    fact: "En la Luna casi no hay aire que ayude a repartir el calor. Por eso, el suelo puede calentarse mucho de día y enfriarse mucho de noche.",
    choices: [
      { id: "heat", title: "Encender la calefacción", subtitle: "Dar calor al invernadero", effects: { energy: -20, food: 25 }, positive: "¡Las plantas reciben calor y producen más comida!", cost: "La calefacción usa energía de la base." },
      { id: "cover", title: "Cubrir las plantas", subtitle: "Poner mantas que ayudan a guardar el calor", effects: { safety: -15, food: 20 }, positive: "¡Las mantas guardan calor y protegen la comida!", cost: "El equipo se expone al frío mientras coloca las mantas." },
    ],
  },
  {
    id: 3,
    code: "MISIÓN 03",
    title: "PROTEJAMOS LA BASE",
    alert: "¡ALERTA! ROCAS DEL ESPACIO",
    sensor: "Aviso de vigilancia de la base",
    headline: "¡Pequeñas rocas se acercan!",
    body: "Son pequeños fragmentos de roca del espacio, llamados micrometeoritos. Pueden golpear la base a gran velocidad.\n¡Hay que proteger al equipo!",
    fact: "La Luna casi no tiene aire que frene estas pequeñas rocas. Aunque sean diminutas, pueden causar daños al chocar. Por eso, las bases necesitan barreras físicas de protección.",
    choices: [
      { id: "shield", title: "Reforzar las barreras", subtitle: "Usar paneles y suelo lunar como protección", effects: { safety: 30, energy: -20 }, positive: "¡Las barreras reducen el riesgo de daños en la base!", cost: "Reforzar las barreras usa energía." },
      { id: "bunker", title: "Ir al refugio", subtitle: "Llevar al equipo a un lugar seguro bajo tierra", effects: { food: -20 }, positive: "El equipo se refugia bajo tierra. La seguridad se mantiene.", cost: "Nadie cuida las plantas y se pierde comida." },
    ],
  },
  {
    id: 4,
    code: "MISIÓN 04",
    title: "¡TORMENTA SOLAR!",
    alert: "¡ALERTA! ¡EL SOL ESTÁ ENFURECIDO!",
    sensor: "Aviso de vigilancia solar",
    headline: "¡Una tormenta solar se dirige hacia la Luna!",
    body: "Una tormenta solar puede enviar partículas energéticas solares, llamadas SEP.\nFuera de un refugio protegido, estas partículas pueden afectar a astronautas y equipos. ¡Decidí antes de que lleguen!",
    fact: "Las partículas energéticas solares, o SEP, pueden ser peligrosas para las personas en la Luna. La Luna no tiene una atmósfera densa ni un campo magnético global como la Tierra. Un refugio con buen blindaje ayuda a reducir la exposición.",
    choices: [
      { id: "power", title: "Continuar afuera", subtitle: "Seguimos las actividades exteriores para mantener la energía de la base.", effects: { energy: 30, safety: -35 }, positive: "¡La base mantiene más energía disponible!", cost: "Fuera del refugio, astronautas y equipos quedan más expuestos a las partículas solares." },
      { id: "shelter", title: "Ir al refugio", subtitle: "Suspendemos actividades exteriores y usamos un refugio con blindaje.", effects: { safety: 25, food: -15 }, positive: "¡El refugio con blindaje reduce la exposición del equipo!", cost: "Mientras el equipo está refugiado, se retrasa el cuidado de las plantas y baja la comida disponible." },
    ],
  },
];

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function applyChoice(r: Resources, c: Choice): Resources {
  return {
    energy: clamp(r.energy + (c.effects.energy ?? 0)),
    food: clamp(r.food + (c.effects.food ?? 0)),
    safety: clamp(r.safety + (c.effects.safety ?? 0)),
  };
}

export function failedResource(r: Resources): ResourceKey | null {
  return (Object.keys(r) as ResourceKey[]).find((k) => r[k] <= CRITICAL) ?? null;
}

export const RESOURCE_LABEL: Record<ResourceKey, string> = { energy: "Energía", food: "Comida", safety: "Seguridad" };

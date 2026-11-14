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
    title: "EMERGENCIA SOLAR",
    alert: "¡ALERTA CRÍTICA!",
    sensor: "Base Lunar Alfa • Sensor #04",
    headline: "¡El polvo lunar cubre los paneles!",
    body: "Una nube de regolito lunar ha sepultado los colectores fotovoltaicos principales y la reserva de energía está cayendo rápidamente.",
    fact: "El polvo lunar (regolito) es extremadamente abrasivo y con bordes afilados. Al no haber atmósfera, se adhiere a visores y paneles solares mediante carga electrostática inducida por la radiación solar.",
    choices: [
      { id: "clean", title: "Limpiar los paneles", subtitle: "Salida EVA al exterior", effects: { energy: 45, safety: -25 }, positive: "Energía recuperada al retirar el manto de polvo de las celdas fotovoltaicas.", cost: "Seguridad por la exposición directa de la cuadrilla al exterior lunar." },
      { id: "save", title: "Reducir consumo", subtitle: "Apagar sistemas secundarios", effects: { food: -30 }, positive: "La energía se mantiene estable sin arriesgar a la tripulación.", cost: "Comida: las lámparas de cultivo quedan apagadas." },
    ],
  },
  {
    id: 2,
    code: "MISIÓN 02",
    title: "INVERNADERO HELADO",
    alert: "¡ALERTA!",
    sensor: "Domo de cultivo • Sensor térmico",
    headline: "¡Las plantas se están congelando!",
    body: "La noche lunar dura 14 días terrestres y la temperatura exterior cae a -170 °C. El frío espacial avanza sobre el invernadero.",
    fact: "En la noche lunar las temperaturas bajan a unos -170 °C. Los hábitats reales estudian mantas reflectivas y calefacción por ciclos para proteger los cultivos.",
    choices: [
      { id: "heat", title: "Encender la calefacción", subtitle: "Calor máximo en el domo", effects: { energy: -20, food: 25 }, positive: "Comida: las plantas se recuperan con el calor.", cost: "Energía consumida por los calefactores." },
      { id: "cover", title: "Cubrir las plantas", subtitle: "Mantas térmicas manuales", effects: { safety: -15, food: 20 }, positive: "Comida: las mantas conservan el calor de los cultivos.", cost: "Seguridad: la tripulación trabaja sin protección térmica." },
    ],
  },
  {
    id: 3,
    code: "MISIÓN 03",
    title: "DEFENSAS LUNARES",
    alert: "¡ALERTA! RIESGO DE IMPACTOS",
    sensor: "Sistema de vigilancia • Domos presurizados",
    headline: "¡Lluvia de micrometeoritos hacia la base!",
    body: "El sistema de vigilancia alerta de posible riesgo de impactos sobre los domos presurizados. Selecciona el protocolo de defensa.",
    fact: "Sin atmósfera que los frene, los micrometeoritos golpean la Luna a más de 20 km/s. Por eso los hábitats lunares se proponen cubrir con regolito o construir bajo tierra.",
    choices: [
      { id: "shield", title: "Reforzar protección", subtitle: "Reforzar paneles y barreras de regolito", effects: { safety: 30, energy: -20 }, positive: "Seguridad: el blindaje físico reduce el riesgo de daños por micrometeoritos.", cost: "Energía empleada en reforzar el blindaje." },
      { id: "bunker", title: "Refugiar tripulación", subtitle: "Evacuar a búnker subterráneo", effects: { food: -20 }, positive: "Seguridad: la tripulación queda protegida bajo tierra.", cost: "Comida: el invernadero queda sin cuidados." },
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

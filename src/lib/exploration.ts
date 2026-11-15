export type LocationId = 0 | 1 | 2 | 3;

// A single undirected circuit. Locations unlock in scientific mission order.
export const LOCATIONS = [
  { name: "Campo de paneles", destination: "Ir a paneles solares", emoji: "☀️", description: "Estos paneles usan la luz del Sol para dar energía a nuestra base.", travelMessage: "¡Vamos a los paneles solares!", connections: [1, 3] },
  { name: "Invernadero", destination: "Ir al invernadero", emoji: "🌱", description: "Aquí cuidamos las plantas que dan comida al equipo.", travelMessage: "¡Vamos al invernadero!", connections: [0, 2] },
  { name: "Estación de protección", destination: "Ir a la estación de protección", emoji: "🛡️", description: "Aquí protegemos la base de las pequeñas rocas del espacio.", travelMessage: "¡Vamos a la estación de protección!", connections: [1, 3] },
  { name: "Observatorio solar", destination: "Ir al observatorio solar", emoji: "🔭", description: "Desde aquí vigilamos el Sol para mantener al equipo a salvo.", travelMessage: "¡Vamos al observatorio solar!", connections: [0, 2] },
] as const satisfies readonly { name: string; destination: string; emoji: string; description: string; travelMessage: string; connections: readonly LocationId[] }[];

export function canVisit(from: LocationId, to: LocationId, missionIndex: number): boolean {
  const connections: readonly LocationId[] = LOCATIONS[from].connections;
  return connections.includes(to) && to <= missionIndex;
}

export type NavigationState = {
  location: LocationId;
  history: LocationId[];
  pending: { target: LocationId; history: LocationId[] } | null;
  arrived: boolean;
};

export const INITIAL_NAVIGATION: NavigationState = { location: 0, history: [], pending: null, arrived: false };

export type NavigationAction =
  | { type: "visit"; target: LocationId; missionIndex: number; animate: boolean }
  | { type: "back"; missionIndex: number; animate: boolean }
  | { type: "arrive"; target: LocationId }
  | { type: "reset" };

// Navigation owns only location/history. It cannot spend resources or resolve missions.
// Finish, skip and reduced motion all commit the same validated destination once.
export function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  if (action.type === "reset") return INITIAL_NAVIGATION;
  if (action.type === "arrive") {
    if (state.pending?.target !== action.target) return state;
    return { location: action.target, history: state.pending.history, pending: null, arrived: true };
  }
  if (state.pending) return state;
  const target = action.type === "back" ? state.history.at(-1) : action.target;
  if (target === undefined || !canVisit(state.location, target, action.missionIndex)) return state;
  const history = action.type === "back" ? state.history.slice(0, -1) : [...state.history, state.location];
  return action.animate
    ? { ...state, pending: { target, history }, arrived: false }
    : { location: target, history, pending: null, arrived: true };
}

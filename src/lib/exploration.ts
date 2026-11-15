// Four connected rooms arranged in a square. Navigation never spends resources.
export const DIRECTIONS = ["Norte", "Este", "Sur", "Oeste"] as const;
export type Heading = 0 | 1 | 2 | 3;
export type LocationId = 0 | 1 | 2 | 3;
export type Pose = { location: LocationId; heading: Heading };

export const LOCATIONS = [
  { name: "Campo de paneles", exits: [3, 1, null, null] },
  { name: "Invernadero", exits: [2, null, null, 0] },
  { name: "Barreras de la base", exits: [null, null, 1, 3] },
  { name: "Observatorio solar", exits: [null, 2, 0, null] },
] as const;

export const INITIAL_POSE: Pose = { location: 0, heading: 1 };

export function turn(pose: Pose, side: "left" | "right"): Pose {
  return { ...pose, heading: ((pose.heading + (side === "left" ? 3 : 1)) % 4) as Heading };
}

export function destination(pose: Pose): LocationId | null {
  return LOCATIONS[pose.location].exits[pose.heading];
}

export function advance(pose: Pose): Pose {
  const next = destination(pose);
  return next === null ? pose : { ...pose, location: next };
}

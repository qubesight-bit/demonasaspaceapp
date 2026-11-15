import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import corridorVideo from "@/assets/prueba-velocidad.mp4";
import solarPanelVideo from "@/assets/paneles-solares.mp4";
import { Game } from "@/components/game/Game";
import { LOCATIONS, INITIAL_NAVIGATION, canVisit, navigationReducer, type LocationId } from "@/lib/exploration";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const videoLabel = "Transición entre ubicaciones de la base lunar";
const click = (name: RegExp | string) => fireEvent.click(screen.getAllByRole("button", { name })[0]!);
const video = () => screen.getByLabelText(videoLabel) as HTMLVideoElement;
const resources = () => within(screen.getByLabelText("Recursos de la base")).getAllByText(/%$/).map(node => node.textContent);
function start() { render(<Game />); click(/Comenzar juego/i); }
function completeMission(choice: string) {
  click(/Iniciar MISIÓN/i);
  click(new RegExp(choice, "i"));
  click("Continuar");
}
function visit(target: LocationId, skip = false) {
  click(LOCATIONS[target].destination);
  if (skip) click("Saltar animación");
  else fireEvent.ended(video());
}
function reachLastMission() {
  completeMission("Limpiar los paneles"); visit(1);
  completeMission("Cubrir las plantas"); visit(2);
  completeMission("Ir al refugio"); visit(3);
}

describe("destination navigation rules", () => {
  it("allows only connected locations unlocked by completed missions", () => {
    const edges = [[1, 3], [0, 2], [1, 3], [0, 2]];
    for (const from of [0, 1, 2, 3] as const) {
      for (const target of [0, 1, 2, 3] as const) {
        for (let progress = 0; progress < 4; progress++) {
          expect(canVisit(from, target, progress)).toBe(edges[from]!.includes(target) && target <= progress);
        }
      }
    }
  });

  it("rejects blocked and disconnected destinations, including during a pending move", () => {
    expect(navigationReducer(INITIAL_NAVIGATION, { type: "visit", target: 1, missionIndex: 0, animate: true })).toBe(INITIAL_NAVIGATION);
    expect(navigationReducer(INITIAL_NAVIGATION, { type: "visit", target: 2, missionIndex: 3, animate: true })).toBe(INITIAL_NAVIGATION);
    const pending = navigationReducer(INITIAL_NAVIGATION, { type: "visit", target: 1, missionIndex: 3, animate: true });
    expect(pending.location).toBe(0);
    expect(navigationReducer(pending, { type: "visit", target: 3, missionIndex: 3, animate: true })).toBe(pending);
    expect(navigationReducer(pending, { type: "back", missionIndex: 3, animate: true })).toBe(pending);
    expect(navigationReducer(pending, { type: "arrive", target: 3 })).toBe(pending);
    const arrived = navigationReducer(pending, { type: "arrive", target: 1 });
    expect(arrived.location).toBe(1);
    expect(arrived.history).toEqual([0]);
    expect(navigationReducer(arrived, { type: "arrive", target: 1 })).toBe(arrived);
  });

  it("pops valid history on back and resets navigation for a new adventure", () => {
    const arrived = navigationReducer(INITIAL_NAVIGATION, { type: "visit", target: 1, missionIndex: 1, animate: false });
    const returned = navigationReducer(arrived, { type: "back", missionIndex: 1, animate: false });
    expect(returned.location).toBe(0);
    expect(returned.history).toEqual([]);
    expect(navigationReducer(returned, { type: "back", missionIndex: 1, animate: true })).toBe(returned);
    expect(navigationReducer(arrived, { type: "reset" })).toEqual(INITIAL_NAVIGATION);
  });
});

describe("child friendly exploration", () => {
  it("shows the current scene, resources, progress and explains locked connected destinations", () => {
    start();
    expect(screen.getByRole("heading", { name: "Estás en: Campo de paneles" })).toBeInTheDocument();
    expect(screen.getByText(/Estos paneles usan la luz/)).toBeInTheDocument();
    expect(screen.getByText("Misiones completadas: 0 de 4")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Progreso de la aventura" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Girar|Avanzar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: LOCATIONS[2].destination })).not.toBeInTheDocument();
    const locked = screen.getByRole("button", { name: /Ir al invernadero/ });
    expect(locked).toBeDisabled();
    expect(locked).toHaveAccessibleDescription(/Completá la misión 1 en Campo de paneles/);
    fireEvent.click(locked);
    expect(screen.queryByLabelText(videoLabel)).not.toBeInTheDocument();
    expect(resources()).toEqual(["35%", "70%", "80%"]);
    expect(screen.getByRole("button", { name: "← Volver" })).toBeDisabled();
  });

  it("plays inline inside the scene while keeping controls visible and blocking conflicting actions", () => {
    start(); completeMission("Limpiar los paneles");
    const before = resources();
    click(LOCATIONS[1].destination);
    const playing = video();
    expect(playing).toHaveAttribute("src", corridorVideo);
    expect(playing.autoplay).toBe(true);
    expect(playing.muted).toBe(true);
    expect(playing.playsInline).toBe(true);
    expect(playing.controls).toBe(false);
    expect(playing.loop).toBe(false);
    expect(playing).toHaveAttribute("disablePictureInPicture");
    expect(playing).toHaveAttribute("controlsList", "nofullscreen noremoteplayback");
    expect(screen.getByLabelText("Escenario de la base lunar")).toContainElement(playing);
    expect(screen.getByRole("status")).toHaveTextContent("¡Vamos al invernadero!");
    expect(screen.getByRole("heading", { name: "Estás en: Campo de paneles" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: LOCATIONS[1].destination })).toBeDisabled();
    expect(screen.getByRole("button", { name: "← Volver" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Saltar animación" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: LOCATIONS[1].destination }));
    fireEvent.ended(playing);
    expect(screen.getByRole("heading", { name: "Estás en: Invernadero" })).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("¡Llegaste!");
    expect(resources()).toEqual(before);
    expect(screen.getByRole("button", { name: /Iniciar MISIÓN 02/ })).toBeEnabled();
  });

  it("skips exactly one move and returns with the solar video without replaying rewards", () => {
    start(); completeMission("Limpiar los paneles");
    const before = resources();
    click(LOCATIONS[1].destination);
    const oldVideo = video();
    click("Saltar animación");
    fireEvent.ended(oldVideo);
    expect(screen.getByRole("heading", { name: "Estás en: Invernadero" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saltar animación" })).toBeDisabled();
    click("← Volver");
    expect(video()).toHaveAttribute("src", solarPanelVideo);
    click("Saltar animación");
    expect(screen.getByRole("heading", { name: "Estás en: Campo de paneles" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Iniciar MISIÓN/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Ya completaste la misión de esta zona/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "← Volver" })).toBeDisabled();
    expect(resources()).toEqual(before);
  });

  it("disables starting a mission while returning to an earlier zone", () => {
    start(); completeMission("Limpiar los paneles"); visit(1);
    click("← Volver");
    const mission = screen.getByRole("button", { name: /Iniciar MISIÓN 02/ });
    expect(mission).toBeDisabled();
    fireEvent.click(mission);
    expect(screen.queryByRole("heading", { name: /Las plantas se están congelando/ })).not.toBeInTheDocument();
    click("Saltar animación");
    expect(screen.queryByRole("button", { name: /Iniciar MISIÓN/ })).not.toBeInTheDocument();
  });

  it("uses the destination video for all eight directed connections after unlocking the base", () => {
    start(); reachLastMission();
    const before = resources();
    for (const target of [0, 1, 2, 3, 2, 1, 0, 3] as const) {
      click(LOCATIONS[target].destination);
      expect(video()).toHaveAttribute("src", target === 0 ? solarPanelVideo : corridorVideo);
      fireEvent.ended(video());
      expect(screen.getByRole("heading", { name: `Estás en: ${LOCATIONS[target].name}` })).toBeInTheDocument();
      expect(resources()).toEqual(before);
      expect(screen.queryByRole("button", { name: /Iniciar MISIÓN 0[123]/ })).not.toBeInTheDocument();
    }
    expect(screen.getByText("Misiones completadas: 3 de 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Iniciar MISIÓN 04/ })).toBeEnabled();
  });

  it("uses valid history for consecutive back moves and prevents inaccessible destinations", () => {
    start(); reachLastMission();
    const before = resources();
    for (const target of [2, 1, 0] as const) {
      click("← Volver"); click("Saltar animación");
      expect(screen.getByRole("heading", { name: `Estás en: ${LOCATIONS[target].name}` })).toBeInTheDocument();
      expect(resources()).toEqual(before);
    }
    expect(screen.getByRole("button", { name: "← Volver" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Iniciar MISIÓN/ })).not.toBeInTheDocument();
  });

  it("honors reduced motion for both destination and back without creating a video", () => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    vi.spyOn(window, "matchMedia").mockReturnValue({ ...media, matches: true });
    start(); completeMission("Limpiar los paneles");
    const before = resources();
    click(LOCATIONS[1].destination);
    expect(screen.queryByLabelText(videoLabel)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Estás en: Invernadero" })).toHaveFocus();
    click("← Volver");
    expect(screen.queryByLabelText(videoLabel)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Estás en: Campo de paneles" })).toHaveFocus();
    expect(resources()).toEqual(before);
  });

  it("finishes a pending move when reduced motion is enabled during playback", () => {
    let reduce = false;
    const listeners = new Set<() => void>();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    vi.spyOn(window, "matchMedia").mockImplementation(() => ({
      ...media, matches: reduce,
      addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => { listeners.add(listener as () => void); },
      removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => { listeners.delete(listener as () => void); },
    }));
    start(); completeMission("Limpiar los paneles");
    click(LOCATIONS[1].destination);
    expect(video()).toBeInTheDocument();
    act(() => { reduce = true; listeners.forEach(listener => listener()); });
    expect(screen.queryByLabelText(videoLabel)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Estás en: Invernadero" })).toHaveFocus();
  });
});

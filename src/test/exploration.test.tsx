import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import corridorVideo from "@/assets/prueba-velocidad.mp4";
import solarPanelVideo from "@/assets/paneles-solares.mp4";
import { Game } from "@/components/game/Game";
import { INITIAL_POSE, advance, destination, turn, type Pose } from "@/lib/exploration";

afterEach(cleanup);

function click(name: RegExp | string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

function start() {
  render(<Game />);
  click(/A JUGAR/i);
}

describe("lunar exploration", () => {
  it.each([
    { side: "izquierda", locations: ["Invernadero", "Barreras de la base", "Observatorio solar", "Campo de paneles"], initialTurn: false },
    { side: "derecha", locations: ["Observatorio solar", "Barreras de la base", "Invernadero", "Campo de paneles"], initialTurn: true },
  ])("selects the destination video for every connection going $side", ({ side, locations, initialTurn }) => {
    start();
    expect(screen.queryByLabelText("Transición entre ubicaciones de la base lunar")).not.toBeInTheDocument();
    if (initialTurn) click(/Girar a la izquierda/i);
    for (const [index, location] of locations.entries()) {
      if (index > 0) click(new RegExp(`Girar a la ${side}`, "i"));
      click("Avanzar");
      const video = screen.getByLabelText("Transición entre ubicaciones de la base lunar") as HTMLVideoElement;
      expect(video).toHaveAttribute("src", location === "Campo de paneles" ? solarPanelVideo : corridorVideo);
      expect(video.autoplay).toBe(true);
      expect(video.muted).toBe(true);
      expect(video.playsInline).toBe(true);
      expect(video.controls).toBe(false);
      expect(video.loop).toBe(false);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      fireEvent.ended(video);
      expect(screen.getByRole("heading", { name: `Estás en: ${location}` })).toBeInTheDocument();
      for (const value of ["35%", "70%", "80%"]) expect(screen.getByText(value)).toBeInTheDocument();
      if (location !== "Campo de paneles") {
        expect(screen.queryByRole("button", { name: /Iniciar MISIÓN/i })).not.toBeInTheDocument();
        expect(screen.getByText(/Primero completá MISIÓN 01/)).toBeInTheDocument();
      }
    }
    expect(screen.getByRole("button", { name: /Iniciar MISIÓN 01/i })).toBeInTheDocument();
  });

  it("waits for the video, prevents repeated input and leaves missions and resources unchanged", () => {
    start();
    const advanceButton = screen.getByRole("button", { name: "Avanzar" });
    fireEvent.click(advanceButton);
    const video = screen.getByLabelText("Transición entre ubicaciones de la base lunar") as HTMLVideoElement;
    expect(video.autoplay).toBe(true);
    expect(video.muted).toBe(true);
    expect(video.playsInline).toBe(true);
    expect(video.controls).toBe(false);
    expect(video.loop).toBe(false);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Estás en:/ })).not.toBeInTheDocument();
    fireEvent.click(advanceButton);
    fireEvent.ended(video);
    expect(screen.getByRole("heading", { name: "Estás en: Invernadero" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Iniciar MISIÓN/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Primero completá MISIÓN 01/)).toBeInTheDocument();
    for (const value of ["35%", "70%", "80%"]) expect(screen.getByText(value)).toBeInTheDocument();
    const blockedButton = screen.getByRole("button", { name: "Avanzar" });
    expect(blockedButton).toBeDisabled();
    fireEvent.click(blockedButton);
    expect(screen.queryByLabelText("Transición entre ubicaciones de la base lunar")).not.toBeInTheDocument();
  });

  it("turns in both directions, wraps around and respects walls", () => {
    let pose = INITIAL_POSE;
    for (let i = 0; i < 4; i++) pose = turn(pose, "right");
    expect(pose).toEqual(INITIAL_POSE);
    expect(turn(turn(pose, "left"), "right")).toEqual(pose);
    const wall: Pose = { location: 0, heading: 2 };
    expect(destination(wall)).toBeNull();
    expect(advance(wall)).toEqual(wall);
  });

  it("connects all four locations and allows returning to the start", () => {
    let pose = advance(INITIAL_POSE);
    expect(pose.location).toBe(1);
    pose = advance(turn(pose, "left"));
    expect(pose.location).toBe(2);
    pose = advance(turn(pose, "left"));
    expect(pose.location).toBe(3);
    pose = advance(turn(pose, "left"));
    expect(pose.location).toBe(0);
  });

  it("blocks future missions and preserves resources while navigating", () => {
    start();
    click("Avanzar");
    fireEvent.ended(screen.getByLabelText("Transición entre ubicaciones de la base lunar"));
    expect(screen.getByRole("heading", { name: "Estás en: Invernadero" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Iniciar MISIÓN/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Primero completá MISIÓN 01/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avanzar" })).toBeDisabled();
    click(/Girar a la derecha/i);
    click(/Girar a la derecha/i);
    click("Avanzar");
    fireEvent.ended(screen.getByLabelText("Transición entre ubicaciones de la base lunar"));
    expect(screen.getByRole("heading", { name: "Estás en: Campo de paneles" })).toBeInTheDocument();
    for (const value of ["35%", "70%", "80%"]) expect(screen.getByText(value)).toBeInTheDocument();
    click(/Iniciar MISIÓN 01/i);
    expect(screen.getByRole("heading", { name: /El polvo lunar/ })).toBeInTheDocument();
    click(/Volver a explorar/i);
    expect(screen.getByText("Mirando al Oeste")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Iniciar MISIÓN 01/i })).toBeInTheDocument();
    expect(screen.getByText("35%")).toBeInTheDocument();
  });

  it("requires reaching the next location and prevents replaying a completed mission", () => {
    start();
    click(/Iniciar MISIÓN 01/i);
    click(/Limpiar los paneles/i);
    expect(screen.getByRole("heading", { name: "¡Mira qué pasó!" })).toBeInTheDocument();
    click(/Continuar/i);
    expect(screen.getByRole("heading", { name: "Estás en: Campo de paneles" })).toBeInTheDocument();
    expect(screen.getByText(/Ya completaste la misión/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Iniciar MISIÓN/i })).not.toBeInTheDocument();
    expect(screen.getByText("55%")).toBeInTheDocument();
    click("Avanzar");
    fireEvent.ended(screen.getByLabelText("Transición entre ubicaciones de la base lunar"));
    expect(screen.getByRole("button", { name: /Iniciar MISIÓN 02/i })).toBeInTheDocument();
    click(/Iniciar MISIÓN 02/i);
    expect(screen.getByRole("heading", { name: /Las plantas se están congelando/ })).toBeInTheDocument();
    expect(screen.getByText("55%")).toBeInTheDocument();
  });
});

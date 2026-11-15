import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Game } from "@/components/game/Game";

afterEach(cleanup);

function choose(title: string) {
  fireEvent.click(screen.getByRole("button", { name: /Iniciar MISIÓN/i }));
  fireEvent.click(screen.getByRole("button", { name: new RegExp(title, "i") }));
  expect(screen.getByRole("heading", { name: "¡Mira qué pasó!" })).toBeInTheDocument();
}

function next() {
  fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
}

function moveToNext(index: number) {
  // The four rooms form a square: east, north, then west.
  if (index > 0) fireEvent.click(screen.getByRole("button", { name: /Girar a la izquierda/i }));
  fireEvent.click(screen.getByRole("button", { name: "Avanzar" }));
}

describe("four mission report flow", () => {
  it.each([
    { choice: "Mantener la energía", ending: "¡MISIÓN INTERRUMPIDA!", energy: "100%", food: "70%", safety: "5%" },
    { choice: "Todos al refugio", ending: "¡MISIÓN CUMPLIDA!", energy: "80%", food: "55%", safety: "65%" },
  ])("reports solar choice $choice before showing $ending", ({ choice, ending, energy, food, safety }) => {
    render(<Game />);
    fireEvent.click(screen.getByRole("button", { name: /A JUGAR/i }));
    for (const [index, title] of ["Limpiar los paneles", "Cubrir las plantas", "Ir al refugio"].entries()) {
      choose(title);
      next();
      moveToNext(index);
    }
    fireEvent.click(screen.getByRole("button", { name: /Iniciar MISIÓN/i }));
    expect(screen.getByRole("heading", { name: /Una tormenta solar/ })).toBeInTheDocument();
    expect(screen.getByText(/Misión 4 de 4/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: new RegExp(choice, "i") }));
    expect(screen.getByRole("heading", { name: "¡Mira qué pasó!" })).toBeInTheDocument();
    for (const value of [energy, food, safety]) expect(screen.getByText(value)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: ending })).not.toBeInTheDocument();
    next();
    expect(screen.getByRole("heading", { name: ending })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Jugar de nuevo|Probar otra vez/ }));
    expect(screen.getByRole("heading", { name: "Estás en: Campo de paneles" })).toBeInTheDocument();
    expect(screen.getByText("35%")).toBeInTheDocument();
    expect(screen.getByText("Mirando al Este")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Iniciar MISIÓN 01/i })).toBeInTheDocument();
  });

  it("stops after the third report when energy is depleted", () => {
    render(<Game />);
    fireEvent.click(screen.getByRole("button", { name: /A JUGAR/i }));
    for (const [index, title] of ["Ahorrar energía", "Encender la calefacción", "Reforzar las barreras"].entries()) {
      choose(title);
      next();
      if (index < 2) moveToNext(index);
    }
    expect(screen.getByRole("heading", { name: "¡MISIÓN INTERRUMPIDA!" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Una tormenta solar/ })).not.toBeInTheDocument();
  });
});

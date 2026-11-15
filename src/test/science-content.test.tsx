import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Game } from "@/components/game/Game";
import { MISSIONS } from "@/lib/game";

afterEach(cleanup);

describe("scientific mission content", () => {
  it("contrasts outdoor SEP exposure with a shielded shelter", () => {
    const solarStorm = MISSIONS[3]!;

    expect(solarStorm.body).toContain("partículas energéticas solares");
    expect(solarStorm.choices[0].title).toBe("Continuar afuera");
    expect(solarStorm.choices[0].cost).toContain("Fuera del refugio");
    expect(solarStorm.choices[1].title).toBe("Ir al refugio");
    expect(solarStorm.choices[1].subtitle).toContain("blindaje");
  });

  it("shows the simplified-science and lunar-communications guidance", () => {
    render(<Game />);

    fireEvent.click(screen.getByRole("button", { name: /La ciencia/i }));

    expect(screen.getByRole("heading", { name: /La ciencia detrás de la misión/i })).toBeInTheDocument();
    expect(screen.getByText(/indicadores simples de este entrenamiento/i)).toBeInTheDocument();
    expect(screen.getByText(/no son mediciones reales de NASA/i)).toBeInTheDocument();
    expect(screen.getByText(/oxígeno, agua, presión/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Mensajes entre la Tierra y la Luna/i })).toBeInTheDocument();
    expect(screen.getByText(/aproximadamente 1,3 segundos/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /demora de comunicación Tierra-Luna/i })).toHaveAttribute(
      "href",
      "https://ntrs.nasa.gov/api/citations/20130011595/downloads/20130011595.pdf",
    );
  });
});

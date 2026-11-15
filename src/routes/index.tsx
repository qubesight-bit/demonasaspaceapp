import { createFileRoute } from "@tanstack/react-router";
import { Game } from "@/components/game/Game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "¡Pura Vida Lunar! — Aventura lunar interactiva" },
      { name: "description", content: "¡Pura Vida Lunar!: aventura costarricense de PopTART-Cats. Toma decisiones en cuatro misiones y equilibra energía, comida y seguridad en la Base Lunar Alfa. NASA Space Apps 2026." },
      { property: "og:title", content: "¡Pura Vida Lunar!" },
      { property: "og:description", content: "¡Pura Vida Lunar!: aventura lunar costarricense de PopTART-Cats. Supera cuatro misiones y cuida la energía, la comida y la seguridad de la Base Lunar Alfa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});

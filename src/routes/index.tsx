import { createFileRoute } from "@tanstack/react-router";
import { Game } from "@/components/game/Game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "¡Misión Base Lunar! — Aventura lunar interactiva" },
      { name: "description", content: "Toma decisiones como comandante de la Base Lunar Alfa y equilibra energía, comida y seguridad. PopTART-Cats, NASA Space Apps 2026." },
      { property: "og:title", content: "¡Misión Base Lunar!" },
      { property: "og:description", content: "Aventura lunar interactiva: equilibra energía, comida y seguridad en la Base Lunar Alfa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});

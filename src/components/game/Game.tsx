import { useEffect, useReducer, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ArrowRight, BookOpen, ChevronLeft, CircleHelp, LockKeyhole, MousePointerClick, Zap, Heart, Home, Lightbulb, Medal, Play, RotateCcw, Rocket, Shield, Sprout, TriangleAlert, TrendingUp, Users, X } from "lucide-react";
import { MISSIONS, START, applyChoice, failedResource, RESOURCE_LABEL, type Choice, type ResourceKey, type Resources } from "@/lib/game";
import corridorVideo from "@/assets/prueba-velocidad.mp4";
import solarPanelVideo from "@/assets/paneles-solares.mp4";
import menuBg from "@/assets/men_principal_0.jpg.asset.json";
import menuKid from "@/assets/men_principal_1.jpg.asset.json";
import questPanels from "@/assets/quest-01-paneles.png";
import questGreenhouse from "@/assets/quest-02-invernadero.png";
import questMeteorites from "@/assets/quest-03-meteoritos.png";
import reportBg from "@/assets/informe_de_decisi_n_0.jpg.asset.json";
import winBg from "@/assets/misi_n_cumplida_victoria_0.jpg.asset.json";
import winMaggie from "@/assets/misi_n_cumplida_victoria_1.jpg.asset.json";
import loseBg from "@/assets/misi_n_interrumpida_derrota_0.jpg.asset.json";

import { solarStormBg } from "@/assets/solar-storm";
import { LOCATIONS, INITIAL_NAVIGATION, canVisit, navigationReducer, type LocationId, type NavigationState } from "@/lib/exploration";

const QUEST_ART = [
  { bg: questPanels, alt: "Maggie y su gato junto a los paneles solares cubiertos de polvo en la base lunar.", icons: ["⚡", "💡"] },
  { bg: questGreenhouse, alt: "Maggie y su gato observan las plantas del invernadero helado de la base lunar.", icons: ["🌡️", "🌱"] },
  { bg: questMeteorites, alt: "Maggie y su gato observan las pequeñas rocas del espacio desde el interior de la base lunar.", icons: ["🛡️", "🏠"] },
  { bg: solarStormBg, alt: "Maggie y su gato observan la base lunar y la tormenta solar desde el interior de la estación.", icons: ["⚡", "🛡️"] },
];

type Phase =
  | { kind: "menu" }
  | { kind: "explore"; index: number }
  | { kind: "mission"; index: number }
  | { kind: "report"; index: number; choice: Choice; before: Resources }
  | { kind: "win" }
  | { kind: "lose"; failed: ResourceKey };

const ICON = { energy: Zap, food: Sprout, safety: Shield } as const;
const BAR = { energy: "bg-energy", food: "bg-food", safety: "bg-safety" } as const;
const TEXT = { energy: "text-energy", food: "text-food", safety: "text-safety" } as const;

function Screen({ bg, children, dim = true }: { bg: string; children: ReactNode; dim?: boolean }) {
  return (
    <main className="lunar-game relative isolate min-h-dvh overflow-x-clip">
      <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {dim && <div className="absolute inset-0 bg-scrim" />}
      <div className="relative z-10 mx-auto flex min-h-dvh min-w-0 max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">{children}</div>
    </main>
  );
}

function Footer() {
  return <p className="mt-auto pt-4 text-center text-sm font-bold text-muted-foreground">PopTART-Cats • NASA Space Apps Challenge • Idea: Maggie</p>;
}

function ResourceBar({ k, value, delta }: { k: ResourceKey; value: number; delta?: number | undefined }) {
  const Icon = ICON[k];
  return (
    <div className="resource-bar glass min-w-0 rounded-2xl px-2 py-2 sm:px-4">
      <div className="flex items-center justify-center gap-1 text-xs font-extrabold sm:text-sm">
        <Icon className={`size-4 shrink-0 ${TEXT[k]}`} />
        <span>{RESOURCE_LABEL[k]}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-1 text-sm font-extrabold">
        <span className={value <= 20 ? "text-destructive" : ""}>{value}%</span>
        {delta ? <span className="text-xs">{delta > 0 ? "▲ +" : "▼ "}{delta}%</span> : null}
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full ${BAR[k]} transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Hud({ r, before, sticky = false }: { r: Resources; before?: Resources; sticky?: boolean }) {
  return (
    <div className={`resource-hud grid grid-cols-3 gap-2 ${sticky ? "sticky top-2 z-20 rounded-3xl bg-background/95 p-2 shadow-lg" : ""}`} aria-label="Recursos de la base">
      {(Object.keys(r) as ResourceKey[]).map((k) => (
        <ResourceBar key={k} k={k} value={r[k]} delta={before ? r[k] - before[k] : undefined} />
      ))}
    </div>
  );
}

function Effects({ c }: { c: Choice }) {
  const keys = Object.keys(c.effects) as ResourceKey[];
  const entries = keys;
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((k) => {
        const v = c.effects[k]!;
        const Icon = ICON[k];
        return (
          <span key={k} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm font-extrabold">
            <Icon className={`size-3.5 ${TEXT[k]}`} />
            {v > 0 ? `+${v}%` : `${v}%`} {RESOURCE_LABEL[k]}
          </span>
        );
      })}
    </div>
  );
}

function CostaRicaFlag() {
  return (
    <svg className="costa-rica-flag" viewBox="0 0 30 20" role="img" aria-label="Bandera de Costa Rica">
      <rect width="30" height="3" y="0" fill="#002b7f" />
      <rect width="30" height="3" y="3" fill="#ffffff" />
      <rect width="30" height="8" y="6" fill="#ce1126" />
      <rect width="30" height="3" y="14" fill="#ffffff" />
      <rect width="30" height="3" y="17" fill="#002b7f" />
    </svg>
  );
}

function Menu({ onStart }: { onStart: () => void }) {
  const [panel, setPanel] = useState<null | "guide" | "science" | "credits">(null);
  return (
    <Screen bg={menuBg.url} dim={false}>
      <header className="flex items-center justify-between">
        <div className="glass flex items-center gap-3 rounded-full px-5 py-2">
          <Rocket className="size-5 shrink-0 text-primary" />
          <div className="leading-tight">
            <p className="text-xs font-extrabold uppercase tracking-widest text-primary">NASA Space Apps 2026</p>
            <p className="text-sm font-bold">Equipo PopTART-Cats</p>
          </div>
        </div>
        <div className="costa-rica-badge glass" aria-label="Proyecto creado en Costa Rica">
          <CostaRicaFlag />
          <span>Costa Rica</span>
        </div>
      </header>
      <section className="my-auto flex min-w-0 flex-col items-center py-4 text-center animate-rise">
        <span className="glass rounded-full px-5 py-1.5 text-sm font-bold">¡Una aventura en la Luna!</span>
        <h1 className="text-glow mt-4 text-4xl font-bold leading-tight sm:text-6xl lg:text-7xl">¡MISIÓN BASE LUNAR!</h1>
        <p className="costa-rica-welcome">¡Pura vida, astronauta! Desde Costa Rica, comienza tu aventura lunar.</p>
        <p className="glass mt-4 rounded-2xl px-5 py-2 font-bold sm:text-lg">¡Cuida la energía, la comida y la seguridad de tu base!</p>
        <div className="mt-6 flex w-full min-w-0 flex-col items-center gap-6 md:flex-row md:justify-center">
          <div className="flex w-full max-w-64 shrink-0 flex-col items-center gap-4 sm:max-w-72">
            <span className="glass rounded-2xl px-4 py-2 text-base font-bold">¡Hola! ¿Listo para explorar?</span>
            <img src={menuKid.url} alt="Astronauta saludando" className="animate-float h-auto w-full rounded-2xl border border-primary/50 object-contain shadow-2xl" />
          </div>
          <div className="flex w-full max-w-md flex-col gap-3">
            <button onClick={onStart} className="glass-button flex items-center justify-center gap-3 rounded-full px-5 py-4 text-xl font-bold sm:text-2xl">
              <Play className="size-6 shrink-0 fill-current" /> ¡A JUGAR! <Rocket className="size-6 shrink-0" />
            </button>
            <div className="grid grid-cols-2 gap-3">
              <MenuTile icon={BookOpen} label="Cómo jugar" onClick={() => setPanel("guide")} />
              <MenuTile icon={Lightbulb} label="La ciencia" onClick={() => setPanel("science")} />
              <MenuTile icon={Users} label="El equipo" onClick={() => setPanel("credits")} />
            </div>
          </div>
        </div>
      </section>
      <footer className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
        <span className="glass rounded-2xl px-4 py-2">🎨 Arte e idea: Maggie • 💻 Código: Ernesto • 🔬 Ciencia: Emmanuel</span>
        <span className="text-muted-foreground">Hecho en Costa Rica por PopTART-Cats • Versión 2.0</span>
      </footer>
      {panel && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-scrim p-4" onClick={() => setPanel(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="menu-panel-title" className="glass animate-rise relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-popover p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPanel(null)} className="absolute right-2 top-2 flex min-w-12 items-center justify-center gap-1 rounded-full px-2" aria-label="Cerrar esta ventana"><X className="size-4" aria-hidden="true" /><span>Cerrar</span></button>
            {panel === "guide" ? (
              <>
                <h2 id="menu-panel-title" className="pr-10 text-2xl font-bold text-primary">¡Aprende a jugar!</h2>
                <p className="mt-3">¡Bienvenido a la <b>Base Lunar Alfa</b>! Ayuda a Maggie a cuidar la base. En cada misión, elige una de dos opciones.</p>
                <ul className="mt-4 space-y-2 font-bold">
                  <li>⚡ Energía: para las luces y el calor.</li>
                  <li>🌱 Comida: para alimentar al equipo.</li>
                  <li>🛡️ Seguridad: para proteger al equipo y la base.</li>
                </ul>
                <p className="mt-4">Mira las barras de arriba. Cada decisión puede subir o bajar tus recursos. <b>Si una barra llega al 10% o menos, la partida termina.</b> ¡Supera las {MISSIONS.length} misiones para ganar!</p>
                <p className="mt-3 text-sm text-muted-foreground">Esta base es imaginaria. Los datos sobre la Luna se basan en la ciencia.</p>
                <button onClick={() => setPanel(null)} className="glass-button mt-5 w-full rounded-full py-3 font-bold">¡Entendido!</button>
              </>
            ) : panel === "science" ? (
              <>
                <h2 id="menu-panel-title" className="pr-10 text-2xl font-bold text-primary">La ciencia detrás de la misión</h2>
                <p className="mt-3">Las barras de <b>Energía</b>, <b>Comida</b> y <b>Seguridad</b> son indicadores simples de este entrenamiento. Sus porcentajes no son mediciones reales de NASA.</p>
                <p className="mt-3">Para sobrevivir en la Luna también hacen falta oxígeno, agua, presión, control de temperatura y otros sistemas de soporte vital. Nuestras decisiones se inspiran en desafíos reales de exploración lunar.</p>
                <section className="mt-4 rounded-2xl bg-muted/60 p-4" aria-labelledby="communications-title">
                  <h3 id="communications-title" className="font-extrabold text-primary">📡 Mensajes entre la Tierra y la Luna</h3>
                  <p className="mt-2">Un mensaje no llega al instante: la señal tarda aproximadamente 1,3 segundos en viajar en un sentido, según la distancia. También hace falta una conexión o una línea de visión adecuada; desde algunas zonas de la Luna la Tierra puede quedar oculta.</p>
                </section>
                <p className="mt-4 text-sm text-muted-foreground">Fuentes oficiales:</p>
                <ul className="mt-2 max-w-full space-y-2 break-words text-sm font-bold underline">
                  <li><a href="https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/" target="_blank" rel="noreferrer">NASA: protección frente a radiación espacial en la Luna</a></li>
                  <li><a href="https://www.nasa.gov/lunar-surface-technology/" target="_blank" rel="noreferrer">NASA: polvo lunar y tecnología de superficie</a></li>
                  <li><a href="https://www.esa.int/es/articles/surviving-the-long-dark-night-of-the-moon" target="_blank" rel="noreferrer">ESA: la larga noche lunar</a></li>
                  <li><a href="https://www.asc-csa.gc.ca/eng/youth-educators/activities/fitness-and-nutrition/interplanetary-farming.asp" target="_blank" rel="noreferrer">CSA: cultivar alimentos fuera de la Tierra</a></li>
                  <li><a href="https://ntrs.nasa.gov/api/citations/20130011595/downloads/20130011595.pdf" target="_blank" rel="noreferrer">NASA: demora de comunicación Tierra-Luna</a></li>
                  <li><a href="https://www.nasa.gov/glenn/glenn-expertise-space-exploration/scan/lunar-surface-propagation/" target="_blank" rel="noreferrer">NASA: visibilidad y señal en la superficie lunar</a></li>
                </ul>
                <button onClick={() => setPanel(null)} className="glass-button mt-5 w-full rounded-full py-3 font-bold">¡Entendido!</button>
              </>
            ) : (
              <>
                <h2 id="menu-panel-title" className="pr-10 text-2xl font-bold text-primary">Equipo PopTART-Cats</h2>
                <p className="text-sm text-muted-foreground">NASA Space Apps Challenge 2026</p>
                <ul className="mt-4 space-y-2 font-bold">
                  <li>👩‍🎨 Dibujos e idea: Maggie</li>
                  <li>💻 Código del juego: Ernesto</li>
                  <li>🔬 Ciencia: Emmanuel</li>
                </ul>
                <button onClick={() => setPanel(null)} className="glass-button mt-5 w-full rounded-full py-3 font-bold">Cerrar</button>
              </>
            )}
          </div>
        </div>
      )}
    </Screen>
  );
}

function MenuTile({ icon: Icon, label, onClick }: { icon: typeof Medal; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="glass flex items-center gap-2 rounded-2xl px-4 py-3 font-bold transition hover:-translate-y-0.5">
      <Icon className="size-5 shrink-0 text-primary" /> {label}
    </button>
  );
}

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (notify: () => void) => {
  const media = window.matchMedia(MOTION_QUERY);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
const motionSnapshot = () => window.matchMedia(MOTION_QUERY).matches;
const serverMotionSnapshot = () => false;

function ExplorationTutorial({ step, onNext, onSkip }: { step: number; onNext: () => void; onSkip: () => void }) {
  const tips = ["Empezá: elegí el botón verde para abrir tu misión.", "Explorá: elegí un lugar disponible para recorrer la base.", "Decidí: tocá o hacé clic en una opción. Mirá cómo cambian las barras."];
  return <aside className="exploration-tutorial" aria-label="Guía rápida"><p className="flex items-center gap-2 font-extrabold"><CircleHelp className="size-5" aria-hidden="true" /> Guía rápida: {step + 1} de 3</p><p>{tips[step]}</p><div className="flex flex-wrap gap-2"><button type="button" onClick={onNext} className="exploration-tutorial-next"><MousePointerClick className="size-5" aria-hidden="true" /> {step === 2 ? "¡Ya entendí!" : "Siguiente consejo"}</button><button type="button" onClick={onSkip} className="exploration-tutorial-skip">Omitir guía</button></div></aside>;
}

function ExplorationScreen({ index, r, navigation, tutorialStep, onTutorialNext, onTutorialSkip, onVisit, onBack, onArrive, onMission }: {
  index: number; r: Resources; navigation: NavigationState;
  tutorialStep: number | null; onTutorialNext: () => void; onTutorialSkip: () => void;
  onVisit: (target: LocationId) => void; onBack: () => void;
  onArrive: (target: LocationId) => void; onMission: () => void;
}) {
  const { location: locationId, pending, history, arrived } = navigation;
  const location = LOCATIONS[locationId];
  const art = QUEST_ART[locationId]!;
  const available = locationId === index;
  const previous = history.at(-1);
  const canGoBack = previous !== undefined && canVisit(locationId, previous, index);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (arrived && !pending) title.current?.focus({ preventScroll: true });
  }, [locationId, arrived, pending]);

  return (
    <main className="lunar-game exploration-scene">
      <header className="exploration-header">
        <div>
          <p className="font-extrabold text-energy">Base Lunar Alfa</p>
          <h1 className="text-2xl font-bold">¡Explorá y cuidá tu base!</h1>
          <p>Misiones completadas: {index} de {MISSIONS.length}</p>
        </div>
        <Hud r={r} />
      </header>
      <ol className="exploration-progress" aria-label="Progreso de la aventura">
        {LOCATIONS.map((place, id) => (
          <li key={place.name} aria-current={id === index ? "step" : undefined}>
            <span aria-hidden="true">{id < index ? "✓" : id + 1}</span>
            <span>{place.name}<small>{id < index ? "Completada" : id === index ? "Tu misión" : "Próximamente"}</small></span>
          </li>
        ))}
      </ol>
      {tutorialStep !== null && <ExplorationTutorial step={tutorialStep} onNext={onTutorialNext} onSkip={onTutorialSkip} />}
      <div className="exploration-layout">
        <section className="exploration-location" aria-labelledby="location-title">
          <div className="exploration-view" aria-label="Escenario de la base lunar" aria-busy={pending !== null}>
            <img src={art.bg} alt={art.alt} className="exploration-art" />
            {pending && (
              <video
                key={pending.target}
                src={pending.target === 0 ? solarPanelVideo : corridorVideo}
                autoPlay muted playsInline disablePictureInPicture disableRemotePlayback
                controlsList="nofullscreen noremoteplayback"
                className="exploration-video"
                aria-label="Transición entre ubicaciones de la base lunar"
                onEnded={() => onArrive(pending.target)}
              />
            )}
          </div>
          <div className="exploration-caption">
            <h2 id="location-title" ref={title} tabIndex={-1} className="text-xl font-bold">Estás en: {location.name}</h2>
            <p>{location.description}</p>
          </div>
        </section>
        <section className="exploration-controls" aria-label="Destinos y misiones">
          <p className="exploration-status" role="status" aria-live="polite" aria-atomic="true">
            {pending ? LOCATIONS[pending.target].travelMessage : arrived ? "¡Llegaste! Elegí qué hacemos ahora." : index === 0 ? "¡Bienvenido! Empezá tu primera misión." : "¡Elegí un destino para seguir explorando!"}
          </p>
          <div className="exploration-mission">
            <p className="font-bold">Tu objetivo: {LOCATIONS[index]!.name}</p>
            {available ? (
              <button onClick={onMission} disabled={pending !== null} className="exploration-mission-button">
                <Play className="inline-block size-5" aria-hidden="true" /> Iniciar {MISSIONS[index]!.code}: {MISSIONS[index]!.title}
              </button>
            ) : (
              <p>Ya completaste la misión de esta zona. Viajá a {LOCATIONS[index]!.name} para seguir.</p>
            )}
          </div>
          <nav aria-label="Destinos conectados" className="exploration-destinations">
            {location.connections.map(target => {
              const place = LOCATIONS[target];
              const locked = !canVisit(locationId, target, index);
              const unlockMission = target > 0 ? MISSIONS[target - 1] : undefined;
              const prerequisite = target > 0 ? LOCATIONS[target - 1] : undefined;
              const lockHint = `Lugar bloqueado: ${place.name}. Completá la misión ${target} en ${prerequisite?.name ?? "la zona anterior"} para desbloquear este destino. La misión se llama ${unlockMission?.title ?? "la misión anterior"}.`;
              return (
                <div key={target} className="exploration-destination">
                  <button
                    onClick={() => onVisit(target)}
                    disabled={locked || pending !== null}
                    aria-label={place.destination}
                    aria-describedby={`destination-${target}-hint`}
                    className="exploration-destination-button"
                  >
                    <span aria-hidden="true">{place.emoji}</span> <span>{place.name}: {place.destination}</span>
                    {locked && <span className="exploration-lock"><LockKeyhole className="inline-block size-4" aria-hidden="true" /> Bloqueado</span>}
                  </button>
                  <p id={`destination-${target}-hint`}>
                    {locked ? lockHint : pending ? "Esperá a llegar o elegí Saltar animación." : "Camino disponible. Explorar no gasta recursos."}
                  </p>
                </div>
              );
            })}
          </nav>
          <div className="exploration-travel-actions">
            <button onClick={onBack} disabled={!canGoBack || pending !== null} aria-describedby="back-hint">← Volver</button>
            <button onClick={() => { if (pending) onArrive(pending.target); }} disabled={pending === null}>Saltar animación</button>
          </div>
          <p id="back-hint" className="text-sm">{canGoBack ? `Volver a ${LOCATIONS[previous].name}.` : "Todavía no hay una ubicación anterior."}</p>
        </section>
      </div>
      <Footer />
    </main>
  );
}

function MissionScreen({ index, r, onChoose, onExplore }: { index: number; r: Resources; onChoose: (c: Choice) => void; onExplore: () => void }) {
  const m = MISSIONS[index]!;
  const art = QUEST_ART[index]!;
  return (
    <main className="lunar-game solar-scene">
      <header className="solar-header flex flex-col gap-3 rounded-3xl p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-energy">{m.code} • Misión {index + 1} de {MISSIONS.length}</p>
          <h1 className="text-xl font-bold">¡Misión Base Lunar! — <span className="text-energy">{m.title}</span></h1>
        </div>
        <div className="w-full lg:max-w-lg"><Hud r={r} /></div>
        <button onClick={onExplore} className="glass rounded-2xl px-4 py-2 font-bold"><ChevronLeft className="inline-block size-5" aria-hidden="true" /> Volver a explorar la base</button>
      </header>
      <section className="solar-stage" aria-labelledby="quest-title">
        <img className="solar-backdrop" src={art.bg} alt={art.alt} />
        <div className="solar-stage-content">
          <div className="solar-story rounded-2xl p-4 sm:p-5">
            <p className="solar-alert inline-flex items-center justify-center gap-2 rounded-full px-3 py-1 text-xs font-bold sm:text-sm"><TriangleAlert className="size-4 shrink-0" />{m.alert}</p>
            {m.id !== 4 && <p className="mt-2 text-sm font-bold text-muted-foreground">{m.sensor}</p>}
            <h2 id="quest-title" className="text-xl font-bold text-yellow-100 sm:text-2xl">{m.headline}</h2>
            <p className="mt-2 whitespace-pre-line text-base font-bold leading-relaxed">{m.body}</p>
            <p className="mt-2 text-lg font-bold">Elegí una opción:</p>
          </div>
          <div className="solar-decisions grid gap-4 md:grid-cols-2" aria-label={`Decisiones: ${m.title}`}>
            {m.choices.map((c, i) => (
              <button key={c.id} onClick={() => onChoose(c)} className={`solar-choice ${i === 0 ? "solar-power" : "solar-shelter"} flex min-w-0 flex-col rounded-2xl p-4 text-left sm:p-5`}>
                <span className="text-xl font-bold uppercase sm:text-2xl"><span aria-hidden="true">{art.icons[i]}</span> ¡{c.title}!</span>
                <span className="mb-4 mt-2 flex-1 text-sm font-extrabold">{c.subtitle}</span>
                <Effects c={c} />
              </button>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

function Report({ index, choice, before, r, onNext }: { index: number; choice: Choice; before: Resources; r: Resources; onNext: () => void }) {
  const m = MISSIONS[index]!;
  const fx = Object.entries(choice.effects) as [ResourceKey, number][];
  const gains = fx.filter(([, v]) => v > 0);
  const losses = fx.filter(([, v]) => v < 0);
  return (
    <Screen bg={reportBg.url}>
      <Hud r={r} before={before} sticky />
      <section className="glass animate-rise my-auto rounded-3xl p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-primary">{m.code} • Tu decisión</p>
            <h2 className="text-2xl font-bold">¡Mira qué pasó!</h2>
          </div>
          <span className="rounded-full bg-accent px-3 py-1 text-sm font-extrabold text-accent-foreground">¡Listo!</span>
        </div>
        <p className="mt-4 font-bold">Elegiste: <span className="text-primary">{choice.title}</span></p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-muted/60 p-4">
            <p className="flex items-center gap-2 font-extrabold text-food"><TrendingUp className="size-5 shrink-0" /> Lo que ayudó</p>
            <p className="mt-2"><b>{gains.map(([k, v]) => `+${v}% ${RESOURCE_LABEL[k]}`).join(", ") || "Sin aumento"}</b> — {choice.positive}</p>
          </div>
          <div className="rounded-2xl bg-muted/60 p-4">
            <p className="flex items-center gap-2 font-extrabold text-energy"><TriangleAlert className="size-5 shrink-0" /> Lo que costó</p>
            <p className="mt-1"><b>{losses.map(([k, v]) => `${v}% ${RESOURCE_LABEL[k]}`).join(", ")}</b> — {choice.cost}</p>
          </div>
        </div>
        <p className="mt-4 flex gap-3 rounded-2xl bg-muted/40 p-4"><Lightbulb className="size-6 shrink-0 text-secondary" /><span><b>¿Sabías que…?</b> {m.fact}</span></p>
      </section>
        <button onClick={onNext} aria-label="Continuar" aria-describedby="continue-hint" className="glass-button mx-auto flex w-full max-w-sm items-center justify-center gap-3 rounded-full px-6 py-3 text-lg font-bold">
          <Play className="size-5 shrink-0" aria-hidden="true" /> Continuar a la siguiente misión <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
      </button>
        <span id="continue-hint" className="sr-only">Va a la siguiente misión.</span>
      <Footer />
    </Screen>
  );
}

function Win({ r, onRestart }: { r: Resources; onRestart: () => void }) {
  const avg = Math.round((r.energy + r.food + r.safety) / 3);
  return (
    <Screen bg={winBg.url}>
      <Hud r={r} sticky />
      <div className="flex flex-wrap justify-between gap-2">
        <div className="glass flex items-center gap-2 rounded-2xl px-4 py-2"><Medal className="shrink-0 text-secondary" /><div><p className="text-sm font-extrabold">¡Tu reconocimiento!</p><p className="font-bold">Explorador lunar ★★★</p></div></div>
        <span className="glass self-center rounded-full px-4 py-2 text-sm font-extrabold">¡Base a salvo!</span>
      </div>
      <section className="animate-rise my-auto text-center">
        <p className="text-sm font-extrabold text-secondary">★ ¡Superaste las {MISSIONS.length} misiones! ★</p>
        <h1 className="text-glow mt-2 text-4xl font-bold leading-tight sm:text-6xl">¡MISIÓN CUMPLIDA!</h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg">¡Cuidaste la <b>Base Lunar Alfa</b> y protegiste al equipo! Tus decisiones marcaron la diferencia. ¡Buen trabajo! 🎉</p>
        <div className="mt-8 flex flex-col items-center gap-6 md:flex-row md:justify-center">
          <img src={winMaggie.url} alt="Maggie celebrando" className="animate-float h-auto max-h-72 w-52 max-w-full rounded-3xl border-4 border-secondary object-contain sm:w-60" />
          <div className="glass w-full min-w-0 max-w-md rounded-3xl p-5 text-left">
            <p className="text-xl font-bold">Así quedaron tus recursos</p>
            <p className="mt-2 text-2xl font-bold text-primary">Promedio: {avg}%</p>
            <p className="mt-2">Sumamos la energía, la comida y la seguridad. Luego dividimos entre tres.</p>
          </div>
        </div>
        <button onClick={onRestart} className="glass-button mx-auto mt-6 flex w-full max-w-sm items-center justify-center gap-2 rounded-full px-6 py-3 text-lg font-bold"><RotateCcw className="size-5 shrink-0" /> Jugar de nuevo</button>
        <p className="mt-3 text-base text-muted-foreground">¡Prueba otras decisiones desde la primera misión!</p>
      </section>
      <Footer />
    </Screen>
  );
}

const LOSE_TEXT: Record<ResourceKey, [string, string]> = {
  energy: ["Falta energía", "Queda muy poca energía para que la base siga funcionando."],
  food: ["Falta comida", "Queda muy poca comida para alimentar al equipo."],
  safety: ["Falta seguridad", "La base ya no es lo bastante segura. El equipo necesita refugiarse."],
};

function Lose({ failed, r, onRetry, onMenu }: { failed: ResourceKey; r: Resources; onRetry: () => void; onMenu: () => void }) {
  const [cause, detail] = LOSE_TEXT[failed];
  return (
    <Screen bg={loseBg.url}>
      <Hud r={r} sticky />
      <div className="glass self-start rounded-2xl px-4 py-2 text-sm font-extrabold text-energy">¡El equipo necesita ayuda!</div>
      <section className="animate-rise my-auto mx-auto w-full max-w-3xl text-center">
        <p className="inline-flex items-center gap-2 font-bold text-secondary"><Heart className="size-5 shrink-0 fill-current" /> ¡Casi lo logramos!</p>
        <h1 className="text-glow mt-2 text-4xl font-bold leading-tight sm:text-5xl">¡MISIÓN INTERRUMPIDA!</h1>
        <p className="mt-3 text-lg">Una de tus barras llegó al 10% o menos. Esta partida terminó. ¡Puedes probar otra vez y elegir un nuevo camino!</p>
        <div className="mt-4 grid gap-4 text-left md:grid-cols-2">
          <div className="glass rounded-2xl p-4"><p className="flex items-center gap-2 font-extrabold text-destructive"><TriangleAlert className="size-5 shrink-0" />¿Qué pasó?</p><p className="mt-2"><b>{cause}:</b> {detail}</p></div>
          <div className="glass rounded-2xl p-4"><p className="flex items-center gap-2 font-extrabold text-secondary"><Lightbulb className="size-5 shrink-0" />Una pista para la próxima</p><p className="mt-2">Mira cuánto sube o baja cada recurso antes de elegir. ¡Intenta mantener las tres barras por encima del 10%!</p></div>
        </div>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button onClick={onRetry} className="glass-button flex w-full max-w-sm items-center justify-center gap-2 rounded-full px-6 py-3 text-lg font-bold"><RotateCcw className="size-5 shrink-0" /> Probar otra vez</button>
          <button onClick={onMenu} className="glass flex w-full max-w-sm items-center justify-center gap-2 rounded-full px-6 py-3 text-lg font-bold"><Home className="size-5 shrink-0" /> Volver al inicio</button>
        </div>
      </section>
      <Footer />
    </Screen>
  );
}

export function Game() {
  const [phase, setPhase] = useState<Phase>({ kind: "menu" });
  const [r, setR] = useState<Resources>(START);
  const [navigation, dispatchNavigation] = useReducer(navigationReducer, INITIAL_NAVIGATION);
  const [tutorialStep, setTutorialStep] = useState<number | null>(0);
  const reducedMotion = useSyncExternalStore(subscribeMotion, motionSnapshot, serverMotionSnapshot);
  useEffect(() => {
    if (reducedMotion && navigation.pending) {
      dispatchNavigation({ type: "arrive", target: navigation.pending.target });
    }
  }, [reducedMotion, navigation.pending]);
  const start = () => {
    setR(START);
    dispatchNavigation({ type: "reset" });
    setTutorialStep(0);
    setPhase({ kind: "explore", index: 0 });
  };

  switch (phase.kind) {
    case "menu":
      return <Menu onStart={start} />;
    case "explore":
      return <ExplorationScreen index={phase.index} r={r} navigation={navigation}
        tutorialStep={phase.index === 0 ? tutorialStep : null}
        onTutorialNext={() => setTutorialStep(step => step === null || step === 2 ? null : step + 1)}
        onTutorialSkip={() => setTutorialStep(null)}
        onVisit={target => dispatchNavigation({ type: "visit", target, missionIndex: phase.index, animate: !reducedMotion })}
        onBack={() => dispatchNavigation({ type: "back", missionIndex: phase.index, animate: !reducedMotion })}
        onArrive={target => dispatchNavigation({ type: "arrive", target })}
        onMission={() => {
          if (!navigation.pending && navigation.location === phase.index) setPhase({ kind: "mission", index: phase.index });
        }} />;
    case "mission":
      return <MissionScreen index={phase.index} r={r} onExplore={() => setPhase({ kind: "explore", index: phase.index })} onChoose={(c) => { const next = applyChoice(r, c); setR(next); setPhase({ kind: "report", index: phase.index, choice: c, before: r }); }} />;
    case "report":
      return <Report index={phase.index} choice={phase.choice} before={phase.before} r={r} onNext={() => {
        const failed = failedResource(r);
        if (failed) setPhase({ kind: "lose", failed });
        else if (phase.index + 1 >= MISSIONS.length) setPhase({ kind: "win" });
        else setPhase({ kind: "explore", index: phase.index + 1 });
      }} />;
    case "win":
      return <Win r={r} onRestart={start} />;
    case "lose":
      return <Lose failed={phase.failed} r={r} onRetry={start} onMenu={() => setPhase({ kind: "menu" })} />;
  }
}

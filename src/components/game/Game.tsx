import { useState, type ReactNode } from "react";
import { ArrowRight, BookOpen, Zap, Heart, Home, Lightbulb, Medal, Play, RotateCcw, Rocket, Shield, Sprout, Trophy, TriangleAlert, TrendingUp, Users, FlaskConical, X } from "lucide-react";
import { MISSIONS, START, applyChoice, failedResource, RESOURCE_LABEL, type Choice, type ResourceKey, type Resources } from "@/lib/game";
import menuBg from "@/assets/men_principal_0.jpg.asset.json";
import menuKid from "@/assets/men_principal_1.jpg.asset.json";
import m1Bg from "@/assets/misi_n_01_energ_a_solar_0.jpg.asset.json";
import m1Maggie from "@/assets/misi_n_01_energ_a_solar_1.jpg.asset.json";
import m2Bg from "@/assets/pantalla_de_invernadero_remaster_0.jpg.asset.json";
import m3Bg from "@/assets/misi_n_03_micrometeoritos_0.jpg.asset.json";
import m3Maggie from "@/assets/misi_n_03_micrometeoritos_1.jpg.asset.json";
import reportBg from "@/assets/informe_de_decisi_n_0.jpg.asset.json";
import winBg from "@/assets/misi_n_cumplida_victoria_0.jpg.asset.json";
import winMaggie from "@/assets/misi_n_cumplida_victoria_1.jpg.asset.json";
import loseBg from "@/assets/misi_n_interrumpida_derrota_0.jpg.asset.json";

const ART = [
  { bg: m1Bg.url, maggie: m1Maggie.url },
  { bg: m2Bg.url, maggie: m1Maggie.url },
  { bg: m3Bg.url, maggie: m3Maggie.url },
];

type Phase =
  | { kind: "menu" }
  | { kind: "mission"; index: number }
  | { kind: "report"; index: number; choice: Choice; before: Resources }
  | { kind: "win" }
  | { kind: "lose"; failed: ResourceKey };

const ICON = { energy: Zap, food: Sprout, safety: Shield } as const;
const BAR = { energy: "bg-energy", food: "bg-food", safety: "bg-safety" } as const;
const TEXT = { energy: "text-energy", food: "text-food", safety: "text-safety" } as const;

function Screen({ bg, children, dim = true }: { bg: string; children: ReactNode; dim?: boolean }) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {dim && <div className="absolute inset-0 bg-scrim" />}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-5 sm:px-8">{children}</div>
    </main>
  );
}

function Footer() {
  return <p className="mt-auto pt-6 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">PopTART-Cats • NASA Space Apps Challenge • Concepto: Maggie</p>;
}

function ResourceBar({ k, value, delta }: { k: ResourceKey; value: number; delta?: number }) {
  const Icon = ICON[k];
  return (
    <div className="glass flex flex-1 items-center gap-3 rounded-full px-4 py-2">
      <Icon className={`size-5 shrink-0 ${TEXT[k]}`} />
      <div className="min-w-0 flex-1">
        <div className="flex justify-between text-xs font-extrabold uppercase tracking-wider">
          <span>{RESOURCE_LABEL[k]}</span>
          <span className={value <= 20 ? "text-destructive" : ""}>
            {value}%{delta ? <span className="ml-1 text-[10px]">{delta > 0 ? "▲ +" : "▼ "}{delta}%</span> : null}
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full ${BAR[k]} transition-all duration-700`} style={{ width: `${value}%` }} />
        </div>
      </div>
    </div>
  );
}

function Hud({ r, before }: { r: Resources; before?: Resources }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {(Object.keys(r) as ResourceKey[]).map((k) => (
        <ResourceBar key={k} k={k} value={r[k]} delta={before ? r[k] - before[k] : undefined} />
      ))}
    </div>
  );
}

function Effects({ c }: { c: Choice }) {
  const keys = Object.keys(c.effects) as ResourceKey[];
  const entries = keys.length === 1 && c.effects[keys[0]]! < 0 ? keys : keys;
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((k) => {
        const v = c.effects[k]!;
        const Icon = ICON[k];
        return (
          <span key={k} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-extrabold uppercase">
            <Icon className={`size-3.5 ${TEXT[k]}`} />
            {v > 0 ? `+${v}%` : `${v}%`} {RESOURCE_LABEL[k]}
          </span>
        );
      })}
    </div>
  );
}

function Menu({ onStart }: { onStart: () => void }) {
  const [panel, setPanel] = useState<null | "guide" | "credits">(null);
  return (
    <Screen bg={menuBg.url} dim={false}>
      <header className="flex items-center justify-between">
        <div className="glass flex items-center gap-3 rounded-full px-5 py-2">
          <Rocket className="size-5 text-primary" />
          <div className="leading-tight">
            <p className="text-xs font-extrabold uppercase tracking-widest text-primary">NASA Space Apps 2026</p>
            <p className="text-sm font-bold">PopTART-Cats Edition</p>
          </div>
        </div>
      </header>
      <section className="my-auto flex flex-col items-center text-center animate-rise">
        <span className="glass rounded-full px-5 py-1.5 text-sm font-bold uppercase tracking-[0.25em]">Aventura Lunar Interactiva</span>
        <h1 className="text-glow mt-4 text-5xl font-bold sm:text-7xl">¡MISIÓN BASE LUNAR!</h1>
        <p className="glass mt-4 rounded-full px-6 py-2 font-bold sm:text-lg">Misión 01 — El Despertar de la Cúpula Científica</p>
        <div className="mt-8 flex flex-col items-center gap-6 md:flex-row">
          <div className="relative">
            <span className="glass absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl px-4 py-1.5 text-sm font-bold">¡Hola, cadete! ¿Listo para explorar?</span>
            <img src={menuKid.url} alt="Astronauta cadete saludando" className="animate-float w-64 rounded-2xl border border-primary/50 shadow-2xl sm:w-80" />
          </div>
          <div className="flex w-full max-w-md flex-col gap-3">
            <button onClick={onStart} className="glass-button flex items-center justify-between rounded-full px-6 py-4 text-2xl font-bold">
              <Play className="size-7 fill-current" /> INICIAR MISIÓN <Rocket className="size-6" />
            </button>
            <div className="grid grid-cols-2 gap-3">
              <MenuTile icon={BookOpen} label="Guía Lunar" onClick={() => setPanel("guide")} />
              <MenuTile icon={Trophy} label="Logros" onClick={() => setPanel("guide")} />
              <MenuTile icon={FlaskConical} label="Invernadero" onClick={onStart} />
              <MenuTile icon={Users} label="Créditos" onClick={() => setPanel("credits")} />
            </div>
          </div>
        </div>
      </section>
      <footer className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
        <span className="glass rounded-full px-4 py-1.5">🎨 Arte & Concepto: Maggie • 💻 Dev: Ernesto • 🔬 Ciencia: Emmanuel</span>
        <span className="uppercase tracking-widest text-muted-foreground">v2.0 Remastered • PopTART-Cats</span>
      </footer>
      {panel && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-scrim p-4" onClick={() => setPanel(null)}>
          <div className="glass animate-rise relative w-full max-w-lg rounded-3xl bg-popover p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPanel(null)} className="absolute right-4 top-4" aria-label="Cerrar"><X /></button>
            {panel === "guide" ? (
              <>
                <h2 className="text-2xl font-bold text-primary">Manual de Supervivencia Lunar</h2>
                <p className="mt-3">Bienvenido a la <b>Base Lunar Alfa</b>. Como comandante del módulo ambiental, tus decisiones equilibran los recursos vitales:</p>
                <ul className="mt-4 space-y-2 font-bold">
                  <li>⚡ ENERGÍA — Calefacción y luces</li>
                  <li>🌱 COMIDA — Plantas de cultivo</li>
                  <li>🛡️ SEGURIDAD — Integridad del domo</li>
                </ul>
                <p className="mt-4 text-sm text-muted-foreground">Si algún recurso cae al 10% o menos, la misión se interrumpe. Inspirado en investigaciones reales de astrobiología para hábitats lunares autosuficientes.</p>
                <button onClick={() => setPanel(null)} className="glass-button mt-5 w-full rounded-full py-3 font-bold">¡Entendido, Comandante!</button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-primary">PopTART-Cats</h2>
                <p className="text-sm text-muted-foreground">NASA Space Apps Challenge 2026</p>
                <ul className="mt-4 space-y-2 font-bold">
                  <li>👩‍🎨 Arte & Concepto: Maggie</li>
                  <li>💻 Programación & Mecánicas: Ernesto</li>
                  <li>🔬 Investigación & Ciencia: Emmanuel</li>
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
      <Icon className="size-5 text-primary" /> {label}
    </button>
  );
}

function MissionScreen({ index, r, onChoose }: { index: number; r: Resources; onChoose: (c: Choice) => void }) {
  const m = MISSIONS[index];
  const art = ART[index];
  return (
    <Screen bg={art.bg}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <span className="glass self-start rounded-full px-5 py-2 text-sm font-extrabold tracking-widest">{m.code} | {m.title}</span>
        <div className="flex-1"><Hud r={r} /></div>
      </div>
      <section key={m.id} className="my-auto flex flex-col items-center gap-6 py-8 md:flex-row md:items-end animate-rise">
        <figure className="shrink-0 text-center">
          <img src={art.maggie} alt="Maggie, la astronauta" className="size-40 rounded-full border-4 border-primary/60 object-cover shadow-2xl sm:size-48" />
          <figcaption className="mt-2 text-sm font-extrabold tracking-widest">MAGGIE • EVA</figcaption>
        </figure>
        <div className="glass flex-1 rounded-3xl p-6">
          <p className="flex flex-wrap items-center gap-3 text-sm font-extrabold">
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-destructive-foreground"><TriangleAlert className="size-4" />{m.alert}</span>
            <span className="text-muted-foreground">{m.sensor}</span>
          </p>
          <h2 className="mt-3 text-3xl font-bold">{m.headline}</h2>
          <p className="mt-2 text-lg">{m.body} <b>¿Qué decisión tomamos?</b></p>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {m.choices.map((c) => (
          <button key={c.id} onClick={() => onChoose(c)} className="glass group flex items-center gap-4 rounded-3xl p-5 text-left transition hover:-translate-y-1 hover:border-primary">
            <div className="flex-1">
              <p className="text-xl font-bold uppercase">{c.title}</p>
              <p className="mb-3 text-sm text-muted-foreground">{c.subtitle}</p>
              <Effects c={c} />
            </div>
            <ArrowRight className="size-6 text-primary transition group-hover:translate-x-1" />
          </button>
        ))}
      </div>
      <Footer />
    </Screen>
  );
}

function Report({ index, choice, before, r, onNext }: { index: number; choice: Choice; before: Resources; r: Resources; onNext: () => void }) {
  const m = MISSIONS[index];
  const fx = Object.entries(choice.effects) as [ResourceKey, number][];
  const gains = fx.filter(([, v]) => v > 0);
  const losses = fx.filter(([, v]) => v < 0);
  return (
    <Screen bg={reportBg.url}>
      <Hud r={r} before={before} />
      <section className="glass animate-rise my-auto rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-primary">Telemetría de la Base • {m.code}</p>
            <h2 className="text-xl font-bold">INFORME DE MISIÓN — EVALUACIÓN</h2>
          </div>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-extrabold text-accent-foreground">EJECUTADO</span>
        </div>
        <p className="mt-4 font-bold">Decisión Tomada: <span className="text-primary">{choice.title}</span></p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-muted/60 p-4">
            <p className="flex items-center gap-2 font-extrabold uppercase text-food"><TrendingUp className="size-5" /> Impacto Positivo</p>
            <p className="mt-1"><b>{gains.map(([k, v]) => `+${v}% ${RESOURCE_LABEL[k]}`).join(", ") || "Recurso estable"}</b> — {choice.positive}</p>
          </div>
          <div className="rounded-2xl bg-muted/60 p-4">
            <p className="flex items-center gap-2 font-extrabold uppercase text-energy"><TriangleAlert className="size-5" /> Costo & Riesgo</p>
            <p className="mt-1"><b>{losses.map(([k, v]) => `${v}% ${RESOURCE_LABEL[k]}`).join(", ")}</b> — {choice.cost}</p>
          </div>
        </div>
        <p className="mt-4 flex gap-3 rounded-2xl bg-muted/40 p-4"><Lightbulb className="size-6 shrink-0 text-secondary" /><span><b>Dato Científico:</b> {m.fact}</span></p>
      </section>
      <button onClick={onNext} className="glass-button mx-auto flex items-center gap-3 rounded-full px-8 py-3 text-lg font-bold">
        <Play className="size-5" /> Continuar Misión <ArrowRight className="size-5" />
      </button>
      <Footer />
    </Screen>
  );
}

function Win({ r, onRestart }: { r: Resources; onRestart: () => void }) {
  const avg = Math.round((r.energy + r.food + r.safety) / 3);
  return (
    <Screen bg={winBg.url}>
      <div className="flex justify-between gap-2">
        <div className="glass flex items-center gap-2 rounded-2xl px-4 py-2"><Medal className="text-secondary" /><div><p className="text-xs font-extrabold uppercase tracking-widest">Rango Asignado</p><p className="font-bold">Cadete Científico Experto ★★★</p></div></div>
        <span className="glass self-center rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-widest">Ciclo Lunar 14: Estable</span>
      </div>
      <section className="animate-rise my-auto text-center">
        <p className="text-sm font-extrabold uppercase tracking-widest text-secondary">★ ¡Misión 03 concluida! ★</p>
        <h1 className="text-glow mt-2 text-5xl font-bold sm:text-6xl">¡MISIÓN CUMPLIDA!</h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg">¡Has asegurado la supervivencia y prosperidad de la <b>Base Lunar Alfa</b>! Las plantas florecen y la energía fluye radiante. ¡Yujuuu! 🎉</p>
        <div className="mt-8 flex flex-col items-center gap-6 md:flex-row md:justify-center">
          <img src={winMaggie.url} alt="Maggie celebrando" className="animate-float size-48 rounded-full border-4 border-secondary object-cover" />
          <div className="glass w-full max-w-lg rounded-3xl p-5 text-left">
            <p className="mb-3 flex justify-between font-bold"><span>Estado de Recursos Finales</span><span className="text-primary">EFICIENCIA GLOBAL: {avg}%</span></p>
            <div className="space-y-2"><Hud r={r} /></div>
          </div>
        </div>
        <button onClick={onRestart} className="glass-button mx-auto mt-8 flex items-center gap-2 rounded-full px-8 py-3 text-lg font-bold"><RotateCcw className="size-5" /> JUGAR DE NUEVO</button>
        <p className="mt-2 text-sm text-muted-foreground">Reiniciar simulación desde Misión 01 • 🚀 ¡Maggie te saluda orgullosa, comandante!</p>
      </section>
      <Footer />
    </Screen>
  );
}

const LOSE_TEXT: Record<ResourceKey, [string, string]> = {
  energy: ["Agotamiento de Energía", "Los sistemas auxiliares protegieron a la tripulación pero detuvieron las operaciones agrícolas automáticas."],
  food: ["Escasez de Comida", "El invernadero no pudo producir suficientes cultivos para alimentar a la tripulación."],
  safety: ["Integridad del Domo Comprometida", "La tripulación fue evacuada por seguridad y la base quedó en modo de protección."],
};

function Lose({ failed, r, onRetry, onMenu }: { failed: ResourceKey; r: Resources; onRetry: () => void; onMenu: () => void }) {
  const [cause, detail] = LOSE_TEXT[failed];
  return (
    <Screen bg={loseBg.url}>
      <div className="glass self-start rounded-full px-5 py-2 text-sm font-extrabold uppercase tracking-widest text-energy">Estado: Modo de Seguridad Activado</div>
      <section className="animate-rise my-auto mx-auto w-full max-w-3xl text-center">
        <p className="inline-flex items-center gap-2 font-bold text-secondary"><Heart className="size-5 fill-current" /> ¡Casi lo logramos, cadete!</p>
        <h1 className="text-glow mt-2 text-5xl font-bold">¡MISIÓN INTERRUMPIDA!</h1>
        <p className="mt-3 text-lg">Un recurso crítico ha caído a niveles mínimos, pero la exploración espacial avanza aprendiendo de cada simulación.</p>
        <div className="mt-6"><Hud r={r} /></div>
        <div className="mt-4 grid gap-4 text-left md:grid-cols-2">
          <div className="glass rounded-2xl p-4"><p className="flex items-center gap-2 font-extrabold uppercase text-destructive"><TriangleAlert className="size-5" />Causa de Interrupción</p><p className="mt-1"><b>{cause}:</b> {detail}</p></div>
          <div className="glass rounded-2xl p-4"><p className="flex items-center gap-2 font-extrabold uppercase text-secondary"><Lightbulb className="size-5" />Consejo de Misión</p><p className="mt-1"><b>Balance de Consumo:</b> en la noche lunar de 14 días terrestres, alternar mantas reflectivas con ciclos cortos de calor ahorra hasta un 40% de energía.</p></div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={onRetry} className="glass-button flex items-center gap-2 rounded-full px-8 py-3 text-lg font-bold"><RotateCcw className="size-5" /> VOLVER A INTENTAR</button>
          <button onClick={onMenu} className="glass flex items-center gap-2 rounded-full px-8 py-3 text-lg font-bold"><Home className="size-5" /> MENÚ PRINCIPAL</button>
        </div>
      </section>
      <Footer />
    </Screen>
  );
}

export function Game() {
  const [phase, setPhase] = useState<Phase>({ kind: "menu" });
  const [r, setR] = useState<Resources>(START);
  const start = () => { setR(START); setPhase({ kind: "mission", index: 0 }); };

  switch (phase.kind) {
    case "menu":
      return <Menu onStart={start} />;
    case "mission":
      return <MissionScreen index={phase.index} r={r} onChoose={(c) => { const next = applyChoice(r, c); setR(next); setPhase({ kind: "report", index: phase.index, choice: c, before: r }); }} />;
    case "report":
      return <Report index={phase.index} choice={phase.choice} before={phase.before} r={r} onNext={() => {
        const failed = failedResource(r);
        if (failed) setPhase({ kind: "lose", failed });
        else if (phase.index + 1 >= MISSIONS.length) setPhase({ kind: "win" });
        else setPhase({ kind: "mission", index: phase.index + 1 });
      }} />;
    case "win":
      return <Win r={r} onRestart={start} />;
    case "lose":
      return <Lose failed={phase.failed} r={r} onRetry={start} onMenu={() => setPhase({ kind: "menu" })} />;
  }
}

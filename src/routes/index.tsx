import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getState } from "@/lib/bollini.functions";

const stateQuery = queryOptions({
  queryKey: ["bollini-state"],
  queryFn: () => getState(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(stateQuery),
  head: () => ({
    meta: [
      { title: "I miei bollini — la bacheca dei punti" },
      {
        name: "description",
        content:
          "Bacheca dei bollini: guarda quanti punti hai, come guadagnarne altri e cosa puoi ottenere in cambio.",
      },
      { property: "og:title", content: "I miei bollini — la bacheca dei punti" },
      {
        property: "og:description",
        content: "Punti, premi e storico dei bollini, tutto in una pagina colorata.",
      },
    ],
  }),
  errorComponent: () => (
    <div className="p-10 text-center">Ops, la bacheca non si carica. Riprova.</div>
  ),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useSuspenseQuery(stateQuery);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            La bacheca di
          </p>
          <h1 className="text-4xl font-extrabold text-foreground md:text-5xl">{data.childName}</h1>
        </div>
        <Link
          to="/admin"
          className="btn-pop btn-pop-hover border-2 border-border bg-card text-sm text-muted-foreground"
        >
          Area genitori
        </Link>
      </header>

      <section className="card-pop relative mt-8 overflow-hidden px-6 py-10 text-center md:py-14">
        <span className="pointer-events-none absolute left-6 top-6 animate-floaty text-3xl" aria-hidden>✨</span>
        <span className="pointer-events-none absolute right-8 top-10 animate-floaty text-2xl [animation-delay:-1.4s]" aria-hidden>⭐</span>
        <span className="pointer-events-none absolute bottom-8 left-10 animate-floaty text-2xl [animation-delay:-2.6s]" aria-hidden>🌟</span>
        <span className="pointer-events-none absolute bottom-6 right-12 animate-floaty text-3xl [animation-delay:-0.8s]" aria-hidden>✨</span>

        <div className="relative mx-auto flex w-fit items-center justify-center">
          <div className="animate-halo absolute h-56 w-56 rounded-full bg-sunny/50 md:h-64 md:w-64" aria-hidden />
          <div className="relative flex h-48 w-48 flex-col items-center justify-center rounded-full border-8 border-sunny-foreground/15 bg-sunny text-sunny-foreground shadow-[inset_0_-12px_0_oklch(0_0_0/0.06)] md:h-56 md:w-56">
            <span className="font-display text-7xl font-extrabold leading-none md:text-8xl">
              {data.points}
            </span>
            <span className="mt-1 font-display text-xl font-bold">bollini</span>
          </div>
        </div>
        <p className="mt-6 font-display text-lg font-bold text-muted-foreground">
          Ogni bollino è una piccola vittoria! 🏅
        </p>
      </section>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="card-pop p-6">
          <h2 className="text-2xl font-bold">Come guadagni bollini</h2>
          <ul className="mt-4 space-y-3">
            {data.actions.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-2xl bg-mint/40 px-4 py-3"
              >
                <span className="text-2xl">{a.emoji}</span>
                <span className="flex-1 font-semibold">{a.label}</span>
                <span className="rounded-full bg-mint px-3 py-1 font-display text-sm font-bold text-mint-foreground">
                  +{a.points}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-pop p-6">
          <h2 className="text-2xl font-bold">Cosa puoi ottenere</h2>
          <ul className="mt-4 space-y-3">
            {data.rewards.map((r) => {
              const ok = data.points >= r.cost;
              return (
                <li
                  key={r.id}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${ok ? "bg-sunny/50" : "bg-secondary/60"}`}
                >
                  <span className="text-2xl">{r.emoji}</span>
                  <span className="flex-1 font-semibold">
                    {r.label}
                    {ok && (
                      <span className="ml-2 text-xs font-bold uppercase text-accent">
                        puoi averlo!
                      </span>
                    )}
                  </span>
                  <span className="rounded-full bg-card px-3 py-1 font-display text-sm font-bold">
                    {r.cost}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="card-pop mt-6 p-6">
        <h2 className="text-2xl font-bold">Storico</h2>
        {data.entries.length === 0 ? (
          <p className="mt-3 text-muted-foreground">
            Ancora nessun bollino registrato. Si comincia oggi!
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {data.entries.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-3">
                <span
                  className={`w-16 shrink-0 rounded-full px-2 py-1 text-center font-display font-bold ${
                    e.delta > 0 ? "bg-mint text-mint-foreground" : "bg-accent text-accent-foreground"
                  }`}
                >
                  {e.delta > 0 ? `+${e.delta}` : e.delta}
                </span>
                <span className="flex-1 font-semibold">{e.label}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(e.ts).toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

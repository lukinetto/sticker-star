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
  const nextReward = [...data.rewards]
    .sort((a, b) => a.cost - b.cost)
    .find((r) => r.cost > data.points);
  const progress = nextReward ? Math.min(100, (data.points / nextReward.cost) * 100) : 100;

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

      <section className="card-pop mt-8 overflow-hidden">
        <div className="grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center md:p-8">
          <div className="flex flex-col items-center justify-center rounded-3xl bg-sunny px-8 py-6 text-sunny-foreground">
            <span className="text-6xl font-extrabold leading-none md:text-7xl">{data.points}</span>
            <span className="mt-1 font-display text-lg font-bold">bollini</span>
          </div>
          <div>
            {nextReward ? (
              <>
                <h2 className="text-xl font-bold">
                  Prossimo traguardo: {nextReward.emoji} {nextReward.label}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ti mancano <strong>{nextReward.cost - data.points}</strong> bollini su{" "}
                  {nextReward.cost}.
                </p>
              </>
            ) : (
              <h2 className="text-xl font-bold">Hai bollini per tutti i premi! 🎉</h2>
            )}
            <div className="mt-4 h-5 w-full overflow-hidden rounded-full border-2 border-border bg-secondary">
              <div
                className="h-full rounded-full bg-accent transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
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

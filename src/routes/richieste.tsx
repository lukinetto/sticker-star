import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getState, createRequest } from "@/lib/bollini.functions";

const stateQuery = queryOptions({
  queryKey: ["bollini-state"],
  queryFn: () => getState(),
});

export const Route = createFileRoute("/richieste")({
  loader: ({ context }) => context.queryClient.ensureQueryData(stateQuery),
  head: () => ({
    meta: [
      { title: "Le mie richieste — Bollini" },
      {
        name: "description",
        content:
          "Dichiara quello che hai fatto per guadagnare bollini e chiedi di spenderli per un premio.",
      },
      { property: "og:title", content: "Le mie richieste — Bollini" },
      {
        property: "og:description",
        content: "Richiedi bollini per le cose fatte bene e chiedi i premi che vuoi.",
      },
    ],
  }),
  errorComponent: () => <div className="p-10 text-center">Ops, riprova tra poco.</div>,
  component: Richieste;
});

function Richieste() {
  return null;
}

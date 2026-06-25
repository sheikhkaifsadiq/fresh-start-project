/**
 * @file src/routes/_authenticated/links.tsx
 * @description Authenticated route mounting the migrated Links module
 * inside the AegisRoute AppShell. Sits under the `_authenticated`
 * guard so unauthenticated visitors get bounced to /auth.
 */

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { LinksManager } from "@/components/links/LinksManager";

export const Route = createFileRoute("/_authenticated/links")({
  head: () => ({ meta: [{ title: "Links — AegisRoute" }] }),
  component: LinksPage,
});

function LinksPage() {
  return (
    <AppShell
      title="Links."
      kicker="PATHWAY · COMMAND · LEDGER"
    >
      <LinksManager />
    </AppShell>
  );
}

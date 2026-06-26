/**
 * @file src/routes/_authenticated/rules.tsx
 * @description Routing rules editor. Reuses the existing RuleBuilder
 * component (migrated 1:1 from the legacy app).
 */

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { RuleBuilder } from "@/components/links/RuleBuilder";

export const Route = createFileRoute("/_authenticated/rules")({
  head: () => ({ meta: [{ title: "Rules — AegisRoute" }] }),
  component: RulesPage,
});

function RulesPage() {
  return (
    <AppShell title="Rules." kicker="POLICY · BRANCHES · DECISIONS">
      <RuleBuilder />
    </AppShell>
  );
}

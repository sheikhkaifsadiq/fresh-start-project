/**
 * @file src/app/(dashboard)/settings/api-keys/page.tsx
 * @description Full API Keys management page for Aegis Route dashboard.
 *
 * Features:
 * - List of API keys with name, created date, last used, permission scopes
 * - Show/hide key value with blur effect
 * - Copy to clipboard with animated success state (✓ icon + colour change)
 * - Revoke key with inline confirmation dialog
 * - Generate new API key form with name + permission scope multi-select
 * - All state managed locally with React useState (no external deps beyond UI)
 */

"use client";

import { useState, useCallback, useId } from "react";
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Key,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Permission =
  | "links:read"
  | "links:write"
  | "links:delete"
  | "analytics:read"
  | "settings:read"
  | "settings:write";

const ALL_PERMISSIONS: Permission[] = [
  "links:read",
  "links:write",
  "links:delete",
  "analytics:read",
  "settings:read",
  "settings:write",
];

const PERMISSION_LABELS: Record<Permission, string> = {
  "links:read": "Links — Read",
  "links:write": "Links — Write",
  "links:delete": "Links — Delete",
  "analytics:read": "Analytics — Read",
  "settings:read": "Settings — Read",
  "settings:write": "Settings — Write",
};

interface ApiKey {
  id: string;
  name: string;
  /** The full key is only returned once on creation; stored here for demo. */
  key: string;
  createdAt: string;
  lastUsedAt: string | null;
  permissions: Permission[];
  isRevoked: boolean;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function generateApiKey(): string {
  const prefix = "ar_live_";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = prefix;
  for (let i = 0; i < 48; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function maskKey(key: string): string {
  if (key.length <= 12) return "••••••••••••";
  return key.slice(0, 10) + "•".repeat(30) + key.slice(-4);
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const SEED_KEYS: ApiKey[] = [
  {
    id: "key_1",
    name: "Production Integration",
    key: "ar_live_Kx8mQ3vT9wRsLpNjYeH2cF7aGdZuIbOo1X4nVsWqP6kMtE",
    createdAt: "2026-05-01T10:00:00Z",
    lastUsedAt: "2026-06-20T14:32:00Z",
    permissions: ["links:read", "links:write", "analytics:read"],
    isRevoked: false,
  },
  {
    id: "key_2",
    name: "CI/CD Pipeline",
    key: "ar_live_Ap5nBr2uYc8wDtElF1gHiJ4kLmMoNqOrPsQtRuSvTxUyVzW",
    createdAt: "2026-04-15T08:00:00Z",
    lastUsedAt: "2026-06-21T09:15:00Z",
    permissions: ["links:read"],
    isRevoked: false,
  },
  {
    id: "key_3",
    name: "Analytics Dashboard",
    key: "ar_live_Zz9yXx8wWv7uUt6sRr5qQp4oOn3mMl2kKj1iIhHgGfFeEdD",
    createdAt: "2026-03-10T12:00:00Z",
    lastUsedAt: null,
    permissions: ["analytics:read", "settings:read"],
    isRevoked: false,
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ApiKeyRowProps {
  apiKey: ApiKey;
  onRevoke: (id: string) => void;
}

function ApiKeyRow({ apiKey, onRevoke }: ApiKeyRowProps) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(apiKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard API not available in some environments
    }
  }, [apiKey.key]);

  const handleRevoke = useCallback(async () => {
    setRevoking(true);
    // Simulate async API call
    await new Promise((r) => setTimeout(r, 800));
    onRevoke(apiKey.id);
    setRevoking(false);
    setShowConfirm(false);
  }, [apiKey.id, onRevoke]);

  return (
    <div className="group rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] p-5 transition-all duration-200 space-y-4">
      <div className="flex items-start justify-between gap-4">
        {/* Key info */}
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="font-semibold text-white truncate">
              {apiKey.name}
            </span>
            {apiKey.isRevoked && (
              <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                Revoked
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-white/40">
            <span>Created {formatDate(apiKey.createdAt)}</span>
            <span>·</span>
            <span>
              {apiKey.lastUsedAt
                ? `Last used ${formatDate(apiKey.lastUsedAt)}`
                : "Never used"}
            </span>
          </div>
        </div>

        {/* Actions */}
        {!apiKey.isRevoked && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Hide key" : "Show key"}
              className="h-8 px-2 text-white/50 hover:text-white hover:bg-white/10"
            >
              {visible ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              aria-label="Copy API key"
              className={`h-8 px-2 transition-colors duration-200 ${
                copied
                  ? "text-green-400 hover:text-green-400 hover:bg-green-500/10"
                  : "text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>

            {!showConfirm ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirm(true)}
                aria-label="Revoke key"
                className="h-8 px-2 text-white/50 hover:text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-white/50 hidden sm:block">
                  Revoke?
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="h-8 px-3 text-xs bg-red-600 hover:bg-red-500"
                >
                  {revoking ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Yes, Revoke"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfirm(false)}
                  className="h-8 px-2 text-white/50 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Key value display */}
      <div className="relative">
        <div
          className={`font-mono text-xs rounded-lg border border-white/8 bg-black/30 px-4 py-3 text-white/80 break-all transition-all duration-300 select-none ${
            visible ? "" : "blur-sm select-none cursor-pointer"
          }`}
          onClick={() => !visible && setVisible(true)}
          role={!visible ? "button" : undefined}
          tabIndex={!visible ? 0 : undefined}
          onKeyDown={(e) => {
            if (!visible && (e.key === "Enter" || e.key === " ")) {
              setVisible(true);
            }
          }}
          aria-label={!visible ? "Click to reveal API key" : undefined}
        >
          {visible ? apiKey.key : maskKey(apiKey.key)}
        </div>
        {!visible && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-white/50 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
              Click to reveal
            </span>
          </div>
        )}
      </div>

      {/* Permission badges */}
      <div className="flex flex-wrap gap-1.5">
        {apiKey.permissions.map((perm) => (
          <span
            key={perm}
            className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full"
          >
            {PERMISSION_LABELS[perm]}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generate key form
// ---------------------------------------------------------------------------

interface GenerateKeyFormProps {
  onGenerate: (name: string, permissions: Permission[]) => void;
}

function GenerateKeyForm({ onGenerate }: GenerateKeyFormProps) {
  const [name, setName] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<Set<Permission>>(
    new Set<Permission>(["links:read"])
  );
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const formId = useId();

  const togglePermission = (perm: Permission) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      next.has(perm) ? next.delete(perm) : next.add(perm);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);

    if (name.trim().length < 3) {
      setNameError("Key name must be at least 3 characters.");
      return;
    }
    if (name.trim().length > 50) {
      setNameError("Key name cannot exceed 50 characters.");
      return;
    }
    if (selectedPerms.size === 0) {
      return; // Shouldn't happen, but guard anyway
    }

    setIsLoading(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 900));
    onGenerate(name.trim(), Array.from(selectedPerms));
    setName("");
    setSelectedPerms(new Set<Permission>(["links:read"]));
    setIsLoading(false);
  };

  return (
    <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-purple-400" />
          Generate New API Key
        </CardTitle>
        <CardDescription className="text-white/40">
          Keys are shown in full only once. Store them securely.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5" id={formId}>
          {/* Key name */}
          <div className="space-y-1.5">
            <label
              htmlFor={`${formId}-name`}
              className="block text-sm font-medium text-white/70"
            >
              Key Name
            </label>
            <Input
              id={`${formId}-name`}
              type="text"
              placeholder="e.g. Production Integration"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(null);
              }}
              maxLength={50}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25
                         focus-visible:ring-purple-500/60 h-11"
            />
            {nameError && (
              <p className="text-xs text-red-400">{nameError}</p>
            )}
          </div>

          {/* Permission scopes */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-white/70">
              Permission Scopes
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_PERMISSIONS.map((perm) => {
                const active = selectedPerms.has(perm);
                return (
                  <button
                    key={perm}
                    type="button"
                    onClick={() => togglePermission(perm)}
                    aria-pressed={active}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all duration-150 text-left ${
                      active
                        ? "border-purple-500/60 bg-purple-500/15 text-purple-300"
                        : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20 hover:text-white/60"
                    }`}
                  >
                    {active ? (
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-sm border border-current opacity-50 shrink-0" />
                    )}
                    {PERMISSION_LABELS[perm]}
                  </button>
                );
              })}
            </div>
            {selectedPerms.size === 0 && (
              <p className="text-xs text-yellow-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Select at least one permission scope.
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || selectedPerms.size === 0 || name.trim().length < 3}
            className="w-full sm:w-auto h-10 px-6 font-semibold text-sm
                       bg-gradient-to-r from-purple-600 to-blue-600
                       hover:from-purple-500 hover:to-blue-500
                       text-white shadow-lg shadow-purple-500/25
                       disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Generate Key
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>(SEED_KEYS);
  const [newlyCreated, setNewlyCreated] = useState<ApiKey | null>(null);
  const [newKeyCopied, setNewKeyCopied] = useState(false);

  const handleRevoke = useCallback((id: string) => {
    setKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, isRevoked: true } : k))
    );
  }, []);

  const handleGenerate = useCallback(
    (name: string, permissions: Permission[]) => {
      const newKey: ApiKey = {
        id: `key_${Date.now()}`,
        name,
        key: generateApiKey(),
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        permissions,
        isRevoked: false,
      };
      setKeys((prev) => [newKey, ...prev]);
      setNewlyCreated(newKey);
      setNewKeyCopied(false);
    },
    []
  );

  const handleCopyNew = async () => {
    if (!newlyCreated) return;
    await navigator.clipboard.writeText(newlyCreated.key);
    setNewKeyCopied(true);
    setTimeout(() => setNewKeyCopied(false), 2500);
  };

  const activeKeys = keys.filter((k) => !k.isRevoked);
  const revokedKeys = keys.filter((k) => k.isRevoked);

  return (
    <div className="min-h-screen bg-[#070711] text-white">
      {/* Page header */}
      <div className="border-b border-white/8 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Key className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">API Keys</h1>
              <p className="text-sm text-white/50 mt-0.5">
                Manage programmatic access to the Aegis Route API
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Newly created key banner */}
        {newlyCreated && (
          <div
            role="alert"
            className="rounded-xl border border-green-500/30 bg-green-500/10 p-5 space-y-3"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <p className="font-semibold text-green-300">
                  API key generated! Copy it now — it won&apos;t be shown again.
                </p>
              </div>
              <button
                onClick={() => setNewlyCreated(null)}
                className="text-white/30 hover:text-white/60 text-lg leading-none"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-xs bg-black/40 rounded-lg px-4 py-3 text-green-200 break-all">
                {newlyCreated.key}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyNew}
                className={`shrink-0 border-white/20 h-10 px-3 transition-colors ${
                  newKeyCopied
                    ? "text-green-400 border-green-500/40 bg-green-500/10"
                    : "text-white/70 bg-transparent hover:bg-white/10"
                }`}
              >
                {newKeyCopied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Generate form */}
        <GenerateKeyForm onGenerate={handleGenerate} />

        {/* Active keys */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Active Keys</h2>
            <span className="text-sm text-white/40">
              {activeKeys.length} key{activeKeys.length !== 1 ? "s" : ""}
            </span>
          </div>

          {activeKeys.length === 0 ? (
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-10 text-center space-y-3">
              <Key className="w-10 h-10 text-white/20 mx-auto" />
              <p className="text-white/40 text-sm">
                No active API keys. Generate one above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeKeys.map((k) => (
                <ApiKeyRow key={k.id} apiKey={k} onRevoke={handleRevoke} />
              ))}
            </div>
          )}
        </div>

        {/* Revoked keys */}
        {revokedKeys.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white/50">Revoked Keys</h2>
            <div className="space-y-3 opacity-60">
              {revokedKeys.map((k) => (
                <ApiKeyRow key={k.id} apiKey={k} onRevoke={handleRevoke} />
              ))}
            </div>
          </div>
        )}

        {/* Security notice */}
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-yellow-300">
              Keep your API keys secure
            </p>
            <p className="text-xs text-yellow-300/60 leading-relaxed">
              Never expose API keys in client-side code, version control, or
              public repositories. Rotate keys regularly. Revoke immediately if
              compromised.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

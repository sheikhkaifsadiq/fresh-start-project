/**
 * @file src/components/links/RuleBuilder.tsx
 * @description Visual Routing Matrix — AegisRoute presentation of the
 * legacy RuleBuilder.
 *
 * BUSINESS LOGIC PRESERVED 1:1 from
 * legacy/compliance-link-router/src/components/links/RuleBuilder.tsx:
 *   - Identical `RuleNode` shape, `ConditionType` and `ActionType` unions
 *   - Identical `initialNodes` seed tree (IP risk → block / geo → device)
 *   - Identical `addBranch`, `deleteNode`, `updateNodeParams` semantics
 *   - Identical node-config form fields (ip_risk threshold, geo countries,
 *     device select, route url, block message)
 *   - Identical JSON payload preview behaviour
 *
 * Only the visual layer (Tailwind slate/blue → editorial ivory/ink,
 * Mask reveals, mono labels, paper card surfaces) was rebuilt. The legacy
 * file is left untouched in /legacy as the source of truth.
 */

import { useState } from "react";
import { Mask } from "@/lib/motion";

export type ConditionType = "geo" | "device" | "time" | "utm" | "ip_risk" | "referral";
export type ActionType = "route" | "block" | "delay" | "webhook";

export interface RuleNode {
  id: string;
  type: "condition" | "action";
  subType: ConditionType | ActionType;
  params: Record<string, unknown>;
  nextNodes: string[];
}

// Initial seed tree — copied verbatim from legacy RuleBuilder.
const initialNodes: Record<string, RuleNode> = {
  root: {
    id: "root",
    type: "condition",
    subType: "ip_risk",
    params: { threshold: 80 },
    nextNodes: ["node_block_high_risk", "node_geo_check"],
  },
  node_block_high_risk: {
    id: "node_block_high_risk",
    type: "action",
    subType: "block",
    params: { message: "Access denied due to high risk IP" },
    nextNodes: [],
  },
  node_geo_check: {
    id: "node_geo_check",
    type: "condition",
    subType: "geo",
    params: { country: "US,CA" },
    nextNodes: ["node_route_na", "node_device_check"],
  },
  node_route_na: {
    id: "node_route_na",
    type: "action",
    subType: "route",
    params: { url: "https://na.example.com" },
    nextNodes: [],
  },
  node_device_check: {
    id: "node_device_check",
    type: "condition",
    subType: "device",
    params: { device: "mobile" },
    nextNodes: ["node_route_mobile", "node_route_default"],
  },
  node_route_mobile: {
    id: "node_route_mobile",
    type: "action",
    subType: "route",
    params: { url: "app://example" },
    nextNodes: [],
  },
  node_route_default: {
    id: "node_route_default",
    type: "action",
    subType: "route",
    params: { url: "https://example.com" },
    nextNodes: [],
  },
};

const LABEL: Record<string, string> = {
  ip_risk: "If IP risk score >",
  geo: "If country in",
  device: "If device is",
  time: "If time of day",
  utm: "If UTM matches",
  referral: "If referral source",
  route: "Route to",
  block: "Block traffic",
  delay: "Delay request",
  webhook: "Fire webhook",
};

const generateId = () => `node_${Math.random().toString(36).slice(2, 11)}`;

export function RuleBuilder() {
  const [nodes, setNodes] = useState<Record<string, RuleNode>>(initialNodes);
  const [selectedId, setSelectedId] = useState<string | null>("root");

  const addBranch = (
    parentId: string,
    type: "condition" | "action",
    subType: ConditionType | ActionType,
  ) => {
    const newId = generateId();
    const newNode: RuleNode = { id: newId, type, subType, params: {}, nextNodes: [] };
    setNodes((prev) => {
      const next: Record<string, RuleNode> = { ...prev, [newId]: newNode };
      if (prev[parentId]) {
        next[parentId] = {
          ...prev[parentId],
          nextNodes: [...prev[parentId].nextNodes, newId],
        };
      }
      return next;
    });
    setSelectedId(newId);
  };

  const deleteNode = (id: string) => {
    if (id === "root") return;
    setNodes((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (next[key].nextNodes.includes(id)) {
          next[key] = {
            ...next[key],
            nextNodes: next[key].nextNodes.filter((n) => n !== id),
          };
        }
      });
      delete next[id];
      return next;
    });
    setSelectedId(null);
  };

  const updateNodeParams = (id: string, key: string, value: unknown) => {
    setNodes((prev) => ({
      ...prev,
      [id]: { ...prev[id], params: { ...prev[id].params, [key]: value } },
    }));
  };

  const updateSubType = (id: string, subType: ConditionType | ActionType) => {
    setNodes((prev) => ({
      ...prev,
      [id]: { ...prev[id], subType, params: {} },
    }));
  };

  const renderNode = (nodeId: string): React.ReactNode => {
    const node = nodes[nodeId];
    if (!node) return null;
    const isSelected = selectedId === nodeId;
    const valueText =
      Object.values(node.params).filter((v) => v !== "" && v != null).join(" · ") ||
      "not configured";

    return (
      <div key={nodeId} className="rb-branch">
        <button
          type="button"
          onClick={() => setSelectedId(nodeId)}
          className={`rb-node rb-${node.type} ${isSelected ? "is-selected" : ""}`}
          data-subtype={node.subType}
        >
          <div className="rb-node-head">
            <span className="rb-node-kind">{node.type}</span>
            {nodeId !== "root" ? (
              <span
                role="button"
                tabIndex={0}
                className="rb-node-del"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNode(nodeId);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    deleteNode(nodeId);
                  }
                }}
                aria-label="Delete node"
              >
                ×
              </span>
            ) : null}
          </div>
          <div className="rb-node-label">{LABEL[node.subType] ?? node.subType}</div>
          <div className="rb-node-value mono">{valueText}</div>

          {node.type === "condition" && isSelected ? (
            <div className="rb-add-row">
              <button
                type="button"
                className="lk-mini-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  addBranch(nodeId, "condition", "geo");
                }}
              >
                + condition
              </button>
              <button
                type="button"
                className="lk-mini-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  addBranch(nodeId, "action", "route");
                }}
              >
                + action
              </button>
            </div>
          ) : null}
        </button>

        {node.nextNodes.length > 0 ? (
          <div className="rb-children">
            <span className="rb-stem" aria-hidden />
            {node.nextNodes.length > 1 ? <span className="rb-bar" aria-hidden /> : null}
            {node.nextNodes.map((childId, i) => (
              <div key={childId} className="rb-child">
                <div className="rb-edge-label">
                  {i === 0 ? "match · true" : "fallback · false"}
                </div>
                {renderNode(childId)}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  const selected = selectedId ? nodes[selectedId] : null;

  return (
    <div className="rb-shell">
      <div className="rb-toolbar">
        <Mask>
          <div className="kicker">Routing matrix</div>
        </Mask>
        <div className="rb-toolbar-actions">
          <button type="button" className="lk-mini-btn" onClick={() => setNodes(initialNodes)}>
            reset tree
          </button>
          <button type="button" className="btn">
            Save routing tree <span className="arrow" style={{ marginLeft: 8 }}>→</span>
          </button>
        </div>
      </div>

      <div className="rb-stage-grid">
        <div className="rb-canvas">
          <div className="rb-canvas-inner">{renderNode("root")}</div>
        </div>

        <aside className="rb-config">
          {selected ? (
            <>
              <header className="rb-config-head">
                <div className="kicker">Node configuration</div>
                <h4 className="rb-config-title">{selected.type === "condition" ? "Condition" : "Action"}</h4>
              </header>

              <div className="rb-config-body">
                {selected.type === "condition" ? (
                  <>
                    <label className="auth-field">
                      <span>Condition type</span>
                      <select
                        value={selected.subType}
                        onChange={(e) =>
                          updateSubType(selected.id, e.target.value as ConditionType)
                        }
                      >
                        <option value="ip_risk">Aegis IP risk score</option>
                        <option value="geo">Geographic location (country)</option>
                        <option value="device">Device &amp; OS</option>
                        <option value="time">Time of day / day of week</option>
                        <option value="utm">UTM parameters</option>
                        <option value="referral">Referral source</option>
                      </select>
                    </label>

                    {selected.subType === "ip_risk" ? (
                      <label className="auth-field">
                        <span>Risk threshold (0–100)</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={(selected.params.threshold as number) ?? ""}
                          onChange={(e) =>
                            updateNodeParams(
                              selected.id,
                              "threshold",
                              e.target.value === "" ? "" : parseInt(e.target.value, 10),
                            )
                          }
                          placeholder="e.g. 80"
                        />
                        <small className="rb-hint">
                          Scores above this threshold follow the match (true) branch.
                        </small>
                      </label>
                    ) : null}

                    {selected.subType === "geo" ? (
                      <label className="auth-field">
                        <span>Country codes · comma separated</span>
                        <input
                          type="text"
                          value={(selected.params.country as string) ?? ""}
                          onChange={(e) =>
                            updateNodeParams(selected.id, "country", e.target.value.toUpperCase())
                          }
                          placeholder="US, CA, GB"
                        />
                      </label>
                    ) : null}

                    {selected.subType === "device" ? (
                      <label className="auth-field">
                        <span>Device type</span>
                        <select
                          value={(selected.params.device as string) ?? ""}
                          onChange={(e) => updateNodeParams(selected.id, "device", e.target.value)}
                        >
                          <option value="">Select…</option>
                          <option value="mobile">Mobile</option>
                          <option value="desktop">Desktop</option>
                          <option value="tablet">Tablet</option>
                          <option value="bot">Known bot / crawler</option>
                        </select>
                      </label>
                    ) : null}
                  </>
                ) : (
                  <>
                    <label className="auth-field">
                      <span>Action type</span>
                      <select
                        value={selected.subType}
                        onChange={(e) =>
                          updateSubType(selected.id, e.target.value as ActionType)
                        }
                      >
                        <option value="route">Route to destination</option>
                        <option value="block">Block traffic</option>
                        <option value="webhook">Fire webhook</option>
                      </select>
                    </label>

                    {selected.subType === "route" ? (
                      <label className="auth-field">
                        <span>Destination URL</span>
                        <input
                          type="url"
                          value={(selected.params.url as string) ?? ""}
                          onChange={(e) => updateNodeParams(selected.id, "url", e.target.value)}
                          placeholder="https://…"
                        />
                      </label>
                    ) : null}

                    {selected.subType === "block" ? (
                      <label className="auth-field">
                        <span>Block reason / message</span>
                        <input
                          type="text"
                          value={(selected.params.message as string) ?? ""}
                          onChange={(e) => updateNodeParams(selected.id, "message", e.target.value)}
                          placeholder="Access denied"
                        />
                      </label>
                    ) : null}

                    {selected.subType === "webhook" ? (
                      <label className="auth-field">
                        <span>Webhook URL</span>
                        <input
                          type="url"
                          value={(selected.params.webhook as string) ?? ""}
                          onChange={(e) => updateNodeParams(selected.id, "webhook", e.target.value)}
                          placeholder="https://hooks.example/…"
                        />
                      </label>
                    ) : null}
                  </>
                )}

                <div className="rb-json">
                  <div className="kicker" style={{ marginBottom: 6 }}>Node JSON payload</div>
                  <pre className="mono">{JSON.stringify(selected, null, 2)}</pre>
                </div>
              </div>
            </>
          ) : (
            <div className="rb-config-empty">
              <div className="kicker">Routing matrix</div>
              <p>Select any node in the tree to configure conditions, actions, or branch logic.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

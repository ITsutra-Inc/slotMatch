"use client";

import { useEffect, useState, useCallback } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Badge from "@/components/ui/badge";
import Card, { CardTitle } from "@/components/ui/card";
import Modal from "@/components/ui/modal";

// ─── Collapsible Section ─────────────────────────────────────────────────────

function Section({ title, icon, defaultOpen = false, children }: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/60 dark:border-white/[0.06] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-surface/50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <span className="text-primary">{icon}</span>
        <span className="text-sm font-semibold text-foreground flex-1">{title}</span>
        <svg
          className={`w-4 h-4 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  );
}

function CodeBlock({ children, language }: { children: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-[13px] leading-relaxed overflow-x-auto">
        {language && (
          <span className="absolute top-2 left-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            {language}
          </span>
        )}
        <code>{children}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded cursor-pointer"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

// ─── API Documentation Component ──────────────────────────────────────────────

function ApiDocumentation() {
  const [showDocs, setShowDocs] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://your-app.up.railway.app";

  if (!showDocs) {
    return (
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <CardTitle>API Documentation</CardTitle>
              <p className="text-sm text-muted mt-0.5">
                Learn how to authenticate, query endpoints, and integrate with your tools
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => setShowDocs(true)}>
            View Guide
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <CardTitle>API Documentation</CardTitle>
            <p className="text-sm text-muted mt-0.5">Complete guide to using the SlotMatch API</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowDocs(false)}>
          Collapse
        </Button>
      </div>

      {/* Quick reference table */}
      <div className="bg-surface dark:bg-white/[0.03] rounded-xl p-4 border border-border/60 dark:border-white/[0.06] mb-6">
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Quick Reference</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Base URL</span>
            <code className="text-xs font-mono text-foreground bg-card px-1.5 py-0.5 rounded">{origin}</code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Auth Header</span>
            <code className="text-xs font-mono text-foreground bg-card px-1.5 py-0.5 rounded">Authorization: Bearer sm_...</code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Endpoint</span>
            <code className="text-xs font-mono text-foreground bg-card px-1.5 py-0.5 rounded">GET /api/external/availability</code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Required Scope</span>
            <code className="text-xs font-mono text-foreground bg-card px-1.5 py-0.5 rounded">read:availability</code>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Section 1: Authentication */}
        <Section
          title="Authentication"
          defaultOpen={true}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-muted">
              All API requests require a valid API key passed in the <code className="text-xs bg-surface px-1.5 py-0.5 rounded font-mono">Authorization</code> header using the Bearer scheme.
            </p>
            <CodeBlock language="http">{`GET /api/external/availability HTTP/1.1
Host: ${origin.replace("https://", "")}
Authorization: Bearer sm_your_api_key_here`}</CodeBlock>
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-4 py-3">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <span className="font-semibold">Important:</span> Your API key is shown only once when created. Store it securely — you cannot retrieve it later.
              </p>
            </div>
          </div>
        </Section>

        {/* Section 2: Get All Availability */}
        <Section
          title="Get All Candidates' Availability"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-muted">Fetch the latest submitted availability for all your candidates.</p>
            <CodeBlock language="curl">{`curl -X GET "${origin}/api/external/availability" \\
  -H "Authorization: Bearer sm_your_api_key_here"`}</CodeBlock>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mt-4 mb-2">Response</p>
            <CodeBlock language="json">{`{
  "success": true,
  "data": [
    {
      "candidateId": "clx1abc2d0001...",
      "email": "jane@example.com",
      "name": "Jane Smith",
      "availability": {
        "windowStart": "2026-03-30T00:00:00.000Z",
        "windowEnd": "2026-04-12T23:59:59.999Z",
        "submittedAt": "2026-03-31T14:30:00.000Z",
        "slots": [
          {
            "date": "2026-03-30",
            "startTime": "09:00",
            "endTime": "12:00"
          },
          {
            "date": "2026-03-30",
            "startTime": "14:00",
            "endTime": "17:00"
          }
        ]
      }
    },
    {
      "candidateId": "clx1def5g0002...",
      "email": "john@example.com",
      "name": "John Doe",
      "availability": null
    }
  ]
}`}</CodeBlock>
            <p className="text-xs text-muted">
              If a candidate hasn&apos;t submitted yet, <code className="bg-surface px-1 py-0.5 rounded font-mono text-[11px]">availability</code> will be <code className="bg-surface px-1 py-0.5 rounded font-mono text-[11px]">null</code>.
            </p>
          </div>
        </Section>

        {/* Section 3: Filter by Email */}
        <Section
          title="Filter by Email or Candidate ID"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-muted">Use query parameters to fetch availability for a specific candidate.</p>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">By email</p>
            <CodeBlock language="curl">{`curl -X GET "${origin}/api/external/availability?email=jane@example.com" \\
  -H "Authorization: Bearer sm_your_api_key_here"`}</CodeBlock>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mt-4 mb-2">By candidate ID</p>
            <CodeBlock language="curl">{`curl -X GET "${origin}/api/external/availability?candidateId=clx1abc2d0001" \\
  -H "Authorization: Bearer sm_your_api_key_here"`}</CodeBlock>
          </div>
        </Section>

        {/* Section 4: Response Schema */}
        <Section
          title="Response Schema"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          }
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Candidate Object</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="text-left py-2 pr-4 text-xs font-semibold text-muted uppercase tracking-wider">Field</th>
                      <th className="text-left py-2 pr-4 text-xs font-semibold text-muted uppercase tracking-wider">Type</th>
                      <th className="text-left py-2 text-xs font-semibold text-muted uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono text-xs">candidateId</td><td className="py-2 pr-4 text-muted text-xs">string</td><td className="py-2 text-xs">Unique candidate identifier</td></tr>
                    <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono text-xs">email</td><td className="py-2 pr-4 text-muted text-xs">string</td><td className="py-2 text-xs">Candidate email address</td></tr>
                    <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono text-xs">name</td><td className="py-2 pr-4 text-muted text-xs">string | null</td><td className="py-2 text-xs">Candidate name</td></tr>
                    <tr><td className="py-2 pr-4 font-mono text-xs">availability</td><td className="py-2 pr-4 text-muted text-xs">object | null</td><td className="py-2 text-xs">Latest availability, or null if not submitted</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Time Slot Object</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="text-left py-2 pr-4 text-xs font-semibold text-muted uppercase tracking-wider">Field</th>
                      <th className="text-left py-2 pr-4 text-xs font-semibold text-muted uppercase tracking-wider">Type</th>
                      <th className="text-left py-2 text-xs font-semibold text-muted uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono text-xs">date</td><td className="py-2 pr-4 text-muted text-xs">YYYY-MM-DD</td><td className="py-2 text-xs">Date of the time slot</td></tr>
                    <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono text-xs">startTime</td><td className="py-2 pr-4 text-muted text-xs">HH:MM</td><td className="py-2 text-xs">Start time (24-hour format)</td></tr>
                    <tr><td className="py-2 pr-4 font-mono text-xs">endTime</td><td className="py-2 pr-4 text-muted text-xs">HH:MM</td><td className="py-2 text-xs">End time (24-hour format)</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Section>

        {/* Section 5: Error Handling */}
        <Section
          title="Error Handling"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-muted">All error responses follow this format:</p>
            <CodeBlock language="json">{`{
  "success": false,
  "error": "Description of what went wrong"
}`}</CodeBlock>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-muted uppercase tracking-wider">Error</th>
                    <th className="text-left py-2 text-xs font-semibold text-muted uppercase tracking-wider">Meaning</th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono text-xs">401</td><td className="py-2 pr-4 text-xs">Missing API key</td><td className="py-2 text-xs">No Authorization header provided</td></tr>
                  <tr className="border-b border-border/30"><td className="py-2 pr-4 font-mono text-xs">401</td><td className="py-2 pr-4 text-xs">Invalid or revoked API key</td><td className="py-2 text-xs">Key is wrong, expired, or revoked</td></tr>
                  <tr><td className="py-2 pr-4 font-mono text-xs">403</td><td className="py-2 pr-4 text-xs">Insufficient permissions</td><td className="py-2 text-xs">Key missing read:availability scope</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* Section 6: Code Examples */}
        <Section
          title="Integration Examples"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          }
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">JavaScript / Node.js</p>
              <CodeBlock language="javascript">{`const API_URL = "${origin}";
const API_KEY = "sm_your_api_key_here";

async function getAvailability(email) {
  const url = email
    ? \`\${API_URL}/api/external/availability?email=\${encodeURIComponent(email)}\`
    : \`\${API_URL}/api/external/availability\`;

  const response = await fetch(url, {
    headers: { Authorization: \`Bearer \${API_KEY}\` },
  });

  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

// Usage
const candidates = await getAvailability();
for (const c of candidates) {
  if (c.availability) {
    console.log(\`\${c.name}: \${c.availability.slots.length} slots\`);
  }
}`}</CodeBlock>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Python</p>
              <CodeBlock language="python">{`import requests

API_URL = "${origin}"
API_KEY = "sm_your_api_key_here"

def get_availability(email=None):
    url = f"{API_URL}/api/external/availability"
    params = {"email": email} if email else {}

    response = requests.get(
        url,
        headers={"Authorization": f"Bearer {API_KEY}"},
        params=params,
    )
    data = response.json()
    if not data["success"]:
        raise Exception(data["error"])
    return data["data"]

# Usage
candidates = get_availability()
for c in candidates:
    if c["availability"]:
        slots = c["availability"]["slots"]
        print(f"{c['name']}: {len(slots)} slots")
        for s in slots:
            print(f"  {s['date']} {s['startTime']}-{s['endTime']}")`}</CodeBlock>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">cURL</p>
              <CodeBlock language="bash">{`# Get all candidates
curl -s "${origin}/api/external/availability" \\
  -H "Authorization: Bearer sm_your_api_key_here" | jq .

# Filter by email
curl -s "${origin}/api/external/availability?email=jane@example.com" \\
  -H "Authorization: Bearer sm_your_api_key_here" | jq .`}</CodeBlock>
            </div>
          </div>
        </Section>

        {/* Section 7: Security */}
        <Section
          title="Security Best Practices"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        >
          <ul className="space-y-3 text-sm text-muted">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span><span className="text-foreground font-medium">Never expose keys in client-side code.</span> Always call the API from a backend server.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span><span className="text-foreground font-medium">Store keys in environment variables</span>, not in source code or version control.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span><span className="text-foreground font-medium">Create separate keys</span> for different integrations so you can revoke them independently.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span><span className="text-foreground font-medium">Revoke keys immediately</span> if they are compromised or no longer needed.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span><span className="text-foreground font-medium">Monitor usage</span> by checking the &quot;Last Used&quot; timestamp to identify unused or suspicious keys.</span>
            </li>
          </ul>
        </Section>
      </div>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface ApiKeyData {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  revoked: boolean;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRaw, setNewKeyRaw] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function loadKeys() {
    try {
      const res = await fetch("/api/api-keys");
      const json = await res.json();
      if (json.success) setKeys(json.data);
    } catch (error) {
      console.error("Failed to load API keys:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKeys();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });

      const json = await res.json();
      if (json.success) {
        setNewKeyRaw(json.data.key);
        setShowCreateModal(false);
        setShowKeyModal(true);
        setNewKeyName("");
        loadKeys();
      }
    } catch (error) {
      console.error("Failed to create API key:", error);
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleRevoke(id: string) {
    const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) loadKeys();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/api-keys/${id}?permanent=true`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) loadKeys();
  }

  function copyKey() {
    navigator.clipboard.writeText(newKeyRaw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
          <p className="text-muted text-sm mt-1">
            Manage API keys for external applications
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create API Key
        </Button>
      </div>

      {/* API Documentation */}
      <ApiDocumentation />

      {/* Keys list */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-border">
          <CardTitle>Your API Keys</CardTitle>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted">No API keys created yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {keys.map((key) => (
              <div
                key={key.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {key.name}
                    </p>
                    {key.revoked && <Badge variant="danger">Revoked</Badge>}
                  </div>
                  <p className="text-xs text-muted mt-1 font-mono">
                    {key.keyPrefix}...
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-xs text-muted">
                      Created {new Date(key.createdAt).toLocaleDateString()}
                    </p>
                    {key.lastUsedAt && (
                      <p className="text-xs text-muted">
                        Last used {new Date(key.lastUsedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!key.revoked && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRevoke(key.id)}
                    >
                      Revoke
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(key.id, key.name)}
                    className="text-danger hover:text-danger"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create API Key"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            id="key-name"
            label="Key name"
            placeholder="e.g., AI Calling Agent"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            required
          />
          <p className="text-xs text-muted">
            Give this key a descriptive name so you can identify it later.
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createLoading}>
              Create Key
            </Button>
          </div>
        </form>
      </Modal>

      {/* Show Key Modal */}
      <Modal
        open={showKeyModal}
        onClose={() => {
          setShowKeyModal(false);
          setNewKeyRaw("");
        }}
        title="API Key Created"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-sm px-4 py-3 rounded-lg border border-amber-200 dark:border-amber-800">
            Copy this key now. You won&apos;t be able to see it again.
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-surface px-3 py-2 rounded-lg text-sm font-mono break-all">
              {newKeyRaw}
            </code>
            <Button variant="secondary" size="sm" onClick={copyKey}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setShowKeyModal(false);
                setNewKeyRaw("");
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Badge from "@/components/ui/badge";
import Card, { CardTitle } from "@/components/ui/card";
import Modal from "@/components/ui/modal";

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

      {/* Usage example */}
      <Card>
        <CardTitle className="mb-3">Quick Start</CardTitle>
        <p className="text-sm text-muted mb-3">
          Use your API key to query candidate availability:
        </p>
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
          <code>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     "${typeof window !== 'undefined' ? window.location.origin : ''}/api/external/availability"

# Filter by candidate email:
curl -H "Authorization: Bearer YOUR_API_KEY" \\
     "${typeof window !== 'undefined' ? window.location.origin : ''}/api/external/availability?email=jane@example.com"`}</code>
        </pre>
      </Card>

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

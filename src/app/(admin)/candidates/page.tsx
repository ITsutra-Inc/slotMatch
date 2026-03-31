"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import Modal from "@/components/ui/modal";

interface Candidate {
  id: string;
  name: string | null;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  availabilityWindows: Array<{
    status: string;
    weekStart: string;
    weekEnd: string;
    submittedAt: string | null;
  }>;
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add form state
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });

      const res = await fetch(`/api/candidates?${params}`);
      const json = await res.json();

      if (json.success) {
        setCandidates(json.data);
        setTotal(json.total);
      }
    } catch (error) {
      console.error("Failed to load candidates:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  async function handleAddCandidate(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);

    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          phone: newPhone,
          name: newName || undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setAddError(data.error);
        return;
      }

      setShowAddModal(false);
      setNewEmail("");
      setNewPhone("");
      setNewName("");
      loadCandidates();
    } catch {
      setAddError("Something went wrong");
    } finally {
      setAddLoading(false);
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Candidates</h1>
          <p className="text-muted text-sm mt-1">{total} total candidates</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
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
          Add Candidate
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Table */}
      <Card padding={false}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="w-12 h-12 text-muted/40 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-muted text-sm">No candidates found</p>
            <Button
              variant="ghost"
              className="mt-2"
              onClick={() => setShowAddModal(true)}
            >
              Add your first candidate
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-6 py-3">
                      Candidate
                    </th>
                    <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-6 py-3">
                      Phone
                    </th>
                    <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-6 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-6 py-3">
                      Availability
                    </th>
                    <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-6 py-3">
                      Added
                    </th>
                    <th className="text-right text-xs font-medium text-muted uppercase tracking-wider px-6 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {candidates.map((candidate) => {
                    const window = candidate.availabilityWindows?.[0];
                    return (
                      <tr
                        key={candidate.id}
                        className="hover:bg-surface transition-colors"
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={`/candidates/${candidate.id}`}
                            className="flex items-center gap-3"
                          >
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-primary text-xs font-semibold">
                                {(candidate.name || candidate.email)
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {candidate.name || "—"}
                              </p>
                              <p className="text-xs text-muted">
                                {candidate.email}
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted">
                          {candidate.phone || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              candidate.status === "ACTIVE"
                                ? "success"
                                : candidate.status === "PAUSED"
                                  ? "warning"
                                  : "default"
                            }
                          >
                            {candidate.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              window?.status === "SUBMITTED"
                                ? "success"
                                : window?.status === "OPEN"
                                  ? "warning"
                                  : "default"
                            }
                          >
                            {window?.status || "No window"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted">
                          {new Date(candidate.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!confirm(`Delete ${candidate.name || candidate.email}? This cannot be undone.`)) return;
                              const res = await fetch(`/api/candidates/${candidate.id}`, { method: "DELETE" });
                              const json = await res.json();
                              if (json.success) loadCandidates();
                            }}
                            className="text-muted hover:text-danger transition-colors cursor-pointer p-1 rounded hover:bg-red-50 dark:hover:bg-red-950"
                            title="Delete candidate"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <p className="text-sm text-muted">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Add Candidate Modal */}
      <Modal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setAddError("");
        }}
        title="Add Candidate"
      >
        <form onSubmit={handleAddCandidate} className="space-y-4">
          {addError && (
            <div className="bg-red-50 dark:bg-red-950 text-danger text-sm px-4 py-3 rounded-lg border border-red-100 dark:border-red-900">
              {addError}
            </div>
          )}
          <Input
            id="candidate-name"
            label="Name (optional)"
            placeholder="Jane Smith"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            id="candidate-email"
            label="Email"
            type="email"
            placeholder="jane@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
          <Input
            id="candidate-phone"
            label="Phone number (optional)"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />
          <p className="text-xs text-muted">
            An invitation will be sent via email and SMS immediately after
            adding.
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={addLoading}>
              Add & Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

"use client";

import * as React from "react";
import { Bug, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import apiClient, { buildApiUrl } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

export function BugReportButton() {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  function resetForm() {
    setTitle("");
    setDescription("");
    setError(null);
    setSuccess(false);
  }

  function handleClose() {
    setOpen(false);
    resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiClient.post(buildApiUrl("feedback/bug-report"), { title, description });
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error || err?.message || "Failed to submit bug report";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="w-9 h-9 text-foreground hover:text-primary hover:bg-primary/10"
        title="Report a bug"
      >
        <Bug className="h-5 w-5" />
        <span className="sr-only">Report a bug</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
          />
          {/* Dialog */}
          <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Report a Bug</h2>
              <Button variant="ghost" size="icon" onClick={handleClose} className="w-8 h-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {!user ? (
              <div className="py-4 text-center space-y-3">
                <p className="text-sm text-muted-foreground">You need to be signed in to submit a bug report.</p>
                <Button variant="ghost" onClick={handleClose} className="w-full">Close</Button>
              </div>
            ) : success ? (
              <p className="text-sm text-green-500 font-medium py-4 text-center">
                Bug report filed! Thanks for the feedback.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="bug-title" className="text-sm font-medium">
                    Title
                  </label>
                  <input
                    id="bug-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief summary of the issue"
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="bug-description" className="text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    id="bug-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Steps to reproduce, what you expected, what happened..."
                    required
                    rows={5}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Submitting…" : "Submit"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

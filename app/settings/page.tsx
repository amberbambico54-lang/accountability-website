"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Pencil, ShieldCheck, SlidersHorizontal, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddItemDialog } from "@/components/ui/add-item-dialog";
import { useAuth } from "@/components/auth-provider";
import { defaultSettings } from "@/lib/content";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import { useWorkspacePages, type WorkspacePage } from "@/components/workspace-pages-provider";

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { pages, addPage, updatePage, deletePage } = useWorkspacePages();
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [addPageOpen, setAddPageOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!hasSupabaseConfig || !supabase || !user) {
      setPasswordError("Password changes require an authenticated Supabase account.");
      return;
    }

    if (newPassword.length < 12) {
      setPasswordError("Choose a password with at least 12 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("The new password and confirmation do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const { data: { user: verifiedUser }, error: verificationError } = await supabase.auth.getUser();
      if (verificationError) throw verificationError;
      if (!verifiedUser?.email || verifiedUser.email.toLowerCase() !== user.email.toLowerCase()) {
        throw new Error("Your signed-in Supabase account could not be verified.");
      }

      const { error: reauthenticationError } = await supabase.auth.signInWithPassword({
        email: verifiedUser.email,
        password: currentPassword,
      });
      if (reauthenticationError) throw reauthenticationError;

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Your password has been changed.");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Unable to change your password. Please try again.");
    } finally {
      setCurrentPassword("");
      setChangingPassword(false);
    }
  };

  const handleAddPage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    try {
      const page = addPage(newTitle, newDescription);
      setNewTitle("");
      setNewDescription("");
      setAddPageOpen(false);
      router.push(`/pages/${page.slug}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to add this page.");
    }
  };

  const handleStartEdit = (page: WorkspacePage) => {
    setEditingId(page.id);
    setEditTitle(page.title);
    setEditDescription(page.description);
  };

  const handleSaveEdit = (page: WorkspacePage) => {
    setErrorMessage("");
    try {
      updatePage(page.id, editTitle, editDescription);
      setEditingId(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update this page.");
    }
  };

  const handleDeletePage = (page: WorkspacePage) => {
    const confirmed = window.confirm(`Remove "${page.title}" from your pages? Its saved module data will remain in this browser.`);
    if (!confirmed) return;
    deletePage(page.id);
    if (editingId === page.id) setEditingId(null);
    if (page.kind === "custom" && window.location.pathname === `/pages/${page.slug}`) {
      router.replace("/settings");
    }
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <section className="flex flex-col gap-5 rounded-[28px] border border-[#E7E0D2] bg-[linear-gradient(135deg,#FAF7F2_0%,#E7E0D2_100%)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <Badge>Account</Badge>
          <h1 className="mt-3 text-3xl font-semibold text-[#313B32]">Settings</h1>
          <p className="mt-2 max-w-2xl text-[#4E5A52]">
            Manage your optional pages. Core pages stay fixed, while these pages can be added, renamed, described, or removed.
          </p>
        </div>
        <AddItemDialog
          open={addPageOpen}
          onOpenChange={setAddPageOpen}
          title="Add a page"
          description="Give your new page a name and a short description."
          triggerLabel="Add a page"
        >
          <form onSubmit={handleAddPage} className="space-y-3">
            {errorMessage && <p role="alert" className="rounded-2xl border border-[#D9A6A6] bg-[#FBEEEE] p-3 text-sm text-[#8B3F3F]">{errorMessage}</p>}
            <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} required placeholder="Page title" aria-label="Page title" className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
            <textarea value={newDescription} onChange={(event) => setNewDescription(event.target.value)} rows={3} placeholder="What is this page for?" aria-label="Page description" className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setAddPageOpen(false)}>Cancel</Button>
              <Button type="submit">Add page</Button>
            </div>
          </form>
        </AddItemDialog>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Change password</CardTitle>
          </CardHeader>
          <CardContent>
            {hasSupabaseConfig ? (
              <form onSubmit={handleChangePassword} className="space-y-3">
                <p className="text-sm text-[#4E5A52]">Confirm your current password before choosing a new one. Use a unique password with at least 12 characters.</p>
                {passwordError && <p role="alert" className="rounded-2xl border border-[#D9A6A6] bg-[#FBEEEE] p-3 text-sm text-[#8B3F3F]">{passwordError}</p>}
                {passwordSuccess && <p role="status" className="rounded-2xl border border-[#9AB7A1] bg-[#E4EFE7] p-3 text-sm text-[#315940]">{passwordSuccess}</p>}
                <label className="block space-y-1 text-sm font-medium text-[#313B32]">
                  Current password
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                    className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 font-normal outline-none focus:border-[#71866E]"
                  />
                </label>
                <label className="block space-y-1 text-sm font-medium text-[#313B32]">
                  New password
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={12}
                    required
                    className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 font-normal outline-none focus:border-[#71866E]"
                  />
                </label>
                <label className="block space-y-1 text-sm font-medium text-[#313B32]">
                  Confirm new password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={12}
                    required
                    className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 font-normal outline-none focus:border-[#71866E]"
                  />
                </label>
                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? "Changing password…" : "Change password"}
                </Button>
              </form>
            ) : (
              <p className="text-sm text-[#4E5A52]">Password changes are unavailable in temporary demo mode. Sign in with a Supabase account to change your password.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Privacy controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {defaultSettings.map((item) => (
              <div key={item} className="rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] p-3 text-sm text-[#4E5A52]">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Workspace preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] p-3 text-sm text-[#4E5A52]">Choose shared or private visibility for each reflection; private entries are only hidden in this interface.</div>
            <div className="rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] p-3 text-sm text-[#4E5A52]">Notifications and milestone reminders are not enabled in this prototype.</div>
            <div className="rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] p-3 text-sm text-[#4E5A52]">Demo profiles use the same local browser storage and are not suitable for sensitive data.</div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-[#313B32]">Manage pages</h2>
          <p className="mt-1 text-sm text-[#4E5A52]">Dashboard, Devotion, UpSkill Progress, Business Dump Ideas/Progress, Faith Goals, and Settings are permanent.</p>
        </div>

        {errorMessage && <p role="alert" className="rounded-2xl border border-[#D9A6A6] bg-[#FBEEEE] p-3 text-sm text-[#8B3F3F]">{errorMessage}</p>}

        <div className="grid gap-4 xl:grid-cols-2">
          {pages.map((page) => (
            <Card key={page.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {editingId === page.id ? (
                    <div className="space-y-3">
                      <input
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        required
                        aria-label="Page title"
                        className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(event) => setEditDescription(event.target.value)}
                        rows={3}
                        aria-label="Page description"
                        className="w-full rounded-2xl border border-[#E7E0D2] bg-[#FAF7F2] px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]"
                      />
                      <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={() => handleSaveEdit(page)}>Save</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <CardTitle>{page.title}</CardTitle>
                      <p className="mt-2 text-sm leading-6 text-[#4E5A52]">{page.description || "No description yet."}</p>
                      <Badge className="mt-3">{page.kind === "custom" ? "Custom page" : "Optional page"}</Badge>
                    </>
                  )}
                </div>
                {editingId !== page.id && (
                  <div className="flex shrink-0">
                    <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${page.title}`} onClick={() => handleStartEdit(page)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" aria-label={`Delete ${page.title}`} onClick={() => handleDeletePage(page)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

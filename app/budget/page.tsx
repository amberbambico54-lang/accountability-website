"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddItemDialog } from "@/components/ui/add-item-dialog";
import { budgetTransactions } from "@/lib/content";
import { formatMoney } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { getAuthorBadgeClass, getAuthorCardClass } from "@/lib/identity";
import { useWorkspacePages } from "@/components/workspace-pages-provider";
import { useLocalStorageJson } from "@/lib/use-local-storage-json";

const storageKey = "our-space-budget";
const savingsTarget = 180000;

type BudgetEntry = {
  id: string;
  date: string;
  description: string;
  type: string;
  amount: number;
  owner: string;
  createdBy: string;
};

const initialTransactions: BudgetEntry[] = budgetTransactions.map((entry) => ({
  ...entry,
  id: `budget-${entry.date}-${entry.description}`,
  createdBy: entry.owner === "Alpha" ? "Alpha" : "Fernan",
}));

function parseTransactions(value: unknown): BudgetEntry[] {
  if (!Array.isArray(value)) throw new Error("Saved budget data must be a list.");
  return value.flatMap((item, index) => {
    if (typeof item !== "object" || item === null) return [];
    const entry = item as Partial<BudgetEntry>;
    const amount = Number(entry.amount);
    if (typeof entry.description !== "string" || !Number.isFinite(amount) || amount < 0) return [];
    return [{
      id: typeof entry.id === "string" ? entry.id : `budget-entry-${index}`,
      date: typeof entry.date === "string" ? entry.date : "",
      description: entry.description,
      type: typeof entry.type === "string" ? entry.type : "Deposit",
      amount,
      owner: typeof entry.owner === "string" ? entry.owner : "Fernan",
      createdBy: entry.createdBy === "Alpha" || (!entry.createdBy && entry.owner === "Alpha") ? "Alpha" : "Fernan",
    }];
  });
}

function getSavingsHistory(entries: BudgetEntry[]) {
  const changes = new Map<string, number>();
  for (const entry of entries) {
    const month = entry.date.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) continue;
    const change = entry.type === "Deposit" ? entry.amount : -entry.amount;
    changes.set(month, (changes.get(month) ?? 0) + change);
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let balance = 0;
  return [...changes.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([month, change]) => {
    balance += change;
    const monthIndex = Number(month.slice(5, 7)) - 1;
    return { month: `${monthNames[monthIndex] ?? month} ${month.slice(2, 4)}`, saved: balance };
  });
}

export default function BudgetPage() {
  const { user } = useAuth();
  const { pages } = useWorkspacePages();
  const pageDetails = pages.find((page) => page.kind === "budget");
  const [transactions, setTransactions] = useLocalStorageJson(storageKey, initialTransactions, parseTransactions);
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Deposit");
  const [amount, setAmount] = useState("5000");
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ description: "", type: "Deposit", amount: "" });

  const deposits = transactions
    .filter((entry: BudgetEntry) => entry.type === "Deposit")
    .reduce((sum: number, entry: BudgetEntry) => sum + Number(entry.amount ?? 0), 0);
  const withdrawals = transactions
    .filter((entry: BudgetEntry) => entry.type !== "Deposit")
    .reduce((sum: number, entry: BudgetEntry) => sum + Number(entry.amount ?? 0), 0);
  const currentBalance = deposits - withdrawals;
  const remaining = savingsTarget - currentBalance;
  const fernanContributions = transactions
    .filter((entry) => entry.type === "Deposit" && entry.owner === "Fernan")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const alphaContributions = transactions
    .filter((entry) => entry.type === "Deposit" && entry.owner === "Alpha")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const personalContributions = fernanContributions + alphaContributions;
  const contributionSplit = personalContributions
    ? `${Math.round((fernanContributions / personalContributions) * 100)}/${Math.round((alphaContributions / personalContributions) * 100)}`
    : "0/0";

  const handleAddTransaction = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!description.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (!user) return;

    const nextEntry = {
      id: `budget-entry-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      description: description.trim(),
      type,
      amount: parsedAmount,
      owner: user.name,
      createdBy: user.name,
    };

    setTransactions((current: BudgetEntry[]) => [nextEntry, ...current]);
    setDescription("");
    setAmount("5000");
    setType("Deposit");
    setAddTransactionOpen(false);
  };

  const history = getSavingsHistory(transactions);
  const handleSaveEdit = (entryId: string) => {
    const parsedAmount = Number(editDraft.amount);
    if (!editDraft.description.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    setTransactions((current) => current.map((entry) => entry.id === entryId
      ? { ...entry, description: editDraft.description.trim(), type: editDraft.type, amount: parsedAmount }
      : entry));
    setEditingId(null);
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <section className="flex flex-col gap-5 rounded-[28px] border border-[#E7E0D2] bg-[linear-gradient(135deg,#FAF7F2_0%,#E7E0D2_100%)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <Badge>Budget</Badge>
          <h1 className="mt-3 text-3xl font-semibold text-[#313B32]">{pageDetails?.title ?? "Wedding Budget Piggy Bank"}</h1>
          <p className="mt-2 max-w-2xl text-[#4E5A52]">
            {pageDetails?.description ?? "A durable savings tracker for the wedding, built with clarity, exact totals, and a shared ledger for both of us."}
          </p>
        </div>
        <AddItemDialog
          open={addTransactionOpen}
          onOpenChange={setAddTransactionOpen}
          title="Add transaction"
          description="Record a deposit, withdrawal, or wedding expense."
          triggerLabel="Add transaction"
        >
          <form className="space-y-3" onSubmit={handleAddTransaction}>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" aria-label="Transaction description" required className="rounded-2xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
              <input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount" aria-label="Transaction amount" required className="rounded-2xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={type} onChange={(event) => setType(event.target.value)} aria-label="Transaction type" className="rounded-2xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#313B32] outline-none focus:border-[#71866E]">
                <option value="Deposit">Deposit</option>
                <option value="Withdrawal">Withdrawal</option>
                <option value="Expense">Expense</option>
              </select>
              <p className="flex items-center rounded-2xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm text-[#4E5A52]">Added by {user?.name ?? "your account"}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setAddTransactionOpen(false)}>Cancel</Button>
              <Button type="submit">Add transaction</Button>
            </div>
          </form>
        </AddItemDialog>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#313B32]">{formatMoney(currentBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Target</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#313B32]">{formatMoney(savingsTarget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#313B32]">{formatMoney(remaining)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contribution split</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-[#313B32]">{contributionSplit}</p>
            <p className="mt-2 text-sm text-[#4E5A52]">Fernan / Alpha</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Savings history</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history}>
                  <CartesianGrid vertical={false} stroke="#E7E0D2" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => formatMoney(Number(value ?? 0))} />
                  <Bar dataKey="saved" fill="#71866E" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {transactions.length === 0 && <p className="text-sm text-[#4E5A52]">No transactions yet. Add one to start tracking savings.</p>}
            {transactions.map((entry) => (
              <div key={entry.id} className={`rounded-2xl border border-[#E7E0D2] p-3 ${getAuthorCardClass(entry.createdBy)}`}>
                {editingId === entry.id ? (
                  <div className="space-y-2">
                    <input value={editDraft.description} onChange={(event) => setEditDraft({ ...editDraft, description: event.target.value })} aria-label="Edit transaction description" className="w-full rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm" />
                    <div className="flex gap-2">
                      <select value={editDraft.type} onChange={(event) => setEditDraft({ ...editDraft, type: event.target.value })} aria-label="Edit transaction type" className="min-w-0 flex-1 rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm">
                        <option value="Deposit">Deposit</option><option value="Withdrawal">Withdrawal</option><option value="Expense">Expense</option>
                      </select>
                      <input type="number" min="0.01" step="0.01" value={editDraft.amount} onChange={(event) => setEditDraft({ ...editDraft, amount: event.target.value })} aria-label="Edit transaction amount" className="min-w-0 flex-1 rounded-xl border border-[#E7E0D2] bg-white px-3 py-2 text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={() => handleSaveEdit(entry.id)}>Save</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-[#313B32]">{entry.description}</p>
                      <span className="text-sm font-medium text-[#313B32]">{entry.type}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-[#4E5A52]">
                      <Badge className={getAuthorBadgeClass(entry.createdBy)}>{entry.createdBy}</Badge>
                      <span>{formatMoney(entry.amount)}</span>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button type="button" size="icon" variant="ghost" aria-label={`Edit ${entry.description}`} onClick={() => {
                        setEditingId(entry.id);
                        setEditDraft({ description: entry.description, type: entry.type, amount: String(entry.amount) });
                      }}><Pencil className="h-4 w-4" /></Button>
                      <Button type="button" size="icon" variant="ghost" aria-label={`Delete ${entry.description}`} onClick={() => setTransactions((current) => current.filter((item) => item.id !== entry.id))}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

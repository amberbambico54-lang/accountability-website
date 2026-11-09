"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddItemDialog } from "@/components/ui/add-item-dialog";
import { budgetHistory, budgetTransactions } from "@/lib/content";
import { formatMoney } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { getAuthorBadgeClass, getAuthorCardClass } from "@/lib/identity";
import { useWorkspacePages } from "@/components/workspace-pages-provider";

const storageKey = "our-space-budget";
const savingsTarget = 180000;

type BudgetEntry = {
  date: string;
  description: string;
  type: string;
  amount: number;
  owner: string;
  createdBy: string;
};

const initialTransactions: BudgetEntry[] = budgetTransactions.map((entry) => ({
  ...entry,
  createdBy: entry.owner === "Alpha" ? "Alpha" : "Fernan",
}));

export default function BudgetPage() {
  const { user } = useAuth();
  const { pages } = useWorkspacePages();
  const pageDetails = pages.find((page) => page.kind === "budget");
  const [transactions, setTransactions] = useState<BudgetEntry[]>(() => {
    if (typeof window === "undefined") return initialTransactions;
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return initialTransactions;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.map((entry: Partial<BudgetEntry>) => ({
        date: entry.date ?? "",
        description: entry.description ?? "Wedding transaction",
        type: entry.type ?? "Deposit",
        amount: Number(entry.amount) || 0,
        owner: entry.owner ?? "Fernan",
        createdBy: entry.createdBy === "Alpha" || (!entry.createdBy && entry.owner === "Alpha") ? "Alpha" : "Fernan",
      })) : initialTransactions;
    } catch {
      return initialTransactions;
    }
  });
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Deposit");
  const [amount, setAmount] = useState("5000");
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(transactions));
  }, [transactions]);

  const deposits = transactions
    .filter((entry: BudgetEntry) => entry.type === "Deposit")
    .reduce((sum: number, entry: BudgetEntry) => sum + Number(entry.amount ?? 0), 0);
  const withdrawals = transactions
    .filter((entry: BudgetEntry) => entry.type !== "Deposit")
    .reduce((sum: number, entry: BudgetEntry) => sum + Number(entry.amount ?? 0), 0);
  const currentBalance = deposits - withdrawals;
  const remaining = savingsTarget - currentBalance;

  const handleAddTransaction = () => {
    const parsedAmount = Number(amount);
    if (!description.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (!user) return;

    const nextEntry = {
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
          <div className="space-y-3">
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
              <Button type="button" onClick={handleAddTransaction}>Add transaction</Button>
            </div>
          </div>
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
            <p className="text-2xl font-semibold text-[#313B32]">60/40</p>
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
                <BarChart data={budgetHistory}>
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
            {transactions.map((entry: BudgetEntry) => (
              <div key={`${entry.date}-${entry.description}-${entry.amount}`} className={`rounded-2xl border border-[#E7E0D2] p-3 ${getAuthorCardClass(entry.createdBy)}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-[#313B32]">{entry.description}</p>
                  <span className="text-sm font-medium text-[#313B32]">{entry.type}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-[#4E5A52]">
                  <Badge className={getAuthorBadgeClass(entry.createdBy)}>{entry.createdBy}</Badge>
                  <span>{formatMoney(entry.amount)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Wallet,
  PlusCircle,
  ChartPie,
  Landmark,
  PiggyBank,
  HandCoins,
  ArrowDownCircle,
  ArrowUpCircle,
  Trash2,
  Target,
  Cloud,
  RefreshCw,
  Database,
  Shield,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const expenseCategories = [
  "Rent",
  "Bills",
  "Food",
  "Grocery",
  "Transport",
  "Subscriptions",
  "Room",
  "Health",
  "Gift",
  "Money Given",
  "Lifestyle",
  "Shopping",
  "Misc",
];

const budgetCategories = [
  "Rent",
  "Bills",
  "Food",
  "Grocery",
  "Transport",
  "Subscriptions",
  "Room",
  "Money Given",
  "Lifestyle",
  "Shopping",
  "Misc",
];

const initialTransactions = [
  { id: "seed-1", type: "income", title: "Salary", amount: 6500, category: "Income", date: "2026-02-01", note: "Monthly income" },
  { id: "seed-2", type: "expense", title: "Rent (your share)", amount: 500, category: "Rent", date: "2026-02-02", note: "Essential" },
  { id: "seed-3", type: "expense", title: "Vodafone", amount: 140, category: "Bills", date: "2026-02-03", note: "Phone bill" },
  { id: "seed-4", type: "expense", title: "Grocery", amount: 104, category: "Grocery", date: "2026-02-04", note: "10 + 89 + 5" },
  { id: "seed-5", type: "expense", title: "Daily Food", amount: 172.37, category: "Food", date: "2026-02-10", note: "From your previous sheet" },
  { id: "seed-6", type: "expense", title: "Transport", amount: 50, category: "Transport", date: "2026-02-11", note: "10 + 10 + 10 + 10 + 10" },
  { id: "seed-7", type: "expense", title: "Subscriptions", amount: 215, category: "Subscriptions", date: "2026-02-12", note: "45 + 50 + 50 + 50 + 20" },
  { id: "seed-8", type: "expense", title: "Shisha", amount: 29, category: "Lifestyle", date: "2026-02-14", note: "9 + 10 + 5 + 5" },
  { id: "seed-9", type: "expense", title: "Washing", amount: 3.5, category: "Misc", date: "2026-02-15", note: "Laundry" },
  { id: "seed-10", type: "expense", title: "Uber", amount: 69, category: "Transport", date: "2026-02-18", note: "17 + 5 + 5 + 7 + 14 + 21" },
  { id: "seed-11", type: "expense", title: "Perfume", amount: 35, category: "Shopping", date: "2026-02-19", note: "Personal shopping" },
  { id: "seed-12", type: "expense", title: "Hair", amount: 15, category: "Misc", date: "2026-02-20", note: "Personal care" },
  { id: "seed-13", type: "expense", title: "Valentines day", amount: 190, category: "Gift", date: "2026-02-21", note: "Special occasion" },
  { id: "seed-14", type: "expense", title: "Phone item", amount: 15, category: "Shopping", date: "2026-02-22", note: "Accessory" },
  { id: "seed-15", type: "expense", title: "Money sent to people", amount: 6100, category: "Money Given", date: "2026-02-24", note: "Track separately" },
];

const initialBudgets = {
  Rent: 500,
  Bills: 200,
  Food: 300,
  Grocery: 150,
  Transport: 150,
  Subscriptions: 220,
  Room: 100,
  "Money Given": 1000,
  Lifestyle: 150,
  Shopping: 100,
  Misc: 100,
};

const colors = ["#0f172a", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#1e293b", "#64748b", "#0b1324", "#8892a0", "#dbe4ee"];

function formatQAR(value: number) {
  const sign = value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(2)} QAR`;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(date: string) {
  return date.slice(0, 7);
}

type Tx = {
  id: string;
  type: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  note: string;
};

type BudgetMap = Record<string, number>;

export default function PersonalFinanceApp() {
  const [transactions, setTransactions] = useState<Tx[]>(() => {
    if (typeof window === "undefined") return initialTransactions;
    const saved = window.localStorage.getItem("transactions");
    return saved ? JSON.parse(saved) : initialTransactions;
  });
  const [budgets, setBudgets] = useState<BudgetMap>(() => {
    if (typeof window === "undefined") return initialBudgets;
    const saved = window.localStorage.getItem("budgets");
    return saved ? JSON.parse(saved) : initialBudgets;
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (typeof window === "undefined") return todayDate().slice(0, 7);
    return window.localStorage.getItem("selectedMonth") || todayDate().slice(0, 7);
  });

  const [entryType, setEntryType] = useState("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [entryMonth, setEntryMonth] = useState(todayDate().slice(0, 7));
  const [entryDay, setEntryDay] = useState(String(new Date().getDate()).padStart(2, "0"));
  const [note, setNote] = useState("");

  const [supabaseUrl, setSupabaseUrl] = useState(() => (typeof window !== "undefined" ? window.localStorage.getItem("supabaseUrl") || "" : ""));
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => (typeof window !== "undefined" ? window.localStorage.getItem("supabaseAnonKey") || "" : ""));
  const [userId, setUserId] = useState(() => (typeof window !== "undefined" ? window.localStorage.getItem("financeUserId") || crypto.randomUUID() : "demo-user"));
  const [syncStatus, setSyncStatus] = useState<"local" | "connected" | "syncing" | "error">("local");
  const [syncMessage, setSyncMessage] = useState("Local only");

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    try {
      return createClient(supabaseUrl, supabaseAnonKey);
    } catch {
      return null;
    }
  }, [supabaseUrl, supabaseAnonKey]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("transactions", JSON.stringify(transactions));
      window.localStorage.setItem("budgets", JSON.stringify(budgets));
      window.localStorage.setItem("selectedMonth", selectedMonth);
      window.localStorage.setItem("supabaseUrl", supabaseUrl);
      window.localStorage.setItem("supabaseAnonKey", supabaseAnonKey);
      window.localStorage.setItem("financeUserId", userId);
    }
  }, [transactions, budgets, selectedMonth, supabaseUrl, supabaseAnonKey, userId]);

  const monthTransactions = useMemo(() => {
    return transactions.filter((item) => monthKey(item.date) === selectedMonth).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedMonth]);

  const incomeTotal = useMemo(() => monthTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0), [monthTransactions]);
  const expenseTotal = useMemo(() => monthTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0), [monthTransactions]);
  const moneyGivenTotal = useMemo(() => monthTransactions.filter((item) => item.type === "expense" && item.category === "Money Given").reduce((sum, item) => sum + item.amount, 0), [monthTransactions]);
  const savingsAmount = useMemo(() => incomeTotal - expenseTotal, [incomeTotal, expenseTotal]);

  const essentialCategories = new Set(["Rent", "Bills", "Food", "Grocery", "Transport", "Subscriptions", "Room", "Health"]);
  const nonEssentialCategories = new Set(["Lifestyle", "Shopping", "Gift", "Misc"]);

  const essentialTotal = useMemo(() => monthTransactions.filter((item) => item.type === "expense" && essentialCategories.has(item.category)).reduce((sum, item) => sum + item.amount, 0), [monthTransactions]);
  const nonEssentialTotal = useMemo(() => monthTransactions.filter((item) => item.type === "expense" && nonEssentialCategories.has(item.category)).reduce((sum, item) => sum + item.amount, 0), [monthTransactions]);

  const categorySummary = useMemo(() => {
    const map = new Map<string, number>();
    monthTransactions.forEach((item) => {
      if (item.type !== "expense") return;
      map.set(item.category, (map.get(item.category) || 0) + item.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [monthTransactions]);

  const monthlyTrend = useMemo(() => {
    const grouped = new Map<string, { income: number; expense: number }>();
    transactions.forEach((item) => {
      const key = monthKey(item.date);
      if (!grouped.has(key)) grouped.set(key, { income: 0, expense: 0 });
      const current = grouped.get(key)!;
      if (item.type === "income") current.income += item.amount;
      if (item.type === "expense") current.expense += item.amount;
    });
    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([key, value]) => ({ month: key, income: value.income, expense: value.expense }));
  }, [transactions]);

  const savingsRate = useMemo(() => (incomeTotal <= 0 ? 0 : (savingsAmount / incomeTotal) * 100), [incomeTotal, savingsAmount]);

  const budgetStatus = useMemo(() => {
    return budgetCategories.map((name) => {
      const spent = categorySummary.find((item) => item.name === name)?.value || 0;
      const budget = budgets[name] || 0;
      const remaining = budget - spent;
      return { name, spent, budget, remaining, percent: budget > 0 ? (spent / budget) * 100 : 0 };
    });
  }, [categorySummary, budgets]);

  const aiInsights = useMemo(() => {
    const tips: string[] = [];
    const topCategory = categorySummary[0];
    if (incomeTotal <= 0) tips.push("Add your monthly income first so the app can calculate real savings and financial status.");
    if (savingsAmount < 0) tips.push("You are spending more than your income this month. Control money given, shopping, and lifestyle first.");
    if (savingsRate > 0 && savingsRate < 20) tips.push("Your savings rate is low. Try to keep at least 20% of income untouched every month.");
    if (moneyGivenTotal > incomeTotal * 0.15 && incomeTotal > 0) tips.push("Money given to people is high compared to your income. Track who it was for and set a monthly limit.");
    if (nonEssentialTotal > essentialTotal * 0.4 && essentialTotal > 0) tips.push("Non-essential spending is taking too much space. Reduce lifestyle, gifts, and personal shopping first.");
    const overBudget = budgetStatus.filter((item) => item.remaining < 0);
    if (overBudget.length > 0) tips.push(`You crossed your budget in ${overBudget.map((item) => item.name).join(", ")}. These need immediate control.`);
    if (topCategory) tips.push(`${topCategory.name} is your biggest expense category this month. Review that first.`);
    if (tips.length === 0) tips.push("Your month looks balanced. Keep adding entries daily so the app can catch patterns earlier.");
    return tips;
  }, [incomeTotal, savingsAmount, savingsRate, moneyGivenTotal, nonEssentialTotal, essentialTotal, budgetStatus, categorySummary]);

  const addTransaction = () => {
    const parsedAmount = Number(amount);
    if (!title.trim() || !parsedAmount || parsedAmount <= 0 || !entryMonth || !entryDay) return;
    const safeDay = String(Math.min(Math.max(Number(entryDay) || 1, 1), 31)).padStart(2, "0");
    const fullDate = `${entryMonth}-${safeDay}`;
    const finalCategory = entryType === "income" ? "Income" : category;
    const newRow: Tx = {
      id: crypto.randomUUID(),
      type: entryType,
      title: title.trim(),
      amount: parsedAmount,
      category: finalCategory,
      date: fullDate,
      note: note.trim(),
    };
    setTransactions((prev) => [newRow, ...prev]);
    setTitle("");
    setAmount("");
    setCategory("Food");
    setEntryMonth(todayDate().slice(0, 7));
    setEntryDay(String(new Date().getDate()).padStart(2, "0"));
    setNote("");
    setSelectedMonth(entryMonth);
  };

  const removeTransaction = (id: string) => setTransactions((prev) => prev.filter((item) => item.id !== id));
  const updateBudget = (name: string, value: string) => setBudgets((prev) => ({ ...prev, [name]: Number(value) || 0 }));

  const connectCloud = async () => {
    if (!supabase) {
      setSyncStatus("error");
      setSyncMessage("Add Supabase URL and anon key first");
      return;
    }
    setSyncStatus("connected");
    setSyncMessage("Connected. Ready to sync.");
  };

  const pushToCloud = async () => {
    if (!supabase) return;
    setSyncStatus("syncing");
    setSyncMessage("Uploading data...");
    try {
      await supabase.from("finance_transactions").delete().eq("user_id", userId);
      if (transactions.length > 0) {
        const rows = transactions.map((item) => ({
          id: item.id,
          user_id: userId,
          type: item.type,
          title: item.title,
          amount: item.amount,
          category: item.category,
          date: item.date,
          note: item.note,
        }));
        const { error: txError } = await supabase.from("finance_transactions").insert(rows).select();
        if (txError) throw txError;
      }

      await supabase.from("finance_budgets").delete().eq("user_id", userId);
      const budgetRows = Object.entries(budgets).map(([category, budget]) => ({ user_id: userId, category, budget }));
      const { error: budgetError } = await supabase.from("finance_budgets").insert(budgetRows).select();
      if (budgetError) throw budgetError;

      const { error: settingsError } = await supabase
        .from("finance_settings")
        .upsert({ user_id: userId, selected_month: selectedMonth }, { onConflict: "user_id" })
        .select();
      if (settingsError) throw settingsError;

      setSyncStatus("connected");
      setSyncMessage("Cloud sync completed");
    } catch (error: any) {
      setSyncStatus("error");
      setSyncMessage(error?.message || "Cloud sync failed");
    }
  };

  const pullFromCloud = async () => {
    if (!supabase) return;
    setSyncStatus("syncing");
    setSyncMessage("Downloading data...");
    try {
      const { data: txData, error: txError } = await supabase.from("finance_transactions").select("id,user_id,type,title,amount,category,date,note").eq("user_id", userId).order("date", { ascending: false });
      if (txError) throw txError;
      const { data: budgetData, error: budgetError } = await supabase.from("finance_budgets").select("category,budget").eq("user_id", userId);
      if (budgetError) throw budgetError;
      const { data: settingsData, error: settingsError } = await supabase.from("finance_settings").select("selected_month").eq("user_id", userId).maybeSingle();
      if (settingsError) throw settingsError;

      if (txData) setTransactions(txData as Tx[]);
      if (budgetData) {
        const nextBudgets: BudgetMap = { ...initialBudgets };
        for (const row of budgetData) nextBudgets[row.category] = Number(row.budget);
        setBudgets(nextBudgets);
      }
      if (settingsData?.selected_month) setSelectedMonth(settingsData.selected_month);

      setSyncStatus("connected");
      setSyncMessage("Cloud data loaded");
    } catch (error: any) {
      setSyncStatus("error");
      setSyncMessage(error?.message || "Cloud download failed");
    }
  };

  const months = Array.from(new Set(transactions.map((item) => monthKey(item.date)).concat(todayDate().slice(0, 7)))).sort();

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-[34px] bg-white shadow-2xl border border-neutral-200 overflow-hidden">
        <div className="bg-gradient-to-b from-white to-[#f8f8fa] border-b border-neutral-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Personal Finance</p>
              <h1 className="text-[28px] leading-none font-semibold tracking-tight mt-1">Money Status</h1>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-sm">
              <Wallet className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="h-11 rounded-2xl border-neutral-200 bg-white">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className={`h-11 rounded-2xl flex items-center justify-center text-sm border ${syncStatus === "connected" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : syncStatus === "error" ? "bg-red-50 text-red-700 border-red-200" : syncStatus === "syncing" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-neutral-50 text-neutral-600 border-neutral-200"}`}>
              <Cloud className="h-4 w-4 mr-2" /> {syncStatus}
            </div>
          </div>

          <Card className="mt-4 rounded-[28px] border-0 bg-black text-white shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-white/70">This Month</p>
                  <p className="text-3xl font-semibold mt-1">{formatQAR(savingsAmount)}</p>
                  <p className="text-xs text-white/60 mt-1">Net balance after all tracked expenses</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
                  <p className="text-[10px] uppercase tracking-wide text-white/60">Savings Rate</p>
                  <p className="text-lg font-semibold">{savingsRate.toFixed(0)}%</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="rounded-2xl bg-white/10 p-3"><div className="flex items-center gap-2 text-white/70 text-[11px]"><ArrowDownCircle className="h-3.5 w-3.5" /> Income</div><p className="mt-1 text-sm font-medium">{incomeTotal.toFixed(0)}</p></div>
                <div className="rounded-2xl bg-white/10 p-3"><div className="flex items-center gap-2 text-white/70 text-[11px]"><ArrowUpCircle className="h-3.5 w-3.5" /> Expense</div><p className="mt-1 text-sm font-medium">{expenseTotal.toFixed(0)}</p></div>
                <div className="rounded-2xl bg-white/10 p-3"><div className="flex items-center gap-2 text-white/70 text-[11px]"><HandCoins className="h-3.5 w-3.5" /> Given</div><p className="mt-1 text-sm font-medium">{moneyGivenTotal.toFixed(0)}</p></div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <Card className="rounded-[26px] border-neutral-100 shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-2 text-neutral-500 text-xs"><Landmark className="h-4 w-4" /> Needs</div><p className="text-xl font-semibold mt-1">{formatQAR(essentialTotal)}</p><p className="text-xs text-neutral-500 mt-1">Main living costs</p></CardContent></Card>
            <Card className="rounded-[26px] border-neutral-100 shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-2 text-neutral-500 text-xs"><PiggyBank className="h-4 w-4" /> Wants</div><p className="text-xl font-semibold mt-1">{formatQAR(nonEssentialTotal)}</p><p className="text-xs text-neutral-500 mt-1">Can be reduced first</p></CardContent></Card>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <div className="px-4 pt-4">
            <TabsList className="grid grid-cols-6 h-12 rounded-2xl bg-neutral-100">
              <TabsTrigger value="dashboard" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Home</TabsTrigger>
              <TabsTrigger value="add" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"><PlusCircle className="h-4 w-4 mr-1" />Add</TabsTrigger>
              <TabsTrigger value="budget" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"><Target className="h-4 w-4 mr-1" />Plan</TabsTrigger>
              <TabsTrigger value="charts" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"><ChartPie className="h-4 w-4 mr-1" />Charts</TabsTrigger>
              <TabsTrigger value="ai" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">AI</TabsTrigger>
              <TabsTrigger value="cloud" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"><Database className="h-4 w-4 mr-1" />Cloud</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="mt-0 p-4 pt-4">
            <Card className="rounded-[28px] border-neutral-100 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base">Recent Transactions</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-[360px] pr-2">
                  <div className="space-y-3">
                    {monthTransactions.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-neutral-100 p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm truncate">{item.title}</p>
                            <Badge variant="secondary" className="rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-100">{item.category}</Badge>
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">{item.date}{item.note ? ` • ${item.note}` : ""}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className={`font-semibold text-sm ${item.type === "income" ? "text-emerald-600" : "text-neutral-900"}`}>{item.type === "income" ? "+" : "-"}{item.amount.toFixed(2)}</p>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => removeTransaction(item.id)}><Trash2 className="h-4 w-4 text-neutral-500" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add" className="mt-0 p-4 pt-4">
            <Card className="rounded-[28px] border-neutral-100 shadow-sm">
              <CardHeader><CardTitle className="text-base">Add Entry</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant={entryType === "expense" ? "default" : "outline"} className={`rounded-2xl h-11 ${entryType === "expense" ? "bg-black hover:bg-neutral-800" : ""}`} onClick={() => setEntryType("expense")}>Expense</Button>
                  <Button variant={entryType === "income" ? "default" : "outline"} className={`rounded-2xl h-11 ${entryType === "income" ? "bg-black hover:bg-neutral-800" : ""}`} onClick={() => setEntryType("income")}>Income</Button>
                </div>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={entryType === "income" ? "Income title" : "Expense title"} className="h-12 rounded-2xl text-base" />
                <Input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} type="text" inputMode="decimal" placeholder="Amount" className="h-12 rounded-2xl" />
                {entryType === "expense" && (
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-12 rounded-2xl"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>{expenseCategories.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                  </Select>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Select value={entryMonth} onValueChange={setEntryMonth}>
                    <SelectTrigger className="h-12 rounded-2xl"><SelectValue placeholder="Month" /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, index) => {
                        const monthNumber = String(index + 1).padStart(2, "0");
                        const value = `${selectedMonth.slice(0, 4)}-${monthNumber}`;
                        const label = new Date(`${value}-01`).toLocaleString(undefined, { month: "long", year: "numeric" });
                        return <SelectItem key={value} value={value}>{label}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                  <Select value={entryDay} onValueChange={setEntryDay}>
                    <SelectTrigger className="h-12 rounded-2xl"><SelectValue placeholder="Day" /></SelectTrigger>
                    <SelectContent>{Array.from({ length: 31 }, (_, index) => { const value = String(index + 1).padStart(2, "0"); return <SelectItem key={value} value={value}>{value}</SelectItem>; })}</SelectContent>
                  </Select>
                </div>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note or person name" className="h-12 rounded-2xl text-base" />
                <div className="grid grid-cols-4 gap-2">{[5, 10, 20, 50].map((quick) => <Button key={quick} variant="outline" className="rounded-2xl" onClick={() => setAmount(String((Number(amount) || 0) + quick))}>+{quick}</Button>)}</div>
                <Button onClick={addTransaction} className="w-full h-12 rounded-2xl bg-black hover:bg-neutral-800">Add Entry</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="mt-0 p-4 pt-4">
            <div className="space-y-3">
              {budgetStatus.map((item) => (
                <Card key={item.name} className="rounded-[26px] border-neutral-100 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div><p className="font-medium">{item.name}</p><p className="text-xs text-neutral-500">Spent {formatQAR(item.spent)} / Budget {formatQAR(item.budget)}</p></div>
                      <div className={`text-sm font-semibold ${item.remaining < 0 ? "text-red-600" : "text-neutral-900"}`}>{item.remaining < 0 ? formatQAR(item.remaining) : `Left ${formatQAR(item.remaining)}`}</div>
                    </div>
                    <Input type="text" inputMode="decimal" value={String(item.budget)} onChange={(e) => updateBudget(item.name, e.target.value.replace(/[^0-9.]/g, ""))} className="h-11 rounded-2xl mb-3 text-base" />
                    <div className="w-full h-2.5 rounded-full bg-neutral-100 overflow-hidden"><div className={`h-full rounded-full ${item.percent > 100 ? "bg-red-500" : item.percent > 80 ? "bg-amber-500" : "bg-black"}`} style={{ width: `${Math.min(item.percent, 100)}%` }} /></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="charts" className="mt-0 p-4 pt-4">
            <div className="space-y-4">
              <Card className="rounded-[28px] border-neutral-100 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-base">Expense Split</CardTitle></CardHeader>
                <CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categorySummary} dataKey="value" nameKey="name" innerRadius={55} outerRadius={88} paddingAngle={3}>{categorySummary.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value: number) => formatQAR(value)} /></PieChart></ResponsiveContainer></div></CardContent>
              </Card>
              <Card className="rounded-[28px] border-neutral-100 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-base">Monthly Trend</CardTitle></CardHeader>
                <CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyTrend}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><Tooltip formatter={(value: number) => formatQAR(value)} /><Bar dataKey="income" radius={[10, 10, 0, 0]} fill="#94a3b8" /><Bar dataKey="expense" radius={[10, 10, 0, 0]} fill="#0f172a" /></BarChart></ResponsiveContainer></div></CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-0 p-4 pt-4">
            <div className="space-y-4">
              <Card className="rounded-[28px] border-neutral-100 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-base">AI Financial Check</CardTitle></CardHeader>
                <CardContent className="space-y-3">{aiInsights.map((tip, index) => <div key={index} className="rounded-2xl bg-neutral-50 border border-neutral-100 p-3 text-sm text-neutral-700">{tip}</div>)}</CardContent>
              </Card>
              <Card className="rounded-[28px] border-neutral-100 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-base">Control First</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm text-neutral-700">
                  <div className="rounded-2xl border border-neutral-100 p-3">1. Keep needs separate from wants. Needs are rent, bills, food, transport, grocery, subscriptions.</div>
                  <div className="rounded-2xl border border-neutral-100 p-3">2. Track money given to people as its own category every single time. Add the person name in the note.</div>
                  <div className="rounded-2xl border border-neutral-100 p-3">3. Before spending on lifestyle or shopping, check the Plan tab first and see what is left.</div>
                  <div className="rounded-2xl border border-neutral-100 p-3">4. Real savings = income minus all expenses. This app shows your real status, not just what is left in hand.</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cloud" className="mt-0 p-4 pt-4">
            <div className="space-y-4">
              <Card className="rounded-[28px] border-neutral-100 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-base">Cloud Database Setup</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Input value={supabaseUrl} onChange={(e) => setSupabaseUrl(e.target.value)} placeholder="Supabase URL" className="h-12 rounded-2xl text-base" autoCapitalize="none" autoCorrect="off" />
                  <Input value={supabaseAnonKey} onChange={(e) => setSupabaseAnonKey(e.target.value)} placeholder="Supabase anon key" className="h-12 rounded-2xl text-base" autoCapitalize="none" autoCorrect="off" />
                  <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Private user ID" className="h-12 rounded-2xl text-base" autoCapitalize="none" autoCorrect="off" />
                  <div className="grid grid-cols-3 gap-2">
                    <Button onClick={connectCloud} variant="outline" className="rounded-2xl h-11"><Cloud className="h-4 w-4 mr-2" />Connect</Button>
                    <Button onClick={pushToCloud} className="rounded-2xl h-11 bg-black hover:bg-neutral-800"><RefreshCw className="h-4 w-4 mr-2" />Push</Button>
                    <Button onClick={pullFromCloud} variant="outline" className="rounded-2xl h-11"><RefreshCw className="h-4 w-4 mr-2" />Pull</Button>
                  </div>
                  <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-3 text-sm text-neutral-700">Status: {syncMessage}</div>
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border-neutral-100 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-base">Supabase Tables Needed</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm text-neutral-700">
                  <div className="rounded-2xl border border-neutral-100 p-3 font-mono text-xs whitespace-pre-wrap">finance_transactions(id text primary key, user_id text, type text, title text, amount numeric, category text, date date, note text)</div>
                  <div className="rounded-2xl border border-neutral-100 p-3 font-mono text-xs whitespace-pre-wrap">finance_budgets(user_id text, category text, budget numeric)</div>
                  <div className="rounded-2xl border border-neutral-100 p-3 font-mono text-xs whitespace-pre-wrap">finance_settings(user_id text primary key, selected_month text)</div>
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border-neutral-100 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-base">Security Note</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm text-neutral-700">
                  <div className="flex gap-2 items-start rounded-2xl bg-neutral-50 border border-neutral-100 p-3"><Shield className="h-4 w-4 mt-0.5" /><span>This preview uses a private user ID field for simple sync testing. For proper security, use Supabase Auth + Row Level Security in the deployed version.</span></div>
                  <div className="rounded-2xl border border-neutral-100 p-3">Best real setup: email login, one user per account, and RLS policies so only your rows are visible.</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

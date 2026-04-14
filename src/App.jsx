import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
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
  Sparkles,
  Database,
  Cloud,
  RefreshCw,
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
  { id: "seed-1", type: "income", title: "Salary", amount: 6500, category: "Income", date: "2026-04-01", note: "Monthly income" },
  { id: "seed-2", type: "expense", title: "Vodafone", amount: 100, category: "Bills", date: "2026-04-02", note: "Phone bill" },
  { id: "seed-3", type: "expense", title: "Shisha", amount: 60, category: "Lifestyle", date: "2026-04-03", note: "Personal" },
  { id: "seed-4", type: "expense", title: "Movlavi", amount: 70, category: "Money Given", date: "2026-04-03", note: "Given" },
  { id: "seed-5", type: "expense", title: "Food", amount: 54.25, category: "Food", date: "2026-04-04", note: "Multiple food entries" },
  { id: "seed-6", type: "expense", title: "Transport", amount: 28, category: "Transport", date: "2026-04-05", note: "Uber + Metro" },
  { id: "seed-7", type: "expense", title: "Room Items", amount: 29, category: "Room", date: "2026-04-06", note: "Soap + room items" },
  { id: "seed-8", type: "expense", title: "Groceries", amount: 52, category: "Grocery", date: "2026-04-07", note: "Grocery shopping" },
  { id: "seed-9", type: "expense", title: "Apple Subscription", amount: 20, category: "Subscriptions", date: "2026-04-07", note: "Monthly" },
];

const initialBudgets = {
  Rent: 500,
  Bills: 200,
  Food: 300,
  Grocery: 150,
  Transport: 120,
  Subscriptions: 50,
  Room: 100,
  "Money Given": 150,
  Lifestyle: 150,
  Shopping: 100,
  Misc: 100,
};

const chartColors = ["#111827", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#0f172a", "#1e293b"];

function formatQAR(value) {
  const num = Number(value || 0);
  const sign = num < 0 ? "-" : "";
  return `${sign}${Math.abs(num).toFixed(2)} QAR`;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(date) {
  return date.slice(0, 7);
}

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function glassCardStyle(dark = false) {
  return {
    borderRadius: 28,
    padding: 16,
    border: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.7)",
    background: dark
      ? "linear-gradient(180deg, rgba(17,24,39,0.98), rgba(31,41,55,0.96))"
      : "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.78))",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    boxShadow: dark
      ? "0 20px 50px rgba(15,23,42,0.28)"
      : "0 12px 35px rgba(15,23,42,0.08)",
  };
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        border: "none",
        background: "transparent",
        borderRadius: 16,
        padding: 0,
        cursor: "pointer",
        minHeight: 50,
        overflow: "hidden",
      }}
    >
      {active && (
        <motion.div
          layoutId="tab-pill"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 16,
            background: "linear-gradient(180deg, #111827, #1f2937)",
            boxShadow: "0 8px 22px rgba(17,24,39,0.22)",
          }}
        />
      )}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "14px 8px",
          color: active ? "#fff" : "#4b5563",
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {icon}
        <span>{label}</span>
      </div>
    </button>
  );
}

export default function App() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("transactions-premium");
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem("budgets-premium");
    return saved ? JSON.parse(saved) : initialBudgets;
  });

  const [selectedMonth, setSelectedMonth] = useState(() => localStorage.getItem("selectedMonth-premium") || todayDate().slice(0, 7));
  const [activeTab, setActiveTab] = useState("dashboard");
  const [entryType, setEntryType] = useState("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [entryMonth, setEntryMonth] = useState(todayDate().slice(0, 7));
  const [entryDay, setEntryDay] = useState(String(new Date().getDate()).padStart(2, "0"));
  const [note, setNote] = useState("");

  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem("supabaseUrl-premium") || "");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => localStorage.getItem("supabaseAnonKey-premium") || "");
  const [userId, setUserId] = useState(() => localStorage.getItem("financeUserId-premium") || uid());
  const [syncStatus, setSyncStatus] = useState("local");
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
    localStorage.setItem("transactions-premium", JSON.stringify(transactions));
    localStorage.setItem("budgets-premium", JSON.stringify(budgets));
    localStorage.setItem("selectedMonth-premium", selectedMonth);
    localStorage.setItem("supabaseUrl-premium", supabaseUrl);
    localStorage.setItem("supabaseAnonKey-premium", supabaseAnonKey);
    localStorage.setItem("financeUserId-premium", userId);
  }, [transactions, budgets, selectedMonth, supabaseUrl, supabaseAnonKey, userId]);

  const monthTransactions = useMemo(() => {
    return transactions.filter((item) => monthKey(item.date) === selectedMonth).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedMonth]);

  const incomeTotal = useMemo(() => monthTransactions.filter((i) => i.type === "income").reduce((s, i) => s + i.amount, 0), [monthTransactions]);
  const expenseTotal = useMemo(() => monthTransactions.filter((i) => i.type === "expense").reduce((s, i) => s + i.amount, 0), [monthTransactions]);
  const moneyGivenTotal = useMemo(() => monthTransactions.filter((i) => i.category === "Money Given").reduce((s, i) => s + i.amount, 0), [monthTransactions]);
  const savingsAmount = incomeTotal - expenseTotal;
  const savingsRate = incomeTotal > 0 ? (savingsAmount / incomeTotal) * 100 : 0;

  const essentialCategories = new Set(["Rent", "Bills", "Food", "Grocery", "Transport", "Subscriptions", "Room", "Health"]);
  const nonEssentialCategories = new Set(["Lifestyle", "Shopping", "Gift", "Misc"]);

  const essentialTotal = useMemo(() => monthTransactions.filter((i) => i.type === "expense" && essentialCategories.has(i.category)).reduce((s, i) => s + i.amount, 0), [monthTransactions]);
  const nonEssentialTotal = useMemo(() => monthTransactions.filter((i) => i.type === "expense" && nonEssentialCategories.has(i.category)).reduce((s, i) => s + i.amount, 0), [monthTransactions]);

  const categorySummary = useMemo(() => {
    const map = new Map();
    monthTransactions.forEach((item) => {
      if (item.type !== "expense") return;
      map.set(item.category, (map.get(item.category) || 0) + item.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [monthTransactions]);

  const monthlyTrend = useMemo(() => {
    const grouped = new Map();
    transactions.forEach((item) => {
      const key = monthKey(item.date);
      if (!grouped.has(key)) grouped.set(key, { income: 0, expense: 0 });
      const current = grouped.get(key);
      if (item.type === "income") current.income += item.amount;
      if (item.type === "expense") current.expense += item.amount;
    });
    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([month, value]) => ({ month, ...value }));
  }, [transactions]);

  const budgetStatus = useMemo(() => {
    return budgetCategories.map((name) => {
      const spent = categorySummary.find((i) => i.name === name)?.value || 0;
      const budget = budgets[name] || 0;
      const remaining = budget - spent;
      return { name, spent, budget, remaining, percent: budget > 0 ? (spent / budget) * 100 : 0 };
    });
  }, [categorySummary, budgets]);

  const aiInsights = useMemo(() => {
    const tips = [];
    const topCategory = categorySummary[0];
    const overBudget = budgetStatus.filter((i) => i.remaining < 0).sort((a, b) => a.remaining - b.remaining);
    const highPercent = budgetStatus.filter((i) => i.percent >= 80).sort((a, b) => b.percent - a.percent);

    if (incomeTotal <= 0) {
      tips.push("Add your salary or other income first. Without income, the app cannot tell your real savings position.");
    }

    if (savingsAmount < 0) {
      tips.push("You are overspending this month. Stop non-essential spending first and avoid giving more money until your balance becomes positive.");
    }

    if (moneyGivenTotal > incomeTotal * 0.1 && incomeTotal > 0) {
      tips.push(`Money Given is already ${formatQAR(moneyGivenTotal)}. This is one of the first places to control because it directly reduces your available cash.`);
    }

    const lifestyleSpent = categorySummary.find((i) => i.name === "Lifestyle")?.value || 0;
    const shoppingSpent = categorySummary.find((i) => i.name === "Shopping")?.value || 0;
    const transportSpent = categorySummary.find((i) => i.name === "Transport")?.value || 0;
    const foodSpent = categorySummary.find((i) => i.name === "Food")?.value || 0;

    if (lifestyleSpent > 0) {
      tips.push(`Lifestyle spending is ${formatQAR(lifestyleSpent)}. Reduce this first before touching essential categories.`);
    }

    if (shoppingSpent > 0) {
      tips.push(`Shopping spending is ${formatQAR(shoppingSpent)}. Delay personal purchases until your savings rate improves.`);
    }

    if (foodSpent > (budgets.Food || 0) * 0.8 && foodSpent > 0) {
      tips.push(`Food is already at ${formatQAR(foodSpent)}. Try reducing outside food and small repeated orders.`);
    }

    if (transportSpent > (budgets.Transport || 0) * 0.8 && transportSpent > 0) {
      tips.push(`Transport is getting high at ${formatQAR(transportSpent)}. Try controlling Uber use and combine trips when possible.`);
    }

    if (overBudget.length > 0) {
      tips.push(`You already crossed budget in ${overBudget.map((i) => i.name).join(", ")}. Freeze spending in these categories for the rest of the month.`);
    } else if (highPercent.length > 0) {
      tips.push(`Watch these categories closely: ${highPercent.slice(0, 3).map((i) => i.name).join(", ")}. They are close to the monthly limit.`);
    }

    if (topCategory) {
      tips.push(`${topCategory.name} is your highest expense category this month. Review each entry there first to cut waste quickly.`);
    }

    if (savingsRate > 0 && savingsRate < 20) {
      tips.push(`Your savings rate is only ${savingsRate.toFixed(0)}%. Aim for at least 20% by reducing wants, not needs.`);
    }

    if (!tips.length) {
      tips.push("Your spending looks balanced this month. Keep tracking daily and control wants before they become habits.");
    }

    return tips;
  }, [categorySummary, incomeTotal, savingsAmount, savingsRate, moneyGivenTotal, budgetStatus, budgets]);

  const months = Array.from(new Set(transactions.map((item) => monthKey(item.date)).concat(todayDate().slice(0, 7)))).sort();

  const addTransaction = () => {
    const parsedAmount = Number(amount);
    if (!title.trim() || !parsedAmount || parsedAmount <= 0) return;
    const safeDay = String(Math.min(Math.max(Number(entryDay) || 1, 1), 31)).padStart(2, "0");
    const finalCategory = entryType === "income" ? "Income" : category;
    const newRow = {
      id: uid(),
      type: entryType,
      title: title.trim(),
      amount: parsedAmount,
      category: finalCategory,
      date: `${entryMonth}-${safeDay}`,
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
    setActiveTab("dashboard");
  };

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
      const budgetRows = Object.entries(budgets).map(([categoryName, budget]) => ({ user_id: userId, category: categoryName, budget }));
      const { error: budgetError } = await supabase.from("finance_budgets").insert(budgetRows).select();
      if (budgetError) throw budgetError;

      const { error: settingsError } = await supabase
        .from("finance_settings")
        .upsert({ user_id: userId, selected_month: selectedMonth }, { onConflict: "user_id" })
        .select();
      if (settingsError) throw settingsError;

      setSyncStatus("connected");
      setSyncMessage("Cloud sync completed");
    } catch (error) {
      setSyncStatus("error");
      setSyncMessage(error?.message || "Cloud sync failed");
    }
  };

  const pullFromCloud = async () => {
    if (!supabase) return;
    setSyncStatus("syncing");
    setSyncMessage("Downloading data...");
    try {
      const { data: txData, error: txError } = await supabase
        .from("finance_transactions")
        .select("id,user_id,type,title,amount,category,date,note")
        .eq("user_id", userId)
        .order("date", { ascending: false });
      if (txError) throw txError;

      const { data: budgetData, error: budgetError } = await supabase
        .from("finance_budgets")
        .select("category,budget")
        .eq("user_id", userId);
      if (budgetError) throw budgetError;

      const { data: settingsData, error: settingsError } = await supabase
        .from("finance_settings")
        .select("selected_month")
        .eq("user_id", userId)
        .maybeSingle();
      if (settingsError) throw settingsError;

      if (txData) setTransactions(txData);
      if (budgetData) {
        const nextBudgets = { ...initialBudgets };
        for (const row of budgetData) nextBudgets[row.category] = Number(row.budget);
        setBudgets(nextBudgets);
      }
      if (settingsData?.selected_month) setSelectedMonth(settingsData.selected_month);

      setSyncStatus("connected");
      setSyncMessage("Cloud data loaded");
    } catch (error) {
      setSyncStatus("error");
      setSyncMessage(error?.message || "Cloud download failed");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        style={styles.phone}
      >
        <div style={styles.header}>
          <div style={styles.topRow}>
            <div>
              <div style={styles.kicker}>Personal Finance</div>
              <div style={styles.title}>Money Status</div>
            </div>
            <motion.div whileHover={{ scale: 1.06, rotate: -4 }} whileTap={{ scale: 0.97 }} style={styles.logoBox}>
              <Wallet size={20} />
            </motion.div>
          </div>

          <div style={styles.topControls}>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={styles.selectCompact}>
              {months.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <div style={styles.statusPill}>Live tracking</div>
          </div>

          <motion.div whileHover={{ y: -2 }} style={glassCardStyle(true)}>
            <div style={styles.cardRow}>
              <div>
                <div style={styles.darkLabel}>This Month</div>
                <div style={styles.balanceText}>{formatQAR(savingsAmount)}</div>
                <div style={styles.darkSub}>Net balance after all tracked expenses</div>
              </div>
              <div style={styles.rateBox}>
                <div style={styles.rateLabel}>Savings Rate</div>
                <div style={styles.rateValue}>{savingsRate.toFixed(0)}%</div>
              </div>
            </div>

            <div style={styles.quickStats}>
              <div style={styles.quickStatCard}><div style={styles.statLabel}><ArrowDownCircle size={13} /> Income</div><div style={styles.statValue}>{incomeTotal.toFixed(0)}</div></div>
              <div style={styles.quickStatCard}><div style={styles.statLabel}><ArrowUpCircle size={13} /> Expense</div><div style={styles.statValue}>{expenseTotal.toFixed(0)}</div></div>
              <div style={styles.quickStatCard}><div style={styles.statLabel}><HandCoins size={13} /> Given</div><div style={styles.statValue}>{moneyGivenTotal.toFixed(0)}</div></div>
            </div>
          </motion.div>

          <div style={styles.grid2}>
            <motion.div whileHover={{ y: -2 }} style={glassCardStyle(false)}>
              <div style={styles.infoLabel}><Landmark size={15} /> Needs</div>
              <div style={styles.metric}>{formatQAR(essentialTotal)}</div>
              <div style={styles.infoSub}>Main living costs</div>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} style={glassCardStyle(false)}>
              <div style={styles.infoLabel}><PiggyBank size={15} /> Wants</div>
              <div style={styles.metric}>{formatQAR(nonEssentialTotal)}</div>
              <div style={styles.infoSub}>Can be reduced first</div>
            </motion.div>
          </div>
        </div>

        <div style={styles.tabsWrap}>
          <div style={styles.tabsBar}>
            <TabButton active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={null} label="Home" />
            <TabButton active={activeTab === "add"} onClick={() => setActiveTab("add")} icon={<PlusCircle size={14} />} label="Add" />
            <TabButton active={activeTab === "budget"} onClick={() => setActiveTab("budget")} icon={<Target size={14} />} label="Plan" />
            <TabButton active={activeTab === "charts"} onClick={() => setActiveTab("charts")} icon={<ChartPie size={14} />} label="Charts" />
            <TabButton active={activeTab === "ai"} onClick={() => setActiveTab("ai")} icon={<Sparkles size={14} />} label="AI" />
            <TabButton active={activeTab === "cloud"} onClick={() => setActiveTab("cloud")} icon={<Database size={14} />} label="Cloud" />
          </div>
        </div>

        <div style={styles.contentWrap}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === "dashboard" && (
                <div style={glassCardStyle(false)}>
                  <div style={styles.sectionTitle}>Recent Transactions</div>
                  <div style={styles.listWrap}>
                    {monthTransactions.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        style={styles.transactionItem}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={styles.transactionTop}>
                            <div style={styles.transactionTitle}>{item.title}</div>
                            <span style={styles.badge}>{item.category}</span>
                          </div>
                          <div style={styles.transactionMeta}>{item.date}{item.note ? ` • ${item.note}` : ""}</div>
                        </div>
                        <div style={styles.transactionRight}>
                          <div style={{ ...styles.amountText, color: item.type === "income" ? "#059669" : "#111827" }}>
                            {item.type === "income" ? "+" : "-"}{item.amount.toFixed(2)}
                          </div>
                          <button onClick={() => setTransactions((prev) => prev.filter((t) => t.id !== item.id))} style={styles.iconBtn}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "add" && (
                <div style={glassCardStyle(false)}>
                  <div style={styles.sectionTitle}>Add Entry</div>
                  <div style={styles.formStack}>
                    <div style={styles.grid2}>
                      <button onClick={() => setEntryType("expense")} style={entryType === "expense" ? styles.primaryBtn : styles.secondaryBtn}>Expense</button>
                      <button onClick={() => setEntryType("income")} style={entryType === "income" ? styles.primaryBtn : styles.secondaryBtn}>Income</button>
                    </div>

                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" style={styles.input} />
                    <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" type="number" step="0.01" style={styles.input} />

                    {entryType === "expense" && (
                      <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.select}>
                        {expenseCategories.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    )}

                    <div style={styles.grid2}>
                      <input 
                        value={`${entryMonth}-${entryDay}`} 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const [y, m, d] = val.split("-");
                            setEntryMonth(`${y}-${m}`);
                            setEntryDay(d);
                          }
                        }} 
                        type="date" 
                        style={styles.input} 
                      />
                    </div>

                    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" style={styles.input} />

                    <div style={styles.quickAddRow}>
                      {[5, 10, 20, 50].map((q) => (
                        <motion.button whileTap={{ scale: 0.96 }} key={q} onClick={() => setAmount(String((Number(amount) || 0) + q))} style={styles.secondaryBtn}>+{q}</motion.button>
                      ))}
                    </div>

                    <motion.button whileTap={{ scale: 0.98 }} onClick={addTransaction} style={styles.primaryBtn}>Add Entry</motion.button>
                  </div>
                </div>
              )}

              {activeTab === "budget" && (
                <div style={styles.stack}>
                  {budgetStatus.map((item) => (
                    <div key={item.name} style={glassCardStyle(false)}>
                      <div style={styles.cardRow}>
                        <div>
                          <div style={styles.transactionTitle}>{item.name}</div>
                          <div style={styles.transactionMeta}>Spent {formatQAR(item.spent)} / Budget {formatQAR(item.budget)}</div>
                        </div>
                        <div style={{ ...styles.amountText, color: item.remaining < 0 ? "#dc2626" : "#111827" }}>
                          {item.remaining < 0 ? formatQAR(item.remaining) : `Left ${formatQAR(item.remaining)}`}
                        </div>
                      </div>
                      <input type="number" value={String(item.budget)} onChange={(e) => setBudgets((prev) => ({ ...prev, [item.name]: Number(e.target.value) || 0 }))} style={{ ...styles.inputCompact, marginTop: 12 }} />
                      <div style={styles.progressTrack}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(item.percent, 100)}%` }}
                          transition={{ duration: 0.5 }}
                          style={{ ...styles.progressFill, background: item.percent > 100 ? "#ef4444" : item.percent > 80 ? "#f59e0b" : "#111827" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "charts" && (
                <div style={styles.stack}>
                  <div style={glassCardStyle(false)}>
                    <div style={styles.sectionTitle}>Expense Split</div>
                    <div style={{ width: "100%", height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categorySummary} dataKey="value" nameKey="name" innerRadius={55} outerRadius={88} paddingAngle={3}>
                            {categorySummary.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
                          </Pie>
                          <Tooltip formatter={(value) => formatQAR(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div style={glassCardStyle(false)}>
                    <div style={styles.sectionTitle}>Monthly Trend</div>
                    <div style={{ width: "100%", height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyTrend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" tickLine={false} axisLine={false} />
                          <YAxis tickLine={false} axisLine={false} />
                          <Tooltip formatter={(value) => formatQAR(value)} />
                          <Bar dataKey="income" radius={[10, 10, 0, 0]} fill="#94a3b8" />
                          <Bar dataKey="expense" radius={[10, 10, 0, 0]} fill="#111827" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "ai" && (
                <div style={styles.stack}>
                  <div style={glassCardStyle(false)}>
                    <div style={styles.sectionTitle}>AI Financial Check</div>
                    <div style={styles.formStack}>
                      {aiInsights.map((tip, index) => (
                        <motion.div key={index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} style={styles.tipBox}>
                          {tip}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "cloud" && (
                <div style={styles.stack}>
                  <div style={glassCardStyle(false)}>
                    <div style={styles.sectionTitle}>Cloud Database Setup</div>
                    <div style={styles.formStack}>
                      <input value={supabaseUrl} onChange={(e) => setSupabaseUrl(e.target.value)} placeholder="Supabase URL" style={styles.input} />
                      <input value={supabaseAnonKey} onChange={(e) => setSupabaseAnonKey(e.target.value)} placeholder="Supabase anon key" style={styles.input} />
                      <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Private user ID" style={styles.input} />

                      <div style={styles.cloudButtonRow}>
                        <button onClick={connectCloud} style={styles.secondaryBtn}><Cloud size={14} /> Connect</button>
                        <button onClick={pushToCloud} style={styles.primaryBtn}><RefreshCw size={14} /> Push</button>
                        <button onClick={pullFromCloud} style={styles.secondaryBtn}><RefreshCw size={14} /> Pull</button>
                      </div>

                      <div style={styles.statusMessage}>{syncStatus.toUpperCase()} • {syncMessage}</div>
                    </div>
                  </div>

                  <div style={glassCardStyle(false)}>
                    <div style={styles.sectionTitle}>Supabase Tables Needed</div>
                    <div style={styles.formStack}>
                      <div style={styles.codeBlock}>finance_transactions(id text primary key, user_id text, type text, title text, amount numeric, category text, date date, note text)</div>
                      <div style={styles.codeBlock}>finance_budgets(user_id text, category text, budget numeric)</div>
                      <div style={styles.codeBlock}>finance_settings(user_id text primary key, selected_month text)</div>
                    </div>
                  </div>

                  <div style={glassCardStyle(false)}>
                    <div style={styles.sectionTitle}>Security Note</div>
                    <div style={styles.securityBox}>
                      <Shield size={15} />
                      <span>This version keeps the database tab and simple sync flow. For real production security, use Supabase Auth and Row Level Security.</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    position: "relative",
    overflow: "hidden",
    fontFamily: "Inter, Arial, sans-serif",
  },
  bgOrb1: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: "50%",
    background: "rgba(129,140,248,0.18)",
    filter: "blur(50px)",
    top: -60,
    left: -60,
  },
  bgOrb2: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: "50%",
    background: "rgba(56,189,248,0.14)",
    filter: "blur(50px)",
    bottom: -40,
    right: -40,
  },
  phone: {
    width: "100%",
    maxWidth: 430,
    borderRadius: 36,
    border: "1px solid rgba(255,255,255,0.6)",
    overflow: "hidden",
    background: "rgba(255,255,255,0.55)",
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    boxShadow: "0 30px 70px rgba(15,23,42,0.13)",
    position: "relative",
    zIndex: 1,
  },
  header: { padding: 20, borderBottom: "1px solid rgba(255,255,255,0.65)" },
  topRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  kicker: { color: "#6b7280", fontSize: 14 },
  title: { fontSize: 30, fontWeight: 700, letterSpacing: "-0.04em", color: "#111827", marginTop: 4 },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg, #111827, #1f2937)",
    boxShadow: "0 14px 25px rgba(17,24,39,0.25)",
  },
  topControls: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) auto",
    gap: 12,
    marginTop: 14,
    alignItems: "center",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 },
  selectCompact: {
    height: 48,
    width: "100%",
    minWidth: 0,
    borderRadius: 16,
    border: "1px solid rgba(209,213,219,0.8)",
    padding: "0 14px",
    fontSize: 14,
    background: "rgba(255,255,255,0.85)",
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    height: 48,
    width: "100%",
    borderRadius: 16,
    border: "1px solid rgba(209,213,219,0.8)",
    padding: "0 14px",
    fontSize: 14,
    background: "rgba(255,255,255,0.85)",
    outline: "none",
    boxSizing: "border-box",
  },
  input: {
    height: 48,
    width: "100%",
    borderRadius: 16,
    border: "1px solid rgba(209,213,219,0.8)",
    padding: "0 14px",
    fontSize: 14,
    background: "rgba(255,255,255,0.85)",
    outline: "none",
    boxSizing: "border-box",
  },
  inputCompact: {
    height: 44,
    width: "100%",
    borderRadius: 16,
    border: "1px solid rgba(209,213,219,0.8)",
    padding: "0 14px",
    fontSize: 14,
    background: "rgba(255,255,255,0.85)",
    outline: "none",
    boxSizing: "border-box",
  },
  statusPill: {
    height: 48,
    minWidth: 120,
    padding: "0 16px",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.75)",
    border: "1px solid rgba(255,255,255,0.8)",
    color: "#4b5563",
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: "nowrap",
    boxSizing: "border-box",
  },
  cardRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  darkLabel: { color: "rgba(255,255,255,0.72)", fontSize: 14 },
  balanceText: { color: "#fff", fontSize: 30, fontWeight: 700, lineHeight: 1.1, marginTop: 6 },
  darkSub: { color: "rgba(255,255,255,0.62)", fontSize: 12, marginTop: 4 },
  rateBox: { background: "rgba(255,255,255,0.08)", padding: "10px 12px", borderRadius: 16, textAlign: "right" },
  rateLabel: { fontSize: 10, textTransform: "uppercase", color: "rgba(255,255,255,0.65)", letterSpacing: "0.08em" },
  rateValue: { color: "#fff", fontSize: 20, fontWeight: 700, marginTop: 2 },
  quickStats: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 },
  quickStatCard: { background: "rgba(255,255,255,0.08)", padding: 12, borderRadius: 18 },
  statLabel: { display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.68)", fontSize: 11 },
  statValue: { color: "#fff", marginTop: 6, fontWeight: 700, fontSize: 14 },
  infoLabel: { display: "flex", alignItems: "center", gap: 8, color: "#6b7280", fontSize: 12 },
  metric: { color: "#111827", fontSize: 22, fontWeight: 700, marginTop: 8 },
  infoSub: { color: "#6b7280", fontSize: 12, marginTop: 4 },
  tabsWrap: { padding: 16, paddingBottom: 0 },
  tabsBar: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0,1fr))",
    gap: 6,
    padding: 6,
    borderRadius: 20,
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(255,255,255,0.65)",
  },
  contentWrap: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 14 },
  listWrap: { display: "flex", flexDirection: "column", gap: 10, maxHeight: 390, overflowY: "auto", paddingRight: 4 },
  transactionItem: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: 12, borderRadius: 20, background: "rgba(255,255,255,0.66)", border: "1px solid rgba(255,255,255,0.8)" },
  transactionTop: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 },
  transactionTitle: { fontWeight: 600, fontSize: 14, color: "#111827" },
  transactionMeta: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  transactionRight: { display: "flex", alignItems: "center", gap: 8 },
  amountText: { fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" },
  badge: { display: "inline-block", background: "rgba(243,244,246,0.95)", borderRadius: 999, padding: "4px 10px", fontSize: 12, color: "#374151" },
  iconBtn: { width: 34, height: 34, borderRadius: 999, border: "none", cursor: "pointer", background: "rgba(255,255,255,0.85)", color: "#6b7280", flexShrink: 0 },
  formStack: { display: "flex", flexDirection: "column", gap: 12 },
  stack: { display: "flex", flexDirection: "column", gap: 12 },
  primaryBtn: {
    height: 48,
    width: "100%",
    borderRadius: 16,
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(180deg, #111827, #1f2937)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    boxShadow: "0 10px 20px rgba(17,24,39,0.15)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxSizing: "border-box",
  },
  secondaryBtn: {
    height: 48,
    width: "100%",
    borderRadius: 16,
    border: "1px solid rgba(209,213,219,0.8)",
    cursor: "pointer",
    background: "rgba(255,255,255,0.8)",
    color: "#111827",
    fontWeight: 600,
    fontSize: 14,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxSizing: "border-box",
  },
  quickAddRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 },
  progressTrack: { width: "100%", height: 10, borderRadius: 999, overflow: "hidden", background: "rgba(226,232,240,0.8)", marginTop: 12 },
  progressFill: { height: "100%", borderRadius: 999 },
  tipBox: { padding: 12, borderRadius: 18, background: "rgba(255,255,255,0.72)", border: "1px solid rgba(255,255,255,0.8)", color: "#374151", fontSize: 14, lineHeight: 1.5 },
  cloudButtonRow: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 },
  statusMessage: { padding: 12, borderRadius: 18, background: "rgba(255,255,255,0.72)", border: "1px solid rgba(255,255,255,0.8)", color: "#374151", fontSize: 13, lineHeight: 1.5 },
  codeBlock: { padding: 12, borderRadius: 18, background: "rgba(248,250,252,0.95)", border: "1px solid rgba(226,232,240,0.9)", color: "#334155", fontSize: 12, lineHeight: 1.5, fontFamily: "monospace", wordBreak: "break-word" },
  securityBox: { display: "flex", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 18, background: "rgba(255,255,255,0.72)", border: "1px solid rgba(255,255,255,0.8)", color: "#374151", fontSize: 14, lineHeight: 1.5 },
};

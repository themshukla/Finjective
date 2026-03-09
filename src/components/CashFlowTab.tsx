import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { useBudget } from "@/context/BudgetContext";
import { BudgetCategory } from "@/data/budgetData";
import { format, parse } from "date-fns";

const txTotal = (c: BudgetCategory) => (c.transactions ?? []).reduce((s, t) => s + t.amount, 0);

type TimeFilter = "ytd" | "yearly" | "all";

const CashFlowTab = () => {
  const { monthlyData, selectedMonth } = useBudget();
  const [filter, setFilter] = useState<TimeFilter>("ytd");

  const allData = useMemo(() => {
    const keys = Object.keys(monthlyData).sort();
    return keys.map((key) => {
      const md = monthlyData[key];
      const income = md.income.reduce((s, c) => s + txTotal(c), 0);
      const allExpenseItems = [
        ...md.expenses,
        ...md.customSections.flatMap((s) => s.items),
      ];
      const expenses = allExpenseItems.reduce((s, c) => s + txTotal(c), 0);
      const surplus = income - expenses;
      const label = format(parse(key, "yyyy-MM", new Date()), "MMM");
      return { month: label, monthKey: key, income, expenses, surplus };
    });
  }, [monthlyData]);

  const chartData = useMemo(() => {
    const currentYear = format(selectedMonth, "yyyy");
    if (filter === "ytd") {
      const currentMonthKey = format(selectedMonth, "yyyy-MM");
      return allData.filter((d) => d.monthKey.startsWith(currentYear) && d.monthKey <= currentMonthKey);
    }
    if (filter === "yearly") {
      return allData.filter((d) => d.monthKey.startsWith(currentYear));
    }
    return allData;
  }, [allData, filter, selectedMonth]);

  const totalIncome = chartData.reduce((s, d) => s + d.income, 0);
  const totalExpenses = chartData.reduce((s, d) => s + d.expenses, 0);
  const netCashFlow = totalIncome - totalExpenses;

  const filters: { label: string; value: TimeFilter }[] = [
    { label: "YTD", value: "ytd" },
    { label: "Yearly", value: "yearly" },
    { label: "All", value: "all" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-card p-3 border border-border">
          <p className="text-[10px] text-primary uppercase tracking-wider">Income</p>
          <p className="text-lg font-bold text-foreground tabular-nums">${totalIncome.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-card p-3 border border-border">
          <p className="text-[10px] text-primary uppercase tracking-wider">Expenses</p>
          <p className="text-lg font-bold text-foreground tabular-nums">${totalExpenses.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-card p-3 border border-border">
          <p className="text-[10px] text-primary uppercase tracking-wider">Net</p>
          <p className={`text-lg font-bold tabular-nums ${netCashFlow >= 0 ? "text-income" : "text-expense"}`}>${netCashFlow.toLocaleString()}</p>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-3">
        <div className="flex justify-end mb-2">
          <div className="inline-flex rounded-lg bg-secondary border border-border p-0.5 gap-0.5">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1 text-[10px] font-medium rounded-md transition-colors ${
                  filter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {chartData.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-10">No data for this period.</p>
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={35} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12, backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                  formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Bar dataKey="surplus" name="Net" radius={[3, 3, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.surplus >= 0 ? "hsl(142 55% 45%)" : "hsl(0 72% 55%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between p-3 pb-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly</h3>
          <div className="flex gap-4 text-[10px] text-muted-foreground tabular-nums">
            <span>Income</span>
            <span>Expenses</span>
            <span>Net</span>
          </div>
        </div>
        {chartData.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No data available.</p>
        ) : (
          <div className="divide-y divide-border">
            {chartData.map((m) => (
              <div key={m.monthKey} className="w-full flex items-center justify-between px-3 py-2.5">
                <span className="font-medium text-xs text-foreground">{m.month}</span>
                <div className="flex gap-4 text-xs tabular-nums">
                  <span className="text-income">+${m.income.toLocaleString()}</span>
                  <span className="text-expense">-${m.expenses.toLocaleString()}</span>
                  <span className={`font-semibold ${m.surplus >= 0 ? "text-income" : "text-expense"}`}>
                    {m.surplus < 0 ? "-" : ""}${Math.abs(m.surplus).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CashFlowTab;

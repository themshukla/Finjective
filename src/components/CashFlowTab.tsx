import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useBudget } from "@/context/BudgetContext";
import { BudgetCategory } from "@/data/budgetData";
import { format, parse } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

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

  const isPositive = netCashFlow > 0;
  const isNegative = netCashFlow < 0;
  const lineColor = isPositive
    ? "hsl(142 55% 45%)"
    : isNegative
    ? "hsl(0 72% 55%)"
    : "hsl(var(--muted-foreground))";

  const filters: { label: string; value: TimeFilter }[] = [
    { label: "YTD", value: "ytd" },
    { label: "Yearly", value: "yearly" },
    { label: "All", value: "all" },
  ];

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <div className="space-y-5">
      {/* Hero summary */}
      <div className="text-center pt-2 pb-1">
        <p className="text-[10px] text-primary uppercase tracking-[0.2em] font-medium mb-2">
          Net Cash Flow
        </p>
        <p
          className={`text-4xl font-bold tabular-nums ${
            isPositive ? "text-income" : isNegative ? "text-expense" : "text-foreground"
          }`}
        >
          {isNegative ? "-" : ""}${Math.abs(netCashFlow).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-muted-foreground">
          <TrendIcon className="h-3.5 w-3.5" />
          <span>${totalIncome.toLocaleString()} income</span>
          <span className="opacity-40">·</span>
          <span>${totalExpenses.toLocaleString()} expenses</span>
        </div>
      </div>

      {/* Line chart card */}
      <div className="rounded-xl bg-card border border-border p-3 pb-2">
        {chartData.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-10">No data for this period.</p>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="0"
                  stroke="hsl(var(--border) / 0.25)"
                  vertical={true}
                  horizontal={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid hsl(var(--border))",
                    fontSize: 12,
                    backgroundColor: "hsl(var(--card))",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => [
                    `${value < 0 ? "-" : ""}$${Math.abs(value).toLocaleString()}`,
                    "Net",
                  ]}
                />
                <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="surplus"
                  stroke={lineColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Filter buttons at bottom */}
        <div className="flex justify-center gap-1 mt-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 text-[11px] font-medium rounded-full transition-colors ${
                filter === f.value
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly breakdown list */}
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

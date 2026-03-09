import { useState, useMemo } from "react";
import { Plus, ChevronRight, TrendingUp, DollarSign, CreditCard, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useBudget } from "@/context/BudgetContext";
import { BudgetCategory } from "@/data/budgetData";
import { format, parse, subMonths } from "date-fns";
import EditItemDialog from "./EditItemDialog";
import SortableCategoryList from "./SortableCategoryList";

const txTotal = (c: BudgetCategory) => (c.transactions ?? []).reduce((s, t) => s + t.amount, 0);

type TimeFilter = "1W" | "1M" | "6M" | "YTD" | "1Y" | "ALL";

const FILTERS: { label: string; value: TimeFilter }[] = [
  { label: "1W", value: "1W" },
  { label: "1M", value: "1M" },
  { label: "6M", value: "6M" },
  { label: "YTD", value: "YTD" },
  { label: "1Y", value: "1Y" },
  { label: "ALL", value: "ALL" },
];

const NetWorthTab = () => {
  const { assets, liabilities, setAssets, setLiabilities, monthlyData, selectedMonth } = useBudget();
  const [filter, setFilter] = useState<TimeFilter>("YTD");
  const [editing, setEditing] = useState<{ list: "asset" | "liability"; index: number } | "addAsset" | "addLiability" | null>(null);

  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.value, 0);
  const netWorth = totalAssets - totalLiabilities;

  // Build all cumulative net worth data from monthly budget surplus
  const allChartData = useMemo(() => {
    const keys = Object.keys(monthlyData).sort();
    let cumulative = 0;
    return keys.map((key) => {
      const md = monthlyData[key];
      const income = md.income.reduce((s, c) => s + txTotal(c), 0);
      const allExpenseItems = [
        ...md.expenses,
        ...md.customSections.flatMap((s) => s.items),
      ];
      const expenses = allExpenseItems.reduce((s, c) => s + txTotal(c), 0);
      cumulative += income - expenses;
      const label = format(parse(key, "yyyy-MM", new Date()), "MMM yy");
      return { month: label, monthKey: key, netWorth: cumulative };
    });
  }, [monthlyData]);

  const chartData = useMemo(() => {
    const now = selectedMonth;
    const currentMonthKey = format(now, "yyyy-MM");
    const currentYear = format(now, "yyyy");

    switch (filter) {
      case "1W":
      case "1M":
        return allChartData.filter((d) => d.monthKey === currentMonthKey);
      case "6M": {
        const cutoff = format(subMonths(now, 5), "yyyy-MM");
        return allChartData.filter((d) => d.monthKey >= cutoff && d.monthKey <= currentMonthKey);
      }
      case "YTD":
        return allChartData.filter((d) => d.monthKey.startsWith(currentYear) && d.monthKey <= currentMonthKey);
      case "1Y": {
        const cutoff = format(subMonths(now, 11), "yyyy-MM");
        return allChartData.filter((d) => d.monthKey >= cutoff && d.monthKey <= currentMonthKey);
      }
      case "ALL":
      default:
        return allChartData;
    }
  }, [allChartData, filter, selectedMonth]);

  const isPositive = netWorth > 0;
  const isNegative = netWorth < 0;
  const lineColor = isPositive
    ? "hsl(142 55% 45%)"
    : isNegative
    ? "hsl(0 72% 55%)"
    : "hsl(var(--muted-foreground))";

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  const handleSave = (list: "asset" | "liability", index: number, values: Record<string, string | number>) => {
    if (list === "asset") {
      const arr = [...assets];
      arr[index] = { name: String(values.name), value: Number(values.value) };
      setAssets(arr);
    } else {
      const arr = [...liabilities];
      arr[index] = { name: String(values.name), value: Number(values.value) };
      setLiabilities(arr);
    }
  };

  const handleAdd = (list: "asset" | "liability", values: Record<string, string | number>) => {
    if (list === "asset") setAssets([...assets, { name: String(values.name), value: Number(values.value) }]);
    else setLiabilities([...liabilities, { name: String(values.name), value: Number(values.value) }]);
  };

  const handleDelete = (list: "asset" | "liability", index: number) => {
    if (list === "asset") { const a = [...assets]; a.splice(index, 1); setAssets(a); }
    else { const a = [...liabilities]; a.splice(index, 1); setLiabilities(a); }
  };

  const getEditingData = () => {
    if (!editing) return null;
    if (editing === "addAsset" || editing === "addLiability") {
      const list = editing === "addAsset" ? "asset" : "liability";
      return {
        title: `Add ${list === "asset" ? "Asset" : "Liability"}`,
        fields: [
          { key: "name", label: "Name", type: "text" as const, value: "" },
        ],
        onSave: (v: Record<string, string | number>) => handleAdd(list, { ...v, value: 0 }),
      };
    }
    const item = editing.list === "asset" ? assets[editing.index] : liabilities[editing.index];
    return {
      title: `Edit ${item.name}`,
      fields: [
        { key: "name", label: "Name", type: "text" as const, value: item.name },
        { key: "value", label: "Value", type: "number" as const, value: item.value },
      ],
      onSave: (v: Record<string, string | number>) => handleSave(editing.list, editing.index, v),
      onDelete: () => handleDelete(editing.list, editing.index),
    };
  };

  const ed = getEditingData();
  const assetIcons = [TrendingUp, DollarSign];

  return (
    <div className="space-y-5">
      {/* Hero summary */}
      <div className="text-center pt-2 pb-1">
        <p className="text-[10px] text-primary uppercase tracking-[0.2em] font-medium mb-2">
          Net Worth
        </p>
        <p
          className={`text-4xl font-bold tabular-nums ${
            isPositive ? "text-income" : isNegative ? "text-expense" : "text-foreground"
          }`}
        >
          {isNegative ? "-" : ""}${Math.abs(netWorth).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-muted-foreground">
          <TrendIcon className="h-3.5 w-3.5" />
          <span>${totalAssets.toLocaleString()} assets</span>
          <span className="opacity-40">·</span>
          <span>${totalLiabilities.toLocaleString()} liabilities</span>
        </div>
      </div>

      {/* Line chart */}
      <div className="rounded-xl bg-card border border-border p-3 pb-3">
        {chartData.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-10">No monthly data yet.</p>
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
                    "Cumulative Net",
                  ]}
                />
                <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  stroke={lineColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Filter buttons — full width like reference */}
        <div className="flex items-center justify-between mt-3 border-t border-border pt-3">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-full transition-all ${
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

      {/* Assets & Liabilities summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-card border border-border p-3">
          <p className="text-[10px] text-primary uppercase tracking-wider">Total Assets</p>
          <p className="text-lg font-bold tabular-nums text-foreground">
            ${totalAssets.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3">
          <p className="text-[10px] text-primary uppercase tracking-wider">Total Liabilities</p>
          <p className="text-lg font-bold tabular-nums text-expense">
            ${totalLiabilities.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Assets section */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-foreground">Assets</h3>
          <button onClick={() => setEditing("addAsset")} className="text-xs text-primary font-medium flex items-center gap-0.5">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        <SortableCategoryList
          items={assets.map((a, i) => ({ name: a.name, budgeted: 0, spent: 0, icon: "", _value: a.value, _iconIndex: i } as any))}
          onReorder={(reordered) => setAssets(reordered.map((r: any) => ({ name: r.name, value: r._value ?? r.value ?? 0 })))}
          containerId="assets"
          renderItem={(cat: any, i) => {
            const Icon = assetIcons[i % assetIcons.length];
            return (
              <button onClick={() => setEditing({ list: "asset", index: i })} className="w-full rounded-xl bg-card border border-border px-3 py-1.5 text-left active:scale-[0.98] transition-transform">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-primary">{cat.name}</p>
                    <p className="text-sm font-bold tabular-nums text-foreground">
                      ${(cat._value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      View <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </button>
            );
          }}
        />
      </section>

      {/* Liabilities section */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-foreground">Liabilities</h3>
          <button onClick={() => setEditing("addLiability")} className="text-xs text-primary font-medium flex items-center gap-0.5">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        <SortableCategoryList
          items={liabilities.map((l) => ({ name: l.name, budgeted: 0, spent: 0, icon: "", _value: l.value } as any))}
          onReorder={(reordered) => setLiabilities(reordered.map((r: any) => ({ name: r.name, value: r._value ?? r.value ?? 0 })))}
          containerId="liabilities"
          renderItem={(cat: any, i) => (
            <button onClick={() => setEditing({ list: "liability", index: i })} className="w-full rounded-xl bg-card border border-border px-3 py-1.5 text-left active:scale-[0.98] transition-transform">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-primary">{cat.name}</p>
                  <p className="text-sm font-bold tabular-nums text-liability">
                    ${(cat._value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    View <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </button>
          )}
        />
      </section>

      {ed && <EditItemDialog open={editing !== null} onClose={() => setEditing(null)} {...ed} />}
    </div>
  );
};

export default NetWorthTab;

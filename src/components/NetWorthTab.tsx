import { useState, useMemo } from "react";
import { Plus, TrendingUp, DollarSign, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useBudget } from "@/context/BudgetContext";
import { NetWorthEntry } from "@/data/budgetData";
import { format, parse, subMonths } from "date-fns";
import EditItemDialog from "./EditItemDialog";
import SortableCategoryList from "./SortableCategoryList";
import NetWorthItemsDialog from "./NetWorthItemsDialog";
import NetWorthSetupPrompt from "./NetWorthSetupPrompt";


const getCardValue = (entries?: NetWorthEntry[], fallback?: number) =>
  entries && entries.length > 0
    ? entries.reduce((s, e) => s + e.amount, 0)
    : (fallback ?? 0);

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
  const { assets, liabilities, setAssets, setLiabilities, selectedMonth, netWorthSnapshots } = useBudget();
  const [filter, setFilter] = useState<TimeFilter>("YTD");
  const [editing, setEditing] = useState<{ list: "asset" | "liability"; index: number } | "addAsset" | "addLiability" | null>(null);
  const [viewingItems, setViewingItems] = useState<{ list: "asset" | "liability"; index: number } | null>(null);

  const totalAssets = assets.reduce((s, a) => s + getCardValue(a.entries, a.value), 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + getCardValue(l.entries, l.value), 0);
  const netWorth = totalAssets - totalLiabilities;

  // Build chart data from persisted net worth snapshots
  const allChartData = useMemo(() => {
    return netWorthSnapshots.map((snap) => ({
      month: format(parse(snap.month_key, "yyyy-MM", new Date()), "MMM yy"),
      monthKey: snap.month_key,
      netWorth: snap.net_worth,
    }));
  }, [netWorthSnapshots]);

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

  // Edit (rename only)
  const handleSave = (list: "asset" | "liability", index: number, values: Record<string, string | number>) => {
    if (list === "asset") {
      const arr = [...assets];
      arr[index] = { ...arr[index], name: String(values.name) };
      setAssets(arr);
    } else {
      const arr = [...liabilities];
      arr[index] = { ...arr[index], name: String(values.name) };
      setLiabilities(arr);
    }
  };

  const handleAdd = (list: "asset" | "liability", values: Record<string, string | number>) => {
    if (list === "asset") setAssets([...assets, { name: String(values.name), value: 0, entries: [] }]);
    else setLiabilities([...liabilities, { name: String(values.name), value: 0, entries: [] }]);
  };

  const handleDelete = (list: "asset" | "liability", index: number) => {
    if (list === "asset") { const a = [...assets]; a.splice(index, 1); setAssets(a); }
    else { const a = [...liabilities]; a.splice(index, 1); setLiabilities(a); }
  };

  const handleEntriesChange = (list: "asset" | "liability", index: number, entries: NetWorthEntry[]) => {
    if (list === "asset") {
      const arr = [...assets];
      arr[index] = { ...arr[index], entries };
      setAssets(arr);
    } else {
      const arr = [...liabilities];
      arr[index] = { ...arr[index], entries };
      setLiabilities(arr);
    }
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
        onSave: (v: Record<string, string | number>) => handleAdd(list, v),
      };
    }
    const item = editing.list === "asset" ? assets[editing.index] : liabilities[editing.index];
    return {
      title: `Rename`,
      fields: [
        { key: "name", label: "Name", type: "text" as const, value: item.name },
      ],
      onSave: (v: Record<string, string | number>) => handleSave(editing.list, editing.index, v),
      onDelete: () => handleDelete(editing.list, editing.index),
    };
  };

  const ed = getEditingData();
  const assetIcons = [TrendingUp, DollarSign];

  // Items dialog data
  const itemsDialogData = viewingItems
    ? viewingItems.list === "asset"
      ? { item: assets[viewingItems.index], list: "asset" as const, index: viewingItems.index }
      : { item: liabilities[viewingItems.index], list: "liability" as const, index: viewingItems.index }
    : null;

  return (
    <div className="space-y-5">
      {/* Hero summary */}
      <div className="text-center pt-2 pb-1">
        <p className="text-[14px] text-primary uppercase tracking-[0.2em] font-medium mb-2">
          Net Worth
        </p>
        <p
          className={`font-bold tabular-nums ${
            isPositive ? "text-income" : isNegative ? "text-expense" : "text-foreground"
          }`}
          style={{ fontSize: "30px" }}
        >
          {isNegative ? "-" : ""}${Math.abs(netWorth).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-2 text-muted-foreground" style={{ fontSize: "14px" }}>
          <span>${totalAssets.toLocaleString()} assets</span>
          <span className="opacity-40">·</span>
          <span>${totalLiabilities.toLocaleString()} liabilities</span>
        </div>
      </div>

      {/* Line chart */}
      <div className="rounded-xl bg-card border border-border p-3 pb-3">
        {chartData.length < 2 ? (
          <p className="text-xs text-muted-foreground text-center py-10">No history yet. Data will appear once you have more than one month recorded.</p>
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

        {/* Filter buttons */}
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

      {/* Assets section */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-primary">Assets</h3>
          <button onClick={() => setEditing("addAsset")} className="text-xs text-primary font-medium flex items-center gap-0.5">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        <SortableCategoryList
          items={assets.map((a, i) => ({ name: a.name, budgeted: 0, spent: 0, icon: "", _value: getCardValue(a.entries, a.value), _iconIndex: i, _entries: a.entries ?? [] } as any))}
          onReorder={(reordered) => setAssets(reordered.map((r: any, i: number) => ({ ...assets[i], name: r.name, value: r._value ?? 0, entries: r._entries ?? [] })))}
          containerId="assets"
          renderItem={(cat: any, i) => {
            const cardValue = getCardValue(assets[i]?.entries, assets[i]?.value);
            const Icon = assetIcons[i % assetIcons.length];
            return (
              <button
                onClick={() => setViewingItems({ list: "asset", index: i })}
                className="w-full rounded-xl bg-card border border-border px-3 py-1.5 text-left active:scale-[0.98] transition-transform"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{cat.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {(assets[i]?.entries?.length ?? 0)} item{(assets[i]?.entries?.length ?? 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-[12px] tabular-nums text-foreground">
                      ${cardValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
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
          <h3 className="text-sm font-bold text-primary">Liabilities</h3>
          <button onClick={() => setEditing("addLiability")} className="text-xs text-primary font-medium flex items-center gap-0.5">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        <SortableCategoryList
          items={liabilities.map((l, i) => ({ name: l.name, budgeted: 0, spent: 0, icon: "", _value: getCardValue(l.entries, l.value), _entries: l.entries ?? [] } as any))}
          onReorder={(reordered) => setLiabilities(reordered.map((r: any, i: number) => ({ ...liabilities[i], name: r.name, value: r._value ?? 0, entries: r._entries ?? [] })))}
          containerId="liabilities"
          renderItem={(cat: any, i) => {
            const cardValue = getCardValue(liabilities[i]?.entries, liabilities[i]?.value);
            return (
              <button
                onClick={() => setViewingItems({ list: "liability", index: i })}
                className="w-full rounded-xl bg-card border border-border px-3 py-1.5 text-left active:scale-[0.98] transition-transform"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{cat.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {(liabilities[i]?.entries?.length ?? 0)} item{(liabilities[i]?.entries?.length ?? 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-[12px] tabular-nums text-foreground">
                      ${cardValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </button>
            );
          }}
        />
      </section>

      {/* Edit/rename dialog */}
      {ed && <EditItemDialog open={editing !== null} onClose={() => setEditing(null)} {...ed} />}

      {/* Items sheet */}
      {itemsDialogData && (
        <NetWorthItemsDialog
          open={viewingItems !== null}
          onClose={() => setViewingItems(null)}
          title={itemsDialogData.item.name}
          entries={itemsDialogData.item.entries ?? []}
          onEntriesChange={(entries) => handleEntriesChange(itemsDialogData.list, itemsDialogData.index, entries)}
          accentClass={itemsDialogData.list === "asset" ? "text-income" : "text-expense"}
        />
      )}
    </div>
  );
};

export default NetWorthTab;

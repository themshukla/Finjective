import { useState, useMemo, useRef, useCallback } from "react";
import { Plus, TrendingUp, DollarSign, TrendingDown, Minus, ChevronRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useBudget } from "@/context/BudgetContext";
import { NetWorthEntry } from "@/data/budgetData";
import { format, parse, subMonths } from "date-fns";
import SortableCategoryList from "./SortableCategoryList";
import NetWorthItemsDialog from "./NetWorthItemsDialog";
import NetWorthSetupPrompt from "./NetWorthSetupPrompt";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

type EditTarget = { list: "asset" | "liability"; index: number } | null;
type AddTarget = "asset" | "liability" | null;

const NetWorthTab = () => {
  const { assets, liabilities, setAssets, setLiabilities, selectedMonth, netWorthSnapshots, netWorthNeedsSetup } = useBudget();
  const [filter, setFilter] = useState<TimeFilter>("YTD");
  const [viewingItems, setViewingItems] = useState<{ list: "asset" | "liability"; index: number } | null>(null);

  // Rename dialog state
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [editName, setEditName] = useState("");

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<EditTarget>(null);

  // Add dialog state
  const [addTarget, setAddTarget] = useState<AddTarget>(null);
  const [addName, setAddName] = useState("");

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

  // Rename handlers
  const openEdit = (list: "asset" | "liability", index: number) => {
    const name = list === "asset" ? assets[index].name : liabilities[index].name;
    setEditTarget({ list, index });
    setEditName(name);
  };

  const confirmRename = () => {
    if (!editTarget || !editName.trim()) return;
    if (editTarget.list === "asset") {
      const arr = [...assets];
      arr[editTarget.index] = { ...arr[editTarget.index], name: editName.trim() };
      setAssets(arr);
    } else {
      const arr = [...liabilities];
      arr[editTarget.index] = { ...arr[editTarget.index], name: editName.trim() };
      setLiabilities(arr);
    }
    setEditTarget(null);
    setEditName("");
  };

  // Delete handlers
  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.list === "asset") {
      const a = [...assets]; a.splice(deleteTarget.index, 1); setAssets(a);
    } else {
      const a = [...liabilities]; a.splice(deleteTarget.index, 1); setLiabilities(a);
    }
    setDeleteTarget(null);
  };

  // Add handlers
  const openAdd = (list: "asset" | "liability") => {
    setAddTarget(list);
    setAddName("");
  };

  const confirmAdd = () => {
    if (!addTarget || !addName.trim()) return;
    if (addTarget === "asset") setAssets([...assets, { name: addName.trim(), value: 0, entries: [] }]);
    else setLiabilities([...liabilities, { name: addName.trim(), value: 0, entries: [] }]);
    setAddTarget(null);
    setAddName("");
  };

  // Entries change
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

  const assetIcons = [TrendingUp, DollarSign];

  const itemsDialogData = viewingItems
    ? viewingItems.list === "asset"
      ? { item: assets[viewingItems.index], list: "asset" as const, index: viewingItems.index }
      : { item: liabilities[viewingItems.index], list: "liability" as const, index: viewingItems.index }
    : null;

  if (netWorthNeedsSetup) return <NetWorthSetupPrompt />;

  // Long-press hook factory
  const useLongPress = (onLongPress: () => void, onClick: () => void, delay = 500) => {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const didLongPress = useRef(false);

    const start = useCallback(() => {
      didLongPress.current = false;
      timerRef.current = setTimeout(() => {
        didLongPress.current = true;
        onLongPress();
      }, delay);
    }, [onLongPress, delay]);

    const cancel = useCallback(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    const handleClick = useCallback(() => {
      if (!didLongPress.current) onClick();
    }, [onClick]);

    return {
      onPointerDown: start,
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onClick: handleClick,
    };
  };

  const CardItem = ({ list, cat, i }: { list: "asset" | "liability"; cat: any; i: number }) => {
    const item = list === "asset" ? assets[i] : liabilities[i];
    const cardValue = getCardValue(item?.entries, item?.value);
    const accentClass = list === "asset" ? "text-income" : "text-expense";

    const longPressHandlers = useLongPress(
      () => setDeleteTarget({ list, index: i }),
      () => openEdit(list, i),
    );

    return (
      <div
        className="w-full rounded-xl bg-card border border-border px-3 py-2.5 flex items-center gap-2 select-none cursor-pointer active:scale-[0.98] transition-transform"
        {...longPressHandlers}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{cat.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {(item?.entries?.length ?? 0)} item{(item?.entries?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>

        <span className={`text-[12px] tabular-nums shrink-0 ${accentClass}`}>
          ${cardValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>

        {/* Chevron taps into items dialog */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); setViewingItems({ list, index: i }); }}
          className="text-muted-foreground shrink-0 p-0.5"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  const renderCard = (list: "asset" | "liability", cat: any, i: number) => (
    <CardItem list={list} cat={cat} i={i} />
  );

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
                <CartesianGrid strokeDasharray="0" stroke="hsl(var(--border) / 0.25)" vertical={true} horizontal={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
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
                <Line type="monotone" dataKey="netWorth" stroke={lineColor} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }} />
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
                filter === f.value ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assets section */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-primary">Assets</h3>
          <button onClick={() => openAdd("asset")} className="text-xs text-primary font-medium flex items-center gap-0.5">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        <SortableCategoryList
          items={assets.map((a, i) => ({ name: a.name, budgeted: 0, spent: 0, icon: "", _value: getCardValue(a.entries, a.value), _iconIndex: i, _entries: a.entries ?? [] } as any))}
          onReorder={(reordered) => setAssets(reordered.map((r: any, i: number) => ({ ...assets[i], name: r.name, value: r._value ?? 0, entries: r._entries ?? [] })))}
          containerId="assets"
          renderItem={(cat: any, i) => renderCard("asset", cat, i)}
        />
      </section>

      {/* Liabilities section */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-primary">Liabilities</h3>
          <button onClick={() => openAdd("liability")} className="text-xs text-primary font-medium flex items-center gap-0.5">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        <SortableCategoryList
          items={liabilities.map((l, i) => ({ name: l.name, budgeted: 0, spent: 0, icon: "", _value: getCardValue(l.entries, l.value), _entries: l.entries ?? [] } as any))}
          onReorder={(reordered) => setLiabilities(reordered.map((r: any, i: number) => ({ ...liabilities[i], name: r.name, value: r._value ?? 0, entries: r._entries ?? [] })))}
          containerId="liabilities"
          renderItem={(cat: any, i) => renderCard("liability", cat, i)}
        />
      </section>

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

      {/* Rename dialog */}
      <AlertDialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <AlertDialogContent className="max-w-[320px] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Rename</AlertDialogTitle>
          </AlertDialogHeader>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmRename()}
            className="h-9 text-sm"
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs" onClick={() => setEditTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="h-8 text-xs" onClick={confirmRename} disabled={!editName.trim()}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent className="max-w-[320px] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Delete card?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will remove the card and all its items. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add dialog */}
      <AlertDialog open={!!addTarget} onOpenChange={(o) => { if (!o) setAddTarget(null); }}>
        <AlertDialogContent className="max-w-[320px] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">
              Add {addTarget === "asset" ? "Asset" : "Liability"}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <Input
            placeholder="e.g. Checking Account"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmAdd()}
            className="h-9 text-sm"
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs" onClick={() => setAddTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="h-8 text-xs" onClick={confirmAdd} disabled={!addName.trim()}>Add</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NetWorthTab;

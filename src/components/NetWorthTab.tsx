import { useState, useMemo, useRef } from "react";
import { Plus, TrendingUp, TrendingDown, Minus, ChevronRight, Copy, FilePlus, Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useBudget } from "@/context/BudgetContext";
import { NetWorthEntry } from "@/data/budgetData";
import { format, parse, subMonths } from "date-fns";
import SortableCategoryList from "./SortableCategoryList";
import NetWorthItemsDialog from "./NetWorthItemsDialog";
import NetWorthSetupPrompt from "./NetWorthSetupPrompt";
import EditItemDialog from "./EditItemDialog";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const getCardValue = (entries?: NetWorthEntry[], fallback?: number) =>
  entries && entries.length > 0
    ? entries.reduce((s, e) => s + e.amount, 0)
    : (fallback ?? 0);

type TimeFilter = "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y" | "ALL";

const FILTERS: { label: string; value: TimeFilter }[] = [
  { label: "1M", value: "1M" },
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "YTD", value: "YTD" },
  { label: "1Y", value: "1Y" },
  { label: "5Y", value: "5Y" },
  { label: "ALL", value: "ALL" },
];

type EditTarget = { list: "asset" | "liability"; index: number } | "addAsset" | "addLiability" | null;

const NetWorthTab = () => {
  const { assets, liabilities, setAssets, setLiabilities, selectedMonth, netWorthSnapshots, netWorthNeedsSetup, importNetWorthFromPrevious, createEmptyNetWorth, clearNetWorth, latestNetWorthSnapshotKey } = useBudget();
  const [confirmAction, setConfirmAction] = useState<null | "import" | "fresh" | "clear">(null);

  const latestLabel = latestNetWorthSnapshotKey
    ? format(parse(latestNetWorthSnapshotKey, "yyyy-MM", new Date()), "MMM yyyy")
    : null;

  const handleImport = () => { setConfirmAction("import"); };
  const handleFresh = () => { setConfirmAction("fresh"); };
  const handleClear = () => { setConfirmAction("clear"); };
  const handleConfirm = () => {
    if (confirmAction === "import") importNetWorthFromPrevious();
    else if (confirmAction === "fresh") createEmptyNetWorth();
    else if (confirmAction === "clear") clearNetWorth();
    setConfirmAction(null);
  };
  const [filter, setFilter] = useState<TimeFilter>("YTD");
  const [viewingItems, setViewingItems] = useState<{ list: "asset" | "liability"; index: number } | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget>(null);

  // inline card name editing
  const [inlineEdit, setInlineEdit] = useState<{ list: "asset" | "liability"; index: number } | null>(null);
  const [inlineVal, setInlineVal] = useState("");
  const [confirmDeleteCard, setConfirmDeleteCard] = useState<{ list: "asset" | "liability"; index: number } | null>(null);

  // inline add
  const [inlineAdding, setInlineAdding] = useState<"asset" | "liability" | null>(null);
  const [inlineAddVal, setInlineAddVal] = useState("");

  const totalAssets = assets.reduce((s, a) => s + getCardValue(a.entries, a.value), 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + getCardValue(l.entries, l.value), 0);
  const netWorth = totalAssets - totalLiabilities;

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
      case "1M":
        return allChartData.filter((d) => d.monthKey === currentMonthKey);
      case "3M": {
        const cutoff = format(subMonths(now, 2), "yyyy-MM");
        return allChartData.filter((d) => d.monthKey >= cutoff && d.monthKey <= currentMonthKey);
      }
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
      case "5Y": {
        const cutoff = format(subMonths(now, 59), "yyyy-MM");
        return allChartData.filter((d) => d.monthKey >= cutoff && d.monthKey <= currentMonthKey);
      }
      case "ALL":
      default:
        return allChartData;
    }
  }, [allChartData, filter, selectedMonth]);

  const isPositive = netWorth > 0;
  const isNegative = netWorth < 0;
  const lineColor = isPositive ? "hsl(142 55% 45%)" : isNegative ? "hsl(0 72% 55%)" : "hsl(var(--muted-foreground))";
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSaveName = (list: "asset" | "liability", index: number, name: string) => {
    if (list === "asset") {
      const arr = [...assets]; arr[index] = { ...arr[index], name }; setAssets(arr);
    } else {
      const arr = [...liabilities]; arr[index] = { ...arr[index], name }; setLiabilities(arr);
    }
  };

  const handleDelete = (list: "asset" | "liability", index: number) => {
    if (list === "asset") { const a = [...assets]; a.splice(index, 1); setAssets(a); }
    else { const a = [...liabilities]; a.splice(index, 1); setLiabilities(a); }
  };

  const handleAdd = (list: "asset" | "liability", values: Record<string, string | number>) => {
    if (list === "asset") setAssets([...assets, { name: String(values.name), value: 0, entries: [] }]);
    else setLiabilities([...liabilities, { name: String(values.name), value: 0, entries: [] }]);
  };

  const commitInlineEdit = () => {
    if (!inlineEdit) return;
    const trimmed = inlineVal.trim();
    if (trimmed) handleSaveName(inlineEdit.list, inlineEdit.index, trimmed);
    setInlineEdit(null);
  };

  const commitInlineAdd = () => {
    const trimmed = inlineAddVal.trim();
    if (trimmed && inlineAdding) handleAdd(inlineAdding, { name: trimmed });
    setInlineAdding(null);
    setInlineAddVal("");
  };

  const handleEntriesChange = (list: "asset" | "liability", index: number, entries: NetWorthEntry[]) => {
    if (list === "asset") {
      const arr = [...assets]; arr[index] = { ...arr[index], entries }; setAssets(arr);
    } else {
      const arr = [...liabilities]; arr[index] = { ...arr[index], entries }; setLiabilities(arr);
    }
  };

  // ── EditItemDialog — only for Add ───────────────────────────────────────────

  const getEditingData = () => {
    if (!editTarget) return null;
    if (editTarget === "addAsset" || editTarget === "addLiability") {
      const list = editTarget === "addAsset" ? "asset" : "liability";
      return {
        title: `Add ${list === "asset" ? "Asset" : "Liability"}`,
        fields: [{ key: "name", label: "Name", type: "text" as const, value: "" }],
        onSave: (v: Record<string, string | number>) => handleAdd(list, v),
      };
    }
    return null;
  };

  const ed = getEditingData();

  const itemsDialogData = viewingItems
    ? viewingItems.list === "asset"
      ? { item: assets[viewingItems.index], list: "asset" as const, index: viewingItems.index }
      : { item: liabilities[viewingItems.index], list: "liability" as const, index: viewingItems.index }
    : null;

  if (netWorthNeedsSetup) return <NetWorthSetupPrompt />;

  // ── Card renderer ────────────────────────────────────────────────────────────

  const renderCard = (list: "asset" | "liability", cat: any, i: number) => {
    const item = list === "asset" ? assets[i] : liabilities[i];
    const cardValue = getCardValue(item?.entries, item?.value);
    const isEditing = inlineEdit?.list === list && inlineEdit?.index === i;

    return (
      <div
        className="w-full rounded-xl bg-card border border-border px-3 py-1.5 flex items-center gap-2 select-none text-left cursor-pointer"
        onClick={() => { if (!isEditing) setViewingItems({ list, index: i }); }}
      >
        {/* Name — tap to edit inline */}
        <span className="shrink-0 max-w-[55%] min-w-0" onClick={(e) => e.stopPropagation()}>
          {isEditing ? (
            <input
              autoFocus
              value={inlineVal}
              onChange={(e) => setInlineVal(e.target.value)}
              onBlur={commitInlineEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitInlineEdit();
                if (e.key === "Escape") setInlineEdit(null);
              }}
              className="text-[15px] font-medium bg-transparent border-0 outline-none w-full text-foreground pb-0 leading-tight"
            />
          ) : (
            <p
              className="text-[15px] font-medium text-foreground truncate cursor-text"
              onClick={(e) => {
                e.stopPropagation();
                setInlineEdit({ list, index: i });
                setInlineVal(item.name);
              }}
            >
              {cat.name}
            </p>
          )}
          <p className="text-[13px] text-muted-foreground">
            {(item?.entries?.length ?? 0)} item{(item?.entries?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </span>

        <span className="flex-1" />

        {isEditing ? (
          <button
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => { e.stopPropagation(); setInlineEdit(null); setConfirmDeleteCard({ list, index: i }); }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : (
          <>
            <span className="text-[15px] font-medium text-foreground tabular-nums shrink-0">
              ${cardValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </>
        )}
      </div>
    );
  };


  return (
    <div className="space-y-5">
      {/* Hero summary */}
      <div className="text-center pt-2 pb-1">
        <p className="text-[14px] text-primary uppercase tracking-[0.2em] font-medium mb-2">Net Worth</p>
        <p
          className={`tabular-nums ${isPositive ? "text-positive" : isNegative ? "text-expense" : "text-foreground"}`}
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
      <div className="pb-1">
        {chartData.length < 2 ? (
          <p className="text-xs text-muted-foreground text-center py-10">No history yet. Data will appear once you have more than one month recorded.</p>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="0" stroke="hsl(var(--border) / 0.25)" vertical={true} horizontal={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12, backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`${value < 0 ? "-" : ""}$${Math.abs(value).toLocaleString()}`, "Cumulative Net"]}
                />
                <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="netWorth" stroke={lineColor} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex items-center justify-between mt-3 border-t border-border pt-3">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-full transition-all ${filter === f.value ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assets section */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[17px] font-normal text-primary">Assets</h3>
          <span className="text-[17px] font-normal text-primary tabular-nums">
            ${totalAssets.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <SortableCategoryList
          items={assets.map((a, i) => ({ name: a.name, budgeted: 0, spent: 0, icon: "", _value: getCardValue(a.entries, a.value), _iconIndex: i, _entries: a.entries ?? [] } as any))}
          onReorder={(reordered) => setAssets(reordered.map((r: any, i: number) => ({ ...assets[i], name: r.name, value: r._value ?? 0, entries: r._entries ?? [] })))}
          containerId="assets"
          renderItem={(cat: any, i) => renderCard("asset", cat, i)}
        />
        {inlineAdding === "asset" ? (
          <div className="w-full mt-px rounded-xl bg-card border border-border px-3 py-1.5 flex items-center gap-2">
            <input
              autoFocus
              value={inlineAddVal}
              onChange={(e) => setInlineAddVal(e.target.value)}
              onBlur={commitInlineAdd}
              onKeyDown={(e) => { if (e.key === "Enter") commitInlineAdd(); if (e.key === "Escape") { setInlineAdding(null); setInlineAddVal(""); } }}
              placeholder="Asset name"
              className="text-[15px] font-medium bg-transparent border-0 outline-none w-full text-foreground placeholder:text-muted-foreground"
            />
          </div>
        ) : (
          <button
            onClick={() => { setInlineAdding("asset"); setInlineAddVal(""); }}
            className="w-full mt-px rounded-xl bg-card border border-border px-3 py-1.5 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors active:opacity-80"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <span className="text-[15px] font-medium">Add Asset</span>
          </button>
        )}
      </section>

      {/* Liabilities section */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[17px] font-normal text-primary">Liabilities</h3>
          <span className="text-[17px] font-normal text-primary tabular-nums">
            ${totalLiabilities.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <SortableCategoryList
          items={liabilities.map((l, i) => ({ name: l.name, budgeted: 0, spent: 0, icon: "", _value: getCardValue(l.entries, l.value), _entries: l.entries ?? [] } as any))}
          onReorder={(reordered) => setLiabilities(reordered.map((r: any, i: number) => ({ ...liabilities[i], name: r.name, value: r._value ?? 0, entries: r._entries ?? [] })))}
          containerId="liabilities"
          renderItem={(cat: any, i) => renderCard("liability", cat, i)}
        />
        {inlineAdding === "liability" ? (
          <div className="w-full mt-px rounded-xl bg-card border border-border px-3 py-1.5 flex items-center gap-2">
            <input
              autoFocus
              value={inlineAddVal}
              onChange={(e) => setInlineAddVal(e.target.value)}
              onBlur={commitInlineAdd}
              onKeyDown={(e) => { if (e.key === "Enter") commitInlineAdd(); if (e.key === "Escape") { setInlineAdding(null); setInlineAddVal(""); } }}
              placeholder="Liability name"
              className="text-[15px] font-medium bg-transparent border-0 outline-none w-full text-foreground placeholder:text-muted-foreground"
            />
          </div>
        ) : (
          <button
            onClick={() => { setInlineAdding("liability"); setInlineAddVal(""); }}
            className="w-full mt-px rounded-xl bg-card border border-border px-3 py-1.5 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors active:opacity-80"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <span className="text-[15px] font-medium">Add Liability</span>
          </button>
        )}
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

      {/* Edit / Add dialog */}
      {ed && (
        <EditItemDialog
          open={editTarget !== null}
          onClose={() => setEditTarget(null)}
          {...ed}
        />
      )}

      {/* Bottom action cards */}
      <div className="flex gap-2 pb-2">
        {latestLabel && (
          <button
            onClick={handleImport}
            className="flex-1 flex items-center gap-2 rounded-xl bg-card border border-border p-2.5 text-left active:scale-[0.98] transition-transform"
          >
            <Copy className="h-4 w-4 text-primary flex-shrink-0" />
            <div>
              <p className="text-[11px] font-medium">Import {latestLabel}</p>
              <p className="text-[9px] text-muted-foreground">Copy assets & liabilities</p>
            </div>
          </button>
        )}
        <button
          onClick={handleClear}
          className="flex-1 flex items-center gap-2 rounded-xl bg-card border border-border p-2.5 text-left active:scale-[0.98] transition-transform"
        >
          <FilePlus className="h-4 w-4 text-primary flex-shrink-0" />
          <div>
            <p className="text-[11px] font-medium">Clear</p>
            <p className="text-[9px] text-muted-foreground">Remove this month</p>
          </div>
        </button>
      </div>

      {/* Confirm overwrite dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent className="max-w-[320px] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">
              {confirmAction === "clear" ? "Clear this month?" : "Replace existing statement?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              {confirmAction === "clear"
                ? `This will delete the ${format(selectedMonth, "MMMM yyyy")} net worth statement and remove it from your history.`
                : `${format(selectedMonth, "MMMM yyyy")} already has a net worth statement. This will replace all assets and liabilities.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {confirmAction === "clear" ? "Clear" : "Replace"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm delete card dialog */}
      <AlertDialog open={!!confirmDeleteCard} onOpenChange={() => setConfirmDeleteCard(null)}>
        <AlertDialogContent className="max-w-[320px] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Delete this card?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">This will remove the card and all its items.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmDeleteCard) { handleDelete(confirmDeleteCard.list, confirmDeleteCard.index); setConfirmDeleteCard(null); } }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NetWorthTab;


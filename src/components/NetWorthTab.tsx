import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Plus, ChevronRight, TrendingUp, DollarSign, CreditCard } from "lucide-react";
import { useBudget } from "@/context/BudgetContext";
import EditItemDialog from "./EditItemDialog";

const NetWorthTab = () => {
  const { assets, liabilities, setAssets, setLiabilities } = useBudget();
  const [editing, setEditing] = useState<{ list: "asset" | "liability"; index: number } | "addAsset" | "addLiability" | null>(null);

  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.value, 0);
  const netWorth = totalAssets - totalLiabilities;

  const pieData = [
    { name: "Assets", value: totalAssets },
    { name: "Liabilities", value: totalLiabilities },
  ];
  const COLORS = ["hsl(40 55% 50%)", "hsl(0 62% 50%)"];

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
          { key: "value", label: "Value", type: "number" as const, value: 0 },
        ],
        onSave: (v: Record<string, string | number>) => handleAdd(list, v),
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

  const assetIcons = [TrendingUp, DollarSign, TrendingUp, DollarSign, TrendingUp, DollarSign];

  return (
    <div className="space-y-5">
      {/* Net Worth summary card */}
      <div className="rounded-xl bg-card border border-border p-4 text-center">
        <p className="text-[10px] text-primary uppercase tracking-wider mb-1">Net Worth</p>
        <p className="text-2xl font-bold tabular-nums text-foreground">
          ${netWorth.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
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
          <p className="text-lg font-bold tabular-nums text-destructive">
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
        <div className="space-y-2.5">
          {assets.map((a, i) => {
            const Icon = assetIcons[i % assetIcons.length];
            return (
              <button key={i} onClick={() => setEditing({ list: "asset", index: i })} className="w-full rounded-xl bg-card border border-border px-3 py-1.5 text-left active:scale-[0.98] transition-transform">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-primary">{a.name}</p>
                    <p className="text-sm font-bold tabular-nums text-foreground">
                      ${a.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
          })}
        </div>
      </section>

      {/* Liabilities section */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-foreground">Liabilities</h3>
          <button onClick={() => setEditing("addLiability")} className="text-xs text-primary font-medium flex items-center gap-0.5">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        <div className="space-y-2.5">
          {liabilities.map((l, i) => (
            <button key={i} onClick={() => setEditing({ list: "liability", index: i })} className="w-full rounded-xl bg-card border border-border px-3 py-1.5 text-left active:scale-[0.98] transition-transform">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-primary">{l.name}</p>
                  <p className="text-sm font-bold tabular-nums text-liability">
                    ${l.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
          ))}
        </div>
      </section>

      {ed && <EditItemDialog open={editing !== null} onClose={() => setEditing(null)} {...ed} />}
    </div>
  );
};

export default NetWorthTab;

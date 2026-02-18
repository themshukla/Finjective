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
      {/* Add button */}
      <button
        onClick={() => setEditing("addAsset")}
        className="w-full rounded-xl bg-card border border-border p-3 flex items-center gap-2 text-primary text-xs font-medium"
      >
        <Plus className="h-4 w-4" />
        Add assets & liabilities
      </button>

      {/* Assets section */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-foreground">Assets</h3>
          <span className="text-xs text-primary font-medium flex items-center gap-0.5">
            View all <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="space-y-2.5">
          {assets.map((a, i) => {
            const Icon = assetIcons[i % assetIcons.length];
            return (
              <button key={i} onClick={() => setEditing({ list: "asset", index: i })} className="w-full rounded-xl bg-card border border-border p-4 text-left active:scale-[0.98] transition-transform">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-primary">{a.name}</p>
                    <p className="text-lg font-bold tabular-nums text-foreground mt-0.5">
                      ${a.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
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
          <span className="text-xs text-primary font-medium flex items-center gap-0.5">
            View all <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="space-y-2.5">
          {liabilities.map((l, i) => (
            <button key={i} onClick={() => setEditing({ list: "liability", index: i })} className="w-full rounded-xl bg-card border border-border p-4 text-left active:scale-[0.98] transition-transform">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-primary">{l.name}</p>
                  <p className="text-lg font-bold tabular-nums text-liability mt-0.5">
                    ${l.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
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

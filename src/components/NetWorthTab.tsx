import { useState } from "react";
import { Plus, ChevronRight, TrendingUp, DollarSign, CreditCard } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useBudget } from "@/context/BudgetContext";
import EditItemDialog from "./EditItemDialog";
import SortableCategoryList from "./SortableCategoryList";

const NetWorthTab = () => {
  const { assets, liabilities, setAssets, setLiabilities } = useBudget();
  const [editing, setEditing] = useState<{ list: "asset" | "liability"; index: number } | "addAsset" | "addLiability" | null>(null);

  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.value, 0);
  const netWorth = totalAssets - totalLiabilities;


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

  const assetIcons = [TrendingUp, DollarSign];

  return (
    <div className="space-y-5">
      {/* Net Worth summary card */}
      <div className="space-y-2">
        <div className="rounded-xl bg-card border border-border p-4 text-center">
          <p className="text-[10px] text-primary uppercase tracking-wider mb-1">Net Worth</p>
          <p className="text-2xl font-bold tabular-nums text-foreground">
            ${netWorth.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
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

      {/* Net Worth chart */}
      <div className="rounded-xl bg-card border border-border p-3">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: "Assets", value: totalAssets },
                { name: "Liabilities", value: -totalLiabilities },
                { name: "Net Worth", value: netWorth },
              ]}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12, backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`$${Math.abs(value).toLocaleString()}`]}
              />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                <Cell fill="hsl(142 55% 45%)" />
                <Cell fill="hsl(0 72% 55%)" />
                <Cell fill={netWorth >= 0 ? "hsl(142 55% 45%)" : "hsl(0 72% 55%)"} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
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

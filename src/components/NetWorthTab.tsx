import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Plus } from "lucide-react";
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
  const COLORS = ["hsl(172 50% 36%)", "hsl(0 72% 51%)"];

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

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-card border border-border p-5 text-center">
        <p className="text-xs text-muted-foreground mb-0.5">Net Worth</p>
        <p className={`text-3xl font-bold ${netWorth >= 0 ? "text-income" : "text-expense"}`}>${netWorth.toLocaleString()}</p>
        <div className="flex justify-center gap-6 mt-2 text-xs">
          <span className="text-muted-foreground">Assets: <span className="text-asset font-semibold">${totalAssets.toLocaleString()}</span></span>
          <span className="text-muted-foreground">Debt: <span className="text-liability font-semibold">${totalLiabilities.toLocaleString()}</span></span>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-3">
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 15% 90%)", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="flex justify-between items-center p-3 pb-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assets</h3>
            <button onClick={() => setEditing("addAsset")} className="text-primary p-1"><Plus className="h-4 w-4" /></button>
          </div>
          <div className="divide-y divide-border">
            {assets.map((a, i) => (
              <button key={i} onClick={() => setEditing({ list: "asset", index: i })} className="w-full flex justify-between px-3 py-2.5 text-left active:bg-muted/50 transition-colors">
                <span className="text-xs">{a.name}</span>
                <span className="text-xs font-semibold text-asset tabular-nums">${a.value.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="flex justify-between items-center p-3 pb-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Liabilities</h3>
            <button onClick={() => setEditing("addLiability")} className="text-primary p-1"><Plus className="h-4 w-4" /></button>
          </div>
          <div className="divide-y divide-border">
            {liabilities.map((l, i) => (
              <button key={i} onClick={() => setEditing({ list: "liability", index: i })} className="w-full flex justify-between px-3 py-2.5 text-left active:bg-muted/50 transition-colors">
                <span className="text-xs">{l.name}</span>
                <span className="text-xs font-semibold text-liability tabular-nums">${l.value.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {ed && <EditItemDialog open={editing !== null} onClose={() => setEditing(null)} {...ed} />}
    </div>
  );
};

export default NetWorthTab;

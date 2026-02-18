import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus } from "lucide-react";
import { useBudget } from "@/context/BudgetContext";
import EditItemDialog from "./EditItemDialog";

const CashFlowTab = () => {
  const { cashFlow, setCashFlow } = useBudget();
  const [editing, setEditing] = useState<number | "add" | null>(null);

  const totalIncome = cashFlow.reduce((s, d) => s + d.income, 0);
  const totalExpenses = cashFlow.reduce((s, d) => s + d.expenses, 0);
  const netCashFlow = totalIncome - totalExpenses;

  const handleSave = (index: number, values: Record<string, string | number>) => {
    const arr = [...cashFlow];
    arr[index] = { month: String(values.month), income: Number(values.income), expenses: Number(values.expenses) };
    setCashFlow(arr);
  };

  const handleAdd = (values: Record<string, string | number>) => {
    setCashFlow([...cashFlow, { month: String(values.month), income: Number(values.income), expenses: Number(values.expenses) }]);
  };

  const handleDelete = (index: number) => {
    const arr = [...cashFlow];
    arr.splice(index, 1);
    setCashFlow(arr);
  };

  const getEditingData = () => {
    if (editing === null) return null;
    if (editing === "add") {
      return {
        title: "Add Month",
        fields: [
          { key: "month", label: "Month", type: "text" as const, value: "" },
          { key: "income", label: "Income", type: "number" as const, value: 0 },
          { key: "expenses", label: "Expenses", type: "number" as const, value: 0 },
        ],
        onSave: handleAdd,
      };
    }
    const m = cashFlow[editing];
    return {
      title: `Edit ${m.month}`,
      fields: [
        { key: "month", label: "Month", type: "text" as const, value: m.month },
        { key: "income", label: "Income", type: "number" as const, value: m.income },
        { key: "expenses", label: "Expenses", type: "number" as const, value: m.expenses },
      ],
      onSave: (v: Record<string, string | number>) => handleSave(editing, v),
      onDelete: () => handleDelete(editing),
    };
  };

  const ed = getEditingData();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-card p-3 border border-border">
          <p className="text-[10px] text-muted-foreground">Income</p>
          <p className="text-lg font-bold text-income tabular-nums">${totalIncome.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-card p-3 border border-border">
          <p className="text-[10px] text-muted-foreground">Expenses</p>
          <p className="text-lg font-bold text-expense tabular-nums">${totalExpenses.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-card p-3 border border-border">
          <p className="text-[10px] text-muted-foreground">Net</p>
          <p className={`text-lg font-bold tabular-nums ${netCashFlow >= 0 ? "text-income" : "text-expense"}`}>${netCashFlow.toLocaleString()}</p>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-3">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlow} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 90%)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(220 10% 46%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 46%)" }} axisLine={false} tickLine={false} width={35} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 15% 90%)", fontSize: 12 }} formatter={(value: number) => [`$${value.toLocaleString()}`]} />
              <Bar dataKey="income" name="Income" fill="hsl(152 60% 40%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="hsl(0 72% 51%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="flex justify-between items-center p-3 pb-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly</h3>
          <button onClick={() => setEditing("add")} className="text-primary p-1"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="divide-y divide-border">
          {[...cashFlow].reverse().map((m, ri) => {
            const actualIndex = cashFlow.length - 1 - ri;
            return (
              <button key={m.month} onClick={() => setEditing(actualIndex)} className="w-full flex items-center justify-between px-3 py-2.5 text-left active:bg-muted/50 transition-colors">
                <span className="font-medium text-xs">{m.month}</span>
                <div className="flex gap-4 text-xs tabular-nums">
                  <span className="text-income">+${m.income.toLocaleString()}</span>
                  <span className="text-expense">-${m.expenses.toLocaleString()}</span>
                  <span className={`font-semibold ${m.income - m.expenses >= 0 ? "text-income" : "text-expense"}`}>
                    ${(m.income - m.expenses).toLocaleString()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {ed && <EditItemDialog open={editing !== null} onClose={() => setEditing(null)} {...ed} />}
    </div>
  );
};

export default CashFlowTab;

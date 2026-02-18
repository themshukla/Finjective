import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Plus } from "lucide-react";
import { useBudget } from "@/context/BudgetContext";
import { BudgetCategory } from "@/data/budgetData";
import EditItemDialog from "./EditItemDialog";

const BudgetTab = () => {
  const { income, expenses, setIncome, setExpenses } = useBudget();
  const [editing, setEditing] = useState<{ list: "income" | "expense"; index: number } | "addIncome" | "addExpense" | null>(null);

  const totalIncome = income.reduce((s, c) => s + c.spent, 0);
  const totalBudgetedIncome = income.reduce((s, c) => s + c.budgeted, 0);
  const totalExpenses = expenses.reduce((s, c) => s + c.spent, 0);
  const totalBudgetedExpenses = expenses.reduce((s, c) => s + c.budgeted, 0);
  const remaining = totalIncome - totalExpenses;

  const handleSaveCategory = (list: "income" | "expense", index: number, values: Record<string, string | number>) => {
    const setter = list === "income" ? setIncome : setExpenses;
    const arr = list === "income" ? [...income] : [...expenses];
    arr[index] = { ...arr[index], name: String(values.name), budgeted: Number(values.budgeted), spent: Number(values.spent) };
    setter(arr);
  };

  const handleDelete = (list: "income" | "expense", index: number) => {
    const setter = list === "income" ? setIncome : setExpenses;
    const arr = list === "income" ? [...income] : [...expenses];
    arr.splice(index, 1);
    setter(arr);
  };

  const handleAdd = (list: "income" | "expense", values: Record<string, string | number>) => {
    const setter = list === "income" ? setIncome : setExpenses;
    const arr = list === "income" ? [...income] : [...expenses];
    arr.push({ name: String(values.name), budgeted: Number(values.budgeted), spent: Number(values.spent), icon: list === "income" ? "💰" : "📦" });
    setter(arr);
  };

  const getEditingData = () => {
    if (!editing) return null;
    if (editing === "addIncome" || editing === "addExpense") {
      return {
        title: editing === "addIncome" ? "Add Income" : "Add Expense",
        fields: [
          { key: "name", label: "Name", type: "text" as const, value: "" },
          { key: "budgeted", label: "Budgeted", type: "number" as const, value: 0 },
          { key: "spent", label: "Actual", type: "number" as const, value: 0 },
        ],
        onSave: (v: Record<string, string | number>) => handleAdd(editing === "addIncome" ? "income" : "expense", v),
      };
    }
    const cat = editing.list === "income" ? income[editing.index] : expenses[editing.index];
    return {
      title: `Edit ${cat.name}`,
      fields: [
        { key: "name", label: "Name", type: "text" as const, value: cat.name },
        { key: "budgeted", label: "Budgeted", type: "number" as const, value: cat.budgeted },
        { key: "spent", label: "Actual", type: "number" as const, value: cat.spent },
      ],
      onSave: (v: Record<string, string | number>) => handleSaveCategory(editing.list, editing.index, v),
      onDelete: () => handleDelete(editing.list, editing.index),
    };
  };

  const ed = getEditingData();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        <SummaryCard label="Income" amount={totalIncome} budgeted={totalBudgetedIncome} variant="income" />
        <SummaryCard label="Expenses" amount={totalExpenses} budgeted={totalBudgetedExpenses} variant="expense" />
        <SummaryCard label="Left" amount={remaining} variant={remaining >= 0 ? "income" : "expense"} />
      </div>

      <section>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Income</h3>
          <button onClick={() => setEditing("addIncome")} className="text-primary p-1"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="space-y-1.5">
          {income.map((cat, i) => (
            <CategoryRow key={i} category={cat} variant="income" onTap={() => setEditing({ list: "income", index: i })} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expenses</h3>
          <button onClick={() => setEditing("addExpense")} className="text-primary p-1"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="space-y-1.5">
          {expenses.map((cat, i) => (
            <CategoryRow key={i} category={cat} variant="expense" onTap={() => setEditing({ list: "expense", index: i })} />
          ))}
        </div>
      </section>

      {ed && <EditItemDialog open={!!editing} onClose={() => setEditing(null)} {...ed} />}
    </div>
  );
};

function SummaryCard({ label, amount, budgeted, variant }: { label: string; amount: number; budgeted?: number; variant: "income" | "expense" }) {
  return (
    <div className="rounded-xl bg-card p-3 border border-border">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${variant === "income" ? "text-income" : "text-expense"}`}>
        ${Math.abs(amount).toLocaleString()}
      </p>
      {budgeted !== undefined && <p className="text-[10px] text-muted-foreground">of ${budgeted.toLocaleString()}</p>}
    </div>
  );
}

function CategoryRow({ category, variant, onTap }: { category: BudgetCategory; variant: "income" | "expense"; onTap: () => void }) {
  const pct = Math.min((category.spent / category.budgeted) * 100, 100);
  const over = category.spent > category.budgeted;

  return (
    <button onClick={onTap} className="w-full rounded-lg bg-card border border-border p-3 flex items-center gap-2.5 text-left active:scale-[0.98] transition-transform">
      <span className="text-lg">{category.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-xs font-medium truncate">{category.name}</span>
          <span className={`text-xs font-semibold tabular-nums ${over ? "text-expense" : "text-foreground"}`}>
            ${category.spent.toLocaleString()} <span className="text-muted-foreground font-normal">/ ${category.budgeted.toLocaleString()}</span>
          </span>
        </div>
        <Progress value={pct} className={`h-1 ${over ? "[&>div]:bg-expense" : variant === "income" ? "[&>div]:bg-income" : "[&>div]:bg-primary"}`} />
      </div>
    </button>
  );
}

export default BudgetTab;

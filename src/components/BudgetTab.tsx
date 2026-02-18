import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Plus, ChevronRight } from "lucide-react";
import { useBudget } from "@/context/BudgetContext";
import { BudgetCategory } from "@/data/budgetData";
import EditItemDialog from "./EditItemDialog";
import MonthSetupPrompt from "./MonthSetupPrompt";

const BudgetTab = () => {
  const { income, expenses, setIncome, setExpenses, needsSetup } = useBudget();
  const [editing, setEditing] = useState<{ list: "income" | "expense"; index: number } | "addIncome" | "addExpense" | null>(null);

  if (needsSetup) return <MonthSetupPrompt />;

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
      {/* Balance hero */}
      <div className="text-center py-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium mb-1">Balance</p>
        <p className={`text-3xl font-bold tabular-nums ${remaining >= 0 ? "text-foreground" : "text-expense"}`}>
          ${Math.abs(remaining).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-card p-3 border border-border">
          <p className="text-[10px] text-primary uppercase tracking-wider">Income</p>
          <p className="text-lg font-bold tabular-nums text-foreground">${totalIncome.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">of ${totalBudgetedIncome.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-card p-3 border border-border">
          <p className="text-[10px] text-primary uppercase tracking-wider">Expenses</p>
          <p className="text-lg font-bold tabular-nums text-foreground">${totalExpenses.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">of ${totalBudgetedExpenses.toLocaleString()}</p>
        </div>
      </div>

      {/* Income section */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-foreground">Income</h3>
          <button onClick={() => setEditing("addIncome")} className="flex items-center gap-1 text-primary text-xs font-medium px-3 py-1.5 rounded-full bg-card border border-border">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        <div className="space-y-2.5">
          {income.map((cat, i) => (
            <CategoryCard key={i} category={cat} variant="income" onTap={() => setEditing({ list: "income", index: i })} />
          ))}
        </div>
      </section>

      {/* Expenses section */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-foreground">Expenses</h3>
          <button onClick={() => setEditing("addExpense")} className="flex items-center gap-1 text-primary text-xs font-medium px-3 py-1.5 rounded-full bg-card border border-border">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        <div className="space-y-2.5">
          {expenses.map((cat, i) => (
            <CategoryCard key={i} category={cat} variant="expense" onTap={() => setEditing({ list: "expense", index: i })} />
          ))}
        </div>
      </section>

      {ed && <EditItemDialog open={!!editing} onClose={() => setEditing(null)} {...ed} />}
    </div>
  );
};

function CategoryCard({ category, variant, onTap }: { category: BudgetCategory; variant: "income" | "expense"; onTap: () => void }) {
  const pct = Math.min((category.spent / category.budgeted) * 100, 100);
  const over = category.spent > category.budgeted;

  return (
    <button onClick={onTap} className="w-full rounded-xl bg-card border border-border p-4 text-left active:scale-[0.98] transition-transform">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-xs font-medium text-primary">{category.name}</p>
          <p className="text-lg font-bold tabular-nums text-foreground mt-0.5">
            ${category.spent.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="text-[10px]">View</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <Progress value={pct} className={`h-1 flex-1 mr-3 ${over ? "[&>div]:bg-expense" : "[&>div]:bg-primary"}`} />
        <span className={`text-[10px] tabular-nums ${over ? "text-expense" : "text-muted-foreground"}`}>
          ${category.budgeted.toLocaleString()} budget
        </span>
      </div>
    </button>
  );
}

export default BudgetTab;

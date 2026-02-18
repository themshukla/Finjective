import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Plus, ChevronRight, Trash2 } from "lucide-react";
import { useBudget } from "@/context/BudgetContext";
import { BudgetCategory } from "@/data/budgetData";
import EditItemDialog from "./EditItemDialog";
import MonthSetupPrompt from "./MonthSetupPrompt";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const BudgetTab = () => {
  const { income, expenses, setIncome, setExpenses, needsSetup, customSections, setCustomSections, addCustomSection } = useBudget();
  const [editing, setEditing] = useState<{ list: "income" | "expense"; index: number } | { list: "custom"; sectionId: string; index: number } | "addIncome" | "addExpense" | { type: "addCustomItem"; sectionId: string } | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [renamingSection, setRenamingSection] = useState<{ id: string; name: string } | null>(null);
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null);

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

  const handleSaveCustomItem = (sectionId: string, index: number, values: Record<string, string | number>) => {
    const updated = customSections.map(s => {
      if (s.id !== sectionId) return s;
      const items = [...s.items];
      items[index] = { ...items[index], name: String(values.name), budgeted: Number(values.budgeted), spent: Number(values.spent) };
      return { ...s, items };
    });
    setCustomSections(updated);
  };

  const handleDeleteCustomItem = (sectionId: string, index: number) => {
    const updated = customSections.map(s => {
      if (s.id !== sectionId) return s;
      const items = [...s.items];
      items.splice(index, 1);
      return { ...s, items };
    });
    setCustomSections(updated);
  };

  const handleAddCustomItem = (sectionId: string, values: Record<string, string | number>) => {
    const updated = customSections.map(s => {
      if (s.id !== sectionId) return s;
      return { ...s, items: [...s.items, { name: String(values.name), budgeted: Number(values.budgeted), spent: Number(values.spent), icon: "📌" }] };
    });
    setCustomSections(updated);
  };

  const handleDeleteSection = (sectionId: string) => {
    setCustomSections(customSections.filter(s => s.id !== sectionId));
  };

  const handleRenameSection = () => {
    if (!renamingSection || !renamingSection.name.trim()) return;
    setCustomSections(customSections.map(s => s.id === renamingSection.id ? { ...s, name: renamingSection.name.trim() } : s));
    setRenamingSection(null);
  };

  const handleCreateSection = () => {
    if (!newSectionName.trim()) return;
    addCustomSection(newSectionName.trim());
    setNewSectionName("");
    setShowAddSection(false);
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
    if (typeof editing === "object" && "type" in editing && editing.type === "addCustomItem") {
      const section = customSections.find(s => s.id === editing.sectionId);
      return {
        title: `Add to ${section?.name ?? "Section"}`,
        fields: [
          { key: "name", label: "Name", type: "text" as const, value: "" },
          { key: "budgeted", label: "Budgeted", type: "number" as const, value: 0 },
          { key: "spent", label: "Actual", type: "number" as const, value: 0 },
        ],
        onSave: (v: Record<string, string | number>) => handleAddCustomItem(editing.sectionId, v),
      };
    }
    if (typeof editing === "object" && "list" in editing && editing.list === "custom") {
      const section = customSections.find(s => s.id === editing.sectionId);
      const cat = section?.items[editing.index];
      if (!cat) return null;
      return {
        title: `Edit ${cat.name}`,
        fields: [
          { key: "name", label: "Name", type: "text" as const, value: cat.name },
          { key: "budgeted", label: "Budgeted", type: "number" as const, value: cat.budgeted },
          { key: "spent", label: "Actual", type: "number" as const, value: cat.spent },
        ],
        onSave: (v: Record<string, string | number>) => handleSaveCustomItem(editing.sectionId, editing.index, v),
        onDelete: () => handleDeleteCustomItem(editing.sectionId, editing.index),
      };
    }
    if (typeof editing === "object" && "list" in editing) {
      const cat = editing.list === "income" ? income[editing.index] : expenses[editing.index];
      return {
        title: `Edit ${cat.name}`,
        fields: [
          { key: "name", label: "Name", type: "text" as const, value: cat.name },
          { key: "budgeted", label: "Budgeted", type: "number" as const, value: cat.budgeted },
          { key: "spent", label: "Actual", type: "number" as const, value: cat.spent },
        ],
        onSave: (v: Record<string, string | number>) => handleSaveCategory(editing.list as "income" | "expense", editing.index, v),
        onDelete: () => handleDelete(editing.list as "income" | "expense", editing.index),
      };
    }
    return null;
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

      {/* Add Section button */}
      <div className="flex justify-center">
        <button onClick={() => setShowAddSection(true)} className="flex items-center gap-1.5 text-primary text-xs font-medium px-4 py-2 rounded-full bg-card border border-border border-dashed">
          <Plus className="h-3.5 w-3.5" /> Add Section
        </button>
      </div>

      {/* Custom standalone sections */}
      {customSections.map(section => {
        const sectionTotal = section.items.reduce((s, c) => s + c.spent, 0);
        const sectionBudgeted = section.items.reduce((s, c) => s + c.budgeted, 0);
        return (
          <section key={section.id}>
            <div className="flex justify-between items-center mb-3">
              <button onClick={() => setRenamingSection({ id: section.id, name: section.name })} className="flex items-center gap-2 active:opacity-70 transition-opacity">
                <h3 className="text-sm font-bold text-foreground">{section.name}</h3>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  ${sectionTotal.toLocaleString()} / ${sectionBudgeted.toLocaleString()}
                </span>
              </button>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditing({ type: "addCustomItem", sectionId: section.id })} className="flex items-center gap-1 text-primary text-xs font-medium px-3 py-1.5 rounded-full bg-card border border-border">
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
                <button onClick={() => setDeletingSectionId(section.id)} className="text-muted-foreground hover:text-expense p-1.5 rounded-full transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="space-y-2.5">
              {section.items.map((cat, i) => (
                <CategoryCard key={i} category={cat} variant="income" onTap={() => setEditing({ list: "custom", sectionId: section.id, index: i })} />
              ))}
              {section.items.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No items yet. Tap "Add" to get started.</p>
              )}
            </div>
          </section>
        );
      })}

      {/* Add Section Dialog */}
      <Dialog open={showAddSection} onOpenChange={setShowAddSection}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">New Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <Input
              placeholder="Section name"
              value={newSectionName}
              onChange={e => setNewSectionName(e.target.value)}
              className="h-10"
              onKeyDown={e => e.key === "Enter" && handleCreateSection()}
            />
            <Button size="sm" className="w-full" onClick={handleCreateSection}>
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Section Dialog */}
      <Dialog open={!!renamingSection} onOpenChange={(open) => !open && setRenamingSection(null)}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Rename Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <Input
              placeholder="Section name"
              value={renamingSection?.name ?? ""}
              onChange={e => setRenamingSection(prev => prev ? { ...prev, name: e.target.value } : null)}
              className="h-10"
              onKeyDown={e => e.key === "Enter" && handleRenameSection()}
            />
            <Button size="sm" className="w-full" onClick={handleRenameSection}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Section Confirm */}
      <AlertDialog open={!!deletingSectionId} onOpenChange={(open) => !open && setDeletingSectionId(null)}>
        <AlertDialogContent className="max-w-[340px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete section?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the section and all its items. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (deletingSectionId) handleDeleteSection(deletingSectionId); setDeletingSectionId(null); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {ed && <EditItemDialog open={!!editing} onClose={() => setEditing(null)} {...ed} />}
    </div>
  );
};

function CategoryCard({ category, variant, onTap }: { category: BudgetCategory; variant: "income" | "expense"; onTap: () => void }) {
  const pct = category.budgeted > 0 ? Math.min((category.spent / category.budgeted) * 100, 100) : 0;
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

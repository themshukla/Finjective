import { useState, useCallback, useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Plus, ChevronRight, Trash2 } from "lucide-react";
import { useBudget } from "@/context/BudgetContext";
import { BudgetCategory, Transaction } from "@/data/budgetData";
import EditItemDialog from "./EditItemDialog";
import TransactionsDialog from "./TransactionsDialog";
import MonthSetupPrompt from "./MonthSetupPrompt";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useSensor,
  useSensors,
  TouchSensor,
  MouseSensor,
  KeyboardSensor,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

const INCOME_ID = "__income__";
const EXPENSES_ID = "__expenses__";
const dndModifiers = [restrictToVerticalAxis];

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, transition: null });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : "auto",
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

function DroppableSection({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`space-y-px min-h-[20px] rounded-lg transition-colors ${isOver ? "bg-primary/5" : ""}`}>
      {children}
    </div>
  );
}

const BudgetTab = () => {
  const { income, expenses, setIncome, setExpenses, needsSetup, customSections, setCustomSections, addCustomSection } = useBudget();
  const [editing, setEditing] = useState<{ list: "income" | "expense"; index: number } | { list: "custom"; sectionId: string; index: number } | "addIncome" | "addExpense" | { type: "addCustomItem"; sectionId: string } | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [renamingSection, setRenamingSection] = useState<{ id: string; name: string } | null>(null);
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null);
  const [viewingTransactions, setViewingTransactions] = useState<{ list: "income" | "expense"; index: number } | { list: "custom"; sectionId: string; index: number } | null>(null);
  const [activeItemData, setActiveItemData] = useState<{ category: BudgetCategory; variant: "income" | "expense" } | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(MouseSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Generate stable item IDs
  const makeId = (containerId: string, index: number) => `${containerId}::${index}`;
  const parseId = (id: string) => {
    const sep = id.lastIndexOf("::");
    if (sep === -1) return null;
    return { containerId: id.substring(0, sep), index: parseInt(id.substring(sep + 2)) };
  };

  const incomeIds = useMemo(() => income.map((_, i) => makeId(INCOME_ID, i)), [income]);
  const expenseIds = useMemo(() => expenses.map((_, i) => makeId(EXPENSES_ID, i)), [expenses]);
  const customIds = useMemo(() => {
    const map: Record<string, string[]> = {};
    customSections.forEach(s => { map[s.id] = s.items.map((_, i) => makeId(s.id, i)); });
    return map;
  }, [customSections]);

  const allIds = useMemo(() => [...incomeIds, ...expenseIds, ...Object.values(customIds).flat()], [incomeIds, expenseIds, customIds]);

  const getContainerItems = useCallback((containerId: string): BudgetCategory[] => {
    if (containerId === INCOME_ID) return income;
    if (containerId === EXPENSES_ID) return expenses;
    return customSections.find(s => s.id === containerId)?.items ?? [];
  }, [income, expenses, customSections]);

  const setContainerItems = useCallback((containerId: string, items: BudgetCategory[]) => {
    if (containerId === INCOME_ID) { setIncome(items); return; }
    if (containerId === EXPENSES_ID) { setExpenses(items); return; }
    setCustomSections(customSections.map(s => s.id === containerId ? { ...s, items } : s));
  }, [setIncome, setExpenses, customSections, setCustomSections]);

  const findContainerOfItem = useCallback((itemId: string): string | null => {
    const parsed = parseId(itemId);
    if (parsed) return parsed.containerId;
    // Check if it's a container ID itself (droppable)
    if (itemId === INCOME_ID || itemId === EXPENSES_ID) return itemId;
    if (customSections.some(s => s.id === itemId)) return itemId;
    return null;
  }, [customSections]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const parsed = parseId(String(event.active.id));
    if (!parsed) return;
    const items = getContainerItems(parsed.containerId);
    const cat = items[parsed.index];
    if (cat) {
      const variant = parsed.containerId === INCOME_ID ? "income" : "expense";
      setActiveItemData({ category: cat, variant: variant as "income" | "expense" });
    }
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(30);
    }
  }, [getContainerItems]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveItemData(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeParsed = parseId(activeId);
    if (!activeParsed) return;

    const sourceContainer = activeParsed.containerId;
    // Determine target container: could be an item ID or a droppable container ID
    const overParsed = parseId(overId);
    const targetContainer = overParsed ? overParsed.containerId : findContainerOfItem(overId);
    if (!targetContainer) return;

    if (sourceContainer === targetContainer) {
      // Reorder within same container
      if (!overParsed) return;
      const items = getContainerItems(sourceContainer);
      const oldIndex = activeParsed.index;
      const newIndex = overParsed.index;
      if (oldIndex === newIndex) return;
      setContainerItems(sourceContainer, arrayMove([...items], oldIndex, newIndex));
    } else {
      // Cross-container move
      const sourceItems = [...getContainerItems(sourceContainer)];
      const targetItems = [...getContainerItems(targetContainer)];
      const [movedItem] = sourceItems.splice(activeParsed.index, 1);
      const insertIndex = overParsed ? overParsed.index : targetItems.length;
      targetItems.splice(insertIndex, 0, movedItem);

      // Update source
      if (sourceContainer === INCOME_ID) setIncome(sourceItems);
      else if (sourceContainer === EXPENSES_ID) setExpenses(sourceItems);

      // Update target
      if (targetContainer === INCOME_ID) setIncome(targetItems);
      else if (targetContainer === EXPENSES_ID) setExpenses(targetItems);

      // Handle custom sections (both source and target may be custom)
      const sourceIsCustom = sourceContainer !== INCOME_ID && sourceContainer !== EXPENSES_ID;
      const targetIsCustom = targetContainer !== INCOME_ID && targetContainer !== EXPENSES_ID;
      if (sourceIsCustom || targetIsCustom) {
        const updated = customSections.map(s => {
          if (s.id === sourceContainer) return { ...s, items: sourceItems };
          if (s.id === targetContainer) return { ...s, items: targetItems };
          return s;
        });
        setCustomSections(updated);
      }
    }
  }, [getContainerItems, findContainerOfItem, setContainerItems, setIncome, setExpenses, setCustomSections]);

  const handleDragCancel = useCallback(() => {
    setActiveItemData(null);
  }, []);

  if (needsSetup) return <MonthSetupPrompt />;

  const txTotal = (c: BudgetCategory) => (c.transactions ?? []).reduce((s, t) => s + t.amount, 0);

  const totalIncome = income.reduce((s, c) => s + txTotal(c), 0);
  const totalBudgetedIncome = income.reduce((s, c) => s + c.budgeted, 0);
  const totalExpenses = expenses.reduce((s, c) => s + txTotal(c), 0);
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
      <div className="space-y-px">
        <div className="rounded-xl bg-card border border-border p-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium mb-1">Balance</p>
          <p className={`text-2xl font-bold tabular-nums ${(totalBudgetedIncome - totalBudgetedExpenses) >= 0 ? "text-foreground" : "text-expense"}`}>
            ${Math.abs(totalBudgetedIncome - totalBudgetedExpenses).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex justify-center gap-4 mt-1">
            <p className={`text-[10px] tabular-nums ${remaining >= 0 ? "text-muted-foreground" : "text-expense"}`}>
              ${Math.abs(remaining).toLocaleString("en-US", { minimumFractionDigits: 2 })} actual
            </p>
            <p className={`text-[10px] font-semibold tabular-nums ${((totalBudgetedIncome - totalBudgetedExpenses) - remaining) >= 0 ? "text-green-500" : "text-expense"}`}>
              {((totalBudgetedIncome - totalBudgetedExpenses) - remaining) < 0 ? "-" : ""}${Math.abs((totalBudgetedIncome - totalBudgetedExpenses) - remaining).toLocaleString("en-US", { minimumFractionDigits: 2 })} remaining
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px">
          <div className="rounded-xl bg-card p-3 border border-border">
            <p className="text-[10px] text-primary uppercase tracking-wider">Income</p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-lg font-bold tabular-nums text-foreground">${totalBudgetedIncome.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">${totalIncome.toLocaleString()} actual</p>
              </div>
              <div className="text-right">
                <p className={`text-[10px] font-semibold tabular-nums ${(totalBudgetedIncome - totalIncome) >= 0 ? "text-green-500" : "text-expense"}`}>
                  {(totalBudgetedIncome - totalIncome) < 0 ? "-" : ""}${Math.abs(totalBudgetedIncome - totalIncome).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-muted-foreground">remaining</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-card p-3 border border-border">
            <p className="text-[10px] text-primary uppercase tracking-wider">Expenses</p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-lg font-bold tabular-nums text-foreground">${totalBudgetedExpenses.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">${totalExpenses.toLocaleString()} actual</p>
              </div>
              <div className="text-right">
                <p className={`text-[10px] font-semibold tabular-nums ${(totalBudgetedExpenses - totalExpenses) >= 0 ? "text-green-500" : "text-expense"}`}>
                  {(totalBudgetedExpenses - totalExpenses) < 0 ? "-" : ""}${Math.abs(totalBudgetedExpenses - totalExpenses).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-muted-foreground">remaining</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        modifiers={dndModifiers}
      >
        {/* Income section */}
        <section>
          <div className="flex justify-between items-center mb-px rounded-xl bg-muted border border-border px-3 py-1.5 -mx-1.5">
            <h3 className="text-sm font-bold text-primary">Income</h3>
            <button onClick={() => setEditing("addIncome")} className="flex items-center gap-1 text-primary text-xs font-medium">
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
          <DroppableSection id={INCOME_ID}>
            <SortableContext items={incomeIds} strategy={verticalListSortingStrategy}>
              {income.map((cat, i) => (
                <SortableItem key={incomeIds[i]} id={incomeIds[i]}>
                  <CategoryCard category={cat} variant="income" onTap={() => setEditing({ list: "income", index: i })} onTransactions={() => setViewingTransactions({ list: "income", index: i })} />
                </SortableItem>
              ))}
            </SortableContext>
          </DroppableSection>
        </section>

        {/* Expenses section */}
        <section className="mt-5">
          <div className="flex justify-between items-center mb-px rounded-xl bg-muted border border-border px-3 py-1.5 -mx-1.5">
            <h3 className="text-sm font-bold text-primary">Expenses</h3>
            <button onClick={() => setEditing("addExpense")} className="flex items-center gap-1 text-primary text-xs font-medium">
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
          <DroppableSection id={EXPENSES_ID}>
            <SortableContext items={expenseIds} strategy={verticalListSortingStrategy}>
              {expenses.map((cat, i) => (
                <SortableItem key={expenseIds[i]} id={expenseIds[i]}>
                  <CategoryCard category={cat} variant="expense" onTap={() => setEditing({ list: "expense", index: i })} onTransactions={() => setViewingTransactions({ list: "expense", index: i })} />
                </SortableItem>
              ))}
            </SortableContext>
          </DroppableSection>
        </section>

        {customSections.length === 0 && (
          <div className="flex justify-center mt-5">
            <button onClick={() => setShowAddSection(true)} className="flex items-center gap-1.5 text-primary text-xs font-medium px-4 py-2 rounded-full bg-card border border-border border-dashed">
              <Plus className="h-3.5 w-3.5" /> Add Section
            </button>
          </div>
        )}

        {/* Custom standalone sections */}
        {customSections.map(section => {
          const sectionTotal = section.items.reduce((s, c) => s + txTotal(c), 0);
          const sectionBudgeted = section.items.reduce((s, c) => s + c.budgeted, 0);
          const sectionItemIds = customIds[section.id] ?? [];
          return (
            <section key={section.id} className="mt-5">
              <div className="flex justify-between items-center mb-px rounded-xl bg-muted border border-border px-3 py-1.5 -mx-1.5">
                <button onClick={() => setRenamingSection({ id: section.id, name: section.name })} className="flex items-center gap-2 active:opacity-70 transition-opacity">
                  <h3 className="text-sm font-bold text-primary">{section.name}</h3>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    ${sectionBudgeted.toLocaleString()} / ${sectionTotal.toLocaleString()} actual
                  </span>
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditing({ type: "addCustomItem", sectionId: section.id })} className="flex items-center gap-1 text-primary text-xs font-medium">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                  <button onClick={() => setDeletingSectionId(section.id)} className="text-muted-foreground hover:text-expense p-1 rounded-full transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <DroppableSection id={section.id}>
                <SortableContext items={sectionItemIds} strategy={verticalListSortingStrategy}>
                  {section.items.map((cat, i) => (
                    <SortableItem key={sectionItemIds[i]} id={sectionItemIds[i]}>
                      <CategoryCard category={cat} variant="income" onTap={() => setEditing({ list: "custom", sectionId: section.id, index: i })} onTransactions={() => setViewingTransactions({ list: "custom", sectionId: section.id, index: i })} />
                    </SortableItem>
                  ))}
                  {section.items.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No items yet. Tap "Add" or drag items here.</p>
                  )}
                </SortableContext>
              </DroppableSection>
            </section>
          );
        })}

        {customSections.length > 0 && (
          <div className="flex justify-center mt-5">
            <button onClick={() => setShowAddSection(true)} className="flex items-center gap-1.5 text-primary text-xs font-medium px-4 py-2 rounded-full bg-card border border-border border-dashed">
              <Plus className="h-3.5 w-3.5" /> Add Section
            </button>
          </div>
        )}

        <DragOverlay dropAnimation={null}>
          {activeItemData ? (
            <div className="scale-[1.03] shadow-xl shadow-primary/10 rounded-xl ring-2 ring-primary/20">
              <CategoryCard category={activeItemData.category} variant={activeItemData.variant} onTap={() => {}} onTransactions={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Import / Reset options */}
      <MonthSetupPrompt compact />

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

      {viewingTransactions && (() => {
        const vt = viewingTransactions;
        let cat: BudgetCategory | undefined;
        if (vt.list === "custom" && "sectionId" in vt) {
          cat = customSections.find(s => s.id === vt.sectionId)?.items[vt.index];
        } else {
          cat = vt.list === "income" ? income[vt.index] : expenses[vt.index];
        }
        if (!cat) return null;
        return (
          <TransactionsDialog
            open
            onClose={() => setViewingTransactions(null)}
            categoryName={cat.name}
            transactions={cat.transactions ?? []}
            onUpdate={(txs: Transaction[]) => {
              if (vt.list === "custom" && "sectionId" in vt) {
                const updated = customSections.map(s => {
                  if (s.id !== vt.sectionId) return s;
                  const items = [...s.items];
                  items[vt.index] = { ...items[vt.index], transactions: txs };
                  return { ...s, items };
                });
                setCustomSections(updated);
              } else {
                const setter = vt.list === "income" ? setIncome : setExpenses;
                const arr = vt.list === "income" ? [...income] : [...expenses];
                arr[vt.index] = { ...arr[vt.index], transactions: txs };
                setter(arr);
              }
            }}
          />
        );
      })()}
    </div>
  );
};

function CategoryCard({ category, variant, onTap, onTransactions }: { category: BudgetCategory; variant: "income" | "expense"; onTap: () => void; onTransactions: () => void }) {
  const spent = (category.transactions ?? []).reduce((s, t) => s + t.amount, 0);
  const budgeted = isNaN(category.budgeted) ? 0 : category.budgeted;
  const pct = budgeted > 0 ? (spent / budgeted) * 100 : 0;
  const barPct = Math.min(pct, 100);
  const over = spent > budgeted;
  const remainingAmt = budgeted - spent;

  return (
    <button onClick={onTap} className="w-full rounded-xl bg-card border border-border px-3 py-1 text-left active:scale-[0.98] transition-transform">
      <div className="flex justify-between items-start">
        <div className="leading-tight">
          <p className="text-xs font-medium text-primary">{category.name}</p>
          <p className="text-sm font-bold tabular-nums text-foreground leading-none mt-0.5">
            ${budgeted.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-muted-foreground tabular-nums leading-none mt-0.5">
            ${spent.toLocaleString("en-US", { minimumFractionDigits: 2 })} actual
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div
            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
            onClick={(e) => { e.stopPropagation(); onTransactions(); }}
            role="button"
          >
            <span className="text-xs">Transactions</span>
            {(category.transactions ?? []).length > 0 && (
              <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full border border-primary bg-card text-primary text-[9px] font-bold">
                {(category.transactions ?? []).length}
              </span>
            )}
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
          <p className={`text-[10px] font-semibold tabular-nums leading-none mt-0.5 ${remainingAmt >= 0 ? "text-green-500" : "text-expense"}`}>
            {remainingAmt < 0 ? "-" : ""}${Math.abs(remainingAmt).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-muted-foreground leading-none mt-0.5">remaining</p>
        </div>
      </div>
      <div className="flex justify-between items-center mt-0.5">
        <Progress value={barPct} className={`h-1 flex-1 mr-3 ${over ? "[&>div]:bg-expense" : "[&>div]:bg-green-500"}`} />
        <span className={`text-[10px] tabular-nums ${over ? "text-expense" : "text-green-500"}`}>
          {pct.toFixed(0)}% spent
        </span>
      </div>
    </button>
  );
}

export default BudgetTab;

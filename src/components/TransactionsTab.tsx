import { useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { Transaction, BudgetCategory, CustomSection } from "@/data/budgetData";
import { format, parseISO } from "date-fns";
import { Plus, CalendarIcon, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface TransactionWithCategory extends Transaction {
  categoryName: string;
  type: "income" | "expense" | "custom";
}

interface CategoryOption {
  label: string;
  value: string;
  list: "income" | "expense";
  index: number;
}

interface CustomCategoryOption {
  label: string;
  value: string;
  list: "custom";
  sectionId: string;
  index: number;
}

type AnyOption = CategoryOption | CustomCategoryOption;

const safeSpent = (v: number) => (isNaN(v) ? 0 : v);

// Pure helpers that work on data arrays (no stale closure issues)
const removeTxFromArrays = (
  txId: string,
  incomeArr: BudgetCategory[],
  expensesArr: BudgetCategory[],
  customArr: CustomSection[]
) => {
  for (let i = 0; i < incomeArr.length; i++) {
    const txs = incomeArr[i].transactions ?? [];
    const txIdx = txs.findIndex(t => t.id === txId);
    if (txIdx !== -1) {
      const newIncome = [...incomeArr];
      newIncome[i] = { ...newIncome[i], spent: safeSpent(newIncome[i].spent) - txs[txIdx].amount, transactions: txs.filter(t => t.id !== txId) };
      return { income: newIncome, expenses: expensesArr, custom: customArr };
    }
  }
  for (let i = 0; i < expensesArr.length; i++) {
    const txs = expensesArr[i].transactions ?? [];
    const txIdx = txs.findIndex(t => t.id === txId);
    if (txIdx !== -1) {
      const newExpenses = [...expensesArr];
      newExpenses[i] = { ...newExpenses[i], spent: safeSpent(newExpenses[i].spent) - txs[txIdx].amount, transactions: txs.filter(t => t.id !== txId) };
      return { income: incomeArr, expenses: newExpenses, custom: customArr };
    }
  }
  for (const section of customArr) {
    for (let i = 0; i < section.items.length; i++) {
      const txs = section.items[i].transactions ?? [];
      const txIdx = txs.findIndex(t => t.id === txId);
      if (txIdx !== -1) {
        const newCustom = customArr.map(s => {
          if (s.id !== section.id) return s;
          const items = [...s.items];
          items[i] = { ...items[i], spent: safeSpent(items[i].spent) - txs[txIdx].amount, transactions: txs.filter(t => t.id !== txId) };
          return { ...s, items };
        });
        return { income: incomeArr, expenses: expensesArr, custom: newCustom };
      }
    }
  }
  return { income: incomeArr, expenses: expensesArr, custom: customArr };
};

const addTxToTarget = (
  tx: Transaction,
  opt: AnyOption,
  incomeArr: BudgetCategory[],
  expensesArr: BudgetCategory[],
  customArr: CustomSection[]
) => {
  if (opt.list === "custom" && "sectionId" in opt) {
    const newCustom = customArr.map(s => {
      if (s.id !== opt.sectionId) return s;
      const items = [...s.items];
      items[opt.index] = {
        ...items[opt.index],
        spent: safeSpent(items[opt.index].spent) + tx.amount,
        transactions: [...(items[opt.index].transactions ?? []), tx],
      };
      return { ...s, items };
    });
    return { income: incomeArr, expenses: expensesArr, custom: newCustom };
  }
  const arr = opt.list === "income" ? [...incomeArr] : [...expensesArr];
  arr[opt.index] = {
    ...arr[opt.index],
    spent: safeSpent(arr[opt.index].spent) + tx.amount,
    transactions: [...(arr[opt.index].transactions ?? []), tx],
  };
  return {
    income: opt.list === "income" ? arr : incomeArr,
    expenses: opt.list === "expense" ? arr : expensesArr,
    custom: customArr,
  };
};

const updateTxInArrays = (
  txId: string,
  updatedTx: Transaction,
  incomeArr: BudgetCategory[],
  expensesArr: BudgetCategory[],
  customArr: CustomSection[]
) => {
  for (let i = 0; i < incomeArr.length; i++) {
    const txs = incomeArr[i].transactions ?? [];
    const txIdx = txs.findIndex(t => t.id === txId);
    if (txIdx !== -1) {
      const newIncome = [...incomeArr];
      const oldAmount = txs[txIdx].amount;
      const newTxs = [...txs];
      newTxs[txIdx] = updatedTx;
      newIncome[i] = { ...newIncome[i], spent: safeSpent(newIncome[i].spent) - oldAmount + updatedTx.amount, transactions: newTxs };
      return { income: newIncome, expenses: expensesArr, custom: customArr };
    }
  }
  for (let i = 0; i < expensesArr.length; i++) {
    const txs = expensesArr[i].transactions ?? [];
    const txIdx = txs.findIndex(t => t.id === txId);
    if (txIdx !== -1) {
      const newExpenses = [...expensesArr];
      const oldAmount = txs[txIdx].amount;
      const newTxs = [...txs];
      newTxs[txIdx] = updatedTx;
      newExpenses[i] = { ...newExpenses[i], spent: safeSpent(newExpenses[i].spent) - oldAmount + updatedTx.amount, transactions: newTxs };
      return { income: incomeArr, expenses: newExpenses, custom: customArr };
    }
  }
  for (const section of customArr) {
    for (let i = 0; i < section.items.length; i++) {
      const txs = section.items[i].transactions ?? [];
      const txIdx = txs.findIndex(t => t.id === txId);
      if (txIdx !== -1) {
        const oldAmount = txs[txIdx].amount;
        const newCustom = customArr.map(s => {
          if (s.id !== section.id) return s;
          const items = [...s.items];
          const newTxs = [...txs];
          newTxs[txIdx] = updatedTx;
          items[i] = { ...items[i], spent: safeSpent(items[i].spent) - oldAmount + updatedTx.amount, transactions: newTxs };
          return { ...s, items };
        });
        return { income: incomeArr, expenses: expensesArr, custom: newCustom };
      }
    }
  }
  return { income: incomeArr, expenses: expensesArr, custom: customArr };
};

const TransactionsTab = () => {
  const { income, expenses, customSections, setIncome, setExpenses, setCustomSections, needsSetup } = useBudget();
  const [showAdd, setShowAdd] = useState(false);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedCategory, setSelectedCategory] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [editingTx, setEditingTx] = useState<TransactionWithCategory | null>(null);
  const [editMerchant, setEditMerchant] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState<Date | undefined>(new Date());
  const [editCalendarOpen, setEditCalendarOpen] = useState(false);
  const [editCategory, setEditCategory] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (needsSetup) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Set up your budget first to see transactions.
      </div>
    );
  }

  // Build category options
  const categoryOptions: AnyOption[] = [];
  income.forEach((cat, i) => categoryOptions.push({ label: `${cat.name} (Income)`, value: `income-${i}`, list: "income", index: i }));
  expenses.forEach((cat, i) => categoryOptions.push({ label: `${cat.name} (Expense)`, value: `expense-${i}`, list: "expense", index: i }));
  customSections.forEach((section) => {
    section.items.forEach((cat, i) => categoryOptions.push({ label: `${cat.name} (${section.name})`, value: `custom-${section.id}-${i}`, list: "custom", sectionId: section.id, index: i } as CustomCategoryOption));
  });

  const applyState = (state: { income: BudgetCategory[]; expenses: BudgetCategory[]; custom: CustomSection[] }) => {
    setIncome(state.income);
    setExpenses(state.expenses);
    setCustomSections(state.custom);
  };

  const handleAddTransaction = () => {
    if (!date || !amount || !merchant.trim() || !selectedCategory) return;
    const opt = categoryOptions.find(o => o.value === selectedCategory);
    if (!opt) return;

    const newTx: Transaction = {
      id: Date.now().toString(),
      date: format(date, "yyyy-MM-dd"),
      amount: Number(amount),
      merchant: merchant.trim(),
    };

    const state = addTxToTarget(newTx, opt, income, expenses, customSections);
    applyState(state);

    setShowAdd(false);
    setMerchant("");
    setAmount("");
    setDate(new Date());
    setSelectedCategory("");
  };

  const findCategoryOptionForTx = (txId: string): string => {
    for (let i = 0; i < income.length; i++) {
      if (income[i].transactions?.some(t => t.id === txId)) return `income-${i}`;
    }
    for (let i = 0; i < expenses.length; i++) {
      if (expenses[i].transactions?.some(t => t.id === txId)) return `expense-${i}`;
    }
    for (const section of customSections) {
      for (let i = 0; i < section.items.length; i++) {
        if (section.items[i].transactions?.some(t => t.id === txId)) return `custom-${section.id}-${i}`;
      }
    }
    return "";
  };

  const openEditDialog = (tx: TransactionWithCategory) => {
    setEditingTx(tx);
    setEditMerchant(tx.merchant);
    setEditAmount(String(tx.amount));
    setEditCategory(findCategoryOptionForTx(tx.id));
    try {
      setEditDate(parseISO(tx.date));
    } catch {
      setEditDate(new Date());
    }
  };

  const handleSaveEdit = () => {
    if (!editingTx || !editDate || !editAmount || !editMerchant.trim() || !editCategory) return;

    const originalCatValue = findCategoryOptionForTx(editingTx.id);
    const newTx: Transaction = {
      id: editingTx.id,
      date: format(editDate, "yyyy-MM-dd"),
      amount: Number(editAmount),
      merchant: editMerchant.trim(),
    };

    if (editCategory === originalCatValue) {
      // Same category — update in place
      const state = updateTxInArrays(editingTx.id, newTx, income, expenses, customSections);
      applyState(state);
    } else {
      // Category changed — remove from old, add to new in one pass
      let state = removeTxFromArrays(editingTx.id, income, expenses, customSections);
      const opt = categoryOptions.find(o => o.value === editCategory);
      if (opt) {
        state = addTxToTarget(newTx, opt, state.income, state.expenses, state.custom);
      }
      applyState(state);
    }
    setEditingTx(null);
  };

  const handleDeleteTx = () => {
    if (!editingTx) return;
    const state = removeTxFromArrays(editingTx.id, income, expenses, customSections);
    applyState(state);
    setEditingTx(null);
    setShowDeleteConfirm(false);
  };

  // Collect all transactions
  const allTransactions: TransactionWithCategory[] = [];
  income.forEach((cat) => {
    cat.transactions?.forEach((tx) => {
      allTransactions.push({ ...tx, categoryName: cat.name, type: "income" });
    });
  });
  expenses.forEach((cat) => {
    cat.transactions?.forEach((tx) => {
      allTransactions.push({ ...tx, categoryName: cat.name, type: "expense" });
    });
  });
  customSections.forEach((section) => {
    section.items.forEach((cat) => {
      cat.transactions?.forEach((tx) => {
        allTransactions.push({ ...tx, categoryName: cat.name, type: "custom" });
      });
    });
  });

  allTransactions.sort((a, b) => b.date.localeCompare(a.date));

  const grouped: Record<string, TransactionWithCategory[]> = {};
  allTransactions.forEach((tx) => {
    const key = tx.date;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(tx);
  });
  const dateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-card border border-border p-4 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium mb-1">
          Total Transactions
        </p>
        <p className="text-2xl font-bold tabular-nums text-foreground">
          {allTransactions.length}
        </p>
        <p className="text-sm font-semibold tabular-nums text-muted-foreground">
          ${allTransactions.reduce((s, t) => s + t.amount, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} total amount
        </p>
      </div>

      <div className="flex justify-center">
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-primary text-xs font-medium px-3 py-1.5 rounded-full bg-card border border-border">
          <Plus className="h-3.5 w-3.5" /> Add Transaction
        </button>
      </div>

      {allTransactions.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-6">
          No transactions yet. Tap "Add Transaction" to get started.
        </p>
      )}

      {dateKeys.map((dateKey) => {
        const txs = grouped[dateKey];
        const dayTotal = txs.reduce((s, t) => s + t.amount, 0);
        let formattedDate: string;
        try {
          formattedDate = format(parseISO(dateKey), "EEE, MMM d, yyyy");
        } catch {
          formattedDate = dateKey;
        }

        return (
          <section key={dateKey}>
            <div className="flex justify-between items-center mb-2 px-1">
              <h3 className="text-xs font-bold text-foreground">{formattedDate}</h3>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                ${dayTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="space-y-1.5">
              {txs.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => openEditDialog(tx)}
                  className="w-full rounded-xl bg-card border border-border px-3 py-2 flex justify-between items-center text-left active:scale-[0.98] transition-transform"
                >
                  <div>
                    <p className="text-xs font-medium text-foreground">{tx.merchant}</p>
                    <p className="text-[10px] text-primary">{tx.categoryName}</p>
                  </div>
                  <p className={`text-xs font-semibold tabular-nums ${tx.type === "income" ? "text-green-500" : "text-foreground"}`}>
                    {tx.type === "income" ? "+" : "-"}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </button>
              ))}
            </div>
          </section>
        );
      })}

      {/* Add Transaction Dialog */}
      <Dialog open={showAdd} onOpenChange={(o) => !o && setShowAdd(false)}>
        <DialogContent className="max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Add Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Merchant</Label>
              <Input placeholder="e.g. Starbucks" value={merchant} onChange={e => setMerchant(e.target.value)} className="mt-1 h-9" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Amount</Label>
              <Input type="number" placeholder="$0.00" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 h-9" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full mt-1 h-9 justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {date ? format(date, "MMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="p-3 pointer-events-auto" />
                  <div className="p-2 pt-0">
                    <Button size="sm" className="w-full" onClick={() => setCalendarOpen(false)}>Done</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button size="sm" className="flex-1" onClick={handleAddTransaction}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={!!editingTx} onOpenChange={(o) => !o && setEditingTx(null)}>
        <DialogContent className="max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Merchant</Label>
              <Input value={editMerchant} onChange={e => setEditMerchant(e.target.value)} className="mt-1 h-9" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Amount</Label>
              <Input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="mt-1 h-9" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Popover open={editCalendarOpen} onOpenChange={setEditCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full mt-1 h-9 justify-start text-left font-normal", !editDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {editDate ? format(editDate, "MMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={editDate} onSelect={setEditDate} initialFocus className="p-3 pointer-events-auto" />
                  <div className="p-2 pt-0">
                    <Button size="sm" className="w-full" onClick={() => setEditCalendarOpen(false)}>Done</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="destructive" size="sm" className="flex-1" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
              </Button>
              <Button size="sm" className="flex-1" onClick={handleSaveEdit}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-[340px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteTx}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TransactionsTab;

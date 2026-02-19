import { useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { Transaction } from "@/data/budgetData";
import { format, parseISO } from "date-fns";
import { Plus, CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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

const TransactionsTab = () => {
  const { income, expenses, customSections, setIncome, setExpenses, setCustomSections, needsSetup } = useBudget();
  const [showAdd, setShowAdd] = useState(false);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedCategory, setSelectedCategory] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

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

    if (opt.list === "custom" && "sectionId" in opt) {
      const updated = customSections.map(s => {
        if (s.id !== opt.sectionId) return s;
        const items = [...s.items];
        const item = items[opt.index];
        items[opt.index] = {
          ...item,
          spent: item.spent + Number(amount),
          transactions: [...(item.transactions ?? []), newTx],
        };
        return { ...s, items };
      });
      setCustomSections(updated);
    } else {
      const arr = opt.list === "income" ? [...income] : [...expenses];
      const setter = opt.list === "income" ? setIncome : setExpenses;
      arr[opt.index] = {
        ...arr[opt.index],
        spent: arr[opt.index].spent + Number(amount),
        transactions: [...(arr[opt.index].transactions ?? []), newTx],
      };
      setter(arr);
    }

    setShowAdd(false);
    setMerchant("");
    setAmount("");
    setDate(new Date());
    setSelectedCategory("");
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
        <p className="text-[10px] text-muted-foreground">
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
                <div
                  key={tx.id}
                  className="rounded-xl bg-card border border-border px-3 py-2 flex justify-between items-center"
                >
                  <div>
                    <p className="text-xs font-medium text-foreground">{tx.merchant}</p>
                    <p className="text-[10px] text-primary">{tx.categoryName}</p>
                  </div>
                  <p className={`text-xs font-semibold tabular-nums ${tx.type === "income" ? "text-green-500" : "text-foreground"}`}>
                    {tx.type === "income" ? "+" : "-"}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
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
    </div>
  );
};

export default TransactionsTab;

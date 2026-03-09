import { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, CalendarIcon, Check, X } from "lucide-react";
import { Transaction } from "@/data/budgetData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface TransactionsDialogProps {
  open: boolean;
  onClose: () => void;
  categoryName: string;
  transactions: Transaction[];
  onUpdate: (transactions: Transaction[]) => void;
}

const TransactionsDialog = ({ open, onClose, categoryName, transactions, onUpdate }: TransactionsDialogProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState<string>("");
  const [merchant, setMerchant] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMerchant, setEditMerchant] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState<Date | undefined>();

  const startEditing = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditMerchant(tx.merchant);
    setEditAmount(String(tx.amount));
    setEditDate(new Date(tx.date + "T00:00:00"));
  };

  const cancelEditing = () => setEditingId(null);

  const saveEditing = () => {
    if (!editingId || !editDate || !editAmount || !editMerchant.trim()) return;
    const updated = transactions.map((t) =>
      t.id === editingId
        ? { ...t, merchant: editMerchant.trim(), amount: Number(editAmount), date: format(editDate, "yyyy-MM-dd") }
        : t
    );
    onUpdate(updated);
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!date || !amount || !merchant.trim()) return;
    const newTx: Transaction = {
      id: Date.now().toString(),
      date: format(date, "yyyy-MM-dd"),
      amount: Number(amount),
      merchant: merchant.trim(),
    };
    onUpdate([...transactions, newTx]);
    setShowAdd(false);
    setAmount("");
    setMerchant("");
    setDate(new Date());
  };

  const handleDelete = (id: string) => {
    onUpdate(transactions.filter((t) => t.id !== id));
    setDeletingId(null);
  };

  const handleClose = () => {
    setShowAdd(false);
    setEditingId(null);
    setDeletingId(null);
    onClose();
  };

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const total = transactions.reduce((s, t) => s + t.amount, 0);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end rounded-[42px] overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Sheet panel */}
      <div className="relative bg-card rounded-t-3xl max-h-[78%] flex flex-col shadow-2xl border-t border-border">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1 border-b border-border shrink-0">
          <h3 className="text-sm font-bold text-foreground">{categoryName}</h3>
          <div className="flex items-center gap-3">
            <span className="text-base font-bold tabular-nums text-primary">
              ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {sorted.length === 0 && !showAdd && (
            <p className="text-xs text-muted-foreground text-center py-6">
              No transactions yet. Tap + Add Transaction to get started.
            </p>
          )}

          {!showAdd && sorted.map((tx) =>
            editingId === tx.id ? (
              <div key={tx.id} className="rounded-xl bg-background border border-border p-3 space-y-2.5">
                <div>
                  <Label className="text-xs text-muted-foreground">Merchant</Label>
                  <Input
                    value={editMerchant}
                    onChange={(e) => setEditMerchant(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEditing()}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Amount</Label>
                  <Input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEditing()}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full mt-1 h-9 justify-start text-left font-normal text-xs", !editDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {editDate ? format(editDate, "MMM d, yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={editDate} onSelect={setEditDate} initialFocus className="p-3 pointer-events-auto" />
                      <div className="border-t border-border p-2">
                        <PopoverClose asChild>
                          <Button variant="outline" size="sm" className="w-full">Done</Button>
                        </PopoverClose>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={cancelEditing}>
                    <X className="h-3.5 w-3.5 mr-1" /> Cancel
                  </Button>
                  <Button size="sm" className="flex-1 text-xs" onClick={saveEditing}>
                    <Check className="h-3.5 w-3.5 mr-1" /> Save
                  </Button>
                </div>
              </div>
            ) : deletingId === tx.id ? (
              <div key={tx.id} className="rounded-xl bg-background border border-destructive/40 p-3 space-y-2">
                <p className="text-xs text-foreground font-medium">Delete <span className="text-destructive">{tx.merchant}</span>?</p>
                <p className="text-[10px] text-muted-foreground">This action cannot be undone.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setDeletingId(null)}>Cancel</Button>
                  <Button variant="destructive" size="sm" className="flex-1 text-xs" onClick={() => handleDelete(tx.id)}>Delete</Button>
                </div>
              </div>
            ) : (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2.5 cursor-pointer hover:bg-secondary/60 transition-colors"
                onClick={() => startEditing(tx)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{tx.merchant}</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(tx.date + "T00:00:00"), "MMM d, yyyy")}</p>
                </div>
                <div className="flex items-center gap-3 ml-2">
                  <span className="text-xs font-bold tabular-nums text-primary">
                    ${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingId(tx.id); }}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          )}

          {showAdd && (
            <div className="rounded-xl bg-background border border-border p-3 space-y-2">
              <Input
                placeholder="Merchant name"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="h-9 text-xs"
                autoFocus
              />
              <Input
                type="number"
                placeholder="$0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="h-9 text-xs"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full h-9 justify-start text-left font-normal text-xs", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {date ? format(date, "MMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="p-3 pointer-events-auto" />
                  <div className="border-t border-border p-2">
                    <PopoverClose asChild>
                      <Button variant="outline" size="sm" className="w-full">Done</Button>
                    </PopoverClose>
                  </div>
                </PopoverContent>
              </Popover>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => { setShowAdd(false); setMerchant(""); setAmount(""); }}>
                  Cancel
                </Button>
                <Button size="sm" className="flex-1 text-xs" onClick={handleAdd} disabled={!merchant.trim() || !amount}>
                  Add
                </Button>
              </div>
            </div>
          )}

          {!showAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-xs font-medium text-primary hover:bg-secondary/40 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Transaction
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionsDialog;

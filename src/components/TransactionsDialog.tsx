import { useState, useEffect } from "react";
import { format } from "date-fns";
import { formatAmountInput, parseAmountInput } from "@/lib/utils";
import { Plus, Trash2, CalendarIcon, Pencil, Check, X } from "lucide-react";
import { Transaction } from "@/data/budgetData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

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
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  if (!open) return null;

  return (
    <>
      <div className="absolute inset-0 z-50 flex flex-col justify-end overflow-hidden rounded-[40px]">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
          onClick={handleClose}
        />

        {/* Sheet panel */}
        <div
          className="relative z-10 bg-card rounded-t-2xl transition-transform duration-300 ease-out max-h-[80%] flex flex-col"
          style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-border shrink-0">
            <h2 className="text-base font-bold text-primary">{categoryName}</h2>
            <div className="flex items-center gap-3">
              <span className="text-base font-bold tabular-nums text-primary">
                ${transactions.reduce((s, t) => s + t.amount, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0 min-h-0 divide-y divide-border">
            {sorted.length === 0 && !showAdd && (
              <p className="text-xs text-muted-foreground text-center py-6">No transactions yet.</p>
            )}

            {!showAdd && sorted.map((tx) =>
              editingId === tx.id ? (
                <div key={tx.id} className="rounded-xl border border-primary/30 bg-card p-3 space-y-2.5">
                  <div>
                    <Label className="text-xs text-muted-foreground">Merchant</Label>
                    <Input
                      value={editMerchant}
                      onChange={(e) => setEditMerchant(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEditing()}
                      className="mt-1 h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Amount</Label>
                    <Input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEditing()}
                      className="mt-1 h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full mt-1 h-9 justify-start text-left font-normal", !editDate && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {editDate ? format(editDate, "MMM d, yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={editDate} onSelect={setEditDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                        <div className="border-t border-border p-2">
                          <PopoverClose asChild>
                            <Button variant="outline" size="sm" className="w-full">Done</Button>
                          </PopoverClose>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1" onClick={cancelEditing}>
                      <X className="h-3.5 w-3.5 mr-1" /> Cancel
                    </Button>
                    <Button size="sm" className="flex-1" onClick={saveEditing}>
                      <Check className="h-3.5 w-3.5 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between px-0 py-3 cursor-pointer hover:bg-muted/30 transition-all duration-200 ${editingId ? "opacity-30 pointer-events-none" : ""}`}
                  onClick={() => startEditing(tx)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{tx.merchant}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(tx.date + "T00:00:00"), "MMM d, yyyy")}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-[12px] font-bold tabular-nums text-foreground">
                      ${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingId(tx.id); }}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            )}

            {showAdd && (
              <div className="rounded-xl border border-primary/30 bg-card p-3 space-y-2.5">
                <div>
                  <Label className="text-xs text-muted-foreground">Merchant</Label>
                  <Input
                    placeholder="e.g. Starbucks"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    className="mt-1 h-9"
                    autoFocus
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Amount</Label>
                  <Input
                    type="number"
                    placeholder="$0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full mt-1 h-9 justify-start text-left font-normal", !date && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {date ? format(date, "MMM d, yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                      <div className="border-t border-border p-2">
                        <PopoverClose asChild>
                          <Button variant="outline" size="sm" className="w-full">Done</Button>
                        </PopoverClose>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
                  <Button size="sm" className="flex-1" onClick={handleAdd}>Add</Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer add button */}
          {!showAdd && (
            <div className="px-4 pb-4 pt-2 border-t border-border shrink-0">
              <Button variant="outline" size="sm" className="w-full" onClick={() => setShowAdd(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Transaction
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation — stays as portal/centered dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent className="max-w-[340px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TransactionsDialog;

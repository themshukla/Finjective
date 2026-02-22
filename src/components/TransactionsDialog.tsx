import { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, CalendarIcon, Pencil, Check, X } from "lucide-react";
import { Transaction } from "@/data/budgetData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  const startEditing = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditMerchant(tx.merchant);
    setEditAmount(String(tx.amount));
    setEditDate(new Date(tx.date + "T00:00:00"));
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

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

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-[380px] rounded-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary">{categoryName} Transactions</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {sorted.length === 0 && !showAdd && (
              <p className="text-xs text-muted-foreground text-center py-6">No transactions yet.</p>
            )}
            {sorted.map((tx) =>
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
                        <Calendar
                          mode="single"
                          selected={editDate}
                          onSelect={setEditDate}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
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
                  className="flex items-center justify-between rounded-xl bg-muted/50 border border-border p-3 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => startEditing(tx)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-primary truncate">{tx.merchant}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(tx.date + "T00:00:00"), "MMM d, yyyy")}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-lg font-bold tabular-nums text-foreground">
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
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                      <div className="border-t border-border p-2">
                        <PopoverClose asChild>
                          <Button variant="outline" size="sm" className="w-full">Done</Button>
                        </PopoverClose>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowAdd(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" className="flex-1" onClick={handleAdd}>
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>

          {!showAdd && (
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setShowAdd(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Transaction
            </Button>
          )}
        </DialogContent>
      </Dialog>

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

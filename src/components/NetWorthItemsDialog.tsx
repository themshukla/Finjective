import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { NetWorthEntry } from "@/data/budgetData";

interface NetWorthItemsDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  entries: NetWorthEntry[];
  onEntriesChange: (entries: NetWorthEntry[]) => void;
  accentClass?: string; // text-income or text-expense
}

const NetWorthItemsDialog = ({
  open,
  onClose,
  title,
  entries,
  onEntriesChange,
  accentClass = "text-income",
}: NetWorthItemsDialogProps) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [showForm, setShowForm] = useState(false);

  const total = entries.reduce((s, e) => s + e.amount, 0);

  const handleAdd = () => {
    if (!name.trim() || !amount) return;
    const entry: NetWorthEntry = {
      id: Date.now().toString(),
      name: name.trim(),
      amount: parseFloat(amount),
    };
    onEntriesChange([...entries, entry]);
    setName("");
    setAmount("");
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    onEntriesChange(entries.filter((e) => e.id !== id));
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto pb-safe">
        <SheetHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-bold">{title}</SheetTitle>
            <span className={`text-lg font-bold tabular-nums ${accentClass}`}>
              ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </SheetHeader>

        <div className="pt-4 space-y-3">
          {/* Entry list */}
          {entries.length === 0 && !showForm && (
            <p className="text-xs text-muted-foreground text-center py-6">
              No items yet. Tap + Add Item to get started.
            </p>
          )}

          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2.5"
            >
              <span className="text-sm font-medium text-foreground">{entry.name}</span>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold tabular-nums ${accentClass}`}>
                  ${entry.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add form */}
          {showForm && (
            <div className="rounded-xl bg-card border border-border p-3 space-y-2">
              <Input
                placeholder="Item name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-sm"
                autoFocus
              />
              <Input
                type="number"
                placeholder="$0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="h-9 text-sm"
              />
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => { setShowForm(false); setName(""); setAmount(""); }}
                >
                  Cancel
                </Button>
                <Button size="sm" className="flex-1" onClick={handleAdd} disabled={!name.trim() || !amount}>
                  Add
                </Button>
              </div>
            </div>
          )}

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-xs font-medium text-primary hover:bg-secondary/40 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Item
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NetWorthItemsDialog;

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NetWorthEntry } from "@/data/budgetData";

interface NetWorthItemsDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  entries: NetWorthEntry[];
  onEntriesChange: (entries: NetWorthEntry[]) => void;
  accentClass?: string;
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

  const handleClose = () => {
    setShowForm(false);
    setName("");
    setAmount("");
    onClose();
  };

  if (!open) return null;

  return (
    /* Overlay scoped to the phone screen — absolute fill */
    <div className="absolute inset-0 z-50 flex flex-col justify-end rounded-[42px] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Sheet panel */}
      <div className="relative bg-card rounded-t-3xl max-h-[75%] flex flex-col shadow-2xl border-t border-border">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1 border-b border-border shrink-0">
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          <div className="flex items-center gap-3">
            <span className={`text-base font-bold tabular-nums ${accentClass}`}>
              ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
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
              <span className="text-xs font-medium text-foreground">{entry.name}</span>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold tabular-nums ${accentClass}`}>
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

          {showForm && (
            <div className="rounded-xl bg-background border border-border p-3 space-y-2">
              <Input
                placeholder="Item name"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => { setShowForm(false); setName(""); setAmount(""); }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={handleAdd}
                  disabled={!name.trim() || !amount}
                >
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
      </div>
    </div>
  );
};

export default NetWorthItemsDialog;

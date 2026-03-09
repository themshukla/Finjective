import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X } from "lucide-react";
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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      // Small delay so the entering animation triggers after mount
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

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
    setVisible(false);
    setTimeout(onClose, 300);
  };

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end overflow-hidden rounded-[40px]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
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
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <div className="flex items-center gap-3">
            <span className={`text-lg font-bold tabular-nums ${accentClass}`}>
              ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-3">
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
      </div>
    </div>
  );
};

export default NetWorthItemsDialog;

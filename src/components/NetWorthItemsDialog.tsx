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
  accentClass = "text-foreground",
}: NetWorthItemsDialogProps) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [visible, setVisible] = useState(false);

  // editingId = id of entry being edited, null = adding new
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  const total = entries.reduce((s, e) => s + e.amount, 0);

  // ── Add ──────────────────────────────────────────────────────────────────────
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

  // ── Edit ─────────────────────────────────────────────────────────────────────
  const openEdit = (entry: NetWorthEntry) => {
    setEditingId(entry.id);
    setName(entry.name);
    setAmount(String(entry.amount));
    setShowForm(false); // close add form if open
  };

  const handleSaveEdit = () => {
    if (!editingId || !name.trim() || !amount) return;
    onEntriesChange(
      entries.map((e) =>
        e.id === editingId ? { ...e, name: name.trim(), amount: parseFloat(amount) } : e
      )
    );
    setEditingId(null);
    setName("");
    setAmount("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setAmount("");
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    if (editingId === id) cancelEdit();
    onEntriesChange(entries.filter((e) => e.id !== id));
  };

  const handleClose = () => {
    setVisible(false);
    cancelEdit();
    setShowForm(false);
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
          <h2 className="text-base font-bold text-primary">{title}</h2>
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-bold tabular-nums text-primary">
              ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-px">
          {entries.length === 0 && !showForm && (
            <p className="text-xs text-muted-foreground text-center py-6">
              No items yet. Tap + Add Item to get started.
            </p>
          )}

          {entries.map((entry) =>
            editingId === entry.id ? (
              /* ── Inline edit form ── */
              <div key={entry.id} className="rounded-xl bg-card border border-primary/40 p-3 space-y-2">
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
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                  className="h-9 text-sm"
                />
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDelete(entry.id)}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleSaveEdit}
                    disabled={!name.trim() || !amount}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              /* ── Regular row — tap to edit ── */
              <button
                key={entry.id}
                onClick={() => openEdit(entry)}
                className="w-full flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2.5 text-left active:opacity-70 transition-opacity"
              >
                <span className="text-[14px] text-foreground">{entry.name}</span>
                <span className="text-[14px] tabular-nums text-foreground">
                  ${entry.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </button>
            )
          )}

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

          {!showForm && !editingId && (
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

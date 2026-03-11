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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
    setConfirmDeleteId(null);
    setName("");
    setAmount("");
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    setConfirmDeleteId(null);
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
        <div className="flex-1 overflow-y-auto px-4 py-0 min-h-0 divide-y divide-border">
          {entries.length === 0 && !showForm && (
            <p className="text-xs text-muted-foreground text-center py-6">
              No items yet. Tap + Add Item to get started.
            </p>
          )}

          {!showForm && entries.map((entry) =>
            editingId === entry.id ? (
              /* ── Inline edit form ── */
              <div key={entry.id} className="rounded-xl border border-primary/30 bg-card p-3 space-y-2.5 my-2">
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
                  {confirmDeleteId === entry.id ? (
                    <>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirmDeleteId(null)}>
                        No
                      </Button>
                      <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDelete(entry.id)}>
                        Confirm
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="destructive" size="sm" className="flex-1" onClick={() => setConfirmDeleteId(entry.id)}>
                        Delete
                      </Button>
                      <Button size="sm" className="flex-1" onClick={handleSaveEdit} disabled={!name.trim() || !amount}>
                        Save
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* ── Regular row — tap to edit ── */
              <div
                key={entry.id}
                onClick={() => openEdit(entry)}
                className="flex items-center justify-between px-0 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <p className="text-[14px] text-foreground truncate flex-1 min-w-0">{entry.name}</p>
                <span className="text-[14px] tabular-nums text-foreground ml-2 shrink-0">
                  ${entry.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )
          )}

          {/* Add form */}
          {showForm && (
            <div className="rounded-xl border border-primary/30 bg-card p-3 space-y-2.5 my-2">
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
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setShowForm(false); setName(""); setAmount(""); }}>
                  Cancel
                </Button>
                <Button size="sm" className="flex-1" onClick={handleAdd} disabled={!name.trim() || !amount}>
                  Add
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer add button */}
        {!showForm && !editingId && (
          <div className="px-4 pb-4 pt-2 border-t border-border shrink-0">
            <Button variant="outline" size="sm" className="w-full" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
            </Button>
          </div>
        )}
      </div>
    </div>
  );

};

export default NetWorthItemsDialog;

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Trash2 } from "lucide-react";
import { NetWorthEntry } from "@/data/budgetData";
import { formatAmountInput, parseAmountInput } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// ── Swipeable row ─────────────────────────────────────────────────────────────
interface SwipeableRowProps {
  entry: NetWorthEntry;
  onDelete: (id: string) => void;
  onSaveName: (id: string, name: string) => void;
  onSaveAmount: (id: string, amount: number) => void;
  anySwipeOpen: boolean;
  setSwipeOpenId: (id: string | null) => void;
  swipeOpenId: string | null;
}

const DELETE_WIDTH = 72;

const SwipeableRow = ({
  entry,
  onDelete,
  onSaveName,
  onSaveAmount,
  swipeOpenId,
  setSwipeOpenId,
}: SwipeableRowProps) => {
  const [editingName, setEditingName] = useState(false);
  const [editingAmount, setEditingAmount] = useState(false);
  const [nameVal, setNameVal] = useState(entry.name);
  const [amountVal, setAmountVal] = useState(
    entry.amount === 0 ? "" : formatAmountInput(String(entry.amount))
  );

  // keep local state in sync if parent entries change (e.g. after save)
  useEffect(() => { if (!editingName) setNameVal(entry.name); }, [entry.name, editingName]);
  useEffect(() => {
    if (!editingAmount) setAmountVal(entry.amount === 0 ? "" : formatAmountInput(String(entry.amount)));
  }, [entry.amount, editingAmount]);

  const isOpen = swipeOpenId === entry.id;

  const [confirmDelete, setConfirmDelete] = useState(false);

  // swipe state
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const [translateX, setTranslateX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const isSwiping = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
    setDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (!isSwiping.current && Math.abs(dx) > 5) {
      if (Math.abs(dx) > Math.abs(dy)) {
        isSwiping.current = true;
        setDragging(true);
      } else {
        return;
      }
    }
    if (!isSwiping.current) return;
    const base = isOpen ? -DELETE_WIDTH : 0;
    const next = Math.min(0, Math.max(-DELETE_WIDTH, base + dx));
    setTranslateX(next);
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    setDragging(false);
    const threshold = DELETE_WIDTH * 0.4;
    const shouldOpen = translateX < -threshold;
    if (shouldOpen) {
      setTranslateX(-DELETE_WIDTH);
      setSwipeOpenId(entry.id);
    } else {
      setTranslateX(0);
      setSwipeOpenId(null);
    }
  };

  // close when another row opens
  useEffect(() => {
    if (!isOpen) { setTranslateX(0); }
  }, [isOpen]);

  const commitName = () => {
    const trimmed = nameVal.trim();
    if (trimmed) onSaveName(entry.id, trimmed);
    else setNameVal(entry.name);
    setEditingName(false);
  };

  const commitAmount = () => {
    onSaveAmount(entry.id, parseAmountInput(amountVal));
    setEditingAmount(false);
  };

  const handleNameTap = () => {
    if (dragging || isOpen) { setSwipeOpenId(null); setTranslateX(0); return; }
    setEditingName(true);
  };

  const handleAmountTap = () => {
    if (dragging || isOpen) { setSwipeOpenId(null); setTranslateX(0); return; }
    setEditingAmount(true);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Delete button behind */}
      <div
        className="absolute inset-y-0 right-0 flex items-stretch"
        style={{ width: DELETE_WIDTH }}
      >
        <button
          className="flex-1 flex items-center justify-center bg-destructive"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-4 w-4 text-destructive-foreground" />
        </button>
      </div>


      {/* Row content */}
      <div
        className="flex items-center justify-between py-3 bg-card relative z-10"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: dragging ? "none" : "transform 0.22s ease",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Name */}
        {editingName ? (
          <Input
            autoFocus
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => { if (e.key === "Enter") commitName(); if (e.key === "Escape") { setNameVal(entry.name); setEditingName(false); } }}
            className="h-7 text-sm flex-1 min-w-0 mr-2 px-1 border-0 rounded-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        ) : (
          <p
            className="text-[14px] text-foreground truncate flex-1 min-w-0 cursor-text"
            onClick={handleNameTap}
          >
            {entry.name}
          </p>
        )}

        {/* Amount */}
        {editingAmount ? (
          <Input
            autoFocus
            type="text"
            inputMode="decimal"
            value={amountVal}
            onChange={(e) => setAmountVal(formatAmountInput(e.target.value))}
            onBlur={commitAmount}
            onKeyDown={(e) => { if (e.key === "Enter") commitAmount(); if (e.key === "Escape") { setAmountVal(formatAmountInput(String(entry.amount))); setEditingAmount(false); } }}
            className="h-7 text-sm w-24 shrink-0 ml-2 px-1 text-right border-0 rounded-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        ) : (
          <span
            className="text-[14px] tabular-nums text-foreground ml-2 shrink-0 cursor-text"
            onClick={handleAmountTap}
          >
            ${entry.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        )}
      </div>
    </div>
  );
};

// ── Main dialog ───────────────────────────────────────────────────────────────
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
}: NetWorthItemsDialogProps) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [visible, setVisible] = useState(false);
  const [swipeOpenId, setSwipeOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true));
    else setVisible(false);
  }, [open]);

  const total = entries.reduce((s, e) => s + e.amount, 0);

  const handleAdd = () => {
    if (!name.trim() || !amount) return;
    const entry: NetWorthEntry = {
      id: Date.now().toString(),
      name: name.trim(),
      amount: parseAmountInput(amount),
    };
    onEntriesChange([...entries, entry]);
    setName("");
    setAmount("");
    setShowForm(false);
  };

  const handleSaveName = (id: string, newName: string) => {
    onEntriesChange(entries.map((e) => (e.id === id ? { ...e, name: newName } : e)));
  };

  const handleSaveAmount = (id: string, newAmount: number) => {
    onEntriesChange(entries.map((e) => (e.id === id ? { ...e, amount: newAmount } : e)));
  };

  const handleDelete = (id: string) => {
    onEntriesChange(entries.filter((e) => e.id !== id));
    setSwipeOpenId(null);
  };

  const handleClose = () => {
    setVisible(false);
    setShowForm(false);
    setSwipeOpenId(null);
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

          {entries.map((entry) => (
            <SwipeableRow
              key={entry.id}
              entry={entry}
              onDelete={handleDelete}
              onSaveName={handleSaveName}
              onSaveAmount={handleSaveAmount}
              anySwipeOpen={swipeOpenId !== null}
              swipeOpenId={swipeOpenId}
              setSwipeOpenId={setSwipeOpenId}
            />
          ))}

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
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(formatAmountInput(e.target.value))}
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
        </div>

        {/* Footer add button */}
        {!showForm && (
          <div className="px-4 pb-4 pt-2 border-t border-border shrink-0">
            <Button variant="outline" size="sm" className="w-full" onClick={() => { setShowForm(true); setSwipeOpenId(null); }}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetWorthItemsDialog;

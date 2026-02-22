import { useState } from "react";
import { format, parse } from "date-fns";
import { useBudget } from "@/context/BudgetContext";
import { Copy, FilePlus } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MonthSetupPrompt = ({ compact }: { compact?: boolean }) => {
  const { selectedMonth, importFromPreviousMonth, createEmptyMonth, latestMonthKey, needsSetup } = useBudget();
  const [confirmAction, setConfirmAction] = useState<null | "import" | "fresh">(null);

  const handleImport = () => {
    if (!needsSetup) { setConfirmAction("import"); return; }
    importFromPreviousMonth();
  };

  const handleFresh = () => {
    if (!needsSetup) { setConfirmAction("fresh"); return; }
    createEmptyMonth();
  };

  const handleConfirm = () => {
    if (confirmAction === "import") importFromPreviousMonth();
    else if (confirmAction === "fresh") createEmptyMonth();
    setConfirmAction(null);
  };

  const latestLabel = latestMonthKey
    ? format(parse(latestMonthKey, "yyyy-MM", new Date()), "MMM yyyy")
    : null;

  if (compact) {
    return (
      <div className="flex gap-2">
        {latestLabel && (
          <button
            onClick={handleImport}
            className="flex-1 flex items-center gap-2 rounded-xl bg-card border border-border p-2.5 text-left active:scale-[0.98] transition-transform"
          >
            <Copy className="h-4 w-4 text-primary flex-shrink-0" />
            <div>
              <p className="text-[11px] font-medium">Import {latestLabel}</p>
              <p className="text-[9px] text-muted-foreground">Reset actuals to $0</p>
            </div>
          </button>
        )}
        <button
          onClick={handleFresh}
          className="flex-1 flex items-center gap-2 rounded-xl bg-card border border-border p-2.5 text-left active:scale-[0.98] transition-transform"
        >
          <FilePlus className="h-4 w-4 text-primary flex-shrink-0" />
          <div>
            <p className="text-[11px] font-medium">Start fresh</p>
            <p className="text-[9px] text-muted-foreground">Blank budget</p>
          </div>
        </button>
        <ConfirmDialog confirmAction={confirmAction} setConfirmAction={setConfirmAction} handleConfirm={handleConfirm} selectedMonth={selectedMonth} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4">
      <div className="text-4xl">📋</div>
      <h3 className="text-sm font-semibold">
        Set up {format(selectedMonth, "MMMM yyyy")}
      </h3>
      <p className="text-xs text-muted-foreground max-w-[240px]">
        No budget has been created for this month yet. How would you like to start?
      </p>

      <div className="flex flex-col gap-2 w-full max-w-[240px]">
        {latestLabel && (
          <button
            onClick={handleImport}
            className="flex items-center gap-2.5 rounded-xl bg-card border border-border p-3.5 text-left active:scale-[0.98] transition-transform"
          >
            <Copy className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs font-medium">Import from {latestLabel}</p>
              <p className="text-[10px] text-muted-foreground">Copy categories, reset actuals to $0</p>
            </div>
          </button>
        )}

        <button
          onClick={handleFresh}
          className="flex items-center gap-2.5 rounded-xl bg-card border border-border p-3.5 text-left active:scale-[0.98] transition-transform"
        >
          <FilePlus className="h-5 w-5 text-primary flex-shrink-0" />
          <div>
            <p className="text-xs font-medium">Start from scratch</p>
            <p className="text-[10px] text-muted-foreground">Create a blank budget</p>
          </div>
        </button>
      </div>
      <ConfirmDialog confirmAction={confirmAction} setConfirmAction={setConfirmAction} handleConfirm={handleConfirm} selectedMonth={selectedMonth} />
    </div>
  );
};

const ConfirmDialog = ({ confirmAction, setConfirmAction, handleConfirm, selectedMonth }: {
  confirmAction: "import" | "fresh" | null;
  setConfirmAction: (v: null) => void;
  handleConfirm: () => void;
  selectedMonth: Date;
}) => (
  <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
    <AlertDialogContent className="max-w-[320px] rounded-xl">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-sm">Replace existing budget?</AlertDialogTitle>
        <AlertDialogDescription className="text-xs">
          {format(selectedMonth, "MMMM yyyy")} already has a budget. This will replace all categories and transactions.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={handleConfirm} className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90">
          Replace
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default MonthSetupPrompt;

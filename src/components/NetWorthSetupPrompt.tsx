import { useState } from "react";
import { format, parse } from "date-fns";
import { useBudget } from "@/context/BudgetContext";
import { Copy, FilePlus } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const NetWorthSetupPrompt = () => {
  const {
    selectedMonth,
    importNetWorthFromPrevious,
    createEmptyNetWorth,
    latestNetWorthSnapshotKey,
    netWorthNeedsSetup,
  } = useBudget();

  const [confirmAction, setConfirmAction] = useState<null | "import" | "fresh">(null);

  const latestLabel = latestNetWorthSnapshotKey
    ? format(parse(latestNetWorthSnapshotKey, "yyyy-MM", new Date()), "MMM yyyy")
    : null;

  const handleImport = () => {
    if (!netWorthNeedsSetup) { setConfirmAction("import"); return; }
    importNetWorthFromPrevious();
  };

  const handleFresh = () => {
    if (!netWorthNeedsSetup) { setConfirmAction("fresh"); return; }
    createEmptyNetWorth();
  };

  const handleConfirm = () => {
    if (confirmAction === "import") importNetWorthFromPrevious();
    else if (confirmAction === "fresh") createEmptyNetWorth();
    setConfirmAction(null);
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4">
      <div className="text-4xl">📊</div>
      <h3 className="text-sm font-semibold">
        Set up {format(selectedMonth, "MMMM yyyy")}
      </h3>
      <p className="text-xs text-muted-foreground max-w-[240px]">
        No net worth statement for this month yet. How would you like to start?
      </p>

      <div className="flex flex-col gap-2 w-full max-w-[240px]">
        {latestLabel && (
          <button
            onClick={handleImport}
            className="flex items-center gap-2.5 rounded-xl bg-card border border-border p-3.5 text-left active:scale-[0.98] transition-transform"
          >
            <Copy className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs font-medium">Copy from {latestLabel}</p>
              <p className="text-[10px] text-muted-foreground">Use same assets & liabilities</p>
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
            <p className="text-[10px] text-muted-foreground">Create a blank statement</p>
          </div>
        </button>
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent className="max-w-[320px] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Replace existing statement?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              {format(selectedMonth, "MMMM yyyy")} already has a net worth statement. This will replace all assets and liabilities.
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
    </div>
  );
};

export default NetWorthSetupPrompt;

import { format, subMonths } from "date-fns";
import { useBudget } from "@/context/BudgetContext";
import { Copy, FilePlus } from "lucide-react";

const MonthSetupPrompt = () => {
  const { selectedMonth, importFromPreviousMonth, createEmptyMonth, hasMonthData } = useBudget();

  const prevMonth = subMonths(selectedMonth, 1);
  const prevKey = format(prevMonth, "yyyy-MM");
  const hasPrev = hasMonthData(prevKey);

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
        {hasPrev && (
          <button
            onClick={importFromPreviousMonth}
            className="flex items-center gap-2.5 rounded-xl bg-card border border-border p-3.5 text-left active:scale-[0.98] transition-transform"
          >
            <Copy className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs font-medium">Import from {format(prevMonth, "MMM yyyy")}</p>
              <p className="text-[10px] text-muted-foreground">Copy categories, reset actuals to $0</p>
            </div>
          </button>
        )}

        <button
          onClick={createEmptyMonth}
          className="flex items-center gap-2.5 rounded-xl bg-card border border-border p-3.5 text-left active:scale-[0.98] transition-transform"
        >
          <FilePlus className="h-5 w-5 text-primary flex-shrink-0" />
          <div>
            <p className="text-xs font-medium">Start from scratch</p>
            <p className="text-[10px] text-muted-foreground">Create a blank budget</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default MonthSetupPrompt;

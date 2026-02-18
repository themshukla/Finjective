import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBudget } from "@/context/BudgetContext";

const MonthSelector = () => {
  const { selectedMonth, setSelectedMonth } = useBudget();

  const prev = subMonths(selectedMonth, 1);
  const next = addMonths(selectedMonth, 1);

  return (
    <div className="px-5 py-4 bg-background">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedMonth(prev)}
          className="p-2 rounded-lg active:bg-card transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            {format(selectedMonth, "MMMM")} <span className="text-muted-foreground font-normal">{format(selectedMonth, "yyyy")}</span>
          </h2>
        </div>

        <button
          onClick={() => setSelectedMonth(next)}
          className="p-2 rounded-lg active:bg-card transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default MonthSelector;

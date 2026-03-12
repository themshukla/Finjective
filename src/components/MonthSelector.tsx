import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBudget } from "@/context/BudgetContext";

interface MonthSelectorProps {
  collapsed?: boolean;
  activeTab?: string;
}

const MonthSelector = ({ collapsed = false, activeTab = "budget" }: MonthSelectorProps) => {
  const { selectedMonth, setSelectedMonth, hasMonthData, netWorthSnapshots } = useBudget();

  const prev = subMonths(selectedMonth, 1);
  const next = addMonths(selectedMonth, 1);
  const now = new Date();
  const isCurrentMonth = format(selectedMonth, "yyyy-MM") === format(now, "yyyy-MM");

  // Always 3 pills: [prev] [selected] [next]
  // Today's month gets filled-blue styling wherever it appears
  const months = [
    { date: prev, label: format(prev, "MMM"), subLabel: format(prev, "yyyy"), action: prev, isSelected: false, isToday: format(prev, "yyyy-MM") === format(now, "yyyy-MM") },
    { date: selectedMonth, label: format(selectedMonth, "MMM"), subLabel: format(selectedMonth, "yyyy"), action: selectedMonth, isSelected: true, isToday: isCurrentMonth },
    { date: next, label: format(next, "MMM"), subLabel: format(next, "yyyy"), action: next, isSelected: false, isToday: format(next, "yyyy-MM") === format(now, "yyyy-MM") },
  ];

  const hasData = (date: Date) => {
    const key = format(date, "yyyy-MM");
    if (activeTab === "networth") {
      const snap = netWorthSnapshots.find(s => s.month_key === key);
      return !!snap && (snap.assets.length > 0 || snap.liabilities.length > 0);
    }
    return hasMonthData(key);
  };

  if (collapsed) {
    return (
      <div className="flex flex-col bg-background border-b border-border transition-all duration-200">
        <div className="text-center py-2">
          <span className="text-xs font-bold text-primary">
            Viewing: {format(selectedMonth, "MMMM yyyy")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background border-b border-border transition-all duration-200">
      <div className="flex items-center justify-between px-3 py-1.5">
        <button
          onClick={() => setSelectedMonth(prev)}
          className="p-1.5 rounded-lg active:opacity-60 transition-opacity"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex gap-1">
        {months.map((m, i) => {
            const hasMonthDataForPill = hasData(m.action);
            // Today pill = filled blue; selected (non-today) pill = solid blue border; others = dashed or no border
            const isFilledToday = m.isToday;
            const isSelectedNonToday = m.isSelected && !m.isToday;
            return (
              <button
                key={i}
                onClick={() => setSelectedMonth(m.action)}
                style={
                  isFilledToday
                    ? {}
                    : isSelectedNonToday
                    ? { border: "2px solid hsl(var(--primary))" }
                    : hasMonthDataForPill
                    ? {}
                    : { border: "1.5px dashed hsl(var(--muted-foreground) / 0.4)" }
                }
                className={`relative flex flex-col items-center px-4 py-1.5 rounded-full transition-colors ${
                  isFilledToday
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground active:opacity-60"
                }`}
              >
                <span className={`text-sm font-semibold ${isFilledToday ? "text-primary-foreground" : "text-foreground"}`}>
                  {m.label}
                </span>
                <span className={`text-[10px] ${isFilledToday ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {m.subLabel}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setSelectedMonth(next)}
          className="p-1.5 rounded-lg active:opacity-60 transition-opacity"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {!isCurrentMonth && (
        <div className="text-center pb-1.5">
          <span className="text-xs font-bold text-primary">
            Viewing: {format(selectedMonth, "MMMM yyyy")}
          </span>
        </div>
      )}
    </div>
  );
};

export default MonthSelector;


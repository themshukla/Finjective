import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBudget } from "@/context/BudgetContext";

const MonthSelector = () => {
  const { selectedMonth, setSelectedMonth } = useBudget();

  const prev = subMonths(selectedMonth, 1);
  const next = addMonths(selectedMonth, 1);
  const now = new Date();
  const isCurrentMonth = format(selectedMonth, "yyyy-MM") === format(now, "yyyy-MM");

  const months = isCurrentMonth
    ? [
        { date: prev, label: format(prev, "MMM"), subLabel: format(prev, "yyyy"), action: prev },
        { date: selectedMonth, label: format(selectedMonth, "MMM"), subLabel: format(selectedMonth, "yyyy"), action: selectedMonth },
        { date: next, label: format(next, "MMM"), subLabel: format(next, "yyyy"), action: next },
      ]
    : [
        { date: prev, label: format(prev, "MMM"), subLabel: format(prev, "yyyy"), action: prev },
        { date: now, label: "Today", subLabel: format(now, "MMM yyyy"), action: now },
        { date: next, label: format(next, "MMM"), subLabel: format(next, "yyyy"), action: next },
      ];

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
      <button
        onClick={() => setSelectedMonth(prev)}
        className="p-1 rounded-md active:bg-muted transition-colors"
      >
        <ChevronLeft className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="flex gap-1">
        {months.map((m, i) => {
          const isCenter = i === 1;
          const isCurrent = format(m.date, "yyyy-MM") === format(now, "yyyy-MM");
          return (
            <button
              key={i}
              onClick={() => setSelectedMonth(m.action)}
              className={`flex flex-col items-center px-4 py-1.5 rounded-lg transition-colors ${
                isCenter
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground active:bg-muted"
              }`}
            >
              <span className={`text-xs font-semibold ${isCenter ? "" : ""}`}>{m.label}</span>
              <span className={`text-[9px] ${isCenter ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {m.subLabel}
                {isCurrent && !isCenter && " •"}
              </span>
              {isCurrent && isCenter && (
                <div className="w-1 h-1 rounded-full bg-primary-foreground mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setSelectedMonth(next)}
        className="p-1 rounded-md active:bg-muted transition-colors"
      >
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
};

export default MonthSelector;

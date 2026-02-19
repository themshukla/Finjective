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
    <div className="flex flex-col bg-background border-b border-border">
      <div className="flex items-center justify-between px-4 py-4">
        <button
          onClick={() => setSelectedMonth(prev)}
          className="p-2 rounded-lg active:bg-card transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="flex gap-2">
          {months.map((m, i) => {
            const isCenter = i === 1;
            const isCurrent = format(m.date, "yyyy-MM") === format(now, "yyyy-MM");
            return (
              <button
                key={i}
                onClick={() => setSelectedMonth(m.action)}
                className={`flex flex-col items-center px-5 py-2.5 rounded-xl transition-colors ${
                  isCenter
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground active:bg-card"
                }`}
              >
                <span className="text-base font-bold">{m.label}</span>
                <span className={`text-xs ${isCenter ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
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
          className="p-2 rounded-lg active:bg-card transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {!isCurrentMonth && (
        <div className="text-center pb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Viewing: {format(selectedMonth, "MMMM yyyy")}
          </span>
        </div>
      )}
    </div>
  );
};

export default MonthSelector;

import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBudget } from "@/context/BudgetContext";

interface MonthSelectorProps {
  collapsed?: boolean;
}

const MonthSelector = ({ collapsed = false }: MonthSelectorProps) => {
  const { selectedMonth, setSelectedMonth, hasMonthData, netWorthSnapshots } = useBudget();

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

  const hasData = (date: Date) => {
    const key = format(date, "yyyy-MM");
    const hasBudget = hasMonthData(key);
    const hasNetWorth = netWorthSnapshots.some(s => s.month_key === key);
    return hasBudget || hasNetWorth;
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
            const isCenter = i === 1;
            const isCurrent = format(m.date, "yyyy-MM") === format(now, "yyyy-MM");
            const isEmpty = !hasData(m.action);
            return (
              <button
                key={i}
                onClick={() => setSelectedMonth(m.action)}
                style={isEmpty ? { outline: "1.5px dashed hsl(var(--muted-foreground) / 0.45)", outlineOffset: "2px" } : undefined}
                className={`relative flex flex-col items-center px-4 py-1.5 rounded-full transition-colors ${
                  isCenter
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground active:opacity-60"
                }`}
              >
                <span className={`text-sm font-semibold ${isCenter ? "text-primary-foreground" : "text-foreground"}`}>{m.label}</span>
                <span className={`text-[10px] ${isCenter ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {m.subLabel}
                  {isCurrent && !isCenter && " ·"}
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


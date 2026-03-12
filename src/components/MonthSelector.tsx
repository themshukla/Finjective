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

  // Pills are always fixed around today: [today-1] [today] [today+1]
  // Selected month is highlighted with a border on whichever pill it matches
  const todayPrev = subMonths(now, 1);
  const todayNext = addMonths(now, 1);
  const months = [
    { date: todayPrev, label: format(todayPrev, "MMM"), subLabel: format(todayPrev, "yyyy"), action: todayPrev, isSelected: format(todayPrev, "yyyy-MM") === format(selectedMonth, "yyyy-MM"), isToday: false },
    { date: now, label: format(now, "MMM"), subLabel: format(now, "yyyy"), action: now, isSelected: isCurrentMonth, isToday: true },
    { date: todayNext, label: format(todayNext, "MMM"), subLabel: format(todayNext, "yyyy"), action: todayNext, isSelected: format(todayNext, "yyyy-MM") === format(selectedMonth, "yyyy-MM"), isToday: false },
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


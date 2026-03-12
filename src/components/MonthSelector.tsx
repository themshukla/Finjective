import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBudget } from "@/context/BudgetContext";

interface MonthSelectorProps {
  collapsed?: boolean;
  activeTab?: string;
}

const MonthSelector = ({ collapsed = false, activeTab = "budget" }: MonthSelectorProps) => {
  const { selectedMonth, setSelectedMonth, hasMonthData, netWorthSnapshots } = useBudget();

  const now = new Date();
  const isCurrentMonth = format(selectedMonth, "yyyy-MM") === format(now, "yyyy-MM");
  const nowKey = format(now, "yyyy-MM");
  const selectedKey = format(selectedMonth, "yyyy-MM");

  const prevMonth = subMonths(selectedMonth, 1);
  const nextMonth = addMonths(selectedMonth, 1);

  // Center = ALWAYS today (never moves).
  // Left  = prev of selected → tapping navigates one step back.
  // Right = next of selected → tapping navigates one step forward.
  // Whichever pill matches the selected month gets the blue circle.
  const months = [
    {
      date: prevMonth, action: prevMonth,
      label: format(prevMonth, "MMM"), subLabel: format(prevMonth, "yyyy"),
      isSelected: format(prevMonth, "yyyy-MM") === selectedKey,
      isToday: format(prevMonth, "yyyy-MM") === nowKey,
    },
    {
      date: now, action: now,
      label: format(now, "MMM"), subLabel: format(now, "yyyy"),
      isSelected: isCurrentMonth, isToday: true,
    },
    {
      date: nextMonth, action: nextMonth,
      label: format(nextMonth, "MMM"), subLabel: format(nextMonth, "yyyy"),
      isSelected: format(nextMonth, "yyyy-MM") === selectedKey,
      isToday: format(nextMonth, "yyyy-MM") === nowKey,
    },
  ];

  const prev = prevMonth;
  const next = nextMonth;

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
            const isFilledToday = m.isToday;
            // Always circle the selected/viewing month with a solid blue border
            const borderStyle = m.isSelected
              ? { border: "2px solid hsl(var(--primary))" }
              : !isFilledToday && !hasMonthDataForPill
              ? { border: "1.5px dashed hsl(var(--muted-foreground) / 0.4)" }
              : {};
            return (
              <button
                key={i}
                onClick={() => setSelectedMonth(m.action)}
                style={borderStyle}
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


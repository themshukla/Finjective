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
  const nowKey = format(now, "yyyy-MM");
  const selectedKey = format(selectedMonth, "yyyy-MM");
  const isCurrentMonth = selectedKey === nowKey;

  // Determine the three pill dates:
  // Center is ALWAYS "now" (today's month).
  // If viewing current month: left = now-1, right = now+1
  // If viewing a PAST month:  left = selectedMonth, center = now, right = now+1
  // If viewing a FUTURE month: left = now-1, center = now, right = selectedMonth
  const isPast = selectedKey < nowKey;
  const isFuture = selectedKey > nowKey;

  const leftDate  = isPast   ? selectedMonth : subMonths(now, 1);
  const rightDate = isFuture ? selectedMonth : addMonths(now, 1);

  const hasData = (date: Date) => {
    const key = format(date, "yyyy-MM");
    if (activeTab === "networth") {
      const snap = netWorthSnapshots.find(s => s.month_key === key);
      return !!snap && (snap.assets.length > 0 || snap.liabilities.length > 0);
    }
    return hasMonthData(key);
  };

  const pills = [
    {
      date: leftDate,
      label: format(leftDate, "MMM"),
      subLabel: format(leftDate, "yyyy"),
      isSelected: format(leftDate, "yyyy-MM") === selectedKey,
      isToday: format(leftDate, "yyyy-MM") === nowKey,
    },
    {
      date: now,
      label: format(now, "MMM"),
      subLabel: format(now, "yyyy"),
      isSelected: isCurrentMonth,
      isToday: true,
    },
    {
      date: rightDate,
      label: format(rightDate, "MMM"),
      subLabel: format(rightDate, "yyyy"),
      isSelected: format(rightDate, "yyyy-MM") === selectedKey,
      isToday: format(rightDate, "yyyy-MM") === nowKey,
    },
  ];

  // Chevrons always step selectedMonth back/forward by 1
  const prev = subMonths(selectedMonth, 1);
  const next = addMonths(selectedMonth, 1);

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
          {pills.map((m, i) => {
            const hasMonthDataForPill = hasData(m.date);
            const isFilledToday = m.isToday && !m.isSelected;
            const borderStyle = m.isSelected
              ? { border: "2px solid hsl(var(--primary))" }
              : !m.isToday && !hasMonthDataForPill
              ? { border: "1.5px dashed hsl(var(--muted-foreground) / 0.4)" }
              : {};
            return (
              <button
                key={i}
                onClick={() => setSelectedMonth(m.date)}
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

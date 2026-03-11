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

  // When viewing current month: show 3 pills [prev] [selected=current] [next]
  // When viewing past/future: show 4 pills [prev] [Today] [selected] [next]
  const months = isCurrentMonth
    ? [
        { date: prev, label: format(prev, "MMM"), subLabel: format(prev, "yyyy"), action: prev, isSelected: false, isToday: false },
        { date: selectedMonth, label: format(selectedMonth, "MMM"), subLabel: format(selectedMonth, "yyyy"), action: selectedMonth, isSelected: true, isToday: true },
        { date: next, label: format(next, "MMM"), subLabel: format(next, "yyyy"), action: next, isSelected: false, isToday: false },
      ]
    : (() => {
        const prevIsToday = format(prev, "yyyy-MM") === format(now, "yyyy-MM");
        const nextIsToday = format(next, "yyyy-MM") === format(now, "yyyy-MM");
        const todayEntry = { date: now, label: format(now, "MMM"), subLabel: format(now, "yyyy"), todayLabel: "Today", action: now, isSelected: false, isToday: true };
        const selectedEntry = { date: selectedMonth, label: format(selectedMonth, "MMM"), subLabel: format(selectedMonth, "yyyy"), action: selectedMonth, isSelected: true, isToday: false };

        if (prevIsToday) {
          // e.g. viewing Apr when today=Mar: show [Feb] [Today=Mar] [Apr] [May]
          const twoBefore = subMonths(now, 1);
          return [
            { date: twoBefore, label: format(twoBefore, "MMM"), subLabel: format(twoBefore, "yyyy"), action: twoBefore, isSelected: false, isToday: false },
            todayEntry,
            selectedEntry,
            { date: next, label: format(next, "MMM"), subLabel: format(next, "yyyy"), action: next, isSelected: false, isToday: false },
          ];
        } else if (nextIsToday) {
          // e.g. viewing Feb when today=Mar: show [Jan] [Feb] [Today=Mar] [Apr]
          const twoAfter = addMonths(now, 1);
          return [
            { date: prev, label: format(prev, "MMM"), subLabel: format(prev, "yyyy"), action: prev, isSelected: false, isToday: false },
            selectedEntry,
            todayEntry,
            { date: twoAfter, label: format(twoAfter, "MMM"), subLabel: format(twoAfter, "yyyy"), action: twoAfter, isSelected: false, isToday: false },
          ];
        } else {
          return [
            { date: prev, label: format(prev, "MMM"), subLabel: format(prev, "yyyy"), action: prev, isSelected: false, isToday: false },
            todayEntry,
            selectedEntry,
            { date: next, label: format(next, "MMM"), subLabel: format(next, "yyyy"), action: next, isSelected: false, isToday: false },
          ];
        }
      })();

  const hasData = (date: Date) => {
    const key = format(date, "yyyy-MM");
    const snap = netWorthSnapshots.find(s => s.month_key === key);
    return !!snap && (snap.assets.length > 0 || snap.liabilities.length > 0);
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
            const isEmpty = !hasData(m.action);
            return (
              <button
                key={i}
                onClick={() => setSelectedMonth(m.action)}
                style={{
                  ...(isEmpty && !m.isToday ? {
                    outline: `1.5px dashed ${m.isSelected ? "hsl(var(--primary-foreground) / 0.6)" : "hsl(var(--muted-foreground) / 0.5)"}`,
                    outlineOffset: "3px"
                  } : {}),
                  ...(m.isToday && !m.isSelected ? {
                    border: "2px solid hsl(var(--primary))"
                  } : {})
                }}
                className={`relative flex flex-col items-center px-4 py-1.5 rounded-full transition-colors ${
                  m.isSelected
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground active:opacity-60"
                }`}
              >
                <span className={`text-sm font-semibold ${m.isSelected ? "text-primary-foreground" : "text-foreground"}`}>
                  {m.label}
                </span>
                <span className={`text-[10px] ${m.isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
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


import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cashFlowData } from "@/data/budgetData";

const CashFlowTab = () => {
  const latestMonth = cashFlowData[cashFlowData.length - 1];
  const totalIncome = cashFlowData.reduce((s, d) => s + d.income, 0);
  const totalExpenses = cashFlowData.reduce((s, d) => s + d.expenses, 0);
  const netCashFlow = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-card p-4 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Income (6mo)</p>
          <p className="text-2xl font-bold text-income">${totalIncome.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-card p-4 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Expenses (6mo)</p>
          <p className="text-2xl font-bold text-expense">${totalExpenses.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-card p-4 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Net Cash Flow</p>
          <p className={`text-2xl font-bold ${netCashFlow >= 0 ? "text-income" : "text-expense"}`}>
            ${netCashFlow.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl bg-card border border-border p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Monthly Cash Flow</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlowData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 90%)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(220 10% 46%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(220 10% 46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 15% 90%)", fontSize: 13 }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="income" name="Income" fill="hsl(152 60% 40%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly breakdown */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider p-4 pb-2">Monthly Breakdown</h3>
        <div className="divide-y divide-border">
          {[...cashFlowData].reverse().map((m) => (
            <div key={m.month} className="flex items-center justify-between px-4 py-3">
              <span className="font-medium text-sm">{m.month}</span>
              <div className="flex gap-6 text-sm tabular-nums">
                <span className="text-income">+${m.income.toLocaleString()}</span>
                <span className="text-expense">-${m.expenses.toLocaleString()}</span>
                <span className={`font-semibold ${m.income - m.expenses >= 0 ? "text-income" : "text-expense"}`}>
                  ${(m.income - m.expenses).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CashFlowTab;

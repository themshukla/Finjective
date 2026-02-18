import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { assets, liabilities } from "@/data/budgetData";

const NetWorthTab = () => {
  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.value, 0);
  const netWorth = totalAssets - totalLiabilities;

  const pieData = [
    { name: "Assets", value: totalAssets },
    { name: "Liabilities", value: totalLiabilities },
  ];

  const COLORS = ["hsl(172 50% 36%)", "hsl(0 72% 51%)"];

  return (
    <div className="space-y-6">
      {/* Net Worth Hero */}
      <div className="rounded-xl bg-card border border-border p-6 text-center">
        <p className="text-sm text-muted-foreground mb-1">Net Worth</p>
        <p className={`text-4xl font-bold ${netWorth >= 0 ? "text-income" : "text-expense"}`}>
          ${netWorth.toLocaleString()}
        </p>
        <div className="flex justify-center gap-8 mt-3 text-sm">
          <span className="text-muted-foreground">Assets: <span className="text-asset font-semibold">${totalAssets.toLocaleString()}</span></span>
          <span className="text-muted-foreground">Liabilities: <span className="text-liability font-semibold">${totalLiabilities.toLocaleString()}</span></span>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="rounded-xl bg-card border border-border p-4">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 15% 90%)", fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assets & Liabilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider p-4 pb-2">Assets</h3>
          <div className="divide-y divide-border">
            {assets.map((a) => (
              <div key={a.name} className="flex justify-between px-4 py-3">
                <span className="text-sm">{a.name}</span>
                <span className="text-sm font-semibold text-asset tabular-nums">${a.value.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-3 bg-muted/50">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-sm font-bold text-asset tabular-nums">${totalAssets.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider p-4 pb-2">Liabilities</h3>
          <div className="divide-y divide-border">
            {liabilities.map((l) => (
              <div key={l.name} className="flex justify-between px-4 py-3">
                <span className="text-sm">{l.name}</span>
                <span className="text-sm font-semibold text-liability tabular-nums">${l.value.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-3 bg-muted/50">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-sm font-bold text-liability tabular-nums">${totalLiabilities.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetWorthTab;

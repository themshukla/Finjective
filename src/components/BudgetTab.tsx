import { Progress } from "@/components/ui/progress";
import { incomeCategories, expenseCategories } from "@/data/budgetData";

const BudgetTab = () => {
  const totalIncome = incomeCategories.reduce((s, c) => s + c.spent, 0);
  const totalBudgetedIncome = incomeCategories.reduce((s, c) => s + c.budgeted, 0);
  const totalExpenses = expenseCategories.reduce((s, c) => s + c.spent, 0);
  const totalBudgetedExpenses = expenseCategories.reduce((s, c) => s + c.budgeted, 0);
  const remaining = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Income" amount={totalIncome} budgeted={totalBudgetedIncome} variant="income" />
        <SummaryCard label="Expenses" amount={totalExpenses} budgeted={totalBudgetedExpenses} variant="expense" />
        <SummaryCard label="Remaining" amount={remaining} variant={remaining >= 0 ? "income" : "expense"} />
      </div>

      {/* Income */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Income</h3>
        <div className="space-y-2">
          {incomeCategories.map((cat) => (
            <CategoryRow key={cat.name} category={cat} variant="income" />
          ))}
        </div>
      </section>

      {/* Expenses */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Expenses</h3>
        <div className="space-y-2">
          {expenseCategories.map((cat) => (
            <CategoryRow key={cat.name} category={cat} variant="expense" />
          ))}
        </div>
      </section>
    </div>
  );
};

function SummaryCard({ label, amount, budgeted, variant }: { label: string; amount: number; budgeted?: number; variant: "income" | "expense" }) {
  return (
    <div className="rounded-xl bg-card p-4 border border-border">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${variant === "income" ? "text-income" : "text-expense"}`}>
        ${amount.toLocaleString()}
      </p>
      {budgeted !== undefined && (
        <p className="text-xs text-muted-foreground mt-1">of ${budgeted.toLocaleString()} budgeted</p>
      )}
    </div>
  );
}

function CategoryRow({ category, variant }: { category: { name: string; budgeted: number; spent: number; icon: string }; variant: "income" | "expense" }) {
  const pct = Math.min((category.spent / category.budgeted) * 100, 100);
  const over = category.spent > category.budgeted;

  return (
    <div className="rounded-lg bg-card border border-border p-3 flex items-center gap-3">
      <span className="text-xl w-8 text-center">{category.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-sm font-medium truncate">{category.name}</span>
          <span className={`text-sm font-semibold tabular-nums ${over ? "text-expense" : "text-foreground"}`}>
            ${category.spent.toLocaleString()} <span className="text-muted-foreground font-normal">/ ${category.budgeted.toLocaleString()}</span>
          </span>
        </div>
        <Progress
          value={pct}
          className={`h-1.5 ${over ? "[&>div]:bg-expense" : variant === "income" ? "[&>div]:bg-income" : "[&>div]:bg-primary"}`}
        />
      </div>
    </div>
  );
}

export default BudgetTab;

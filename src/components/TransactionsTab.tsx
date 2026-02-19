import { useBudget } from "@/context/BudgetContext";
import { Transaction } from "@/data/budgetData";
import { format, parseISO } from "date-fns";

interface TransactionWithCategory extends Transaction {
  categoryName: string;
  type: "income" | "expense" | "custom";
}

const TransactionsTab = () => {
  const { income, expenses, customSections, needsSetup } = useBudget();

  if (needsSetup) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Set up your budget first to see transactions.
      </div>
    );
  }

  // Collect all transactions
  const allTransactions: TransactionWithCategory[] = [];

  income.forEach((cat) => {
    cat.transactions?.forEach((tx) => {
      allTransactions.push({ ...tx, categoryName: cat.name, type: "income" });
    });
  });

  expenses.forEach((cat) => {
    cat.transactions?.forEach((tx) => {
      allTransactions.push({ ...tx, categoryName: cat.name, type: "expense" });
    });
  });

  customSections.forEach((section) => {
    section.items.forEach((cat) => {
      cat.transactions?.forEach((tx) => {
        allTransactions.push({ ...tx, categoryName: cat.name, type: "custom" });
      });
    });
  });

  // Sort by date descending
  allTransactions.sort((a, b) => b.date.localeCompare(a.date));

  // Group by date
  const grouped: Record<string, TransactionWithCategory[]> = {};
  allTransactions.forEach((tx) => {
    const key = tx.date;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(tx);
  });

  const dateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  if (allTransactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No transactions yet. Add transactions to your budget categories.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-card border border-border p-4 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium mb-1">
          Total Transactions
        </p>
        <p className="text-2xl font-bold tabular-nums text-foreground">
          {allTransactions.length}
        </p>
        <p className="text-[10px] text-muted-foreground">
          ${allTransactions.reduce((s, t) => s + t.amount, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} total amount
        </p>
      </div>

      {dateKeys.map((dateKey) => {
        const txs = grouped[dateKey];
        const dayTotal = txs.reduce((s, t) => s + t.amount, 0);
        let formattedDate: string;
        try {
          formattedDate = format(parseISO(dateKey), "EEE, MMM d, yyyy");
        } catch {
          formattedDate = dateKey;
        }

        return (
          <section key={dateKey}>
            <div className="flex justify-between items-center mb-2 px-1">
              <h3 className="text-xs font-bold text-foreground">{formattedDate}</h3>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                ${dayTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="space-y-1.5">
              {txs.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-xl bg-card border border-border px-3 py-2 flex justify-between items-center"
                >
                  <div>
                    <p className="text-xs font-medium text-foreground">{tx.merchant}</p>
                    <p className="text-[10px] text-primary">{tx.categoryName}</p>
                  </div>
                  <p className={`text-xs font-semibold tabular-nums ${tx.type === "income" ? "text-green-500" : "text-foreground"}`}>
                    {tx.type === "income" ? "+" : "-"}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default TransactionsTab;

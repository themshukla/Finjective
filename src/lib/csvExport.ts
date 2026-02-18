import { BudgetCategory, CustomSection } from "@/data/budgetData";

export const exportBudgetToCSV = (
  monthKey: string,
  income: BudgetCategory[],
  expenses: BudgetCategory[],
  customSections: CustomSection[]
) => {
  const rows: string[][] = [["Section", "Name", "Budgeted", "Actual", "Difference"]];

  income.forEach((item) => {
    rows.push(["Income", item.name, item.budgeted.toFixed(2), item.spent.toFixed(2), (item.spent - item.budgeted).toFixed(2)]);
  });

  expenses.forEach((item) => {
    rows.push(["Expenses", item.name, item.budgeted.toFixed(2), item.spent.toFixed(2), (item.spent - item.budgeted).toFixed(2)]);
  });

  customSections.forEach((section) => {
    section.items.forEach((item) => {
      rows.push([section.name, item.name, item.budgeted.toFixed(2), item.spent.toFixed(2), (item.spent - item.budgeted).toFixed(2)]);
    });
  });

  const csvContent = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `budget-${monthKey}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

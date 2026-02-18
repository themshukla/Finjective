export interface BudgetCategory {
  name: string;
  budgeted: number;
  spent: number;
  icon: string;
}

export interface CashFlowItem {
  month: string;
  income: number;
  expenses: number;
}

export interface AssetItem {
  name: string;
  value: number;
}

export interface LiabilityItem {
  name: string;
  value: number;
}

export const incomeCategories: BudgetCategory[] = [
  { name: "Salary", budgeted: 5500, spent: 5500, icon: "💼" },
  { name: "Freelance", budgeted: 1200, spent: 800, icon: "💻" },
  { name: "Investments", budgeted: 300, spent: 345, icon: "📈" },
];

export const expenseCategories: BudgetCategory[] = [
  { name: "Housing", budgeted: 1800, spent: 1800, icon: "🏠" },
  { name: "Food & Dining", budgeted: 600, spent: 520, icon: "🍽️" },
  { name: "Transportation", budgeted: 400, spent: 380, icon: "🚗" },
  { name: "Utilities", budgeted: 250, spent: 230, icon: "⚡" },
  { name: "Entertainment", budgeted: 200, spent: 275, icon: "🎬" },
  { name: "Healthcare", budgeted: 150, spent: 90, icon: "🏥" },
  { name: "Savings", budgeted: 1000, spent: 1000, icon: "🏦" },
  { name: "Shopping", budgeted: 300, spent: 340, icon: "🛍️" },
];

export const cashFlowData: CashFlowItem[] = [
  { month: "Sep", income: 6800, expenses: 5100 },
  { month: "Oct", income: 7100, expenses: 5400 },
  { month: "Nov", income: 6600, expenses: 5800 },
  { month: "Dec", income: 7500, expenses: 6200 },
  { month: "Jan", income: 7000, expenses: 5200 },
  { month: "Feb", income: 6645, expenses: 4635 },
];

export const assets: AssetItem[] = [
  { name: "Checking Account", value: 8500 },
  { name: "Savings Account", value: 25000 },
  { name: "Investment Portfolio", value: 42000 },
  { name: "Retirement (401k)", value: 78000 },
  { name: "Home Equity", value: 120000 },
  { name: "Vehicle", value: 18000 },
];

export const liabilities: LiabilityItem[] = [
  { name: "Mortgage", value: 185000 },
  { name: "Auto Loan", value: 12000 },
  { name: "Student Loans", value: 28000 },
  { name: "Credit Card", value: 3200 },
];

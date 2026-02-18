import { useState, createContext, useContext, ReactNode } from "react";
import { BudgetCategory, CashFlowItem, AssetItem, LiabilityItem, incomeCategories as defaultIncome, expenseCategories as defaultExpenses, cashFlowData as defaultCashFlow, assets as defaultAssets, liabilities as defaultLiabilities } from "@/data/budgetData";

interface BudgetState {
  income: BudgetCategory[];
  expenses: BudgetCategory[];
  cashFlow: CashFlowItem[];
  assets: AssetItem[];
  liabilities: LiabilityItem[];
  setIncome: (v: BudgetCategory[]) => void;
  setExpenses: (v: BudgetCategory[]) => void;
  setCashFlow: (v: CashFlowItem[]) => void;
  setAssets: (v: AssetItem[]) => void;
  setLiabilities: (v: LiabilityItem[]) => void;
}

const BudgetContext = createContext<BudgetState | null>(null);

export const useBudget = () => {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
};

export const BudgetProvider = ({ children }: { children: ReactNode }) => {
  const [income, setIncome] = useState<BudgetCategory[]>(defaultIncome);
  const [expenses, setExpenses] = useState<BudgetCategory[]>(defaultExpenses);
  const [cashFlow, setCashFlow] = useState<CashFlowItem[]>(defaultCashFlow);
  const [assets, setAssets] = useState<AssetItem[]>(defaultAssets);
  const [liabilities, setLiabilities] = useState<LiabilityItem[]>(defaultLiabilities);

  return (
    <BudgetContext.Provider value={{ income, expenses, cashFlow, assets, liabilities, setIncome, setExpenses, setCashFlow, setAssets, setLiabilities }}>
      {children}
    </BudgetContext.Provider>
  );
};

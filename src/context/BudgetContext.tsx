import { useState, createContext, useContext, ReactNode, useCallback } from "react";
import { BudgetCategory, CashFlowItem, AssetItem, LiabilityItem, CustomSection, incomeCategories as defaultIncome, expenseCategories as defaultExpenses, cashFlowData as defaultCashFlow, assets as defaultAssets, liabilities as defaultLiabilities } from "@/data/budgetData";
import { format, addMonths, subMonths } from "date-fns";

interface MonthData {
  income: BudgetCategory[];
  expenses: BudgetCategory[];
  customSections: CustomSection[];
}

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
  customSections: CustomSection[];
  setCustomSections: (v: CustomSection[]) => void;
  addCustomSection: (name: string) => void;
  selectedMonth: Date;
  setSelectedMonth: (d: Date) => void;
  monthKey: string;
  hasMonthData: (key: string) => boolean;
  importFromPreviousMonth: () => void;
  createEmptyMonth: () => void;
  needsSetup: boolean;
}

const BudgetContext = createContext<BudgetState | null>(null);

export const useBudget = () => {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
};

const getMonthKey = (d: Date) => format(d, "yyyy-MM");

export const BudgetProvider = ({ children }: { children: ReactNode }) => {
  const now = new Date();
  const currentKey = getMonthKey(now);

  // Store per-month budget data
  const [monthlyData, setMonthlyData] = useState<Record<string, MonthData>>({
    [currentKey]: { income: defaultIncome, expenses: defaultExpenses, customSections: [] },
  });

  const [selectedMonth, setSelectedMonth] = useState<Date>(now);
  const [cashFlow, setCashFlow] = useState<CashFlowItem[]>(defaultCashFlow);
  const [assets, setAssets] = useState<AssetItem[]>(defaultAssets);
  const [liabilities, setLiabilities] = useState<LiabilityItem[]>(defaultLiabilities);

  const monthKey = getMonthKey(selectedMonth);
  const currentMonthData = monthlyData[monthKey];
  const needsSetup = !currentMonthData;

  const income = currentMonthData?.income ?? [];
  const expenses = currentMonthData?.expenses ?? [];
  const customSections = currentMonthData?.customSections ?? [];

  const setIncome = useCallback((v: BudgetCategory[]) => {
    setMonthlyData(prev => ({
      ...prev,
      [monthKey]: { ...prev[monthKey], income: v },
    }));
  }, [monthKey]);

  const setExpenses = useCallback((v: BudgetCategory[]) => {
    setMonthlyData(prev => ({
      ...prev,
      [monthKey]: { ...prev[monthKey], expenses: v },
    }));
  }, [monthKey]);

  const setCustomSections = useCallback((v: CustomSection[]) => {
    setMonthlyData(prev => ({
      ...prev,
      [monthKey]: { ...prev[monthKey], customSections: v },
    }));
  }, [monthKey]);

  const addCustomSection = useCallback((name: string) => {
    const id = Date.now().toString();
    setMonthlyData(prev => ({
      ...prev,
      [monthKey]: {
        ...prev[monthKey],
        customSections: [...(prev[monthKey]?.customSections ?? []), { id, name, items: [] }],
      },
    }));
  }, [monthKey]);

  const hasMonthData = useCallback((key: string) => !!monthlyData[key], [monthlyData]);

  const importFromPreviousMonth = useCallback(() => {
    const prevKey = getMonthKey(subMonths(selectedMonth, 1));
    const prevData = monthlyData[prevKey];
    const imported: MonthData = prevData
      ? {
          income: prevData.income.map(c => ({ ...c, spent: 0 })),
          expenses: prevData.expenses.map(c => ({ ...c, spent: 0 })),
          customSections: (prevData.customSections ?? []).map(s => ({
            ...s,
            items: s.items.map(c => ({ ...c, spent: 0 })),
          })),
        }
      : { income: [], expenses: [], customSections: [] };
    setMonthlyData(prev => ({ ...prev, [monthKey]: imported }));
  }, [selectedMonth, monthlyData, monthKey]);

  const createEmptyMonth = useCallback(() => {
    setMonthlyData(prev => ({ ...prev, [monthKey]: { income: [], expenses: [], customSections: [] } }));
  }, [monthKey]);

  return (
    <BudgetContext.Provider value={{
      income, expenses, cashFlow, assets, liabilities,
      customSections, setCustomSections, addCustomSection,
      setIncome, setExpenses, setCashFlow, setAssets, setLiabilities,
      selectedMonth, setSelectedMonth, monthKey,
      hasMonthData, importFromPreviousMonth, createEmptyMonth, needsSetup,
    }}>
      {children}
    </BudgetContext.Provider>
  );
};

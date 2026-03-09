import { useState, createContext, useContext, ReactNode, useCallback, useEffect, useRef } from "react";
import { BudgetCategory, CashFlowItem, AssetItem, LiabilityItem, CustomSection, incomeCategories as defaultIncome, expenseCategories as defaultExpenses, cashFlowData as defaultCashFlow, assets as defaultAssets, liabilities as defaultLiabilities } from "@/data/budgetData";
import { format, subMonths } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MonthData {
  income: BudgetCategory[];
  expenses: BudgetCategory[];
  customSections: CustomSection[];
}

export interface NetWorthSnapshot {
  month_key: string;
  net_worth: number;
  assets: AssetItem[];
  liabilities: LiabilityItem[];
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
  latestMonthKey: string | null;
  createEmptyMonth: () => void;
  needsSetup: boolean;
  saving: boolean;
  monthlyData: Record<string, MonthData>;
  netWorthSnapshots: NetWorthSnapshot[];
  netWorthNeedsSetup: boolean;
  latestNetWorthSnapshotKey: string | null;
  importNetWorthFromPrevious: () => void;
  createEmptyNetWorth: () => void;
  snapshotsLoaded: boolean;
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

  const [monthlyData, setMonthlyData] = useState<Record<string, MonthData>>({});
  const [netWorthSnapshots, setNetWorthSnapshots] = useState<NetWorthSnapshot[]>([]);

  const [selectedMonth, setSelectedMonth] = useState<Date>(now);
  const [cashFlow, setCashFlow] = useState<CashFlowItem[]>(defaultCashFlow);
  const [assets, setAssets] = useState<AssetItem[]>(defaultAssets);
  const [liabilities, setLiabilities] = useState<LiabilityItem[]>(defaultLiabilities);
  const [saving, setSaving] = useState(false);
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set());
  const [snapshotsLoaded, setSnapshotsLoaded] = useState(false);

  const monthKey = getMonthKey(selectedMonth);
  const currentMonthData = monthlyData[monthKey];
  const needsSetup = !currentMonthData;

  const income = currentMonthData?.income ?? [];
  const expenses = currentMonthData?.expenses ?? [];
  const customSections = currentMonthData?.customSections ?? [];

  // Load all net worth snapshots once on mount
  useEffect(() => {
    const loadSnapshots = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase
        .from('net_worth_snapshots') as any)
        .select('month_key, net_worth, assets, liabilities')
        .eq('user_id', user.id)
        .order('month_key', { ascending: true });

      if (error) {
        console.error('Error loading net worth snapshots:', error);
        return;
      }

      if (data) {
        setNetWorthSnapshots(data.map((d: any) => ({
          month_key: d.month_key,
          net_worth: d.net_worth,
          assets: d.assets as AssetItem[],
          liabilities: d.liabilities as LiabilityItem[],
        })));
      }
      setSnapshotsLoaded(true);
    };

    loadSnapshots();
  }, []);

  // Load assets/liabilities for the selected month from snapshots
  useEffect(() => {
    if (!snapshotsLoaded) return;
    const snapshot = netWorthSnapshots.find(s => s.month_key === monthKey);
    if (snapshot) {
      setAssets(snapshot.assets?.length ? snapshot.assets : defaultAssets);
      setLiabilities(snapshot.liabilities?.length ? snapshot.liabilities : defaultLiabilities);
    }
    // If no snapshot for this month, keep current values (they'll be saved on first change)
  }, [monthKey, snapshotsLoaded]);

  // Save net worth snapshot when assets or liabilities change
  const prevNetWorthRef = useRef<string>("");

  useEffect(() => {
    if (!snapshotsLoaded) return;

    const totalAssets = assets.reduce((s, a) => {
      const val = a.entries && a.entries.length > 0 ? a.entries.reduce((sum, e) => sum + e.amount, 0) : (a.value ?? 0);
      return s + val;
    }, 0);
    const totalLiabilities = liabilities.reduce((s, l) => {
      const val = l.entries && l.entries.length > 0 ? l.entries.reduce((sum, e) => sum + e.amount, 0) : (l.value ?? 0);
      return s + val;
    }, 0);
    const netWorth = totalAssets - totalLiabilities;

    const serialized = JSON.stringify({ assets, liabilities, netWorth, monthKey });
    if (serialized === prevNetWorthRef.current) return;
    prevNetWorthRef.current = serialized;

    const saveSnapshot = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await (supabase
        .from('net_worth_snapshots') as any)
        .upsert({
          user_id: user.id,
          month_key: monthKey,
          net_worth: netWorth,
          assets: assets as unknown as Record<string, unknown>[],
          liabilities: liabilities as unknown as Record<string, unknown>[],
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,month_key' });

      if (error) {
        console.error('Error saving net worth snapshot:', error);
      } else {
        // Update local snapshots state
        setNetWorthSnapshots(prev => {
          const existing = prev.findIndex(s => s.month_key === monthKey);
          const updated = { month_key: monthKey, net_worth: netWorth, assets, liabilities };
          if (existing >= 0) {
            const arr = [...prev];
            arr[existing] = updated;
            return arr;
          }
          return [...prev, updated].sort((a, b) => a.month_key.localeCompare(b.month_key));
        });
      }
    };

    saveSnapshot();
  }, [assets, liabilities, monthKey, snapshotsLoaded]);

  // Load month data from database
  useEffect(() => {
    const loadMonth = async () => {
      if (loadedMonths.has(monthKey)) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase
        .from('budget_months') as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('month_key', monthKey)
        .maybeSingle();

      if (error) {
        console.error('Error loading budget:', error);
        return;
      }

      if (data) {
        setMonthlyData(prev => ({
          ...prev,
          [monthKey]: {
            income: data.income as unknown as BudgetCategory[],
            expenses: data.expenses as unknown as BudgetCategory[],
            customSections: (data.custom_sections as unknown as CustomSection[]) ?? [],
          },
        }));
      }

      setLoadedMonths(prev => new Set(prev).add(monthKey));
    };

    loadMonth();
  }, [monthKey, loadedMonths]);

  // Save to database
  const saveToDb = useCallback(async (key: string, data: MonthData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    const payload = {
      user_id: user.id,
      month_key: key,
      income: data.income as unknown as Record<string, unknown>[],
      expenses: data.expenses as unknown as Record<string, unknown>[],
      custom_sections: data.customSections as unknown as Record<string, unknown>[],
    };
    const { error } = await (supabase
      .from('budget_months') as any)
      .upsert(payload, { onConflict: 'user_id,month_key' });

    setSaving(false);

    if (error) {
      console.error('Error saving budget:', error);
      toast.error('Failed to save changes');
    } else {
      toast.success('Saved!', { duration: 1500 });
    }
  }, []);

  // Auto-save immediately on changes
  const prevDataRef = useRef<string>("");

  useEffect(() => {
    if (!currentMonthData || !loadedMonths.has(monthKey)) return;

    const serialized = JSON.stringify(currentMonthData);
    if (serialized === prevDataRef.current) return;
    prevDataRef.current = serialized;

    saveToDb(monthKey, currentMonthData);
  }, [currentMonthData, monthKey, saveToDb, loadedMonths]);

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

  const getLatestMonthKey = useCallback((): string | null => {
    const keys = Object.keys(monthlyData).filter(k => k < monthKey).sort();
    return keys.length > 0 ? keys[keys.length - 1] : null;
  }, [monthlyData, monthKey]);

  const importFromPreviousMonth = useCallback(() => {
    const sourceKey = getLatestMonthKey();
    const sourceData = sourceKey ? monthlyData[sourceKey] : null;
    const imported: MonthData = sourceData
      ? {
          income: sourceData.income.map(c => ({ ...c, spent: 0, transactions: [] })),
          expenses: sourceData.expenses.map(c => ({ ...c, spent: 0, transactions: [] })),
          customSections: (sourceData.customSections ?? []).map(s => ({
            ...s,
            items: s.items.map(c => ({ ...c, spent: 0, transactions: [] })),
          })),
        }
      : { income: [], expenses: [], customSections: [] };
    setMonthlyData(prev => ({ ...prev, [monthKey]: imported }));
  }, [monthlyData, monthKey, getLatestMonthKey]);

  const createEmptyMonth = useCallback(() => {
    setMonthlyData(prev => ({ ...prev, [monthKey]: { income: [], expenses: [], customSections: [] } }));
  }, [monthKey]);

  return (
    <BudgetContext.Provider value={{
      income, expenses, cashFlow, assets, liabilities,
      customSections, setCustomSections, addCustomSection,
      setIncome, setExpenses, setCashFlow, setAssets, setLiabilities,
      selectedMonth, setSelectedMonth, monthKey,
      hasMonthData, importFromPreviousMonth, createEmptyMonth, needsSetup, saving,
      latestMonthKey: getLatestMonthKey(),
      monthlyData,
      netWorthSnapshots,
    }}>
      {children}
    </BudgetContext.Provider>
  );
};

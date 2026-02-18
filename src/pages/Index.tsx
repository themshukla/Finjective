import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, PieChart } from "lucide-react";
import { BudgetProvider } from "@/context/BudgetContext";
import BudgetTab from "@/components/BudgetTab";
import CashFlowTab from "@/components/CashFlowTab";
import NetWorthTab from "@/components/NetWorthTab";

const Index = () => {
  return (
    <BudgetProvider>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Safe area top */}
        <header className="border-b border-border bg-card pt-[env(safe-area-inset-top)]">
          <div className="px-4 py-3">
            <h1 className="text-lg font-bold tracking-tight">💰 BudgetFlow</h1>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 pb-[env(safe-area-inset-bottom)] overflow-y-auto">
          <Tabs defaultValue="budget" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4 h-9">
              <TabsTrigger value="budget" className="gap-1 text-xs">
                <DollarSign className="h-3.5 w-3.5" /> Budget
              </TabsTrigger>
              <TabsTrigger value="cashflow" className="gap-1 text-xs">
                <TrendingUp className="h-3.5 w-3.5" /> Cash Flow
              </TabsTrigger>
              <TabsTrigger value="networth" className="gap-1 text-xs">
                <PieChart className="h-3.5 w-3.5" /> Net Worth
              </TabsTrigger>
            </TabsList>

            <TabsContent value="budget"><BudgetTab /></TabsContent>
            <TabsContent value="cashflow"><CashFlowTab /></TabsContent>
            <TabsContent value="networth"><NetWorthTab /></TabsContent>
          </Tabs>
        </main>
      </div>
    </BudgetProvider>
  );
};

export default Index;

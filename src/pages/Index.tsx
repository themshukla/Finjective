import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, PieChart } from "lucide-react";
import BudgetTab from "@/components/BudgetTab";
import CashFlowTab from "@/components/CashFlowTab";
import NetWorthTab from "@/components/NetWorthTab";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight">💰 BudgetFlow</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <Tabs defaultValue="budget" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="budget" className="gap-1.5 text-xs sm:text-sm">
              <DollarSign className="h-4 w-4" /> Budget
            </TabsTrigger>
            <TabsTrigger value="cashflow" className="gap-1.5 text-xs sm:text-sm">
              <TrendingUp className="h-4 w-4" /> Cash Flow
            </TabsTrigger>
            <TabsTrigger value="networth" className="gap-1.5 text-xs sm:text-sm">
              <PieChart className="h-4 w-4" /> Net Worth
            </TabsTrigger>
          </TabsList>

          <TabsContent value="budget">
            <BudgetTab />
          </TabsContent>
          <TabsContent value="cashflow">
            <CashFlowTab />
          </TabsContent>
          <TabsContent value="networth">
            <NetWorthTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;

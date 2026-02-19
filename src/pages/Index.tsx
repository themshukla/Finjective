import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, PieChart, User, List } from "lucide-react";
import { BudgetProvider } from "@/context/BudgetContext";
import BudgetTab from "@/components/BudgetTab";
import CashFlowTab from "@/components/CashFlowTab";
import NetWorthTab from "@/components/NetWorthTab";
import ProfileTab from "@/components/ProfileTab";
import TransactionsTab from "@/components/TransactionsTab";
import MonthSelector from "@/components/MonthSelector";
import PullToRefresh from "@/components/PullToRefresh";

const Index = () => {
  return (
    <BudgetProvider>
      {/* iPhone device frame */}
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="relative w-[375px] h-[812px] bg-foreground/5 rounded-[52px] shadow-2xl p-3 flex-shrink-0 border border-border">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-foreground/5 rounded-b-2xl z-20" />
          {/* Screen */}
          <div className="w-full h-full bg-background rounded-[42px] overflow-hidden flex flex-col">
            {/* Status bar */}
            <div className="h-12 flex items-end justify-between px-8 pb-1">
              <span className="text-[11px] font-semibold text-foreground">9:41</span>
              <div className="flex gap-1 items-center">
                <div className="w-4 h-2.5 border border-foreground rounded-sm relative">
                  <div className="absolute inset-[1.5px] right-[2px] bg-foreground rounded-[1px]" />
                </div>
              </div>
            </div>

            {/* Spacer for status bar */}

            {/* Month selector */}
            <MonthSelector />

            {/* Content */}
            <main className="flex-1 overflow-y-auto">
              <Tabs defaultValue="budget" className="w-full h-full flex flex-col">
                <PullToRefresh
                  onRefresh={() => new Promise(r => setTimeout(r, 600))}
                  className="flex-1 overflow-y-auto px-4 py-3 scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <TabsContent value="budget" className="mt-0"><BudgetTab /></TabsContent>
                  <TabsContent value="transactions" className="mt-0"><TransactionsTab /></TabsContent>
                  <TabsContent value="cashflow" className="mt-0"><CashFlowTab /></TabsContent>
                  <TabsContent value="networth" className="mt-0"><NetWorthTab /></TabsContent>
                  <TabsContent value="profile" className="mt-0"><ProfileTab /></TabsContent>
                </PullToRefresh>

                {/* Bottom tab bar */}
                <div className="border-t border-border bg-background px-2 pb-5 pt-1.5">
                  <TabsList className="w-full grid grid-cols-5 h-auto bg-transparent gap-0">
                    <TabsTrigger value="budget" className="flex-col gap-0.5 text-[10px] py-1 px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary text-muted-foreground">
                      <DollarSign className="h-5 w-5" />
                      Budget
                    </TabsTrigger>
                    <TabsTrigger value="transactions" className="flex-col gap-0.5 text-[10px] py-1 px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary text-muted-foreground">
                      <List className="h-5 w-5" />
                      Transactions
                    </TabsTrigger>
                    <TabsTrigger value="cashflow" className="flex-col gap-0.5 text-[10px] py-1 px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary text-muted-foreground">
                      <TrendingUp className="h-5 w-5" />
                      Cash Flow
                    </TabsTrigger>
                    <TabsTrigger value="networth" className="flex-col gap-0.5 text-[10px] py-1 px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary text-muted-foreground">
                      <PieChart className="h-5 w-5" />
                      Net Worth
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="flex-col gap-0.5 text-[10px] py-1 px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary text-muted-foreground">
                      <User className="h-5 w-5" />
                      Profile
                    </TabsTrigger>
                  </TabsList>
                </div>
              </Tabs>
            </main>
          </div>
        </div>
      </div>
    </BudgetProvider>
  );
};

export default Index;

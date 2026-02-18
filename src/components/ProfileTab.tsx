import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBudget } from "@/context/BudgetContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ChevronRight, Moon, Sun, Bell, Shield, HelpCircle, LogOut, Download } from "lucide-react";
import { exportBudgetToCSV } from "@/lib/csvExport";
import { toast } from "sonner";

const ProfileTab = () => {
  const { income, expenses, assets, liabilities, customSections, monthKey } = useBudget();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const totalIncome = income.reduce((s, c) => s + c.budgeted, 0);
  const totalExpenses = expenses.reduce((s, c) => s + c.spent, 0);
  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.value, 0);

  const displayName = user?.user_metadata?.display_name || user?.email || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleExportCSV = () => {
    exportBudgetToCSV(monthKey, income, expenses, customSections);
    toast.success("CSV downloaded!");
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const menuItems = [
    { icon: Download, label: "Export as CSV", onClick: handleExportCSV },
    { icon: theme === "dark" ? Moon : Sun, label: "Appearance", detail: theme === "dark" ? "Dark" : "Light", onClick: toggleTheme },
    { icon: Bell, label: "Notifications", detail: "On" },
    { icon: Shield, label: "Privacy & Security" },
    { icon: HelpCircle, label: "Help & Support" },
    { icon: LogOut, label: "Sign Out", destructive: true, onClick: handleSignOut },
  ];

  return (
    <div className="space-y-5">
      {/* Profile header */}
      <div className="rounded-xl bg-card border border-border p-5 flex flex-col items-center text-center">
        <Avatar className="h-16 w-16 mb-3">
          <AvatarImage src="" />
          <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">{initials}</AvatarFallback>
        </Avatar>
        <h2 className="text-base font-bold text-foreground">{displayName}</h2>
        <p className="text-xs text-muted-foreground">{user?.email}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-card border border-border p-3">
          <p className="text-[10px] text-primary uppercase tracking-wider">Monthly Savings</p>
          <p className={`text-lg font-bold tabular-nums ${totalIncome - totalExpenses >= 0 ? "text-foreground" : "text-expense"}`}>
            ${(totalIncome - totalExpenses).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3">
          <p className="text-[10px] text-primary uppercase tracking-wider">Net Worth</p>
          <p className={`text-lg font-bold tabular-nums ${totalAssets - totalLiabilities >= 0 ? "text-foreground" : "text-expense"}`}>
            ${(totalAssets - totalLiabilities).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Menu */}
      <div className="rounded-xl bg-card border border-border overflow-hidden divide-y divide-border">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="w-full flex items-center gap-3 px-3 py-3 text-left active:bg-secondary transition-colors"
          >
            <item.icon className={`h-4 w-4 ${item.destructive ? "text-destructive" : "text-primary"}`} />
            <span className={`text-xs font-medium flex-1 ${item.destructive ? "text-destructive" : "text-foreground"}`}>{item.label}</span>
            {item.detail && <span className="text-[10px] text-muted-foreground">{item.detail}</span>}
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileTab;

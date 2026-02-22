import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBudget } from "@/context/BudgetContext";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { ChevronRight, Moon, Sun, Bell, Shield, HelpCircle, Download, LogOut } from "lucide-react";
import { exportBudgetToCSV } from "@/lib/csvExport";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ProfileTab = () => {
  const { income, expenses, assets, liabilities, customSections, monthKey } = useBudget();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const totalIncome = income.reduce((s, c) => s + c.budgeted, 0);
  const totalExpenses = expenses.reduce((s, c) => s + c.spent, 0);
  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.value, 0);

  const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email || "User";
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "US";

  const handleExportCSV = () => {
    exportBudgetToCSV(monthKey, income, expenses, customSections);
    toast.success("CSV downloaded!");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const menuItems = [
    { icon: Download, label: "Export as CSV", onClick: handleExportCSV },
    { icon: theme === "dark" ? Moon : Sun, label: "Appearance", detail: theme === "dark" ? "Dark" : "Light", onClick: toggleTheme },
    { icon: Bell, label: "Notifications", detail: "On" },
    { icon: Shield, label: "Privacy & Security" },
    { icon: HelpCircle, label: "Help & Support" },
  ];

  return (
    <div className="space-y-5">
      {/* Profile header */}
      <div className="rounded-xl bg-card border border-border p-5 flex flex-col items-center text-center">
        <Avatar className="h-16 w-16 mb-3">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">{initials}</AvatarFallback>
        </Avatar>
        <h2 className="text-base font-bold text-foreground">{displayName}</h2>
        {user?.email && displayName !== user.email && (
          <p className="text-xs text-muted-foreground">{user.email}</p>
        )}
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
            <item.icon className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium flex-1 text-foreground">{item.label}</span>
            {item.detail && <span className="text-[10px] text-muted-foreground">{item.detail}</span>}
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-card border border-border px-3 py-3 text-destructive text-xs font-medium active:bg-secondary transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  );
};

export default ProfileTab;

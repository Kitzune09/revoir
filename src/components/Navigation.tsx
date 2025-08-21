import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun, BookOpen, Target, Calendar, Trophy, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: BookOpen },
    { id: "create", label: "Create Roadmap", icon: Plus },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "achievements", label: "Achievements", icon: Trophy },
  ];

  return (
    <nav className="flex items-center justify-between p-6 bg-gradient-card border-b border-border">
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Target className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">LearnPath</h1>
        </div>
        
        <div className="flex space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center space-x-2",
                  activeTab === item.id && "bg-primary text-primary-foreground shadow-orange"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={toggleTheme}
        className="p-2"
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>
    </nav>
  );
}
import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Dashboard } from "@/components/Dashboard";
import { CreateRoadmap } from "@/components/CreateRoadmap";
import { MindMap } from "@/components/MindMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Trophy } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onCreateRoadmap={() => setActiveTab("create")} />;
      case "create":
        return <CreateRoadmap />;
      case "calendar":
        return (
          <div className="p-6 space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
                <Calendar className="h-8 w-8 text-primary" />
                Study Calendar
              </h2>
              <p className="text-muted-foreground">Plan and track your study sessions</p>
            </div>
            
            <div className="space-y-6">
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle>Interactive Mind Map</CardTitle>
                </CardHeader>
                <CardContent>
                  <MindMap />
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case "achievements":
        return (
          <div className="p-6 space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
                <Trophy className="h-8 w-8 text-primary" />
                Achievements
              </h2>
              <p className="text-muted-foreground">Celebrate your learning milestones</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-success border-border/50 text-success-foreground">
                <CardContent className="p-6 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">First Roadmap</h3>
                  <p className="text-sm opacity-90">Created your first learning roadmap</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-card border-border/50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-muted-foreground">Week Warrior</h3>
                  <p className="text-sm text-muted-foreground">Study for 7 consecutive days</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-card border-border/50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-muted-foreground">Task Master</h3>
                  <p className="text-sm text-muted-foreground">Complete 50 learning tasks</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      default:
        return <Dashboard onCreateRoadmap={() => setActiveTab("create")} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="container mx-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
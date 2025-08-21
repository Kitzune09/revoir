import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Clock, Target, TrendingUp } from "lucide-react";

interface Roadmap {
  id: string;
  title: string;
  subject: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  deadline: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

interface DashboardProps {
  onCreateRoadmap: () => void;
}

export function Dashboard({ onCreateRoadmap }: DashboardProps) {
  // Mock data - in real app this would come from state management
  const roadmaps: Roadmap[] = [
    {
      id: "1",
      title: "Complete React Mastery",
      subject: "React Development",
      progress: 65,
      totalTasks: 12,
      completedTasks: 8,
      deadline: "Dec 31, 2024",
      difficulty: "Intermediate"
    },
    {
      id: "2", 
      title: "Data Structures & Algorithms",
      subject: "Computer Science",
      progress: 30,
      totalTasks: 20,
      completedTasks: 6,
      deadline: "Jan 15, 2025",
      difficulty: "Advanced"
    },
    {
      id: "3",
      title: "UI/UX Design Fundamentals",
      subject: "Design",
      progress: 85,
      totalTasks: 8,
      completedTasks: 7,
      deadline: "Nov 30, 2024",
      difficulty: "Beginner"
    }
  ];

  const stats = {
    totalRoadmaps: roadmaps.length,
    averageProgress: Math.round(roadmaps.reduce((acc, r) => acc + r.progress, 0) / roadmaps.length),
    completedTasks: roadmaps.reduce((acc, r) => acc + r.completedTasks, 0),
    totalTasks: roadmaps.reduce((acc, r) => acc + r.totalTasks, 0)
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-success text-success-foreground";
      case "Intermediate": return "bg-warning text-warning-foreground";
      case "Advanced": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Learning Dashboard</h2>
          <p className="text-muted-foreground">Track your progress and stay motivated</p>
        </div>
        <Button onClick={onCreateRoadmap} className="bg-primary hover:bg-primary-hover shadow-orange">
          <Plus className="h-4 w-4 mr-2" />
          New Roadmap
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Roadmaps</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalRoadmaps}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Progress</p>
                <p className="text-2xl font-bold text-foreground">{stats.averageProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tasks Completed</p>
                <p className="text-2xl font-bold text-foreground">{stats.completedTasks}/{stats.totalTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Study Streak</p>
                <p className="text-2xl font-bold text-foreground">7 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roadmaps Grid */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-4">Your Learning Roadmaps</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roadmaps.map((roadmap) => (
            <Card key={roadmap.id} className="bg-gradient-card border-border/50 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {roadmap.title}
                  </CardTitle>
                  <Badge className={getDifficultyColor(roadmap.difficulty)}>
                    {roadmap.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{roadmap.subject}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-foreground font-medium">{roadmap.progress}%</span>
                  </div>
                  <Progress value={roadmap.progress} className="h-2" />
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {roadmap.completedTasks}/{roadmap.totalTasks} tasks
                  </span>
                  <span className="text-muted-foreground">Due: {roadmap.deadline}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
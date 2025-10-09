import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useGoogleAuth } from "@/contexts/GoogleAuthContext";

interface StudyEvent {
  summary: string;
  description: string;
  start: { dateTime: string };
  end: { dateTime: string };
}

interface StudyPlan {
  id: string;
  roadmap_id: string;
  plan_data: StudyEvent[];
  plan_type: string;
  hours_per_week: number;
  starting_date: string;
  created_at: string;
}

export function Calendar() {
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { signInAndExecute, addEventsToCalendar } = useGoogleAuth();
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadStudyPlans();
  }, []);

  const loadStudyPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('study_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Cast plan_data from Json to StudyEvent[]
      const typedPlans: StudyPlan[] = (data || []).map(plan => ({
        ...plan,
        plan_data: plan.plan_data as unknown as StudyEvent[]
      }));
      
      setStudyPlans(typedPlans);
    } catch (error) {
      console.error("Error loading study plans:", error);
      toast.error("Failed to load study plans");
    } finally {
      setLoading(false);
    }
  };

  const handleExportToGoogleCalendar = async () => {
    if (studyPlans.length === 0) {
      toast.error("No study plans to export");
      return;
    }

    // Combine all events from all plans
    const allEvents = studyPlans.flatMap(plan => plan.plan_data);

    setIsExporting(true);
    try {
      await signInAndExecute(async () => {
        await addEventsToCalendar(allEvents);
        toast.success("Study plans exported to Google Calendar!");
        setIsExporting(false);
      });
    } catch (error) {
      console.error('Error exporting to calendar:', error);
      toast.error("Failed to export to Google Calendar");
      setIsExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading your calendar...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
          <CalendarIcon className="h-8 w-8 text-primary" />
          Study Calendar
        </h2>
        <p className="text-muted-foreground">Your day-wise study plan</p>
      </div>

      {studyPlans.length === 0 ? (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-12 text-center">
            <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No study plans yet</h3>
            <p className="text-muted-foreground">Create a roadmap to generate your study calendar</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {studyPlans.map((plan) => (
              <Card key={plan.id} className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Study Plan</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {plan.plan_type} • {plan.hours_per_week}h/week
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {plan.plan_data.map((event: StudyEvent, index: number) => (
                      <div key={index} className="p-4 border border-border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground mb-1">{event.summary}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                {formatDate(event.start.dateTime)}
                              </span>
                              <span>
                                {formatTime(event.start.dateTime)} - {formatTime(event.end.dateTime)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleExportToGoogleCalendar}
              disabled={isExporting}
              size="lg"
              className="bg-gradient-primary text-primary-foreground px-8 shadow-orange"
            >
              <Download className="h-5 w-5 mr-2" />
              {isExporting ? "Exporting..." : "Export to Google Calendar"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

export default function CalendarPreview() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="space-y-6">
      <div className="border-t border-border" />
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Study Calendar</CardTitle>
          <p className="text-muted-foreground">View and plan your study sessions</p>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border border-border"
          />
        </CardContent>
      </Card>
    </div>
  );
}

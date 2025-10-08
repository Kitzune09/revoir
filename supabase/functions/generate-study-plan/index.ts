import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roadmap, planType, hoursPerWeek } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating study plan with params:', { planType, hoursPerWeek, roadmap });

    const systemPrompt = `You are an expert study planner. Create a realistic, well-paced study schedule based on the provided learning roadmap.

Guidelines:
- Schedule sessions during weekdays (Monday-Friday) between 9 AM and 9 PM
- Each study session should be 1-3 hours long
- Distribute ${hoursPerWeek} hours per week across the subtasks
- Consider estimated hours for each subtask
- Create a ${planType} plan
- Space out sessions appropriately to avoid burnout
- Include breaks between intensive sessions`;

    const userPrompt = `Create a detailed study plan for this learning roadmap:

Title: ${roadmap.title}
Subject: ${roadmap.subject}
Description: ${roadmap.description || 'No description'}

Subtasks:
${roadmap.subtasks.map((st: any, i: number) => `${i + 1}. ${st.title} (${st.estimated_hours || 2}h) - ${st.description}`).join('\n')}

Requirements:
- Plan Type: ${planType}
- Hours per week: ${hoursPerWeek}
- Start date: ${new Date().toISOString()}

Generate a JSON array of calendar events following this exact schema for each session.`;

    const eventSchema = {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "Title of the study session (e.g., 'Study Session: Module 1 - JavaScript Fundamentals')"
        },
        description: {
          type: "string",
          description: "Detailed description of what to cover in this session"
        },
        start: {
          type: "object",
          properties: {
            dateTime: {
              type: "string",
              description: "ISO 8601 format with timezone (e.g., '2025-10-13T10:00:00-07:00')"
            }
          },
          required: ["dateTime"]
        },
        end: {
          type: "object",
          properties: {
            dateTime: {
              type: "string",
              description: "ISO 8601 format with timezone (e.g., '2025-10-13T12:00:00-07:00')"
            }
          },
          required: ["dateTime"]
        }
      },
      required: ["summary", "description", "start", "end"]
    };

    const responseSchema = {
      type: "object",
      properties: {
        events: {
          type: "array",
          items: eventSchema,
          description: "Array of study session events"
        }
      },
      required: ["events"]
    };

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "study_plan",
            strict: true,
            schema: responseSchema
          }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsedContent = JSON.parse(content);

    console.log('Generated study plan:', parsedContent);

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-study-plan:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

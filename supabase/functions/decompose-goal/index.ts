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
    const { goal, subject, difficulty } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert learning path designer. Your task is to break down learning goals into logical, sequential subtasks that form a complete learning roadmap.

For each subtask, provide:
1. A clear, concise title
2. A detailed description of what the learner will cover
3. Estimated hours needed to complete
4. Prerequisites (array of other subtask titles that must be completed first)

Consider the difficulty level and create an appropriate number of subtasks (5-12 depending on complexity).
Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Task title",
    "description": "Detailed description",
    "estimated_hours": number,
    "prerequisites": ["prerequisite task title 1", "prerequisite task title 2"]
  }
]`;

    const userPrompt = `Create a learning roadmap for:
Goal: ${goal}
Subject: ${subject}
Difficulty: ${difficulty}

Break this down into a logical sequence of subtasks with clear dependencies.`;

    console.log('Calling Lovable AI with goal:', goal);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('AI response received:', content);

    // Extract JSON from the response (in case it's wrapped in markdown)
    let subtasks;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      subtasks = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI response. Please try again.');
    }

    console.log('Parsed subtasks:', subtasks);

    return new Response(
      JSON.stringify({ subtasks }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error in decompose-goal function:', error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
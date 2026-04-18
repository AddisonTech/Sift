import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface UserPreferences {
  price_weight: number;
  quality_weight: number;
  ethics_weight: number;
  health_weight: number;
  speed_weight: number;
  dietary: string[];
  budget: string;
  distance_radius_km: number;
  avoid_chains: boolean;
}

interface RequestBody {
  imageBase64?: string;
  mimeType?: string;
  textQuery?: string;
  location: { lat: number; lng: number } | null;
  preferences: UserPreferences;
}

interface GeminiAnalysis {
  item_name: string;
  item_category: string;
  base_score: number;
  verdict: string;
  reasoning: string;
  score_breakdown: {
    price: number;
    quality: number;
    ethics: number;
    health: number;
    speed: number;
  };
  search_query: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    });
  }

  try {
    const body: RequestBody = await req.json();
    const { imageBase64, mimeType, textQuery, preferences } = body;

    if (!textQuery && (!imageBase64 || !mimeType)) {
      throw new Error('Either textQuery or imageBase64 + mimeType must be provided');
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const systemPrompt = `You are Sift, a personal decision engine. Analyze the item and return a JSON object.

Based on the user's preferences (weights 1-10: price=${preferences.price_weight}, quality=${preferences.quality_weight}, ethics=${preferences.ethics_weight}, health=${preferences.health_weight}, speed=${preferences.speed_weight}, budget=${preferences.budget}, dietary=${preferences.dietary.join(',')}):

Return ONLY valid JSON matching this schema:
{
  "item_name": "string — specific name, brand if visible",
  "item_category": "product|restaurant|food|service|other",
  "base_score": number (0-100, weighted by user preferences),
  "verdict": "Buy|Skip|Go|Pass|Watch",
  "reasoning": "string — 1-3 punchy sentences, no fluff, confident tone",
  "score_breakdown": {
    "price": number,
    "quality": number,
    "ethics": number,
    "health": number,
    "speed": number
  },
  "search_query": "string — a good search query to find online alternatives"
}

Verdict rules:
- For products: Buy (score ≥65), Watch (50-64), Skip (<50)
- For restaurants/food: Go (score ≥65), Watch (50-64), Pass (<50)
- Be confident. Never hedge. If the score is 72, say it clearly.`;

    const parts: object[] = textQuery
      ? [{ text: `${systemPrompt}\n\nUser query: "${textQuery}"` }]
      : [
          { text: systemPrompt },
          { inlineData: { mimeType, data: imageBase64 } },
        ];

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.4,
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.status} — ${errText}`);
    }

    const geminiData = await geminiResponse.json();
    const rawText: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!rawText) {
      const finishReason = geminiData.candidates?.[0]?.finishReason ?? 'unknown';
      throw new Error(`Gemini returned no content (finishReason: ${finishReason})`);
    }

    const analysis: GeminiAnalysis = JSON.parse(rawText);

    const requiredFields: (keyof GeminiAnalysis)[] = ['item_name', 'base_score', 'verdict', 'reasoning'];
    for (const field of requiredFields) {
      if (analysis[field] === undefined || analysis[field] === null) {
        throw new Error(`Gemini response missing required field: ${field}`);
      }
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

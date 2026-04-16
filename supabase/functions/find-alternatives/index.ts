import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RequestBody {
  location: { lat: number; lng: number } | null;
  item_name: string;
  item_category: string;
  search_query: string;
}

interface LocalAlternative {
  id: string;
  name: string;
  distance_km: number;
  address: string;
  rating: number | null;
  price_level: number | null;
  place_id: string;
}

interface OnlineAlternative {
  id: string;
  name: string;
  price: number;
  currency: string;
  merchant: string;
  url: string;
  image_url: string | null;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function categoryToPlaceTypes(category: string): string[] {
  switch (category) {
    case 'restaurant':
    case 'food':
      return ['restaurant', 'cafe', 'bakery', 'meal_takeaway'];
    case 'product':
      return ['store', 'shopping_mall', 'supermarket'];
    default:
      return ['store', 'restaurant', 'cafe'];
  }
}

function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
    const { location, item_category, search_query } = body;

    const googlePlacesKey = Deno.env.get('GOOGLE_PLACES_KEY');
    const serperApiKey = Deno.env.get('SERPER_API_KEY');

    const local_alternatives: LocalAlternative[] = [];
    const online_alternatives: OnlineAlternative[] = [];

    if (location && googlePlacesKey) {
      const radiusMeters = 8000;
      const includedTypes = categoryToPlaceTypes(item_category);

      const placesResponse = await fetch(
        'https://places.googleapis.com/v1/places:searchNearby',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': googlePlacesKey,
            'X-Goog-FieldMask':
              'places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.location',
          },
          body: JSON.stringify({
            includedTypes,
            locationRestriction: {
              circle: {
                center: { latitude: location.lat, longitude: location.lng },
                radius: radiusMeters,
              },
            },
            maxResultCount: 5,
          }),
        },
      );

      if (placesResponse.ok) {
        const placesData = await placesResponse.json();
        const places = placesData.places ?? [];

        for (const place of places) {
          const placeLat = place.location?.latitude ?? location.lat;
          const placeLng = place.location?.longitude ?? location.lng;
          const distKm = haversineKm(location.lat, location.lng, placeLat, placeLng);

          local_alternatives.push({
            id: place.id ?? crypto.randomUUID(),
            name: place.displayName?.text ?? 'Unknown',
            distance_km: Math.round(distKm * 10) / 10,
            address: place.formattedAddress ?? '',
            rating: place.rating ?? null,
            price_level: place.priceLevel ?? null,
            place_id: place.id ?? '',
          });
        }
      }
    }

    if (serperApiKey) {
      const serperResponse = await fetch('https://google.serper.dev/shopping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': serperApiKey,
        },
        body: JSON.stringify({ q: search_query, num: 5 }),
      });

      if (serperResponse.ok) {
        const serperData = await serperResponse.json();
        const shopping = serperData.shopping ?? [];

        for (const item of shopping) {
          const rawPrice = typeof item.price === 'string'
            ? parseFloat(item.price.replace(/[^0-9.]/g, ''))
            : (item.price ?? 0);

          online_alternatives.push({
            id: crypto.randomUUID(),
            name: item.title ?? 'Unknown',
            price: isNaN(rawPrice) ? 0 : rawPrice,
            currency: 'USD',
            merchant: item.source ?? item.merchant ?? 'Unknown',
            url: item.link ?? '',
            image_url: item.imageUrl ?? null,
          });
        }
      }
    }

    return new Response(JSON.stringify({ local_alternatives, online_alternatives }), {
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

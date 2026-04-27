export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface CommunitySquad {
  id: string;
  trainer_name: string;
  squad_name: string;
  code: string;
  pokemon_preview: { name: string; pokemonId: number; isShiny: boolean }[];
  created_at: string;
}

export async function fetchSquads(): Promise<CommunitySquad[]> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/squads?select=*&order=created_at.desc&limit=30`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

export async function uploadSquad(
  squad: Omit<CommunitySquad, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/squads`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(squad),
    });
    if (!response.ok) {
      const err = await response.text();
      console.error('Upload error:', response.status, err);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Upload exception:', e);
    return false;
  }
}
import { createAdminClient } from '@/lib/supabase/admin';
import type { CityImage } from '@/types/database';

type CityImageRow = CityImage & {
  city_image_id: number;
  unsplash_id: string;
  fetched_at: string;
};

type UpsertInput = {
  city_key: string;
  unsplash_id: string;
  raw_url: string;
  blur_hash: string | null;
  photographer_name: string;
  photographer_url: string;
};

export async function getCityImage(cityKey: string): Promise<(CityImage & { fetched_at: string }) | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('city_images')
    .select('*')
    .eq('city_key', cityKey)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const row = data as CityImageRow;
  return {
    city_key: row.city_key,
    raw_url: row.raw_url,
    blur_hash: row.blur_hash,
    photographer_name: row.photographer_name,
    photographer_url: row.photographer_url,
    fetched_at: row.fetched_at
  };
}

export async function getCityImages(cityKeys: string[]): Promise<Map<string, CityImage & { fetched_at: string }>> {
  const result = new Map<string, CityImage & { fetched_at: string }>();
  if (cityKeys.length === 0) {
    return result;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('city_images')
    .select('*')
    .in('city_key', cityKeys);

  if (error) {
    throw error;
  }

  for (const row of (data ?? []) as CityImageRow[]) {
    result.set(row.city_key, {
      city_key: row.city_key,
      raw_url: row.raw_url,
      blur_hash: row.blur_hash,
      photographer_name: row.photographer_name,
      photographer_url: row.photographer_url,
      fetched_at: row.fetched_at
    });
  }

  return result;
}

export async function upsertCityImage(input: UpsertInput): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('city_images')
    .upsert(
      {
        city_key: input.city_key,
        unsplash_id: input.unsplash_id,
        raw_url: input.raw_url,
        blur_hash: input.blur_hash,
        photographer_name: input.photographer_name,
        photographer_url: input.photographer_url,
        fetched_at: new Date().toISOString()
      },
      { onConflict: 'city_key' }
    );

  if (error) {
    throw error;
  }
}

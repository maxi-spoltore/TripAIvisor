import { getCityImage, getCityImages, upsertCityImage } from '@/lib/db/queries/city-images';
import { searchCityImage } from './unsplash';
import type { CityImage } from '@/types/database';

const STALE_DAYS = 30;

function normalizeCityKey(city: string): string {
  return city.trim().toLowerCase();
}

function isStale(fetchedAt: string): boolean {
  const fetchedDate = new Date(fetchedAt);
  const now = new Date();
  const diffMs = now.getTime() - fetchedDate.getTime();
  return diffMs > STALE_DAYS * 24 * 60 * 60 * 1000;
}

export async function resolveCityImage(cityName: string): Promise<CityImage | null> {
  const cityKey = normalizeCityKey(cityName);
  if (!cityKey) {
    return null;
  }

  const cached = await getCityImage(cityKey);

  if (cached && !isStale(cached.fetched_at)) {
    return cached;
  }

  const result = await searchCityImage(cityName);
  if (!result) {
    return cached ?? null;
  }

  try {
    await upsertCityImage({ city_key: cityKey, ...result });
  } catch {
    // Cache write failed — still return the fetched result
  }

  return {
    city_key: cityKey,
    raw_url: result.raw_url,
    blur_hash: result.blur_hash,
    photographer_name: result.photographer_name,
    photographer_url: result.photographer_url
  };
}

export async function resolveCityImages(cityNames: string[]): Promise<Map<string, CityImage>> {
  const result = new Map<string, CityImage>();
  const uniqueKeys = new Map<string, string>();

  for (const name of cityNames) {
    const key = normalizeCityKey(name);
    if (key && !uniqueKeys.has(key)) {
      uniqueKeys.set(key, name);
    }
  }

  if (uniqueKeys.size === 0) {
    return result;
  }

  const keys = Array.from(uniqueKeys.keys());
  const cached = await getCityImages(keys);

  const missingKeys: string[] = [];
  const staleKeys: string[] = [];

  for (const key of keys) {
    const entry = cached.get(key);
    if (!entry) {
      missingKeys.push(key);
    } else if (isStale(entry.fetched_at)) {
      staleKeys.push(key);
      result.set(key, entry);
    } else {
      result.set(key, entry);
    }
  }

  const keysToFetch = [...missingKeys, ...staleKeys];

  await Promise.all(
    keysToFetch.map(async (key) => {
      const originalName = uniqueKeys.get(key) ?? key;
      const fetched = await searchCityImage(originalName);
      if (!fetched) {
        return;
      }

      const image: CityImage = {
        city_key: key,
        raw_url: fetched.raw_url,
        blur_hash: fetched.blur_hash,
        photographer_name: fetched.photographer_name,
        photographer_url: fetched.photographer_url
      };

      result.set(key, image);

      try {
        await upsertCityImage({ city_key: key, ...fetched });
      } catch {
        // Cache write failed
      }
    })
  );

  return result;
}

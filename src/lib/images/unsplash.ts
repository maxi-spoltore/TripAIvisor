type UnsplashResult = {
  unsplash_id: string;
  raw_url: string;
  blur_hash: string | null;
  photographer_name: string;
  photographer_url: string;
};

export async function searchCityImage(city: string): Promise<UnsplashResult | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return null;
  }

  const query = `${city} city landmark`;
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}` },
      next: { revalidate: false }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const photo = data.results?.[0];
    if (!photo) {
      return null;
    }

    return {
      unsplash_id: photo.id,
      raw_url: photo.urls.raw,
      blur_hash: photo.blur_hash ?? null,
      photographer_name: photo.user.name,
      photographer_url: photo.user.links.html
    };
  } catch {
    return null;
  }
}

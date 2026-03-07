CREATE TABLE city_images (
  city_image_id SERIAL PRIMARY KEY,
  city_key TEXT NOT NULL UNIQUE,
  unsplash_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  thumb_url TEXT NOT NULL,
  blur_hash TEXT,
  photographer_name TEXT NOT NULL,
  photographer_url TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

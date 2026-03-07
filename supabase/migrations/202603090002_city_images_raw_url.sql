ALTER TABLE city_images ADD COLUMN raw_url TEXT;

UPDATE city_images SET raw_url = image_url;

ALTER TABLE city_images ALTER COLUMN raw_url SET NOT NULL;

ALTER TABLE city_images DROP COLUMN image_url;
ALTER TABLE city_images DROP COLUMN thumb_url;

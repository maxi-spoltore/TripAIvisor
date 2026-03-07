'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { CityImage } from '@/types/database';

type TripCardImageCarouselProps = {
  images: CityImage[];
};

export function TripCardImageCarousel({ images }: TripCardImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearRotation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startRotation = useCallback(() => {
    clearRotation();
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 2000);
  }, [clearRotation, images.length]);

  useEffect(() => {
    return clearRotation;
  }, [clearRotation]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    startRotation();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    clearRotation();
  };

  const activeImage = images[activeIndex];

  return (
    <div
      className="relative h-32 sm:h-36 lg:h-44"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {images.map((image, index) => (
        <Image
          key={image.city_key}
          alt=""
          className={`object-cover [object-position:center_25%] lg:[object-position:center_30%] transition-opacity duration-700 ${
            index === activeIndex ? 'opacity-100' : 'opacity-0'
          }`}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          src={`${image.raw_url}&w=1200&q=80&fit=crop`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />

      {/* Dot indicators */}
      <div
        className={`absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-1.5 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {images.map((image, index) => (
          <span
            key={image.city_key}
            className={`block h-1.5 rounded-full transition-all duration-300 ${
              index === activeIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
            }`}
          />
        ))}
      </div>

      <p className="absolute bottom-1.5 right-2 text-[10px] text-white/70">
        Photo by <span className="font-medium">{activeImage.photographer_name}</span> / Unsplash
      </p>
    </div>
  );
}

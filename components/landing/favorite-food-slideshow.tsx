"use client";

import Image from "next/image";
import { useState } from "react";

const slides = [
  { src: "/ramen-promo.webp" },
  { src: "/favorite-food-burger.webp" },
  { src: "/favorite-food-onigiri.webp" },
  { src: "/favorite-food-udon.webp" },
] as const;

export function FavoriteFoodSlideshow() {
  const [paused, setPaused] = useState(false);

  return (
    <div className="relative aspect-square overflow-hidden border border-border bg-card">
      <div className="absolute right-2 top-2 z-20">
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          className="rounded-md border border-white/40 bg-black/45 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm hover:bg-black/55"
        >
          {paused ? "スライドを再生" : "スライドを一時停止"}
        </button>
      </div>
      {slides.map((slide, index) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt=""
          width={1080}
          height={1080}
          sizes="(min-width: 1024px) 36rem, calc(100vw - 2rem)"
          priority={index === 0}
          className={[
            "public-home-fade-slide absolute inset-0 h-full w-full object-cover",
            paused ? "public-home-fade-slide--paused" : "",
          ].join(" ")}
          style={{ animationDelay: `${index * 4.5}s` }}
        />
      ))}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-5 text-white">
        <p className="text-sm font-semibold">好きな物も、記録すれば調整できる</p>
      </div>
    </div>
  );
}

import Image from "next/image";

const slides = [
  { src: "/ramen-promo.webp" },
  { src: "/favorite-food-burger.webp" },
  { src: "/favorite-food-onigiri.webp" },
  { src: "/favorite-food-udon.webp" },
] as const;

export function FavoriteFoodSlideshow() {
  return (
    <div className="relative aspect-square overflow-hidden border border-border bg-card">
      {slides.map((slide, index) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt=""
          width={1080}
          height={1080}
          sizes="(min-width: 1024px) 36rem, calc(100vw - 2rem)"
          priority={index === 0}
          loading={index === 0 ? undefined : "lazy"}
          className="public-home-fade-slide absolute inset-0 h-full w-full object-cover"
          style={{ animationDelay: `${index * 4.5}s` }}
        />
      ))}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-5 text-white">
        <p className="text-sm font-semibold">
          好きな物も、記録すれば調整できる
        </p>
      </div>
    </div>
  );
}

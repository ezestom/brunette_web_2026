import type { Content } from "../lib/types";

/** Local Instagram assets, in the same numbered order as public/. */
export const socialMedia: NonNullable<Content["home"]["socialMedia"]> =
  Array.from({ length: 6 }, (_, index) => {
    const number = index + 1;
    return [
      {
        type: "video" as const,
        src: `/social_media_videos/video${number}.mp4`,
        poster: `/social_media_videos/video${number}-poster.webp`,
        alt: `Video ${number} de Brunette`,
      },
      {
        type: "image" as const,
        src: `/social_media_photos/instagram${number}.jpg`,
        alt: `Foto ${number} de Brunette en Instagram`,
      },
    ];
  }).flat();

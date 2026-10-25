import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { socialMedia } from "../src/data/social-media.ts";
import sample from "../content/demo.json" with { type: "json" };
import { validateContent } from "../src/lib/validation.ts";

test("local social media alternates six real clips and six photos with existing posters", () => {
  assert.equal(socialMedia.length, 12);
  socialMedia.forEach((item, index) => {
    assert.equal(item.type, index % 2 ? "image" : "video");
    assert.ok(existsSync(new URL(`../public${item.src}`, import.meta.url)));
    if (item.type === "video") {
      assert.ok(item.poster);
      assert.ok(existsSync(new URL(`../public${item.poster}`, import.meta.url)));
    }
  });
});

test("social clips and photos survive content validation", () => {
  const content = structuredClone(sample);
  content.home.socialMedia = [
    {
      type: "video",
      src: "/media/reel.mp4",
      poster: "/assets/poster.jpg",
      alt: "En el mostrador",
    },
    {
      type: "image",
      src: "/social_media_photos/instagram1.jpg",
      href: "https://www.instagram.com/",
    },
  ];
  assert.deepEqual(
    validateContent(content).home.socialMedia,
    content.home.socialMedia,
  );
});

test("social media rejects unsafe URLs", () => {
  for (const src of [
    "javascript:alert(1)",
    "/media/../private.mp4",
    "data:text/html,test",
  ]) {
    const content = structuredClone(sample);
    content.home.socialMedia = [{ type: "video", src }];
    assert.throws(() => validateContent(content));
  }
});

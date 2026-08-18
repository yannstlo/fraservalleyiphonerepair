import type { CollectionEntry } from "astro:content";

type BlogPost = CollectionEntry<"blog">;

export function postUrl(post: BlogPost): string {
  if (post.data.originalUrl) {
    return new URL(post.data.originalUrl).pathname;
  }

  return `/blog/${post.slug}.html`;
}

export function postRouteParam(post: BlogPost): string {
  return postUrl(post).replace(/^\/+|\/+$/g, "");
}

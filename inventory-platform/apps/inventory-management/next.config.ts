import type { NextConfig } from "next";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const monorepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const storageHostnames = Array.from(
  new Set(
    [
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      ...(process.env.NEXT_PUBLIC_ASSET_HOSTS ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ]
      .map((value) => {
        if (!value) return undefined;

        try {
          return new URL(value.includes("://") ? value : `https://${value}`).hostname;
        } catch {
          return undefined;
        }
      })
      .filter((value): value is string => Boolean(value)),
  ),
);

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  transpilePackages: ["@workspace/ui", "@workspace/db"],
  turbopack: {
    root: monorepoRoot,
  },
  images: storageHostnames.length
    ? {
        remotePatterns: storageHostnames.map((hostname) => ({
          protocol: "https" as const,
          hostname,
          pathname: "/storage/v1/object/**",
        })),
      }
    : undefined,
};

export default nextConfig;

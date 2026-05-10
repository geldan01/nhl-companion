import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a minimal self-contained server bundle at .next/standalone for the
  // Docker runtime image (see Dockerfile). Required for the small final image.
  output: "standalone",
  images: {
    remotePatterns: [
      // Object form (not the URL shorthand) so that omitting `search`
      // allows any query string — NHL logo URLs sometimes include
      // ?season=YYYYYYYY for season-specific variants.
      { protocol: "https", hostname: "assets.nhle.com", pathname: "/logos/**" },
      { protocol: "https", hostname: "assets.nhle.com", pathname: "/mugs/**" },
    ],
    // NHL team logos are served as SVG. Next blocks SVG optimization by
    // default because SVGs can carry inline scripts; the CSP below sandboxes
    // them so script execution is impossible regardless of file content.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;

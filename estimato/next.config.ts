import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  turbopack: {
    // Fortæl Turbopack at projektets rod er denne mappe, ikke parent-mappen
    root: __dirname,
  },
  async headers() {
    return [
      {
        // widget.js kan indlæses fra alle hjemmesider
        source: "/widget.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
    ]
  },
}

export default nextConfig

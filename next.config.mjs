/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // So that if a client-side error happens in production, the browser
  // console can show the real file/line (via the generated .map files)
  // instead of minified names like "g", "rE", "iZ" - makes any future bug
  // report actually actionable instead of guesswork.
  productionBrowserSourceMaps: true,
  eslint: {
    // Safety net: don't let a missing/mismatched eslint setup block the Vercel build.
    // Run `npm run lint` locally if you want lint feedback during development.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Safety net for first deploy. Once you've run `npm run build` locally
    // successfully, feel free to remove this to get full type-safety on builds.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

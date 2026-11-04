const config = {
  ...(process.env.MOAON_STATIC_EXPORT === "1" ? { output: "export", images: { unoptimized: true } } : {}),
  serverExternalPackages: ["ffmpeg-static", "ffprobe-static"],
  devIndicators: false,
  eslint: { ignoreDuringBuilds: true },
};
export default config;

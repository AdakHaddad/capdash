import withPWA from "next-pwa";

const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  async rewrites() {
    return [
      {
        source: '/api/supabase/:path*',
        destination: 'https://plkqkwhgfilhzhcgzavc.supabase.co/functions/v1/:path*',
      },
    ]
  },
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
})(nextConfig);

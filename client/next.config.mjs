/** @type {import('next').NextConfig} */
const nextConfig = {
  // Legacy static-site URLs stay alive. The old pages used ?slug= query params;
  // these map them onto the new route shapes so existing links never 404.
  async redirects() {
    return [
      {
        source: "/place.html",
        has: [{ type: "query", key: "slug" }],
        destination: "/destinations/:slug",
        permanent: false,
      },
      {
        source: "/book.html",
        has: [{ type: "query", key: "slug" }],
        destination: "/book/:slug",
        permanent: false,
      },
      { source: "/index.html", destination: "/", permanent: false },
      { source: "/destinations.html", destination: "/destinations", permanent: false },
      { source: "/place.html", destination: "/destinations", permanent: false },
      { source: "/book.html", destination: "/destinations", permanent: false },
      { source: "/chat.html", destination: "/chat", permanent: false },
      { source: "/about.html", destination: "/about", permanent: false },
      { source: "/contact.html", destination: "/contact", permanent: false },
    ]
  },
}

export default nextConfig

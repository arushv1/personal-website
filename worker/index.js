export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const pathname = new URL(request.url).pathname;
    const assetRequest = /\.[^/]+$/.test(pathname) || /^\/(?:api|models|draco|assets)(?:\/|$)/.test(pathname);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

    if (response.status !== 404 || assetRequest || !acceptsHtml || !["GET", "HEAD"].includes(request.method)) {
      return response;
    }

    const indexUrl = new URL(request.url);
    indexUrl.pathname = "/index.html";
    indexUrl.search = "";
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};

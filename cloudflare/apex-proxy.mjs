export default {
  async fetch(request, env) {
    const upstreamBase = env.APP_ORIGIN;

    if (!upstreamBase) {
      return new Response("Missing APP_ORIGIN", { status: 500 });
    }

    const incomingUrl = new URL(request.url);
    const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, upstreamBase);
    const proxiedRequest = new Request(upstreamUrl, request);

    return fetch(proxiedRequest, { redirect: "manual" });
  },
};

/**
 * Minimal GitHub OAuth relay for Decap CMS.
 * Deploy this on Cloudflare Workers (free tier). It's the only "server"
 * this project needs — it just exchanges a GitHub login for a token,
 * it never touches your paintings or your repo content directly.
 *
 * Required environment variables (set in Cloudflare dashboard):
 *   GITHUB_CLIENT_ID
 *   GITHUB_CLIENT_SECRET
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/auth") {
      const redirectUri = `${url.origin}/callback`;
      const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
      authorizeUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      authorizeUrl.searchParams.set("redirect_uri", redirectUri);
      authorizeUrl.searchParams.set("scope", "repo,user");
      return Response.redirect(authorizeUrl.toString(), 302);
    }

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) return new Response("Missing code", { status: 400 });

      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const tokenData = await tokenRes.json();

      if (tokenData.error || !tokenData.access_token) {
        return new Response(`OAuth error: ${tokenData.error_description || "unknown"}`, { status: 400 });
      }

      const payload = JSON.stringify({ token: tokenData.access_token, provider: "github" });

      const html = `
        <!DOCTYPE html>
        <html><body>
        <script>
          (function() {
            function receiveMessage(e) {
              window.opener.postMessage(
                'authorization:github:success:${payload.replace(/'/g, "\\'")}',
                e.origin
              );
              window.removeEventListener("message", receiveMessage, false);
            }
            window.addEventListener("message", receiveMessage, false);
            window.opener.postMessage("authorizing:github", "*");
          })();
        </script>
        </body></html>
      `;

      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    return new Response("Not found", { status: 404 });
  },
};

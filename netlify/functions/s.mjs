import { getStore } from '@netlify/blobs';

// Serve the app at /<uuid> with the bill embedded, so the short URL stays in the address bar
export default async (req, context) => {
  const id = context.params.id;
  const d = await getStore('links').get(id);
  if (!d) return Response.redirect(new URL('/', req.url), 302);
  const page = await fetch(new URL('/', req.url));
  if (!page.ok) return Response.redirect(new URL('/#' + d, req.url), 302);
  const html = (await page.text()).replace('<script>', '<script>var SHARED=' + JSON.stringify(d) + ',SHARED_ID=' + JSON.stringify(id) + '</script>\n<script>');
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Bills never change, so let the CDN answer repeat opens without running this function (purged on each deploy)
      'netlify-cdn-cache-control': 'public, s-maxage=31536000, durable',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
};

// Only UUID-shaped paths reach this function; static files and the home page are served as normal
export const config = {
  path: '/:id([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})',
  preferStatic: true,
};

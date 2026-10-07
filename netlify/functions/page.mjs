import { bills, edits, idParam } from '../lib/bills.mjs';

// Serve the app at /<viewId> (read-only) or /e/<editId> (editable) with the bill embedded,
// so the short URL stays in the address bar
export default async (req, context) => {
  const url = new URL(req.url);
  const id = idParam(context);
  const editId = id && url.pathname.startsWith('/e/') ? id : null;
  const viewId = editId ? await edits().get(editId) : id;
  const bill = viewId && await bills().get(viewId, { type: 'json' });
  if (!bill) return Response.redirect(new URL('/', url), 302);
  const page = await fetch(new URL('/', url));
  if (!page.ok) return Response.redirect(new URL('/#' + bill.d, url), 302);
  const vars = { SHARED: bill.d, VIEW_ID: viewId, EDIT_ID: editId };
  const inject = '<script>' + Object.entries(vars).map(([k, v]) => 'var ' + k + '=' + JSON.stringify(v) + ';').join('') + '</script>\n<script>';
  return new Response((await page.text()).replace('<script>', inject), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Bills can be edited, so always fetch the latest
      'cache-control': 'no-store',
    },
  });
};

// Only UUID-shaped paths reach this function (config must be literal strings for Netlify to read it); static files and the home page are served as normal
export const config = {
  path: ['/:id([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', '/e/:id([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'],
  preferStatic: true,
};

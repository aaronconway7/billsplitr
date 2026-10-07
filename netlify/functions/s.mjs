import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  const id = context.params.id;
  const d = await getStore('links').get(id);
  return Response.redirect(new URL(d ? '/#' + d : '/', req.url), 302);
};

// Only UUID-shaped paths reach this function; static files and the home page are served as normal
export const config = {
  path: '/:id([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})',
  preferStatic: true,
};

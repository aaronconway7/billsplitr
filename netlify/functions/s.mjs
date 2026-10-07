import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  const id = context.params.id;
  const d = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? await getStore('links').get(id) : null;
  return Response.redirect(new URL(d ? '/#' + d : '/', req.url), 302);
};

export const config = { path: '/s/:id' };

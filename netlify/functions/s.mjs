import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  const id = context.params.id;
  const d = /^[A-Za-z0-9_-]{10}$/.test(id) ? await getStore('links').get(id) : null;
  return Response.redirect(new URL(d ? '/#' + d : '/', req.url), 302);
};

export const config = { path: '/s/:id' };

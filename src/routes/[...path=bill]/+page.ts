// Only the home page is prerendered; shared-bill paths reuse it (see netlify/functions/page.mjs)
export const entries = () => [{ path: '' }];

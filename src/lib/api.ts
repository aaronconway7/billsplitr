// JSON request with a 5s timeout. keepalive requests (sent as the page goes away) can't be aborted.
export async function api(method: string, url: string, body: unknown, keep = false) {
	const ac = keep ? null : new AbortController();
	const t = setTimeout(() => ac?.abort(), 5000);
	try {
		const r = await fetch(url, {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
			keepalive: keep,
			signal: ac?.signal
		});
		if (!r.ok) throw new Error(String(r.status));
		return r.status === 204 ? null : r.json();
	} finally {
		clearTimeout(t);
	}
}

export function safeRedirectToUrl(targetUrl, { allowedHosts = [], allowedProtocols = ['https:'] } = {}) {
  if (!targetUrl || typeof targetUrl !== 'string') return false;

  let url;
  try {
    url = new URL(targetUrl, window.location.origin);
  } catch {
    return false;
  }

  if (!allowedProtocols.includes(url.protocol)) return false;

  if (allowedHosts.length > 0) {
    const hostOk = allowedHosts.some((pattern) => hostMatches(url.hostname, pattern));
    if (!hostOk) return false;
  }

  window.location.assign(url.toString());
  return true;
}

function hostMatches(hostname, pattern) {
  if (!pattern) return false;
  const p = String(pattern).toLowerCase();
  const h = String(hostname).toLowerCase();
  if (p.startsWith('*.')) {
    const base = p.slice(2);
    return h === base || h.endsWith('.' + base);
  }
  return h === p;
}


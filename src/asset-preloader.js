export const GAME_ASSET_PRELOAD_CONCURRENCY = 3;

export function collectAssetUrls(values) {
  const entries = Array.isArray(values) ? values : [values];
  const urls = [];
  for (const value of entries) {
    if (typeof value === "string") {
      urls.push(value);
    } else if (Array.isArray(value)) {
      urls.push(...collectAssetUrls(value));
    } else if (value && typeof value === "object") {
      urls.push(...collectAssetUrls(Object.values(value)));
    }
  }
  return urls;
}

export function selectAssetUrlsForColors(assetPaths, colors) {
  return colors.flatMap((color) => collectAssetUrls(assetPaths?.[color] ?? []));
}

export async function preloadAssetUrls(urls, loadAsset, {
  concurrency = GAME_ASSET_PRELOAD_CONCURRENCY,
  onAssetComplete = null
} = {}) {
  const queue = [...new Set(urls.filter(Boolean))];
  if (queue.length === 0) return;

  const workerCount = Math.min(queue.length, Math.max(1, Math.floor(concurrency)));
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < queue.length) {
      const url = queue[nextIndex];
      nextIndex += 1;
      await loadAsset(url);
      onAssetComplete?.(url);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
}

import LRUCache from 'lru-cache';

const cache = new LRUCache({
  ttl: 5 * 60 * 1000, // 5 minutes in ms
  max: 100,
});

export const useAsyncCache = async (
  key: string,
  callable: () => Promise<unknown>
) => {
  if (cache.has(key)) {
    return cache.get(key);
  }

  const value = await callable();
  cache.set(key, value);
  return value;
};

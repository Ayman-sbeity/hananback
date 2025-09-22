import NodeCache from 'node-cache';

const cache = new NodeCache({ 
  stdTTL: 300,
  checkperiod: 60,
  useClones: false 
});
export const CACHE_KEYS = {
  PRODUCTS_LIST: 'products_list',
  PRODUCT_DETAIL: 'product_detail',
  PRODUCTS_COUNT: 'products_count',
  CATEGORIES: 'categories_list'
};

export const generateProductsKey = (query) => {
  const {
    category = '',
    search = '',
    page = 1,
    limit = 10,
    showAll = false,
    includeInactive = false,
    minPrice = '',
    maxPrice = '',
    sort = ''
  } = query;
  
  return `${CACHE_KEYS.PRODUCTS_LIST}_${category}_${search}_${page}_${limit}_${showAll}_${includeInactive}_${minPrice}_${maxPrice}_${sort}`;
};

export const generateProductKey = (productId) => {
  return `${CACHE_KEYS.PRODUCT_DETAIL}_${productId}`;
};

export const cacheOperations = {
  get: (key) => {
    try {
      return cache.get(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  set: (key, data, ttl = 300) => {
    try {
      return cache.set(key, data, ttl);
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  del: (key) => {
    try {
      return cache.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  flush: () => {
    try {
      cache.flushAll();
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  },

  clearProductCache: () => {
    try {
      const keys = cache.keys();
      const productKeys = keys.filter(key => 
        key.startsWith(CACHE_KEYS.PRODUCTS_LIST) || 
        key.startsWith(CACHE_KEYS.PRODUCT_DETAIL) ||
        key.startsWith(CACHE_KEYS.PRODUCTS_COUNT) ||
        key.startsWith(CACHE_KEYS.CATEGORIES)
      );
      
      if (productKeys.length > 0) {
        cache.del(productKeys);
        console.log(`Cleared ${productKeys.length} product cache entries`);
      }
    } catch (error) {
      console.error('Clear product cache error:', error);
    }
  },

  getStats: () => {
    return cache.getStats();
  }
};

export const clearProductCacheMiddleware = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      cacheOperations.clearProductCache();
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

export default cache;

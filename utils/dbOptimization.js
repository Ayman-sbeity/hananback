import Product from "../models/Product.js";

export const optimizeDatabase = async () => {
  try {
    console.log('Starting database optimization...');

    await Product.createIndexes();
    console.log('✅ Product indexes created/verified');

    const indexes = await Product.collection.listIndexes().toArray();
    console.log('📋 Available indexes:', indexes.map(idx => idx.name));
    
    return {
      success: true,
      indexes: indexes.map(idx => idx.name)
    };
  } catch (error) {
    console.error('❌ Database optimization failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const warmUpCache = async () => {
  try {
    console.log('Cache warm-up is disabled - no caching implemented');

    return {
      success: true,
      message: 'Cache warm-up skipped - caching disabled'
    };
  } catch (error) {
    console.error('❌ Cache warm-up failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const getPerformanceMetrics = async () => {
  try {
    const start = Date.now();

    await Product.findOne({ isActive: true }).lean();
    const dbQueryTime = Date.now() - start;

    const cacheStats = cacheOperations.getStats();

    const dbStats = await Product.collection.stats();
    
    return {
      success: true,
      metrics: {
        dbQueryTime: dbQueryTime + 'ms',
        cacheHitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses) || 0,
        cacheSize: cacheStats.keys,
        dbCollectionSize: Math.round(dbStats.size / 1024) + ' KB',
        dbIndexSize: Math.round(dbStats.totalIndexSize / 1024) + ' KB'
      }
    };
  } catch (error) {
    console.error('❌ Performance metrics failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  optimizeDatabase,
  warmUpCache,
  getPerformanceMetrics
};

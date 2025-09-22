import Product from "../models/Product.js";
import { cacheOperations } from "../utils/cache.js";

export const optimizeDatabase = async () => {
  try {
    console.log('Starting database optimization...');

    await Product.createIndexes();
    console.log('✅ Product indexes created/verified');

    const stats = await Product.collection.stats();
    console.log('📊 Collection stats:', {
      count: stats.count,
      avgObjSize: Math.round(stats.avgObjSize),
      totalIndexSize: Math.round(stats.totalIndexSize / 1024) + ' KB'
    });

    const indexes = await Product.collection.listIndexes().toArray();
    console.log('📋 Available indexes:', indexes.map(idx => idx.name));
    
    return {
      success: true,
      stats,
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
    console.log('Starting cache warm-up...');

    const categories = await Product.distinct('category', { isActive: true });
    cacheOperations.set('categories_list', categories, 1800);
    console.log('✅ Categories cached');

    const products = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    const total = await Product.countDocuments({ isActive: true });
    
    const firstPageData = {
      products,
      totalPages: Math.ceil(total / 10),
      currentPage: 1,
      total
    };
    
    cacheOperations.set('products_list_____1_10_false_false____', firstPageData, 300);
    console.log('✅ First page of products cached');

    const stats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          totalStock: { $sum: '$stock' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalInactive = await Product.countDocuments({ isActive: false });

    const productStats = {
      byCategory: stats,
      totalActive: totalProducts,
      totalInactive: totalInactive,
      total: totalProducts + totalInactive
    };
    
    cacheOperations.set('product_stats', productStats, 900);
    console.log('✅ Product stats cached');
    
    return {
      success: true,
      cachedItems: ['categories', 'firstPage', 'stats']
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

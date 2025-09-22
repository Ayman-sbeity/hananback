import Product from "../models/Product.js";
import { 
  cacheOperations, 
  generateProductsKey, 
  generateProductKey,
  CACHE_KEYS 
} from "../utils/cache.js";

export const getProducts = async (req, res) => {
  try {
    const { 
      category, 
      search, 
      page = 1, 
      limit = 10, 
      showAll = false,
      includeInactive = false,
      minPrice,
      maxPrice,
      sort
    } = req.query;

    const cacheKey = generateProductsKey(req.query);

    const cachedResult = cacheOperations.get(cacheKey);
    if (cachedResult) {
      console.log('Returning cached products data');
      return res.json(cachedResult);
    }

    console.log('Fetching products from database...');
    
    const query = (showAll === 'true' || includeInactive === 'true') ? {} : { isActive: true };
    
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }
    
    if (search) {
      
      query.$text = { $search: search };
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined) {
        query.price.$lte = Number(maxPrice);
      }
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOption = { price: -1 };
    } else if (search && query.$text) {
      
      sortOption = { score: { $meta: 'textScore' } };
    }

    const products = await Product.find(query)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(); 

    const total = await Product.countDocuments(query);

    const result = {
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    };

    cacheOperations.set(cacheKey, result, 300);
    console.log('Products data cached successfully');

    res.json(result);
  } catch (err) {
    console.error('Error in getProducts:', err);
    res.status(500).json({ message: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;

    const cacheKey = generateProductKey(productId);

    const cachedProduct = cacheOperations.get(cacheKey);
    if (cachedProduct) {
      console.log('Returning cached product data');
      return res.json(cachedProduct);
    }

    console.log('Fetching product from database...');

    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    cacheOperations.set(cacheKey, product, 600);
    console.log('Product data cached successfully');

    res.json(product);
  } catch (err) {
    console.error('Error in getProductById:', err);
    res.status(500).json({ message: err.message });
  }
};

export const createProduct = async (req, res) => {
  const { name, price, description, image, stock, category, brand } = req.body;
  
  try {
    if (!name || !price || !description || !image || !category) {
      return res.status(400).json({ 
        message: 'Name, price, description, image, and category are required' 
      });
    }

    if (price <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    if (stock < 0) {
      return res.status(400).json({ message: 'Stock cannot be negative' });
    }

    const product = new Product({ 
      name, 
      price, 
      description, 
      image, 
      stock: stock || 0,
      category,
      brand: brand || '',
    });
    
    const savedProduct = await product.save();

    cacheOperations.clearProductCache();
    console.log('Product cache cleared after creation');
    
    res.status(201).json(savedProduct);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    console.error('Error in createProduct:', err);
    res.status(500).json({ message: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { name, price, description, image, stock, category, brand, isActive } = req.body;

    if (price && price <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    if (stock && stock < 0) {
      return res.status(400).json({ message: 'Stock cannot be negative' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;
    if (description !== undefined) product.description = description;
    if (image !== undefined) product.image = image;
    if (stock !== undefined) product.stock = stock;
    if (category !== undefined) product.category = category;
    if (brand !== undefined) product.brand = brand;
    if (isActive !== undefined) product.isActive = isActive;

    const updatedProduct = await product.save();

    cacheOperations.clearProductCache();
    console.log('Product cache cleared after update');
    
    res.json(updatedProduct);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    console.error('Error in updateProduct:', err);
    res.status(500).json({ message: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isActive = false;
    await product.save();

    cacheOperations.clearProductCache();
    console.log('Product cache cleared after deletion');
    
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error in deleteProduct:', err);
    res.status(500).json({ message: err.message });
  }
};

export const hardDeleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    cacheOperations.clearProductCache();
    console.log('Product cache cleared after hard deletion');
    
    res.json({ message: 'Product permanently deleted' });
  } catch (err) {
    console.error('Error in hardDeleteProduct:', err);
    res.status(500).json({ message: err.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const cacheKey = CACHE_KEYS.CATEGORIES;

    const cachedCategories = cacheOperations.get(cacheKey);
    if (cachedCategories) {
      console.log('Returning cached categories data');
      return res.json(cachedCategories);
    }

    console.log('Fetching categories from database...');

    const categories = await Product.distinct('category', { isActive: true });

    cacheOperations.set(cacheKey, categories, 1800);
    console.log('Categories data cached successfully');
    
    res.json(categories);
  } catch (err) {
    console.error('Error in getCategories:', err);
    res.status(500).json({ message: err.message });
  }
};

export const getProductStats = async (req, res) => {
  try {
    const cacheKey = 'product_stats';

    const cachedStats = cacheOperations.get(cacheKey);
    if (cachedStats) {
      console.log('Returning cached product stats');
      return res.json(cachedStats);
    }

    console.log('Calculating product stats from database...');

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

    const result = {
      byCategory: stats,
      totalActive: totalProducts,
      totalInactive: totalInactive,
      total: totalProducts + totalInactive
    };

    cacheOperations.set(cacheKey, result, 900);
    console.log('Product stats cached successfully');
    
    res.json(result);
  } catch (err) {
    console.error('Error in getProductStats:', err);
    res.status(500).json({ message: err.message });
  }
};

export const clearCache = async (req, res) => {
  try {
    cacheOperations.clearProductCache();
    res.json({ message: 'Product cache cleared successfully' });
  } catch (err) {
    console.error('Error clearing cache:', err);
    res.status(500).json({ message: 'Failed to clear cache' });
  }
};

export const getCacheStats = async (req, res) => {
  try {
    const stats = cacheOperations.getStats();
    res.json(stats);
  } catch (err) {
    console.error('Error getting cache stats:', err);
    res.status(500).json({ message: 'Failed to get cache stats' });
  }
};
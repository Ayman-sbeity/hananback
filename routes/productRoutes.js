import express from "express";
import { 
  getProducts, 
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  hardDeleteProduct,
  getCategories,
  getProductStats,
  clearCache,
  getCacheStats
} from "../controllers/productController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { optimizeDatabase, warmUpCache, getPerformanceMetrics } from "../utils/dbOptimization.js";
import Product from "../models/Product.js";

const router = express.Router();

router.get("/optimize/database", protect, admin, async (req, res) => {
  try {
    const result = await optimizeDatabase();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/optimize/cache/warmup", protect, admin, async (req, res) => {
  try {
    const result = await warmUpCache();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/optimize/metrics", protect, admin, async (req, res) => {
  try {
    const result = await getPerformanceMetrics();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/cache/stats", protect, admin, getCacheStats);
router.delete("/cache/clear", protect, admin, clearCache);

router.get("/categories", getCategories);
router.get("/stats", protect, admin, getProductStats);

router.get("/count", protect, admin, async (req, res) => {
  try {
    const count = await Product.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", getProducts);
router.get("/:id", getProductById);

router.post("/", protect, admin, createProduct);
router.put("/:id", protect, admin, updateProduct);
router.delete("/:id", protect, admin, deleteProduct);

router.delete("/:id/hard", protect, admin, hardDeleteProduct);

export default router;
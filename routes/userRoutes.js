import express from "express";
import { registerUser, loginUser, getUsers, getCurrentUser, getUserById, updateUser, deleteUser } from "../controllers/userController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/count", protect, admin, async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", protect, getUsers);
router.get("/me", protect, getCurrentUser);
router.get("/:id", getUserById); 
router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/:id", protect, updateUser); 
router.delete("/:id", protect, deleteUser); 

export default router;

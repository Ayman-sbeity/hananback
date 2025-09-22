import express from "express";
import {
  submitContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact,
} from "../controllers/contactController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", submitContact);

router.get("/", protect, admin, getContacts);
router.get("/:id", protect, admin, getContact);
router.put("/:id", protect, admin, updateContact);
router.delete("/:id", protect, admin, deleteContact);

export default router;

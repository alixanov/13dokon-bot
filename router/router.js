const { Router } = require("express");
const router = Router();
const { addProduct, getAllProduct, deleteProduct, updateProduct, getOneProduct} = require("../controllers/crud.control");

// Маршруты для CRUD операций
router.post('/add',addProduct); // Убираем дублирование маршрута
router.get("/getall", getAllProduct);
router.delete("/delete/:id", deleteProduct);
router.put("/update/:id", updateProduct);
router.get("/getone/:id", getOneProduct);


module.exports = router;

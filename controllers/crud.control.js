const InstrumentSchema = require('../module/crud-schema')



const addProduct = async (req, res) => {
     try {
          // const { rasm, nomi, soni, narxi } = req.body
          const newProduct = await new InstrumentSchema(req.body)
          await newProduct.save();
          res.status(201).json(newProduct)
     } catch (error) {
          res.status(500).json({ message: "Ошибка при добавлении продукта", error })
     }
}

const getAllProduct = async (req, res) => {
     try {
          const products = await InstrumentSchema.find()
          res.status(200).json(products)
     } catch (error) {
          res.status(500).json({ message: "Ошибка при получении продуктов", error })
     }
}


const deleteProduct = async (req, res) => {
     try {
          const { id } = req.params;
          const deletedProduct = await InstrumentSchema.findByIdAndDelete(id);
          if (!deletedProduct) {
               return res.status(404).json({ message: "Продукт не найден" });
          }
          res.status(200).json({ message: "Продукт успешно удален" });
     } catch (error) {
          res.status(500).json({ message: "Ошибка при удалении продукта", error });
     }
};

const updateProduct = async (req, res) => {
     try {
          const { id } = req.params;
          const { rasm, nomi, malumoti, turi,location, soni, narxi ,ton} = req.body;

          const updatedProduct = await InstrumentSchema.findByIdAndUpdate(
               id,
               { rasm, nomi, malumoti, turi, location, soni, narxi ,ton},
               { new: true } // Вернуть обновленный документ
          );

          if (!updatedProduct) {
               return res.status(404).json({ message: "Продукт не найден" });
          }

          res.status(200).json(updatedProduct);
     } catch (error) {
          res.status(500).json({ message: "Ошибка при обновлении продукта", error });
     }
};

// Получение одного продукта по ID
const getOneProduct = async (req, res) => {
     try {
          console.log(req.params.id); // Выводим ID для проверки
          const product = await InstrumentSchema.findById(req.params.id);
          if (!product) {
               return res.status(404).json({ message: "Продукт не найден" });
          }
          res.status(200).json(product);
     } catch (error) {
          res.status(500).json({ message: "Ошибка при получении продукта", error });
     }
};







module.exports = { addProduct, getAllProduct, deleteProduct, updateProduct, getOneProduct, }
const { Schema, model } = require("mongoose");

const ReviewSchema = new Schema({
     userId: {
          type: String, // ID пользователя (Chat ID)
          required: true
     },
     productId: {
          type: Schema.Types.ObjectId, // Ссылка на модель продукта
          ref: 'InstrumentSchema',
          required: true
     },
     reviewText: {
          type: String, // Текст отзыва
          required: true
     },
     reviewDate: {
          type: Date, // Дата оставления отзыва
          default: Date.now
     }
});

module.exports = model("Review", ReviewSchema);

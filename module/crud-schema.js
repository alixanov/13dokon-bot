const { Schema, model } = require("mongoose");

const InstrumentSchema = new Schema({
     rasm: {
          type: String,
          required: true,
     },
     nomi: {
          type: String,
          required: true,
     },
     malumoti: {
          type: String,  
          required: true,
     },
     turi: {
          type: String,
          required: true,
     },
     location: {
          type: String,
          required: true,
     },
     soni: {
          type: Number,
          required: true,
     },
     narxi: {
          type: String,
          required: true,
     },
     ton: {
          type: String,
          required: true,
     },
});

module.exports = model("InstrumentSchema", InstrumentSchema); // Убедитесь, что нет пробела в названии модели

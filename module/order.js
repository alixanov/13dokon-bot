const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
     userId: {
          type: String,
          required: true
     },
     productId: {
          type: Schema.Types.ObjectId,
          ref: 'InstrumentSchema', // ссылается на вашу схему товаров
          required: true
     },
     productName: {
          type: String,
          required: true
     },
     quantity: {
          type: Number,
          required: true
     },
     price: {
          type: Number,
          required: true
     },
     orderDate: {
          type: Date,
          default: Date.now
     }
});

module.exports = mongoose.model('Order', OrderSchema);

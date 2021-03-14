const mongoose = require('mongoose');

const merchantProductSchema = mongoose.Schema({
  title: { type: String, required: true },
  imagePath: { type: String, required: true }
});


module.exports = mongoose.model('MERCHANT_PRODUCT', merchantProductSchema);

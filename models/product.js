const mongoose = require('mongoose');

const productSchema = mongoose.Schema({

  title: { type: String, required: true },
  subtitle: { type: String },
  image: {type: [],required: true},
  price: {type: String,required: true},
  discount:{type: String, required: true },
  sellingPrice:{type: String, required: true },
  seller_id:{type: mongoose.Schema.Types.ObjectId, required: true },
  visibility_status:{type: String, required: true },
  category_a:{type: String, required: true },
  category_b:{type: String, required: true },
  category_c:{type: String, required: true },
  activity_details:{type: {}, required: true },
  product_stock_status:{type: String, required: true },
  lastActivity:{type:Date,required:true},
  general_variants_data:{type:{}},
  color_variants_data:{type:{}},
  parentOrChild:{type:String},
  individual_name_in_group:{type:String},
  child_products:{type:{}},
  parent_product:{type:{}}


});

module.exports = mongoose.model('PRODUCT', productSchema);

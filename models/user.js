const mongoose = require('mongoose');
const uniqueValidator = require("mongoose-unique-validator");

const userSchema = mongoose.Schema({
  msisdn: { type: String, required: true, unique: true },//unique is not validator, reuired is validator
  name: { type: String, required: true },
  // merchant_id: { type: String },
  pushToken:{type:String},
  shop_name:{type:String},
  owner_name:{type:String},
  street:{type:String},
  road:{type:String},
  landmark_address:{type:String},
  landmarkCordinates:{},
  selected_categories_a:{},
  selected_categorie:{type:String,reuired:true},
  selected_categories_b:{},
  ismerchant:{type:Boolean},
  images: {type: [String]},
  shop_activity_details:{},
  delivery_setting:{}




});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);

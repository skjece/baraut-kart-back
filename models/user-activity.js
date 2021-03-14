const mongoose = require('mongoose');
const uniqueValidator = require("mongoose-unique-validator");

const userActivitySchema = mongoose.Schema({

user_msisdn:{type: String, required:true , unique:true},
likes:{type:[]},
views:{type:[]},
wishlist:{type:[]}
});

userActivitySchema.plugin(uniqueValidator);


module.exports = mongoose.model('USER_ACTIVITY', userActivitySchema);

const mongoose = require('mongoose');
const uniqueValidator = require("mongoose-unique-validator");

const generalDataSchema = mongoose.Schema({
  params:{type:{}}
});

generalDataSchema.plugin(uniqueValidator);

module.exports = mongoose.model('GENERAL_DATA', generalDataSchema);

const mongoose = require('mongoose');

const componentSchema = mongoose.Schema({

seller_id:{type: mongoose.Schema.Types.ObjectId, required:true},
components:{type:[]},//array holds all componets
image:{type:[]},
visible:{type:Boolean},
component_order:{type:[]}



});

module.exports = mongoose.model('COMPONENT', componentSchema);

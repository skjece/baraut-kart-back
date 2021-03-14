const express =require('express');
const router =express.Router(); //using router provided by express
const GENERAL_DATA = require("../models/general_data");






router.post("/fetchParam", (req, res, next) => {
  console.log("{generalData}fetchParam rq::"+JSON.stringify(req.body));

  let param_name=req.body.param_name;
  let obj={};
  // obj["is_registration_allowed"]={ $exists : true };
  let fieldToFetch="params."+param_name;
  obj[fieldToFetch]=1
  const genral_data_query = GENERAL_DATA
                        .findById("6028a2fa9b5c5d3084e7109d",obj);

  genral_data_query
  .then((documnets)=>{
    let fetchedData=documnets;
    console.log("{genralservice}{fetchParam}doc:"+(fetchedData));
    let param_value=fetchedData.params[param_name];
    console.log("paramname:"+param_name+":param_value:"+param_value)
    res.status(200).json({
      fetched_param:{
        status:200,
        param_name:param_name,
        param_value:  param_value
      }
    });
    // let data=new GENERAL_DATA({test:"test"})
    // data.save().then(()=>{})
  })
  .catch(err=>{
    res.status(500).json({
      fetched_param:{
        message:"Some error occured",
        error:err,
        status:"SOME_ERROR"
      }

    })
  })
});





module.exports = router;

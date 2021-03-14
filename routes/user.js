const express =require('express');
const router =express.Router(); //using router provided by express

const USER = require("../models/user");
const checkToken = require('../middleware/check-token');


const common_lib = require("../functions/common_function");

const checkMerchantToken = require('../middleware/check-merchant-token');

router.post("/fetchMerchants", (req, res, next) => {
  console.log("fetch-merchants rq::"+JSON.stringify(req.body));

  let latFromBody=req.body.cord[0];
  let longFromBody=req.body.cord[1];

  let finalLat=29.1016351;
  let finalLong=77.260414;

  if(latFromBody){
    finalLat=latFromBody
  }

  if(longFromBody){
    finalLong=longFromBody
  }

console.log("finalLat:"+finalLat+"::finalLong:"+finalLong)

  let fetchedMerchants;
  let merchantQuery = USER.find({ismerchant:true});
  let merchantCountQuery = USER.count({ismerchant:true});


  merchantQuery = USER.find({ismerchant:true,
    "landmarkCordinates.loc":{
      $near :
        {
          $geometry: { type: "Point",  coordinates: [ finalLat, finalLong ] }
        }
    }
  });


  //.sort({overall_rating:-1})


  if(req.body.pageNum){
    let requetForPageNumber=req.body.pageNum;
    let itemPerPage=20;
    merchantQuery
     .skip((requetForPageNumber-1)*itemPerPage)
     .limit(itemPerPage)
  }

  merchantCountQuery.then(number_of_merchants=>{
    merchantQuery
    .then((documnets)=>{
      console.log("{userroute}{fetch-merchant}documnets:"+documnets)
      fetchedMerchants=documnets;
      res.status(200).json({
        message: "Merchants fetched successfully!",
        merchants: fetchedMerchants,
        number_of_merchants:number_of_merchants
      })
    })
  })

  .catch(err=>{
    res.status(500).json({
      message:"Some error occured",
      status:500,
      status:"SOME_ERROR"
    })
  })
});



router.get("/specific-auth-merchant",checkMerchantToken ,(req, res, next) => {
  console.log("get-specific-suth-merchant-rq::"+JSON.stringify(req.query));


  // if(!req.query.merchant_id && req.merchant_id!="" ){
  //   res.status(500).json({
  //     message:"No merchant ID received",
  //     status:"SOME_ERROR",
  //     status:500
  //   })
  // }

  let fetchedMerchant;
  const merchantQuery = USER.findOne({_id:req.userData.merchant_id , ismerchant:true});

  merchantQuery
  .then((documnet)=>{

    fetchedMerchant=documnet;
    res.status(200).json({
      message: "specific_merchant fetched successfully!",
      specific_merchant: fetchedMerchant
    })
  })
  // .catch(err=>{
  //   res.status(500).json({
  //     message:"Some error occured",
  //     statusMsg:"SOME_ERROR",
  //     status:500
  //   })
  //})
});


router.get("/specific", (req, res, next) => {
  console.log("get-specific-merchant rq::"+JSON.stringify(req.query));


  if(!req.query.merchant_id && req.merchant_id!="" ){
    res.status(500).json({
      message:"No merchant ID received",
      status:"SOME_ERROR",
      status:500
    })
  }

  let fetchedMerchant;
  const merchantQuery = USER.findOne({_id:req.query.merchant_id , ismerchant:true});

  merchantQuery
  .then((documnet)=>{
    fetchedMerchant=documnet;

    if(req.query.shop_being_viewed)
    common_lib.modiFyMerchantPoints({shop_viewed:1,net_points:5,merchant_id:req.query.merchant_id});

    return res.status(200).json({
      message: "specific_merchant fetched successfully!",
      specific_merchant: fetchedMerchant
    })
  })
  .catch(err=>{
    res.status(500).json({
      message:"Some error occured",
      statusMsg:"SOME_ERROR",
      status:500
    })
  })
});



router.post("/update",checkToken,(req,res,next)=>{
  console.log("{user}{update}:"+JSON.stringify(req.body));
  let msisdn=req.userData.msisdn;
  // let pushToken=req.body.pushToken;

  if(msisdn==undefined||msisdn==""||msisdn==null){
    return res.status(500).json({message:"msisdn not in token",status:"UPDATE_ERROR"});
  }

  // if(pushToken==undefined||pushToken==""||pushToken==null){
  //   return res.status(500).json({message:"pushToken not in token",status:"UPDATE_ERROR_PUSH_TKEN_NOT_FOUND"});
  // }

  // req.body.msisdn=req.userData.msisdn;

  //editig a already saved entry
  USER.findOne({msisdn:msisdn})
  .then(userDoc =>{
    console.log("a userDoc:"+JSON.stringify(userDoc));

    if(!userDoc){
      return res.status(500).json({message:"user not in table",status:"USER_NOT_FOUND_ERROR"});

    }

    // if(userDoc)
    // {
    //   userDoc['pushToken']=req.body.pushToken;
    // }
   console.log("new userdoc:"+JSON.stringify(userDoc));


    if(req.body.pushToken){
      userQuery= USER.update({msisdn:msisdn},
        {$set :{pushToken:req.body.pushToken}}
       )
    }else if(req.body.delivery_setting){
      userQuery=USER.update({msisdn:msisdn},
        {$set :{delivery_setting:req.body.delivery_setting}}
       )
    }else{
      return res.status(500).json({
        message:"Some error occured",
        status:"SOME_ERROR"
      })
    }

    //userDoc.save()
    userQuery
    .then((response)=>{
      console.log("{user route}{update}after uptaing:"+JSON.stringify(response));
        return res.status(200).json({
          message:"user updatd successfully",
          status:"USER_UPDATED",
          updated_user:userDoc
        });
    })
    .catch(err => {
      console.log("{userroute}{update}errafter uptaing:"+JSON.stringify(err));
      res.status(500).json({
        message:"Some error occured",
        error:err,
        status:"SOME_ERROR"
      })
    })

  })

});




router.post("/register_as_merchant",checkMerchantToken,(req,res,next)=>{
  console.log("{user}{register_as_merchant}:"+JSON.stringify(req.body));
  let msisdn=req.userData.msisdn;
  // let pushToken=req.body.pushToken;

  if(msisdn==undefined||msisdn==""||msisdn==null){
    return res.status(500).json({message:"msisdn not in token",status:"UPDATE_ERROR"});
  }

  req.body.reg_details['ismerchant']=true;

  // let arr=Object.values(req.body.reg_details['landmarkCordinates']['loc']['coordinates'])
  // req.body.reg_details['landmarkCordinates']['loc']['coordinates']=[arr[1],arr[0]];

  req.body.reg_details['shop_activity_details']={
    "total_sales":3500,
    "shop_views":30,
    "product_views":117,
    "net_points":290,
    "product-likes":35,
    "delivered_orders":32
  }

  // if(pushToken==undefined||pushToken==""||pushToken==null){
  //   return res.status(500).json({message:"pushToken not in token",status:"UPDATE_ERROR_PUSH_TKEN_NOT_FOUND"});
  // }

  // req.body.msisdn=req.userData.msisdn;

  //editig a already saved entry
  // USER.findOne({msisdn:msisdn})
  // .then(userDoc =>{
  //   console.log("a userDoc:"+JSON.stringify(userDoc));
    // let newUserDoc=userDoc;
    // if(userDoc)
    // {
      // UserDoc=req.body.reg_details;
      // UserDoc['msisdn']=req.userData.msisdn;
      // UserDoc['ismerchant']=true;

      // req.body.reg_details['msisdn']=req.userData.msisdn;


    // }


   console.log("new userdoc:"+JSON.stringify(req.body.reg_details));
  //  newUserDoc=new USER(newUserDoc);

   //UserDoc.save()

    USER.updateOne({msisdn:msisdn},req.body.reg_details)

   //userDoc.save()
    .then((response)=>{
      if(Number(response.n)==1 && Number(response.nModified) >=0){
        console.log("{user route}{register_as_merchant}::Nothing to update")
      }
      console.log("{user route}{register_as_merchant}after uptaing:"+JSON.stringify(response));
        return res.status(200).json({
          message:"user registered as merchant  successfully",
          status:"USER_REGISTERED_AS_MERCHANT",
          registered_user:req.body.reg_details
        });
    })


    .catch(err => {
      console.log("{userroute}{register_as_merchant}errafter uptaing:"+JSON.stringify(err));
      res.status(500).json({
        message:"Some error occured",
        error:err,
        status:"SOME_ERROR"
      })
    })



});








module.exports = router;

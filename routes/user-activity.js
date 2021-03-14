const express =require('express');
const router =express.Router(); //using router provided by express

const USER_ACTIVITY = require("../models/user-activity");
const PRODUCT = require("../models/product");

const checkToken = require('../middleware/check-token');



const common_lib = require("../functions/common_function");

checkIfDocumentAlreadyPresent= (req,res,next)=>{
  console.log("{checkIfDocumentAlreadyPresent}");
  let user_msisdn=req.userData.msisdn;
  console.log("{user-activity}{update}req body:"+JSON.stringify(req.body));
  USER_ACTIVITY.findOne({user_msisdn:user_msisdn})
  .then(userActivityDoc => {
    if(!userActivityDoc){
      console.log("{user-activity}{update}No user doc found");
      req.flowData = { userActivityDoc};

    }else{
      console.log("{user-activity}{update} user doc found");
      req.flowData = { userActivityDoc};

    }

    next();
  })

}

pushNewEntryIfNotPresent = (req,res,next)=>{
  console.log("{pushNewEntryIfNotPresent}:"+req.flowData);
  if(req.flowData.userActivityDoc){
    next();
  }
  else{
    let user_msisdn=req.userData.msisdn;
    let newUserActivityDoc=USER_ACTIVITY({
      user_msisdn:user_msisdn,
      likes:[],
      views:[],
      wishlist:[]
    });


    if(req.body.ACTION="ADD_TO_LIKED_PRODUCTS" && req.body.product._id){
      newUserActivityDoc['likes'][0]={
        product_id:req.body.product._id,
        timestamp:new Date()
      }
    }else if(req.body.ACTION="REMOVE_FROM_LIKED_PRODUCTS"){
      console.log("no need to add entry as request is for remove")
      return res.status(200).json({
        "like_status_changed":{
          status:200,
          status_msg:"LIKE_REMOVED"
        }
      });
    }

    newUserActivityDoc.save()
    .then(resp=>{
      console.log("{user-activity}{update}new user doc saved:"+JSON.stringify(resp));
      return res.status(200).json({
        "like_status_changed":{
          status:200,
          status_msg:"LIKE_ADDED"
        }
      });
    })
    .catch((err)=>{
      return res.status(500).json({
        "like_status_changed":{
          status:500,
          status_msg:"SOME_ERROR"
        }
      });
    })
  }
}


updateIfPresent = (req,res,next)=>{
  console.log("{updateIfPresent}:"+req.flowData.userActivityDoc);
  let userActivityDoc=req.flowData.userActivityDoc;
  let user_msisdn=req.userData.msisdn;

  let status_mg="LIKE_ADDED";

  if(req.body.ACTION==
    "ADD_TO_LIKED_PRODUCTS" && req.body.product._id){
    // tempArray=newLikeArray;
    isFound=false;
    userActivityDoc['likes'].forEach((element,index) => {
      if((element.product_id==req.body.product._id) && !isFound){
        console.log("{user-activity}{update}like already presnet updating time only");
        //newLikeArray[index][timeStamp]=new Date();
        let str="likes."+index+".timestamp";
        let obj={};
        obj[str]=new Date();
        // console.log("obj:"+JSON.stringify(obj));
        Query=USER_ACTIVITY.update(
          {user_msisdn:user_msisdn},
          { $set:obj}
        )
        isFound=true;
        return;
      }
    });

    let MAX_LIKES_LENGTH=3;
    if(isFound==false){
      console.log("{user-activity}{update}not  presnet so adding in array");

      if( userActivityDoc['likes'].length >MAX_LIKES_LENGTH){

        console.log("{user-activity}{update}array limit exceeded to replacing oldest with new one");
        let oldestEntry=userActivityDoc['likes'][0]['timestamp'];
        let oldestEntryIndex=0;
        console.log("final_oldest_entry:"+JSON.stringify(oldestEntry))


        userActivityDoc['likes'].forEach((element,index)=>{
          if(element.timestamp < oldestEntry)
          {
            oldestEntry=userActivityDoc['likes'][index]['timestamp'];
            oldestEntryIndex=index;
            console.log("final_oldest_entry:"+JSON.stringify(element))
          }
        });

        let str="likes."+oldestEntryIndex;
        let obj={};
        obj[str]={
          product_id:req.body.product._id,
          timestamp:new Date()
        }
        // console.log("obj:"+JSON.stringify(obj));

        Query=USER_ACTIVITY.update(
          {user_msisdn:user_msisdn},
          {$set:obj}
        );

      }else{
        console.log("{user-activity}{update}array in limit so pushing");
        let obj={
          product_id:req.body.product._id,
          timestamp:new Date()
        }
        Query=USER_ACTIVITY.update(
          {user_msisdn:user_msisdn },
          {$push: { likes: obj}}
        )

        // {user_msisdn:user_msisdn , 'likes.product_id': {$nin:[req.body.product._id]}},
      }
    }
  } else if(req.body.ACTION=="REMOVE_FROM_LIKED_PRODUCTS" && req.body.product._id){
    status_mg="LIKE_REMOVED";
    isFound=false;
    userActivityDoc['likes'].forEach((element,index) => {
      if((element.product_id==req.body.product._id) && !isFound){
        console.log("{user-activity}{update}present already thus removing)");
        //newLikeArray[index][timeStamp]=new Date();
        // let str="likes."+index+".timestamp";
        // let obj={};
        // obj[str]=new Date();
        // console.log("obj:"+JSON.stringify(obj));
        Query=USER_ACTIVITY.update(
          {user_msisdn:user_msisdn},
          { $pull: {likes:{product_id:req.body.product._id}}}
        )
        isFound=true;
        // return;
      }
    });

    if(isFound==false){
      return res.status(200).json({
        "like_status_changed":{
          status:200,
          status_msg:status_mg
        }
      });
    }
  }

    Query
    .then((resp)=>{
      console.log("{user-activity}{update}old user doc updated:"+JSON.stringify(resp));

      res.status(200).json({
        "like_status_changed":{
          status:200,
          status_msg:status_mg
        }
      });

      if(req.body.ACTION=="ADD_TO_LIKED_PRODUCTS"){
        common_lib.modiFyLikedPointsInProduct({liked:1,net_points:5, product_id:req.body.product._id});
        common_lib.modiFyMerchantPoints({product_liked:1,net_points:5, merchant_id:req.body.product.seller_id});
      }else if(req.body.ACTION=="REMOVE_FROM_LIKED_PRODUCTS"){
        common_lib.modiFyLikedPointsInProduct({liked:-1,net_points:-5,product_id:req.body.product._id});
        common_lib.modiFyMerchantPoints({product_liked:-1,net_points:-5, merchant_id:req.body.product.seller_id});

      }
      return;
    })
    .catch((err)=>{
      return res.status(500).json({
        "like_status_changed":{
          status:500,
          status_msg:"SOME_ERROR"
        }
      });
    })



}

router.post("/update",checkToken,checkIfDocumentAlreadyPresent,
  pushNewEntryIfNotPresent,updateIfPresent);



router.post("/checkThings",checkToken,(req,res,next)=>{
  console.log("{checkThings}");
  let user_msisdn=req.userData.msisdn;
  console.log("{user-activity}{update}req body:"+JSON.stringify(req.body));
  USER_ACTIVITY.findOne({user_msisdn:user_msisdn})
  .then(userActivityDoc => {
    if(!userActivityDoc){
      console.log("{user-activity}{update}No user doc found");
      if(req.body.ACTION="CHECK_IF_LIKED" ){
        return res.status(200).json({
                is_product_liked:{
                  status:200,
                  is_liked:false
                }
              })
      }
      // else{
      //   console.log("dont know what to check");
      //   return  res.status(500).json({
      //             status:500,
      //             status_msg:"NO_ACTION_SPECIFIED"
      //           })
      // }

    }

    //doc is found
    console.log("{user-activity}{update} user doc found");
    if(req.body.ACTION="CHECK_IF_LIKED" ){
      let is_liked=false;
      userActivityDoc['likes'].forEach((element)=>{
        // console.log("test:"+ element.product_id );
        // console.log("test:"+ req.body.product_id);
        // console.log("test:"+element.product_id == req.body.product_id );

        if((element.product_id+"" == req.body.product_id+"") && is_liked==false){
          console.log("is liked::"+true)
          is_liked=true;
        }

      })


      return res.status(200).json({
        is_product_liked:{
          status:200,
          is_liked:is_liked
        }
      });
    }
    // else{
    //   console.log("dont know what to check");
    //   return  res.status(500).json({
    //     status:500,
    //     status_msg:"NO_ACTION_SPECIFIED"
    //   });
    // }



  })
  .catch((err)=>{

    return res.status(500).json({
      "checkthings":{
        status:500,
        status_msg:"SOME_ERROR"
      }
    });
  })
});








// (req, res, next) => {
  // let user_msisdn=req.userData.msisdn;
  // console.log("{user-activity}{update}req body:"+JSON.stringify(req.body));



  // USER_ACTIVITY.findOne({user_msisdn:user_msisdn})
  // .then(userActivityDoc => {
  //   if(!userActivityDoc){
  //     console.log("{user-activity}{update}No user doc found");

      // let newUserActivityDoc=USER_ACTIVITY({
      //   user_msisdn:user_msisdn,
      //   likes:[],
      //   views:[],
      //   wishlist:[]
      // });

      // if(req.body.ACTION="ADD_TO_LIKED_PRODUCTS" && req.body.product_id){
      //   newUserActivityDoc['likes'][0]={
      //     product_id:req.body.product_id,
      //     timestamp:new Date()
      //   }
      // }

      // newUserActivityDoc.save()
      // .then(resp=>{
      //   console.log("{user-activity}{update}new user doc saved:"+JSON.stringify(resp));
      //   return res.status(200).json({
      //     "add_like":{
      //       status:200,
      //       status_msg:"LIKE ADDED"
      //     }
      //   });
      // })

    // }


    //if doc found -check if already presnet the replace new timestamp in same entry
    //else check if length of array exceeds
    //if yes then replace with oldest
    //else push

    // let newLikeArray=userActivityDoc['likes'];

    // if(req.body.ACTION="ADD_TO_LIKED_PRODUCTS" && req.body.product_id){
    //   // tempArray=newLikeArray;
    //   isFound=false;
    //   userActivityDoc['likes'].forEach((element,index) => {
    //     if((element.product_id==req.body.product_id) && !isFound){
    //       console.log("{user-activity}{update}like already presnet updating time only");
    //       //newLikeArray[index][timeStamp]=new Date();
    //       let str="likes."+index+".timestamp";
    //       let obj={};
    //       obj[str]=new Date();
    //       // console.log("obj:"+JSON.stringify(obj));
    //       Query=USER_ACTIVITY.update(
    //         {user_msisdn:user_msisdn},
    //         { $set:obj}
    //       )
    //       isFound=true;
    //       return;
    //     }
    //   });

    //   let MAX_LIKES_LENGTH=3;
    //   if(isFound==false){
    //     console.log("{user-activity}{update}not  presnet so adding in array");

    //     if( userActivityDoc['likes'].length >MAX_LIKES_LENGTH){

    //       console.log("{user-activity}{update}array limit exceeded to replacing oldest with new one");
    //       let oldestEntry=userActivityDoc['likes'][0]['timestamp'];
    //       let oldestEntryIndex=0;
    //       console.log("final_oldest_entry:"+JSON.stringify(oldestEntry))


    //       userActivityDoc['likes'].forEach((element,index)=>{
    //         if(element.timestamp < oldestEntry)
    //         {
    //           oldestEntry=userActivityDoc['likes'][index]['timestamp'];
    //           oldestEntryIndex=index;
    //           console.log("final_oldest_entry:"+JSON.stringify(element))
    //         }
    //       });

    //       let str="likes."+oldestEntryIndex;
    //       let obj={};
    //       obj[str]={
    //         product_id:req.body.product_id,
    //         timestamp:new Date()
    //       }
    //       // console.log("obj:"+JSON.stringify(obj));

    //       Query=USER_ACTIVITY.update(
    //         {user_msisdn:user_msisdn},
    //         {$set:obj}
    //       );

    //     }else{
    //       console.log("{user-activity}{update}array in limit so pushing");
    //       let obj={
    //         product_id:req.body.product_id,
    //         timestamp:new Date()
    //       }
    //       Query=USER_ACTIVITY.update(
    //         {user_msisdn:user_msisdn },
    //         {$push: { likes: obj}}
    //       )

    //       // {user_msisdn:user_msisdn , 'likes.product_id': {$nin:[req.body.product_id]}},
    //     }
    //   }

    //   Query
    //   .then((resp)=>{
    //     console.log("{user-activity}{update}old user doc updated:"+JSON.stringify(resp));
    //     return res.status(200).json({
    //       "add_like":{
    //         status:200,
    //         status_msg:"LIKE ADDED"
    //       }
    //     });
    //   })
    //   .catch((err)=>{
    //     return res.status(500).json({
    //       "add_like":{
    //         status:500,
    //         status_msg:"SOME_ERROR"
    //       }
    //     });
    //   })

    // }

  // });







  // COMPONENT.findOne({seller_id:req.userData.merchant_id})
  // .then((document)=>{
  //   if(document){

  //     console.log("Seeler  found in Component table thus updating");
  //     // req.body.data['component_position']= 1;
  //     let query;
  //     if(req.body.UPDATE_ORDER){
  //       query=COMPONENT.update(
  //         {seller_id:req.userData.merchant_id},
  //         {$set: {
  //           component_order:req.body.UPDATE_ORDER
  //          }}
  //       )
  //     }else if(req.body.DELETE_COMPONENT){
  //       query=COMPONENT.update(
  //         {seller_id:req.userData.merchant_id},
  //         {$pull: {
  //           "components":{component_name: req.body.DELETE_COMPONENT}
  //          }}
  //       )
  //     }
  //     else{
  //       console.log("dont kknwo what tp update");
  //     }

  //     query
  //     .then((resp)=>{
  //       console.log("resposne updaing componet item:"+JSON.stringify(resp));
  //       return res.status(200).json({
  //         message:"componets order updatd successfully",
  //         status_msg:"COMPONENT_ORDER_CHANGED",
  //         // added_component:req.body.data
  //       })
  //     })
  //     .catch((err)=>{
  //       console.log("err upadting componet item:"+JSON.stringify(err));
  //       res.status(500).json({
  //         message:"Some error occured",
  //         error:err,
  //         status_msg:"SOME_ERROR"
  //       })
  //     })


  //   }
  //   else{
  //     console.log("Seller Not  found in Component table :");

  //     // console.log("err updating componet item:"+JSON.stringify(err));
  //     return res.status(500).json({
  //       message:"Some error occured",
  //       error:err,
  //       status_msg:"SOME_ERROR"
  //     })
  //   }
  // })

// }


// );



// router.post(
//   "/delete",checkMerchantToken,
//   (req, res, next) => {
//     console.log("inside {merchant-products}delete:"+JSON.stringify(req.body))


//     PRODUCT.update({_id:(req.body.product._id)}, {$set: {"product_stock_status":"DELETED","lastActivity":new Date()}})
//     .then((resp)=>{
//       console.log("resposne updating delete status :"+JSON.stringify(resp));
//       return res.status(200).json({
//         message:"product status changed to deleted successfully",
//         status_msg:"product_stock_status_CHANGED_TO_DELETED",
//       })
//     })
//     .catch((err)=>{
//       console.log("err saving item:"+JSON.stringify(err));
//       res.status(500).json({
//         message:"Some error occured",
//         error:err,
//         status_msg:"SOME_ERROR"
//       })
//     })

//   }
// );



// router.get("/fetchComponents", checkMerchantToken,(req, res, next) => {
//   console.log("merchant fetchComponentsFORPUBLIC rq::qury::"+JSON.stringify(req.query));

//   console.log("merchant fetchComponentsFORPUBLIC rq::req.userData.merchant_id::"+JSON.stringify(req.userData.merchant_id));
//   console.log("merchant fetchComponentsFORPUBLIC rq:date"+new Date().toISOString());
//   let fetchComponents;
//   var merchantComponentQuery;





//   merchantComponentQuery = COMPONENT
//     .findOne({seller_id:req.userData.merchant_id })

//     countQuery=COMPONENT.count({
//       seller_id:req.userData.merchant_id
//     })

//  countQuery.then((number_of_components)=>{
//   merchantComponentQuery
//     .then((documnets)=>{
//       console.log("{merchant -componets}{fetched}:"+JSON.stringify(documnets))
//       fetchedComponents=documnets;
//       res.status(200).json({
//         message: "Components fetched successfully!",
//         component_list: fetchedComponents,
//         number_of_components:number_of_components
//       })
//     })
//     .catch(err=>{
//       res.status(500).json({
//         message:"Some error occured",
//         error:err,
//         status:"SOME_ERROR"
//       })
//     })
//   })
// });




// router.get("/fetchComponentsForPublic",(req, res, next) => {
//   console.log("merchant fetchComponents rq::qury::"+JSON.stringify(req.query));

//   // console.log("merchant fetchComponents rq::req.userData.merchant_id::"+JSON.stringify(req.userData.merchant_id));
//   console.log("merchant fetchComponents rq:date"+new Date().toISOString());
//   let fetchComponents;
//   var merchantComponentQuery;


//   let OFFICIAL_SELLER_ID="600c02c5a991150e9415575e";


//   merchantComponentQuery = COMPONENT
//     .findOne({seller_id:OFFICIAL_SELLER_ID })

//     countQuery=COMPONENT.count({
//       seller_id:OFFICIAL_SELLER_ID
//     })

//  countQuery.then((number_of_components)=>{
//   merchantComponentQuery
//     .then((documnets)=>{
//       console.log("{merchant -componets}{fetched}:"+JSON.stringify(documnets))
//       fetchedComponents=documnets;
//       res.status(200).json({
//         message: "Components fetched successfully!",
//         component_list: fetchedComponents,
//         number_of_components:number_of_components
//       })
//     })
//     .catch(err=>{
//       res.status(500).json({
//         message:"Some error occured",
//         error:err,
//         status:"SOME_ERROR"
//       })
//     })
//   })
// });


// router.get("/specific", checkMerchantToken,(req, res, next) => {
//   console.log("get-specific-order rq::"+JSON.stringify(req.query));

//   if(!req.query.order_id && req.order_id!="" ){
//     return  res.status(500).json({
//       message:"No order ID received",
//       status:"SOME_ERROR",
//       status:500
//     })
//   }

//   let fetchedOrder;
//   const orderQuery = ORDER.findById(req.query.order_id);
//   orderQuery
//   .then((documnet)=>{
//     fetchedOrder=documnet;
//     res.status(200).json({
//       message: "specific_order fetched successfully!",
//       specific_order: fetchedOrder
//     })
//   })
//   .catch(err=>{
//     res.status(500).json({
//       message:"Some error occured",
//       statusMsg:"SOME_ERROR",
//       status:500
//     })
//   })
// });







module.exports = router;


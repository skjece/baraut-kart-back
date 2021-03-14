const express =require('express');
const router =express.Router(); //using router provided by express
const ORDER = require("../models/order");
const PRODUCT = require("../models/product");
const checkMerchantToken = require('../middleware/check-merchant-token');
const checkToken = require('../middleware/check-token');
const multer = require("multer");


const common_lib = require("../functions/common_function");



const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg"
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isValid = MIME_TYPE_MAP[file.mimetype];
    let error = new Error("Invalid mime type");
    if (isValid) {
      error = null;
    }
    cb(error, "product-images");
  },
  filename: (req, file, cb) => {
    const name = file.originalname
      .toLowerCase()
      .split(" ")
      .join("-");
    const ext = MIME_TYPE_MAP[file.mimetype];
    // let finalName=name + "-" + Date.now() + "." + ext;

    console.log(JSON.stringify(req.body));

    if(!req.body.image)
      req.body['image']=[]

      let finalName="";
      let arr=[];
      if(req.body['old_images_name'])
        arr=JSON.parse(req.body['old_images_name']);


      console.log("forming name flagggg:"+(arr &&(arr.length > req.body.image.length)));
      if((arr.length > req.body.image.length)){

        // let arr=JSON.parse(req.body['old_images_name']);
        finalName=arr[req.body.image.length];
        console.log("forming name from old image::"+finalName);
      }else{
        finalName=name + "-" + Date.now() + "." + ext;
      }

      cb(null, finalName);
      req.body.image.push(finalName);


  }
});



router.post("/update",checkMerchantToken,
multer({ storage: storage }).array('image',8),
(req,res,next)=>{
  console.log("{merchant-product}{update}:"+(req)+"::body:"+JSON.stringify(req.body));
  let msisdn=req.userData.msisdn;
  let merchant_id=req.userData.merchant_id;
  let ProductId=req.body._id;
  req.body['seller_id']=req.userData.merchant_id;
  req.body.activity_details=JSON.parse(req.body.activity_details)

  if(msisdn==undefined||msisdn==""||msisdn==null ||merchant_id==undefined||merchant_id==null){
    return res.status(500).json({message:"msisdn/merch_id not in token",status:"UPDATE_ERROR"});
  }

  //editig a already saved entry
  PRODUCT.deleteOne({_id:ProductId})
  .then((delete_resp)=>{
    console.log("{merchant product}{updateroute}:delete_resp:"+JSON.stringify(delete_resp));

    if(!delete_resp)
    return res.status(500).json({message:"unable to delte old entry",status:"UPDATE_ERROR"});

    req.body['lastActivity']=new Date();

    let updated_product=PRODUCT(req.body);

    updated_product.save()
    .then((response)=>{
      console.log("{merchant update route}{update}after uptaing:"+JSON.stringify(response));
      res.status(200).json({
            message:"product updatd successfully",
            status:"PRODUCT_UPDATED",
            updated_product:updated_product
        });

      // console.log("mechant-product{update}currentStatus:"+updated_order.orderFlow.currentStatus);

      // if(updated_order.orderFlow.currentStatus=="shipped"){
      //    //sending sms to USER//
      //   template_id_user=42585; //to customer order confirmation
      //   msisdn_list_user=""+updated_order.msisdn;
      //   key_list_user="{#DD#}|{#BB#}|{#FF#}";
      //   let value_list_user =""+updated_order.merchant_name+"|Rs."+updated_order.payable_amount+"|is shipped";
      //   let sms_req=common_lib.createSendSMSRequest(msisdn_list_user,key_list_user,value_list_user,template_id_user);
      //   sms_req.then((resp)=>{
      //     console.log("resp:"+JSON.stringify(resp))
      //   })
      //   .catch(err=>{
      //     console.log("err:"+JSON.stringify(err))
      //   })
      // }

      //sending notification

      // common_lib.sendNotification(req.userData.msisdn,{updated_product:updated_product});

      return;




      })
      // .catch(err => {
      //   console.log("{merchant update route}{update}errafter uptaing:"+JSON.stringify(err));
      //   return res.status(500).json({
      //     message:"Some error occured",
      //     error:err,
      //     status:"SOME_ERROR"
      //   })
      // })

  })

});






router.get("/fetchProducts",(req, res, next) => {
  console.log("prodct route fetchProducts rq::body::"+JSON.stringify(req.query));
  // return;

  if(req.query.product_id_multiple){
    let temp_arr=req.query.product_id_multiple.split(',');
    req.query.product_id_multiple=temp_arr
  }

  let fetchProducts;


  var ProductQuery;

  let countQuery= PRODUCT.count({product_stock_status:{$eq:"IN_STOCK"},visibility_status:{$ne:'HIDDEN'}});

    if( req.query.string && req.query.string!="null" && req.query.string!=""){

    queriedTextWordsArray=(req.query.string).split(' ');


    console.log("querrieswords array:"+queriedTextWordsArray);


      orderQuery = PRODUCT
      .find({
        //seller_id:req.userData.merchant_id ,
        product_stock_status:{$eq:"IN_STOCK"},visibility_status:{$ne:'HIDDEN'} ,

        $or:[
          {title:{$regex:queriedTextWordsArray[0],$options:'i'}},
          {subtitle:{$regex:queriedTextWordsArray[0],$options:'i'}}
        ],
        parentOrChild:{$ne:"child"}
      });



      countQuery=PRODUCT.count({
        //seller_id:req.userData.merchant_id ,
        product_stock_status:{$eq:"IN_STOCK"},visibility_status:{$ne:'HIDDEN'} ,
        $or:[
          {title:{$regex:queriedTextWordsArray[0],$options:'i'}},
          {subtitle:{$regex:queriedTextWordsArray[0],$options:'i'}}
        ],
        parentOrChild:{$ne:"child"}
      })

    }else if(req.query.product_id_multiple){
      orderQuery = PRODUCT
      .find({
        _id:req.query.product_id_multiple,
        product_stock_status:{$ne:"DELETED"},

      });

      countQuery=PRODUCT.count({
        _id:req.query.product_id_multiple,
        product_stock_status:{$ne:"DELETED"},


      });
    }else
    {
      orderQuery = PRODUCT
      .find({product_stock_status:{$eq:"IN_STOCK"},visibility_status:{$ne:'HIDDEN'} ,parentOrChild:{$ne:"child"}});

      countQuery=PRODUCT.count({
        // seller_id:req.userData.merchant_id ,
        product_stock_status:{$eq:"IN_STOCK"},visibility_status:{$ne:'HIDDEN'},parentOrChild:{$ne:"child"}
      });


      if(req.query.merchant_id && req.query.merchant_id!="null"){
        //orderQuery=orderQuery.find({seller_id:req.query.merchant_id});
        console.log("merchant_id query firing:")
        orderQuery = PRODUCT
        .find({
          seller_id:req.query.merchant_id,
          product_stock_status:{$eq:"IN_STOCK"},visibility_status:{$ne:'HIDDEN'},parentOrChild:{$ne:"child"}
        });

        countQuery=PRODUCT.count({
          seller_id:req.query.merchant_id,
          product_stock_status:{$eq:"IN_STOCK"},visibility_status:{$ne:'HIDDEN'},parentOrChild:{$ne:"child"}
        })
      }
///////////////////////////////////////////////
      let obj={product_stock_status:{$eq:"IN_STOCK"},visibility_status:{$ne:'HIDDEN'},parentOrChild:{$ne:"child"}};

      if(req.query.cat_a && req.query.cat_a!="null"){
        console.log("cat a adding in query firing:");
        obj['category_a']=req.query.cat_a ;
      }

      if(req.query.cat_b && req.query.cat_b!="null"){
        console.log("cat a adding in query firing:");
        obj['category_b']=req.query.cat_b ;
      }

      if(req.query.cat_c && req.query.cat_c!="null"){
        console.log("cat a adding in query firing:");
        obj['category_c']=req.query.cat_c ;
      }

      if(req.query.cat_c && req.query.cat_c!="null" && req.query.cat_c.includes("all_")){
        delete obj['category_a'];
        delete obj['category_b'];
        delete obj['category_c'];
        let required_category_b=req.query.cat_c.split("all_")[1];
        console.log("{fetchProducts}required_category_b"+required_category_b);

        obj['category_b']=required_category_b;
      }

      console.log("{fetchProducts}final bject:"+JSON.stringify(obj))
      if(Object.keys(obj).length>3){
        console.log("one of category fileter is present");

        orderQuery = PRODUCT.find(obj);
        countQuery=PRODUCT.count(obj)
      }
///////////////////////////////////////////////////////////


    }




    orderQuery=orderQuery.sort({"lastActivity":-1});





     if(req.query.pageNum){
       let requetForPageNumber=req.query.pageNum;
       let itemPerPage=20;
        orderQuery
        .skip((requetForPageNumber-1)*itemPerPage)
        .limit(itemPerPage)
     }else{
       console.log("something wrong with api request.No limitation found::"+req.query)
      orderQuery.limit(50)
     }


  console.log("product{fetch}orderQuery:"+(orderQuery))
 countQuery.then((number_of_products)=>{
  //  if(number_of_products>20){
  //    return res.status(500).send({
  //      "message":"max fetch 20 products limite reached",
  //      "number_of_products":number_of_products,
  //      status:400
  //    })
  //  }

  // for(var i=0;i<500;i++){
    console.log("{loadTest}requestfiredAt:"+new Date())
    orderQuery
    .then((documnets)=>{
      console.log("{loadTest}responseReceivedAt:"+new Date())
      console.log("{products}{fetched}:"+JSON.stringify(documnets))
      fetchedProducts=documnets;
      res.status(200).json({
        message: "Products fetched successfully!",
        product_list: fetchedProducts,
        number_of_products:number_of_products
      })
    })
    .catch(err=>{
      res.status(500).json({
        message:"Some error occured",
        error:err,
        status:"SOME_ERROR"
      })
    })
  // }

  })

});



router.get("/fetchSpecificProduct",(req, res, next) => {
  console.log("get-fetchSpecificProduct- rq::"+JSON.stringify(req.query));
  // return;
  if(!req.query.product_id && req.product_id!="" ){
    return  res.status(500).json({
      message:"No product ID received",
      status:"SOME_ERROR",
      status:500
    })
  }

  let fetchedProduct;
  const ProductQuery = PRODUCT.findById(req.query.product_id);
  ProductQuery
  .then((documnet)=>{
    fetchedProduct=documnet;

    common_lib.modiFyLikedPointsInProduct({viewed:1,net_points:2, product_id:req.query.product_id});
    common_lib.modiFyMerchantPoints({product_viewed:1,net_points:2, merchant_id:fetchedProduct.seller_id});


    return res.status(200).json({
      message: "specific_product fetched successfully!",
      specific_product: fetchedProduct
    });




  })
//   .catch(err=>{
//     res.status(500).json({
//       message:"Some error occured",
//       statusMsg:"SOME_ERROR",
//       status:500
//     })
//   })
});



module.exports = router;

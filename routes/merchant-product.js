const express =require('express');
const router =express.Router(); //using router provided by express
const ORDER = require("../models/order");
const PRODUCT = require("../models/product");
const checkMerchantToken = require('../middleware/check-merchant-token');
const checkToken = require('../middleware/check-token');
// const multer = require("multer");

const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const spacesEndpoint = new aws.Endpoint('sfo3.digitaloceanspaces.com');
const s3 = new aws.S3({
  endpoint: spacesEndpoint
});

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg"
};


// Change bucket property to your Space name
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'barautkart/product-images',
    acl: 'public-read',
    key: function (req, image, cb) {

      if(req.files.length==1){
        req.body['image']=[];
      }
      const name = image.originalname
      .toLowerCase()
      .split(" ")
      .join("-");
      const ext = MIME_TYPE_MAP[image.mimetype];

      let finalName="";
      finalName=name + "-" + Date.now() + "." + ext;
      req.body.image.push(finalName);

      // console.log("number of images:"+req.files.length)
      console.log(image);
      cb(null, finalName);
    }
  })
}).array('image', 8);

// const multerGoogleStorage =require('multer-google-storage');



// Imports the Google Cloud client library
// const {Storage} = require('@google-cloud/storage');
// const product = require('../models/product');

// // Creates a client
// const storage_gc = new Storage({
//   keyFilename: './awshop-39dff-4ded98ab8513.json',
//   projectId:'awshop-39dff'
// });


// const bucket=storage_gc.bucket('baraut-corner-s3');




// var uploadHandler = multer({
//   storage: multerGoogleStorage.storageEngine({
//     bucket:'baraut-corner-s3',
//     keyFilename: 'D:/project_mine/MAX/angular_pure/baraut-food-corner/backened/awshop-39dff-4ded98ab8513.json',
//     projectId:'awshop-39dff'
//   })
// });


// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const isValid = MIME_TYPE_MAP[file.mimetype];
//     let error = new Error("Invalid mime type");
//     if (isValid) {
//       error = null;
//     }
//     // img_bucket.file("file_name").createWriteStream({
//     //   resumable:false,
//     //   gzip:true
//     // });
//      cb(error, "product-images");
//   },
//   filename: (req, file, cb) => {
//     const name = file.originalname
//       .toLowerCase()
//       .split(" ")
//       .join("-");
//     const ext = MIME_TYPE_MAP[file.mimetype];
//     // let finalName=name + "-" + Date.now() + "." + ext;

//     console.log(JSON.stringify(req.body));

//     if(!req.body.image)
//       req.body['image']=[]

//       let finalName="";
//       let arr=[];
//       if(req.body['old_images_name'])
//         arr=JSON.parse(req.body['old_images_name']);


//       console.log("forming name flagggg:"+(arr &&(arr.length > req.body.image.length)));
//       if((arr.length > req.body.image.length)){

//         // let arr=JSON.parse(req.body['old_images_name']);
//         finalName=arr[req.body.image.length];
//         console.log("forming name from old image::"+finalName);
//       }else{
//         finalName=name + "-" + Date.now() + "." + ext;
//       }

//       cb(null, finalName);
//       req.body.image.push(finalName);


//   }
// });


const Multer = multer();

// sendUploadToGcs=(req,res,next)=>{

//   console.log("req.files::"+req.files+"::old_image_name:"+req.body.old_images_name)
//   if (!req.files) {
//     return next()
//   }

//   let promises = [];
//   req.files.forEach((image, index) => {

//     console.log("image::"+index+"::size:"+image.size)

//     /////////////////////////////////////
//     const name = image.originalname
//       .toLowerCase()
//       .split(" ")
//       .join("-");
//     const ext = MIME_TYPE_MAP[image.mimetype];

//     // if(!req.body.image)
//     if(index==0)
//     req.body['image']=[];

//     let finalName="";
//     // let arr=[];
//     // if(req.body['old_images_name'])
//     //   arr=JSON.parse(req.body['old_images_name']);

//     // console.log("forming name flagggg:"+(arr &&(arr.length > req.body.image.length)));
//     // if((arr.length > req.body.image.length)){
//     //   // let arr=JSON.parse(req.body['old_images_name']);
//     //   finalName=arr[req.body.image.length];
//     //   console.log("forming name from old image::"+finalName);
//     // }else{
//       finalName=name + "-" + Date.now() + "." + ext;
//     // }
//     req.body.image.push(finalName);

//     //////////////////////////////////

//     //const finalName = Date.now() + "_p"
//     const file = bucket.file("product-images/" +finalName);

//     ///////////////////////////////////

//     const promise = new Promise((resolve, reject) => {
//       const stream = file.createWriteStream({
//         metadata: {
//           contentType: image.mimetype
//         }
//       });

//       stream.on('error', (err) => {
//         req.files[index].cloudStorageError = err
//         reject(err)
//       });

//       stream.on('finish', async () => {
//         try {
//           req.files[index].cloudStorageObject = finalName
//           await file.makePublic()
//           //req.files[index].cloudStoragePublicUrl = getPublicUrl(finalName)
//           //     console.log(JSON.stringify(req.body));





//           resolve();
//         } catch (error) {
//           reject(error)
//         }
//       });

//       stream.end(image.buffer);
//     })

//     promises.push(promise)
//   });

//   Promise.all(promises)
//     .then(_ => {
//       promises = [];
//       next();
//     })
//     .catch(next);
// }

router.post(
  "/add",checkMerchantToken,
  // multer({ storage: storage }).array('image',8),
  // Multer.array('image',8), sendUploadToGcs,
  upload,
  (req, res, next) => {

    // upload(req, res, function (error) {
    //   if (error) {
    //     console.log(error);
    //     res.status(500).json({
    //       message:"Some error occured while uploading images",
    //       error:err,
    //       status_msg:"SOME_ERROR"
    //     })

    //     // return response.redirect("/error");
    //   }
    //   console.log('File uploaded successfully.');
    //   // response.redirect("/success");
    // });


    // return null;

    console.log("inside {merchant-products}add:"+JSON.stringify(req.body))
    const url = req.protocol + "://" + req.get("host");

    req.body['seller_id']=req.userData.merchant_id;
    req.body['lastActivity']=new Date();

    try{
      req.body.activity_details=JSON.parse(req.body.activity_details);
    }
    catch{
      req.body.activity_details=(req.body.activity_details);
    }

    if(req.body.general_variants_data){
      try{
        req.body.general_variants_data=(JSON.parse(req.body.general_variants_data));
      }
      catch{
        req.body.general_variants_data=((req.body.general_variants_data));
      }
    }



    if(req.body.color_variants_data)
    req.body.color_variants_data=JSON.parse(req.body.color_variants_data);




    if(req.body.already_uploaded_image){
      req.body.image=[req.body.already_uploaded_image];
    }

    const product=new PRODUCT(req.body);

    console.log("product before saving:"+JSON.stringify(product))
    product.save()
    .then((resp)=>{
      console.log("resposne saving item:"+JSON.stringify(resp));

      if(req.body.parent_product){
        console.log("a chld product is added thus updaing parent as well");
        updateParentProduct(req.body.parent_product,resp._id);
      }

      return res.status(200).json({
        message:"product added successfully",
        status_msg:"PRODUCT_ADDED",
        added_product:product
      })
    })
    // .catch((err)=>{
    //   console.log("err saving item:"+JSON.stringify(err));
    //   res.status(500).json({
    //     message:"Some error occured",
    //     error:err,
    //     status_msg:"SOME_ERROR"
    //   })
    // })

  }
);

router.post("/update",checkMerchantToken,
// multer({ storage: storage }).array('image',8),
// Multer.array('image',8), sendUploadToGcs,
upload,
(req,res,next)=>{
  console.log("{merchant-product}{update}:"+(req)+"::body:"+JSON.stringify(req.body));
  let msisdn=req.userData.msisdn;
  let merchant_id=req.userData.merchant_id;
  let ProductId=req.body._id;
  req.body['seller_id']=req.userData.merchant_id;
  req.body.activity_details=JSON.parse(req.body.activity_details);
  if(req.body.general_variants_data)
  req.body.general_variants_data=(JSON.parse(req.body.general_variants_data));
  if(req.body.color_variants_data)
  req.body.color_variants_data=JSON.parse(req.body.color_variants_data);
  if(req.body.child_products)
  req.body.child_products=JSON.parse(req.body.child_products);


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



router.post(
  "/delete",checkMerchantToken,
  (req, res, next) => {
    console.log("inside {merchant-products}delete:"+JSON.stringify(req.body))


    PRODUCT.update({_id:(req.body.product._id)}, {$set: {"product_stock_status":"DELETED","lastActivity":new Date()}})
    .then((resp)=>{
      console.log("resposne updating delete status :"+JSON.stringify(resp));
      return res.status(200).json({
        message:"product status changed to deleted successfully",
        status_msg:"product_stock_status_CHANGED_TO_DELETED",
      })
    })
    .catch((err)=>{
      console.log("err saving item:"+JSON.stringify(err));
      res.status(500).json({
        message:"Some error occured",
        error:err,
        status_msg:"SOME_ERROR"
      })
    })

  }
);



router.post(
  "/updateProductValue",checkMerchantToken,
  (req, res, next) => {
    console.log("inside {merchant-products}updateProductValue:"+JSON.stringify(req.body))

    let obj={"lastActivity":new Date()};

    let value_name="";
    let status_msg="";
    let value_changed_to="";
    if(req.body.CHANGE_VISIBILITY_STATUS){
      value_name="CHANGE_VISIBILITY_STATUS";
      value_changed_to=req.body.CHANGE_VISIBILITY_STATUS;
      obj['visibility_status']=req.body.CHANGE_VISIBILITY_STATUS;
      status_msg="visibility_status_CHANGED";
    }else if(req.body.CHANGE_STOCK_STATUS){
      value_name="CHANGE_STOCK_STATUS";
      value_changed_to=req.body.CHANGE_STOCK_STATUS;
      obj['product_stock_status']=req.body.CHANGE_STOCK_STATUS;
      status_msg="product_stock_status_CHANGED";
    }else{
      Object.keys(req.body).forEach((key)=>{

        if(key!="product_id"){
          console.log("hello:key:"+key+":value:"+req.body[key]);

          obj[key]=req.body[key]
        }
      });
      status_msg="product updated";

    }

    console.log("update product value final obj:"+JSON.stringify(obj))

    PRODUCT.update({_id:(req.body.product_id)}, {$set: obj})
    .then((resp)=>{
      console.log("resposne updating specific value status :"+JSON.stringify(resp));

      //if(resp.nModified)
      //{
        return res.status(200).json({
          "UPDATED_SPECIFIC_VALUE":{
            value_changed_to:value_changed_to,
            value_name:value_name,
            product_id:req.body.product_id,
            status:200,
            message:"product specifc value changed to  successfully",
            status_msg:status_msg

          }
        })
      //}
      // else{
      //   return res.status(200).json({
      //     message:"product specifc value changed to  successfully",
      //     status_msg:"product_stock_status_CHANGED",
      //   })
      // }

    })
    .catch((err)=>{
      console.log("err updating item:"+JSON.stringify(err));
      res.status(500).json(
      {
        UPDATED_SPECIFIC_VALUE:{
          value_name:value_name,
          message:"Some error occured",
          error:err,
          status_msg:"SOME_ERROR"
        }
      })
    })

  }
);



router.get("/fetchProducts", checkMerchantToken,(req, res, next) => {
  console.log("merchant fetchProducts rq::qury::"+JSON.stringify(req.query));

  console.log("merchant fetchProducts rq::req.userData.merchant_id::"+JSON.stringify(req.userData.merchant_id));
  console.log("merchant fetchProducts rq:date"+new Date().toISOString());
  let fetchProducts;

  // var date = new Date();
  // var year=date.getFullYear();
  // var month= date.getMonth();
  // var date_new=date.getDate();
  // var finalDate=new Date(year, month,date_new);
  // console.log("{fetch merchant order}finalDate:"+finalDate);
  //date.setDate(date.getDate() - 1);
  //date ; //# => Thu Mar 31 2011 11:14:50 GMT+0200 (CEST)
  var merchantProductQuery;
  // if(req.body.requiredStatuses.length>0){
  //    orderQuery = ORDER
  //   .find({merchant_id:req.userData.merchant_id ,
  //     "orderFlow.currentStatus": req.body.requiredStatuses,
  //     "orderFlow.placed":{$gte : finalDate}
  //   })
  //   .sort({"orderFlow.placed":-1});
  // }
  // else{

  let countQuery= PRODUCT.count({
    product_stock_status:{$ne:"DELETED"},
    parentOrChild:{$ne:"child"}
  });

    if(req.query.queriedText!="null" ){
      // queriedTextWordsArray=["null" , null ,null];
    queriedTextWordsArray=(req.query.queriedText).split(' ');
    //regex = queriedTextWordsArray.map(function (k) { return new RegExp(k); });

    console.log("querrieswords array:"+queriedTextWordsArray);

      orderQuery = PRODUCT
      .find({
        seller_id:req.userData.merchant_id ,
        product_stock_status:{$ne:"DELETED"} ,
        parentOrChild:{$ne:"child"},
        $or:[
          {title:{$regex:queriedTextWordsArray[0],$options:'i'}},
          {subtitle:{$regex:queriedTextWordsArray[0],$options:'i'}}
        ]
      });

      countQuery=PRODUCT.count({
        seller_id:req.userData.merchant_id ,
        product_stock_status:{$ne:"DELETED"} ,
        parentOrChild:{$ne:"child"},
        $or:[
          {title:{$regex:queriedTextWordsArray[0],$options:'i'}},
          {subtitle:{$regex:queriedTextWordsArray[0],$options:'i'}}
        ]
      })

    }else
    {
      orderQuery = PRODUCT
      .find({
        seller_id:req.userData.merchant_id ,
        product_stock_status:{$ne:"DELETED"},
        parentOrChild:{$ne:"child"}
      })

      countQuery=PRODUCT.count({
        seller_id:req.userData.merchant_id ,
        product_stock_status:{$ne:"DELETED"},
        parentOrChild:{$ne:"child"}
      })
    }




    orderQuery=orderQuery.sort({"lastActivity":-1});



     if(req.query.pageNum){
       let requetForPageNumber=req.query.pageNum;
       let itemPerPage=4;
        orderQuery
        .skip((requetForPageNumber-1)*itemPerPage)
        .limit(itemPerPage)
     }
  // }
 countQuery.then((number_of_products)=>{
    orderQuery
    .then((documnets)=>{
      console.log("{merchant -products}{fetched}:"+JSON.stringify(documnets))
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
  })

                      // .getFilter
                      // .limit(15);

});



router.get("/specific", checkMerchantToken,(req, res, next) => {
  console.log("get-specific-order rq::"+JSON.stringify(req.query));

  if(!req.query.order_id && req.order_id!="" ){
    return  res.status(500).json({
      message:"No order ID received",
      status:"SOME_ERROR",
      status:500
    })
  }

  let fetchedOrder;
  const orderQuery = ORDER.findById(req.query.order_id);
  orderQuery
  .then((documnet)=>{
    fetchedOrder=documnet;
    res.status(200).json({
      message: "specific_order fetched successfully!",
      specific_order: fetchedOrder
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

function updateParentProduct(parent_product_id,child_id){
  PRODUCT.update(
    {_id:parent_product_id},
    { $push: { "child_products.color" : child_id }
  })
  .then((response)=>{
    console.log("updateParentProduct:response:"+JSON.stringify(response))
  },err=>{
    console.log("updateParentProduct:err:"+JSON.stringify(err))
  })
}


module.exports = router;

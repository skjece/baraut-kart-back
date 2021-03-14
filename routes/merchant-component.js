const express =require('express');
const router =express.Router(); //using router provided by express
const ORDER = require("../models/order");
const COMPONENT = require("../models/component");
const checkMerchantToken = require('../middleware/check-merchant-token');
const checkToken = require('../middleware/check-token');
// const multer = require("multer");


const common_lib = require("../functions/common_function");
// const MIME_TYPE_MAP = {
//   "image/png": "png",
//   "image/jpeg": "jpg",
//   "image/jpg": "jpg"
// };

// const Multer = multer();


const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const spacesEndpoint = new aws.Endpoint('sfo3.digitaloceanspaces.com');
const s3 = new aws.S3({
  endpoint: spacesEndpoint
});

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const isValid = MIME_TYPE_MAP[file.mimetype];
//     let error = new Error("Invalid mime type");
//     if (isValid) {
//       error = null;
//     }
//     cb(error, "product-images");
//   },
//   filename: (req, file, cb) => {
//     const name = file.originalname
//       .toLowerCase()
//       .split(" ")
//       .join("-");
//     const ext = MIME_TYPE_MAP[file.mimetype];
//     // let finalName=name + "-" + Date.now() + "." + ext;

//     console.log("multer::"+JSON.stringify(req.body));

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

//      let x;
//     try {
//         x=JSON.parse(req.body.data);
//     } catch (e) {
//         x=req.body.data
//         console.log("not parsable ");
//     }


//      req.body.data=x;
//       req.body.data.banners[(req.body['image'].length)-1]['image_name']=finalName;
//      // console.log("checkinmulter:"+JSON.parse(req.body.data)['banners'])

//   }
// });
// Imports the Google Cloud client library
const {Storage} = require('@google-cloud/storage');

// Creates a client
const storage_gc = new Storage({

  keyFilename: './awshop-39dff-4ded98ab8513.json',
  projectId:'awshop-39dff'
});


const bucket=storage_gc.bucket('baraut-corner-s3');



const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg"
};

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'barautkart/component-images',
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

      let x;
      try {
          x=JSON.parse(req.body.data);
      } catch (e) {
          x=req.body.data
          console.log("not parsable ");
      }


       req.body.data=x;

      req.body.data.banners[(req.body['image'].length)-1]['image_name']=finalName;

      // console.log("number of images:"+req.files.length)
      // console.log(req.body);
      cb(null, finalName);
    }
  })
}).array('imageForMulter', 8);

// sendUploadToGcs=(req,res,next)=>{

//   console.log("req.files::"+req.files+"::old_image_name:"+req.body.old_images_name)
//   if (!req.files) {
//     return next()
//   }

//   let promises = [];
//   req.files.forEach((image, index) => {

//     /////////////////////////////////////
//     const name = image.originalname
//       .toLowerCase()
//       .split(" ")
//       .join("-");
//     const ext = MIME_TYPE_MAP[image.mimetype];

//     if(!req.body.image)
//       req.body['image']=[];

//     let finalName="";
//     let arr=[];
//     if(req.body['old_images_name'])
//       arr=JSON.parse(req.body['old_images_name']);

//     console.log("forming name flagggg:"+(arr &&(arr.length > req.body.image.length)));
//     if((arr.length > req.body.image.length)){
//       // let arr=JSON.parse(req.body['old_images_name']);
//       finalName=arr[req.body.image.length];
//       console.log("forming name from old image::"+finalName);
//     }else{
//       finalName=name + "-" + Date.now() + "." + ext;
//     }
//     req.body.image.push(finalName);

//          let x;
//     try {
//         x=JSON.parse(req.body.data);
//     } catch (e) {
//         x=req.body.data
//         console.log("not parsable ");
//     }


//      req.body.data=x;
//       req.body.data.banners[(req.body['image'].length)-1]['image_name']=finalName;
//      // console.log("checkinmulter:"+JSON.parse(req.body.data)['banners'])

//     //////////////////////////////////

//     //const finalName = Date.now() + "_p"
//     const file = bucket.file("component-images/" +finalName);

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
  upload,
  // Multer.array('imageForMulter',8), sendUploadToGcs,
  // multer({ storage: storage }).array('imageForMulter',10) ,

  (req, res, next) => {
    console.log("inside {merchant-coponents}add:"+JSON.stringify(req.body))
    const url = req.protocol + "://" + req.get("host");



    COMPONENT.findOne({seller_id:req.userData.merchant_id})
    .then((document)=>{
      if(!document){

        console.log("Seeler Not found in Component table thus addidng new entry");
        req.body.data['component_name']= "1";
        let component_order=["1"];

        // let new_final_component = JSON.parse(req.body.data);
        // console.log("newfinalcmponet:"+JSON.stringify(req.body.data))
        // return;


        const component=new COMPONENT({
          seller_id:req.userData.merchant_id,
          components:[
            req.body.data
          ],
          component_order:component_order
        });

        component.save()
          .then((resp)=>{
            console.log("resposne saving item:"+JSON.stringify(resp));
            return res.status(200).json({
              message:"product added successfully",
              status_msg:"PRODUCT_ADDED",
              added_component:req.body.data
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

      else{
        console.log("Seller  found in Component table thus pushing to same array:"+JSON.stringify(document));
        let max_position=1;
        document.components.forEach((componet)=>{
          if(Number(componet.component_name)>max_position){
            max_position=Number(componet.component_name)
          }
        })
        let new_component_name=(max_position+1)+"";
        req.body.data['component_name']= new_component_name;
        // let new_final_component=JSON.parse(req.body.data);
        // const component=new COMPONENT({
        //   seller_id:req.userData.merchant_id,
        //   components:[
        //     req.body.data
        //   ]
        // });

        COMPONENT.update(
          {seller_id:req.userData.merchant_id},
          {$push: { components: req.body.data , component_order : new_component_name}}

        )
        .then((resp)=>{
          console.log("resposne pushing componet item:"+JSON.stringify(resp));
          return res.status(200).json({
            message:"componets pushed successfully",
            status_msg:"PRODUCT_ADDED",
            added_component:req.body.data
          })
        })
        .catch((err)=>{
          console.log("err pushing componet item:"+JSON.stringify(err));
          res.status(500).json({
            message:"Some error occured",
            error:err,
            status_msg:"SOME_ERROR"
          })
        })





      }
    })

  }
);

router.post("/update",checkMerchantToken,
// multer({ storage: storage }).array('image',8),
(req, res, next) => {
  console.log("inside {merchant-coponents}update:"+JSON.stringify(req.body))



  COMPONENT.findOne({seller_id:req.userData.merchant_id})
  .then((document)=>{
    if(document){

      console.log("Seeler  found in Component table thus updating");
      // req.body.data['component_position']= 1;
      let query;
      if(req.body.UPDATE_ORDER){
        query=COMPONENT.update(
          {seller_id:req.userData.merchant_id},
          {$set: {
            component_order:req.body.UPDATE_ORDER
           }}
        )
      }else if(req.body.DELETE_COMPONENT){
        query=COMPONENT.update(
          {seller_id:req.userData.merchant_id},
          {$pull: {
            "components":{component_name: req.body.DELETE_COMPONENT},
            "component_order":{ $in: [req.body.DELETE_COMPONENT]}
           }}
        )
      }
      else{
        console.log("dont kknwo what tp update");
      }

      query
      .then((resp)=>{
        console.log("resposne updaing componet item:"+JSON.stringify(resp));
        return res.status(200).json({
          message:"componets order updatd successfully",
          status_msg:"COMPONENT_ORDER_CHANGED",
          // added_component:req.body.data
        })
      })
      .catch((err)=>{
        console.log("err upadting componet item:"+JSON.stringify(err));
        res.status(500).json({
          message:"Some error occured",
          error:err,
          status_msg:"SOME_ERROR"
        })
      })


    }
    else{
      console.log("Seller Not  found in Component table :");

      // console.log("err updating componet item:"+JSON.stringify(err));
      return res.status(500).json({
        message:"Some error occured",
        error:err,
        status_msg:"SOME_ERROR"
      })
    }
  })

}


);



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



router.get("/fetchComponents", checkMerchantToken,(req, res, next) => {
  console.log("merchant fetchComponentsFORPUBLIC rq::qury::"+JSON.stringify(req.query));

  console.log("merchant fetchComponentsFORPUBLIC rq::req.userData.merchant_id::"+JSON.stringify(req.userData.merchant_id));
  console.log("merchant fetchComponentsFORPUBLIC rq:date"+new Date().toISOString());
  let fetchComponents;
  var merchantComponentQuery;





  merchantComponentQuery = COMPONENT
    .findOne({seller_id:req.userData.merchant_id })

    countQuery=COMPONENT.count({
      seller_id:req.userData.merchant_id
    })

 countQuery.then((number_of_components)=>{
  merchantComponentQuery
    .then((documnets)=>{
      console.log("{merchant -componets}{fetched}:"+JSON.stringify(documnets))
      fetchedComponents=documnets;
      res.status(200).json({
        message: "Components fetched successfully!",
        component_list: fetchedComponents,
        number_of_components:number_of_components
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
});




router.get("/fetchComponentsForPublic",(req, res, next) => {
  console.log("merchant fetchComponents rq::qury::"+JSON.stringify(req.query));

  // console.log("merchant fetchComponents rq::req.userData.merchant_id::"+JSON.stringify(req.userData.merchant_id));
  console.log("merchant fetchComponents rq:date"+new Date().toISOString());
  let fetchComponents;
  var merchantComponentQuery;


  let OFFICIAL_SELLER_ID="600c02c5a991150e9415575e";
  let OFFICIAL_SELLER_ID_LARGE_SCREEN="604d01a047b14d3a18111967";



  // if(req.query.seller_id="OFFICIAL_SELLER_ID"){
  //   requested_seller_id=OFFICIAL_SELLER_ID;
  // }else{
  //   OFFICIAL_SELLER_ID=req.query.seller_id;
  // }

  // if(!req.query.seller_id)
  //   requested_seller_id=OFFICIAL_SELLER_ID;
  // else
  let requested_seller_id=req.query.seller_id;

  if(requested_seller_id=='PUBLIC'){
    requested_seller_id=OFFICIAL_SELLER_ID;
  }else if(requested_seller_id=='PUBLIC_LARGE_SCREEN'){
    requested_seller_id=OFFICIAL_SELLER_ID_LARGE_SCREEN;
  }


  merchantComponentQuery = COMPONENT
    .findOne({seller_id:requested_seller_id })

    countQuery=COMPONENT.count({
      seller_id:requested_seller_id
    })

 countQuery.then((number_of_components)=>{
  merchantComponentQuery
    .then((documnets)=>{
      console.log("{merchant -componets}{fetched}:"+JSON.stringify(documnets))
      fetchedComponents=documnets;
      res.status(200).json({
        message: "Components fetched successfully!",
        component_list: fetchedComponents,
        number_of_components:number_of_components
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
});


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

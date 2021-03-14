const express =require('express');
const router =express.Router(); //using router provided by express
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ORDER = require("../models/order");
const checkMerchantToken = require('../middleware/check-merchant-token');
const { error } = require('console');
const { Schema } = require('mongoose');

const common_lib = require("../functions/common_function");


router.post("/add",checkMerchantToken,(req,res,next)=>{
  console.log("{order}{add}:"+(req)+"::body:"+JSON.stringify(req.body));
  let msisdn=req.userData.msisdn;
  if(msisdn==undefined||msisdn==""||msisdn==null){
    return res.status(500).json({message:"msisdn not in token",status:"ADD_ERROR"});
  }

  req.body.msisdn=req.userData.msisdn;

   let orderDocument=ORDER({});

   req.body.orderFlow.placed=new Date();
    orderDocument['delivery_details']=req.body.delivery_details;
    orderDocument['items']=req.body.items;
    orderDocument['orderFlow']=req.body.orderFlow;

    orderDocument['msisdn']=req.userData.msisdn;
    orderDocument['lastActivity']=new Date();
    orderDocument['merchant_id']=req.body.items[0]['seller_id'];

    console.log("{order route}{create}orderDociment:"+JSON.stringify(orderDocument))
    orderDocument.save()
    .then((response)=>{
      console.log("{ordersroute}{add}after adding:"+JSON.stringify(response));
        return res.status(200).json({
          message:"order added successfully",
          status:"ORDER_ADDED",
          added_order:orderDocument
        })
    })
    .catch(err => {
      console.log("{ordersroute}{add}errafter adding:"+JSON.stringify(err));
      res.status(500).json({
        message:"Some error occured",
        error:err,
        status:"SOME_ERROR"
      })
    })



});


router.post("/update",checkMerchantToken,(req,res,next)=>{
  console.log("{merchant-order}{update}:"+(req)+"::body:"+JSON.stringify(req.body.order._id));
  let msisdn=req.userData.msisdn;
  let merchant_id=req.userData.merchant_id;

  let updated_order=req.body.order;
  let updatedOrderId=req.body.order._id;

  if(msisdn==undefined||msisdn==""||msisdn==null ||merchant_id==undefined||merchant_id==null){
    return res.status(500).json({message:"msisdn/merch_id not in token",status:"UPDATE_ERROR"});
  }

  //editig a already saved entry
  //"orderFlow.placed":new Date(updated_order.orderFlow.placed),
  ORDER.updateOne(
    {_id:updatedOrderId},{
    $set:{
      "orderFlow.placed":new Date(),
      "orderFlow.currentStatus":(updated_order.orderFlow.currentStatus)
    }
  })

    .then((response)=>{
      console.log("{merchant update route}{update}after uptaing:"+JSON.stringify(response));



      res.status(200).json({
            message:"order updatd successfully",
            status:"ORDER_UPDATED",
            updated_order:updated_order
        });

      // console.log("mechant-order{update}currentStatus:"+updated_order.orderFlow.currentStatus);
      const eventEmitter=req.app.get('eventEmitter');
      eventEmitter.emit('order_details_updated',{
        msisdn:updated_order.msisdn,
        status:updated_order.orderFlow.currentStatus
      });

      doNotifyActivities(updated_order);
      return;

    })
    .catch(err => {
      console.log("{merchant update route}{update}errafter uptaing:"+JSON.stringify(err));
      return res.status(500).json({
        message:"Some error occured",
        error:err,
        status:"SOME_ERROR"
      })
    })

  //})

});



router.post("/fetchOrders", checkMerchantToken,(req, res, next) => {
  console.log("merchant fetchOrders rq::body::"+JSON.stringify(req.body));

  console.log("merchant fetchOrders rq::req.userData.merchant_id::"+JSON.stringify(req.userData.merchant_id));
  console.log("merchant fetchOrders rq:date"+new Date().toISOString());
  let fetchedOrders;

  var date = new Date();
  var year=date.getFullYear();
  var month= date.getMonth();
  var date_new=date.getDate();
  var finalDate=new Date(year, month,date_new);
  console.log("{fetch merchant order}finalDate:"+finalDate);
  //date.setDate(date.getDate() - 1);
  //date ; //# => Thu Mar 31 2011 11:14:50 GMT+0200 (CEST)
  var orderQuery;
  var orderCountQuery;
  if(req.body.requiredStatuses.length>0){


     orderQuery = ORDER
    .find({merchant_id:req.userData.merchant_id ,
      "orderFlow.currentStatus": req.body.requiredStatuses,
    })
    .sort({"orderFlow.placed":-1});

    orderCountQuery=ORDER.count({
      merchant_id:req.userData.merchant_id ,
      "orderFlow.currentStatus": req.body.requiredStatuses
    })

  }
  else{
     orderQuery = ORDER
    .find({merchant_id:req.userData.merchant_id})
    .sort({"orderFlow.placed":-1});

    orderCountQuery=ORDER.count({
      merchant_id:req.userData.merchant_id
    })

  }

  if(req.body.pageNum){
    console.log("limiting number of oredrs")
    let requetForPageNumber=req.body.pageNum;
    let itemPerPage=4;
     orderQuery
     .skip((requetForPageNumber-1)*itemPerPage)
     .limit(itemPerPage)
  }

  orderCountQuery.then((number_of_orders)=>{
    console.log("number of oredrs:"+number_of_orders)
    orderQuery
    .then((documnets)=>{
      console.log("{merchant -oredr}{fetched}:"+JSON.stringify(documnets))
      fetchedOrders=documnets;
      res.status(200).json({
        message: "Orders fetched successfully!",
        orders_list: fetchedOrders,
        number_of_orders:number_of_orders
      })
    })
  })
  .catch(err=>{
      res.status(500).json({
        message:"Some error occured",
        error:err,
        status:"SOME_ERROR"
      })
   })
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
    console.log("sending feched specific rder:"+JSON.stringify(fetchedOrder))
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


function doNotifyActivities(updated_order){
  if(updated_order.orderFlow.currentStatus=="shipped"){
    //sending sms to USER//
   template_id_user=42585; //to customer order confirmation
   msisdn_list_user=""+updated_order.msisdn;
   key_list_user="{#DD#}|{#BB#}|{#FF#}";
   let value_list_user =""+updated_order.merchant_name+"|Rs."+updated_order.payable_amount+"|is shipped";
   var a="Your order worth Rs."+parseInt(updated_order.payable_amount);
   var b=" is shipped";
   var c=" Thanks for using BarautKart."
   value_list_user=a+"|"+b+"|"+c+"|";
   let sms_req=common_lib.createSendSMSRequest(msisdn_list_user,key_list_user,value_list_user,"5");
   sms_req.then((resp)=>{
     console.log("resp:"+JSON.stringify(resp))
   })
   .catch(err=>{
     console.log("err:"+JSON.stringify(err))
   })
 }

 else if(updated_order.orderFlow.currentStatus=="processing"){
  //sending sms to USER//
 template_id_user=42585; //to customer order confirmation
 msisdn_list_user=""+updated_order.msisdn;
 key_list_user="{#DD#}|{#BB#}|{#FF#}";
 let value_list_user =""+updated_order.merchant_name+"|Rs."+updated_order.payable_amount+"|is under processing";
 var a="Your order worth Rs."+parseInt(updated_order.payable_amount);
  var b=" is under processing";
  var c=" Thanks for using BarautKart."
  value_list_user=a+"|"+b+"|"+c+"|";
 let sms_req=common_lib.createSendSMSRequest(msisdn_list_user,key_list_user,value_list_user,"5");
 sms_req.then((resp)=>{
   console.log("resp:"+JSON.stringify(resp))
 })
 .catch(err=>{
   console.log("err:"+JSON.stringify(err))
 })
}

else if(updated_order.orderFlow.currentStatus=="delivered"){
  //sending sms to USER//
 template_id_user=42585; //to customer order confirmation
 msisdn_list_user=""+updated_order.msisdn;
 key_list_user="{#DD#}|{#BB#}|{#FF#}";
 let value_list_user =""+updated_order.merchant_name+"|Rs."+updated_order.payable_amount+"|is delivered";
 var a="Your order worth Rs."+parseInt(updated_order.payable_amount);
 var b=" is delivered";
 var c=" Thanks for using BarautKart."
 value_list_user=a+"|"+b+"|"+c+"|";
 let sms_req=common_lib.createSendSMSRequest(msisdn_list_user,key_list_user,value_list_user,"5");
 sms_req.then((resp)=>{
   console.log("resp:"+JSON.stringify(resp))
 })
 .catch(err=>{
   console.log("err:"+JSON.stringify(err))
 });

  // console.log("updatedorder:"+JSON.stringify(updated_order))
 //update shop activity and product activity
  // common_lib.modiFyLikedPointsInProduct({viewed:1,net_points:2, product_id:req.query.product_id});
  common_lib.modiFyMerchantPoints({
    amount_paid:parseInt(updated_order.payable_amount),
    net_points:parseInt(updated_order.payable_amount/15),
    delivered_order:1,
    merchant_id:updated_order.merchant_id
  });


}

else if(updated_order.orderFlow.currentStatus=="cancelled"){
  //sending sms to USER//
 template_id_user=42585; //to customer order confirmation
 msisdn_list_user=""+updated_order.msisdn;
 key_list_user="{#DD#}|{#BB#}|{#FF#}";
 let value_list_user =""+updated_order.merchant_name+"|Rs."+updated_order.payable_amount+"|is canceled";
 var a="Your order worth Rs."+parseInt(updated_order.payable_amount);
 var b=" is cancelled by owner";
 var c=" Thanks for using BarautKart."
 value_list_user=a+"|"+b+"|"+c+"|";
 let sms_req=common_lib.createSendSMSRequest(msisdn_list_user,key_list_user,value_list_user,"5");
 sms_req.then((resp)=>{
   console.log("resp:"+JSON.stringify(resp))
 })
 .catch(err=>{
   console.log("err:"+JSON.stringify(err))
 })
}

 //sending notification

 common_lib.sendNotification(updated_order.msisdn,{updated_order:updated_order});

 return;
}


module.exports = router;

const express =require('express');
const router =express.Router(); //using router provided by express
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ORDER = require("../models/order");
const checkToken = require('../middleware/check-token');
const { error } = require('console');


const common_lib = require("../functions/common_function");


router.post("/add",checkToken,(req,res,next)=>{


  console.log("{order}{add}:::body:"+JSON.stringify(req.body));

  // return;
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
    orderDocument['discountOnOrder']=req.body.discountOnOrder;

    orderDocument['msisdn']=req.userData.msisdn;
    orderDocument['lastActivity']=new Date();
    orderDocument['merchant_id']=req.body.items[0]['seller_id'];

    orderDocument['merchant_name']=req.body.merchant_name;
    orderDocument['payable_amount']=req.body.payable_amount;
    orderDocument['delivered_in']=req.body.delivered_in;
    orderDocument['seller_msisdn']=req.body.seller_msisdn;
    var a="Your order worth Rs."+parseInt(req.body.payable_amount);
    var b=" is received"
    var c="Thanks for using BarautKart."
    let value_list_user=a+"|"+b+"|"+c+"|";
    // let value_list_user =" "+req.body.merchant_name+"|Rs."+parseInt(req.body.payable_amount)+"|is received";

    console.log("{order route}{create}orderDociment:"+JSON.stringify(orderDocument))
    orderDocument.save()
    .then((response)=>{
      console.log("{ordersroute}{add}after adding:"+JSON.stringify(response));

        res.status(200).json({
        message:"order added successfully",
        status:"ORDER_ADDED",
        added_order:orderDocument
      })
      //sending response back but not returning as SMS also sending

      //sending sms to USER//
      template_id_user=42585; //to customer order confirmation
      msisdn_list_user=""+req.userData.msisdn;
      key_list_user="{#DD#}|{#BB#}|{#FF#}";

      let sms_req=common_lib.createSendSMSRequest(msisdn_list_user,key_list_user,value_list_user,"5");
      sms_req.then((resp)=>{
        console.log("resp{send sms to customer-placed}:"+JSON.stringify(resp))
      })
      .catch(err=>{
        console.log("err{send sms to customer-placed}:"+JSON.stringify(err))
      })

      //sending SMS to Merchant
      template_id_merch=42426; //to merchant order received
      msisdn_list_merch=""+req.body.seller_msisdn;
      key_list_merch="{#BB#}|{#CC#}";
      var a="You have received order worth " ;
      var b="Rs."+parseInt(req.body.payable_amount)+" from "+req.userData.msisdn;
      var c="Thanks for using BarautKart."
      value_list_merch=a+"|"+b+"|"+c+"|";


      let sms_req_merch=common_lib.createSendSMSRequest(msisdn_list_merch,key_list_merch,value_list_merch,"5");
      sms_req_merch.then((resp)=>{
        console.log("resp{send sms to merchant-placed}:"+JSON.stringify(resp))
      })
      .catch(err=>{
        console.log("err{send sms to merchant-placed}:"+JSON.stringify(err))
      })

      //sms sending done

      //emmiting event to inform merchant to update in real time -socket in private room

      const eventEmitter=req.app.get('eventEmitter');
      eventEmitter.emit('order_created',{
        msisdn:orderDocument.seller_msisdn,
        amount:parseInt(orderDocument.payable_amount)
      });

      //send notification to merchant and customer

      common_lib.sendNotification(orderDocument.seller_msisdn,{added_order_merchant:orderDocument});
      common_lib.sendNotification(req.userData.msisdn,{added_order_customer:orderDocument});

      return;




    })
    // .catch(err => {
    //   console.log("{ordersroute}{add}errafter adding:"+JSON.stringify(err));
    //   res.status(500).json({
    //     message:"Some error occured",
    //     error:err,
    //     status:"SOME_ERROR"
    //   })
    // })



});



router.get("/fetchOrders", checkToken,(req, res, next) => {
  console.log("fetchOrders rq::");

  let fetchedOrders;
  const orderQuery = ORDER
                        .find({msisdn:req.userData.msisdn})
                         .sort({lastActivity:-1})
                         .limit(15);
  orderQuery
  .then((documnets)=>{
    fetchedOrders=documnets;
    res.status(200).json({
      message: "Orders fetched successfully!",
      orders_list: fetchedOrders
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



router.get("/specific", checkToken,(req, res, next) => {
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
    console.log("order::fetchspecific::"+JSON.stringify(fetchedOrder))
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



router.post("/cancel",checkToken,(req,res,next)=>{
  console.log("{-order}{cancel}:body:"+JSON.stringify(req.body.order._id));
  let msisdn=req.userData.msisdn;
  // let merchant_id=req.userData.merchant_id;

  let recivedOrder=req.body.order;
  let recivedOrderId=req.body.order._id;

  if(msisdn==undefined||msisdn==""||msisdn==null ){
    return res.status(500).json({message:"msisdn not in token",status:"CANCEL_ERROR"});
  }

  //editig a already saved entry
  // ORDER.deleteOne({_id:recivedOrderId})
  // .then((delete_resp)=>{

    // console.log("{order}{cancelroute}:delete_resp:"+JSON.stringify(delete_resp));


    // if(!delete_resp)
    // return res.status(500).json({message:"unable to delte old entry",status:"UPDATE_ERROR"});



    // let cancelled_order=ORDER(recivedOrder);
    recivedOrder['orderFlow']['currentStatus']="cancelled";
    recivedOrder['orderFlow']['placed']=new Date();

    ORDER.update({_id:recivedOrderId},{"orderFlow.currentStatus":"cancelled","orderFlow.placed":new Date()})
    // cancelled_order.orderFlow.placed=new Date(cancelled_order.orderFlow.placed)

    //cancelled_order.save()
    .then((response)=>{
      console.log("{cancelled route}{cancel}after cancelling:"+JSON.stringify(response));
       res.status(200).json({
            message:"order cancelled successfully",
            status:"ORDER_CANCELLED",
            cancelled_order:recivedOrder
        });

        doActivitiesAfterCancellation(recivedOrder);
        const eventEmitter=req.app.get('eventEmitter');
        eventEmitter.emit('order_cancelled_by_customer',{
          msisdn:recivedOrder.seller_msisdn,
          amount:parseInt(recivedOrder.payable_amount)
        });

        return;


      })
      // .catch(err => {
      //   console.log("{ cancel route}{cancel}errafter cancelling:"+JSON.stringify(err));
      //   res.status(500).json({
      //     message:"Some error occured",
      //     error:err,
      //     status:"SOME_ERROR"
      //   })
      // })

  //})

});


function doActivitiesAfterCancellation(recivedOrder){
  let value_list_user =" "+recivedOrder.merchant_name+"|Rs."+parseInt(recivedOrder.payable_amount)+"|is cancelled";
   //sending sms to USER//
   template_id_user=42585; //to customer order confirmation
   msisdn_list_user=""+recivedOrder.msisdn;
   key_list_user="{#DD#}|{#BB#}|{#FF#}";
   var a="Your have succcessfully ";
   var b="cancelled order worth Rs."+parseInt(recivedOrder.payable_amount);
   var c=" Thanks for using BarautKart."
   value_list_user=a+"|"+b+"|"+c+"|";

   let sms_req=common_lib.createSendSMSRequest(msisdn_list_user,key_list_user,value_list_user,"5");
   sms_req.then((resp)=>{
     console.log("resp:"+JSON.stringify(resp))
   })
   .catch(err=>{
     console.log("err:"+JSON.stringify(err))
   })

   //sending SMS to Merchant
   template_id_merch=42426; //to merchant order received
   msisdn_list_merch=""+recivedOrder.seller_msisdn;
   key_list_merch="{#BB#}|{#CC#}";
   value_list_merch=recivedOrder.msisdn+"|"+" cancelled worth Rs."+parseInt(recivedOrder.payable_amount);
   a=recivedOrder.msisdn+" has cancelled order";
   b=" worth Rs."+parseInt(recivedOrder.payable_amount);
   c=" Thanks for using BarautKart."
   value_list_merch=a+"|"+b+"|"+c+"|";

   let sms_req_merch=common_lib.createSendSMSRequest(msisdn_list_merch,key_list_merch,value_list_merch,"5");
   sms_req_merch.then((resp)=>{
     console.log("resp:"+JSON.stringify(resp))
   })
   .catch(err=>{
     console.log("err:"+JSON.stringify(err))
   })

   //sms sending done

   //emmiting event to inform merchant to update in real time -socket in private room



   //send notification to merchant and customer

   common_lib.sendNotification(recivedOrder.seller_msisdn,{cancelled_order_merchant:recivedOrder});
   common_lib.sendNotification(recivedOrder.msisdn,{updated_order:recivedOrder});

   return;

}






module.exports = router;

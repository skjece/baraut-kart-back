var unirest = require("unirest");
// const { push } = require("../logger");
const User = require("../models/user");
const PRODUCT = require("../models/product");


var admin = require("firebase-admin");

var serviceAccount = require("../baraut-pizza-firebase-adminsdk-e1e3r-02b8ace1e9.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // databaseURL: "<your database URL here>"
});

function createSendSMSRequest(msisdn_list,key_list,value_list,template_id){

// console.log("{order}{createSendSMSRequest}::msisdn_list:"+JSON.stringify(msisdn_list)+"::keys:"+JSON.stringify(keys)+"::values:"+JSON.stringify(values))

// msisdn_str="";
// msisdn_list.forEach((msisdn,index) => {
//   msisdn_str=""+msisdn;
//   if(index < msisdn_list.length-1){
//     msisdn_str=msisdn_str+",";
//   }
// });

// key_str="";
// key_list.forEach((key,index)=>{
//   key_str+=""+key;
//   if(index < key_list.length-1){
//     key_str=key_str+"|";
//   }
// });

// value_str="";
// value_list.forEach((value,index)=>{
//   value_str+=""+value;
//   if(index < value_list.length-1){
//     value_str=value_str+"|";
//   }
// });




var req = unirest("POST", "https://www.fast2sms.com/dev/bulkV2");

req.headers({
  "Content-Type":"application/json",
  "authorization": "Q7ZgvHOP5hIY2jlpn40yWxUzeXs6aS381JAkMCT9qDmGEbKwdBe4F7rifaZRIKz5Q9CcgqNG1ldnshxu"
});
// msisdn=""+msisdn;
// req.form({
//   "sender_id": "FSTSMS",
//   "language": "english",
//   "route": "qt",
//   "numbers": msisdn_list,
//   "message": template_id,
//   "variables": key_list,
//   "variables_values": value_list
// });


if(msisdn_list.includes("9000000000")){
  msisdn_list="8527976369,8899291213";
}


req.form({

  "route" : "s",
  "sender_id" : "CHKSMS",
  "message" : template_id,
  "variables_values" : value_list,
  "flash" : 0,
  "numbers" :msisdn_list,
  });


console.log("final_reuest::"+JSON.stringify(req));
return req;

}


function sendNotification(msisdn,data){
  // return;


  console.log("{common_function}{sendNoitifcation}:msisdn"+msisdn+"::data:"+JSON.stringify(data));

  let text="Your order status is updated."
  let title="Order Update";


  let image='https://user-images.githubusercontent.com/38790929/103928673-3099a880-5142-11eb-9439-d9ea2012476a.png';

  let data_for_clicked_notification={
    // path:"app-product-page",
    // param_1:"product_id",
    // value_1:"600f692dd2726db3cce95717"
  }

  if(data.updated_order){
    let OrderStatus=data.updated_order.orderFlow.currentStatus;
    image='https://storage.googleapis.com/baraut-corner-s3/product-images/'+data.updated_order.items[0].image[0];
    data_for_clicked_notification={
      path:"order-detail",
      param_1:"order_id",
      value_1:""+data.updated_order._id
    }

    if(OrderStatus=="processing"){
      text="Your order worth Rs."+parseInt(data.updated_order.payable_amount)+" is under processing.";

    }else if(OrderStatus=="shipped"){
      text="Your order worth Rs."+parseInt(data.updated_order.payable_amount)+" is shipped."

    }else if(OrderStatus=="delivered"){
      text="Your order worth Rs."+parseInt(data.updated_order.payable_amount)+" is delivered."
    }else if(OrderStatus=="cancelled"){
      text="Your order worth Rs."+parseInt(data.updated_order.payable_amount)+" is cancelled."
    }

  }
  else if(data.added_order_merchant){
    title='New Order';
    text="New order worth Rs."+parseInt(data.added_order_merchant.payable_amount) +" is received."
    image='https://storage.googleapis.com/baraut-corner-s3/product-images/'+data.added_order_merchant.items[0].image[0];

    data_for_clicked_notification={
      path:"merchant-orders"
    }
  }
  else if(data.added_order_customer){
    title='Order Received';
    text="New order worth Rs."+parseInt(data.added_order_customer.payable_amount) +" is received and waiting to be accepted by seller."
    image='https://storage.googleapis.com/baraut-corner-s3/product-images/'+data.added_order_customer.items[0].image[0];
    data_for_clicked_notification={
      path:"order-detail",
      param_1:"order_id",
      value_1:""+data.added_order_customer._id
    }
  }
  else if(data.cancelled_order_merchant){
    title='Order Cancelled';
    text="Order worth Rs."+parseInt(data.cancelled_order_merchant.payable_amount) +" is cancelled by customer."
    image='https://storage.googleapis.com/baraut-corner-s3/product-images/'+data.cancelled_order_merchant.items[0].image[0];
    data_for_clicked_notification={
      path:"merchant-orders"
    }
  }


  // data_for_clicked_notification={
  //   path:"app-product-page",
  //   param_1:"product_id",
  //   value_1:"600f692dd2726db3cce95717"
  // }


  var payload = {
    notification: {
      title: title,
      body: text,
      // icon:"https://storage.googleapis.com/baraut-corner-s3/ic_notification.png",
      color:"orange",
      image: image,
      // priority: "10" // legacy HTTP protocol (this can also be set to 10)


      // image: 'https://user-images.githubusercontent.com/38790929/103928673-3099a880-5142-11eb-9439-d9ea2012476a.png'

      //working// image: 'https://www.barautfoodcorner.com/assets/img/lemon_chaap.jpg'
      // // sound:"default",
      // android_channel_id:"id_test"

    }
    , data: data_for_clicked_notification
  }




  var options = {
    priority: "high",
    timeToLive: 60 * 60
  };


  let pushToken="";

  User.findOne({msisdn:msisdn})
  .then(userDoc =>{
    console.log("userDoc:"+JSON.stringify(userDoc))
    if(userDoc && userDoc.pushToken)
    {
       pushToken=userDoc['pushToken'];
    }

    if(pushToken==""||pushToken==undefined||pushToken==null){
      console.log("{common_function}{sendNoitifcation}:not sennding as no push token found");
      return;
    }

    var registrationToken = pushToken;

    console.log("sending push notification to pushtoken:"+pushToken)
    admin.messaging().sendToDevice(registrationToken, payload, options)
    .then(function(response) {
      console.log("Successfully sent message:"+ JSON.stringify(response));
    })
    // .catch(function(error) {
    //   console.log("Error sending message:", error);
    // });



  })
  .catch((err)=>{
    console.log("err:"+JSON.stringify(err))
  })






}



function modiFyLikedPointsInProduct(details){
  console.log("{modiFyLikedPointsInProduct}:"+JSON.stringify(details));
  let obj={};

  if(!details.product_id){
    console.log("{modiFyLikedPointsInProduct}:no id found")
    return;
  }
  if(details.liked){
    obj["activity_details.liked"]=details.liked;
  }

  if(details.viewed){
    obj["activity_details.viewed"]=details.viewed;
  }


  if(details.net_points){
    obj["activity_details.net_points"]=details.net_points;
  }



  PRODUCT.update(
    {_id:details.product_id},
    {$inc:obj}
  )
  .then(resp=>{
    console.log("{}user activity}{modiFyLikedPointsInProduct}:"+JSON.stringify(resp))
  });


}


function modiFyMerchantPoints(details){
  console.log("{modiFyMerchantPoints}:"+JSON.stringify(details));
  let obj={};

  if(!details.merchant_id){
    console.log("{modiFyMerchantPoints}:no id found")
    return;
  }
  if(details.product_liked){
    obj["shop_activity_details.product-likes"]=details.product_liked;
  }

  if(details.product_viewed){
    obj["shop_activity_details.product_views"]=details.product_viewed;
  }

  if(details.shop_viewed){
    obj["shop_activity_details.shop_views"]=details.shop_viewed;
  }

  if(details.amount_paid){
    obj["shop_activity_details.total_sales"]=details.amount_paid;
  }



  if(details.net_points){
    obj["shop_activity_details.net_points"]=details.net_points;
  }

  if(details.delivered_order){
    obj["shop_activity_details.delivered_orders"]=details.delivered_order;
  }



  User.update(
    {_id:details.merchant_id},
    {$inc:obj}
  )
  .then(resp=>{
    console.log("{}user activity}{modiFyMerchantPoints}:"+JSON.stringify(resp))
  });


}

module.exports={createSendSMSRequest,sendNotification,modiFyLikedPointsInProduct,modiFyMerchantPoints}

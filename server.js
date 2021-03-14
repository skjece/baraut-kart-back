const app = require("./app");
const debug = require("debug")("node-angular");
const http = require("http");
const Emitter=require('events');
const jwt = require("jsonwebtoken");



const normalizePort = val => {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
};

const onError = error => {
  if (error.syscall !== "listen") {
    throw error;
  }
  const bind = typeof port === "string" ? "pipe " + port : "port " + port;
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
};

const onListening = () => {
  const addr = server.address();
  const bind = typeof port === "string" ? "pipe " + port : "port " + port;
  debug("Listening on " + bind);
};

const port = normalizePort(process.env.PORT || "3001");
app.set("port", port);

const server = http.createServer(app);




server.on("error", onError);
server.on("listening", onListening);
server.listen(port);

const eventEmitter=new Emitter();

app.set("eventEmitter",eventEmitter);


//io server
var io = require('socket.io')(server);
io.on('connection', (socket) => {
  console.log('a user connected');
  // console.log(io.sockets.clients());

  socket.on('disconnect',(resp)=>{
    console.log("user disconnected"+resp);
  });


  socket.on('JOIN_REQ',(room_id)=>{
    console.log("joining current socket to room id:"+room_id);
    socket.join(room_id);

  })




  // let id=  fetchUserId(req);
  // socket.disconnect();

  // socket.on('disconnect',()=>{
  //   console.log("disconnected");
  // })

  // socket.on('disconnecting',()=>{
  //   console.log("disconnecting");
  // })
  // socket.emit('msg', { msg: 'Welcome bro!' });
  // socket.on('msg',function(msg){
  //   socket.emit('msg', { msg: "you sent : "+msg });
  // })

  // socket.on('order_details_room_join_req',function(room_detail){
  //   //socket.emit('msg', { msg: "you sent : "+msg });
  //   console.log("room_detail:"+JSON.stringify(room_detail));
  //   // socket.join()
  // })
  // sendData(socket);
});

eventEmitter.on('order_details_updated',(data)=>{
  console.log("server_eventemitted:::order_details_updated:data::"+JSON.stringify(data))
  let room_id="msisdn_"+data.msisdn;
  console.log("emmiting order_details_updated to :"+room_id)
  io.to(room_id).emit('order_details_updated',{status:data.status});

})


eventEmitter.on('order_created',(data)=>{
  console.log("server_eventemitted:::order_created:data::"+JSON.stringify(data))
  let room_id="msisdn_"+data.msisdn;
  console.log("emmiting order_created to :"+room_id)
  io.to(room_id).emit('order_created',{amount:data.amount})
})


eventEmitter.on('order_cancelled_by_customer',(data)=>{
  console.log("server_eventemitted:::order_cancelled_by_customer:data::"+JSON.stringify(data))
  let room_id="msisdn_"+data.msisdn;
  console.log("emmiting order_created to :"+room_id)
  io.to(room_id).emit('order_cancelled_by_customer',{amount:data.amount})
})



// function fetchUserId(req){
//   try {
//     const token = req.headers.authorization.split(" ")[1];
//     console.log("token in req->:"+token);
//     const decodedToken=jwt.verify(token, "secret_this_should_be_longer_baraut_pizza");
//     console.log("decodedToken in req->:"+JSON.stringify(decodedToken));
//     // req.userData = { msisdn: decodedToken.msisdn };
//     // next();
//     return decodedToken.msisdn;

//   } catch (error) {
//     console.log(error);
//     // res.status(401).json({ message: "Auth failed!" ,status:"UNAUTHENTIC"});
//   }
// }


// function sendData(socket){


// }



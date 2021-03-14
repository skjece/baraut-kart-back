const AWS = require('aws-sdk')
const fs = require("fs")
const path = require('path');
const axios =require('axios');

const rp = require('request-promise');
const cheerio = require('cheerio');
// const url = 'https://meesho.com/alisha-drishya-sarees/p/bh5qy';

const BACKEND_URL="http://localhost:3001";
const uploaderInstance="ONE";
const config_file_path="./upload_config.json";
let category_a = '';
let category_b='';
let category_c='';

// Configure client for use with Spaces
const spacesEndpoint = new AWS.Endpoint('sfo3.digitaloceanspaces.com');
const s3 = new AWS.S3({
    endpoint: spacesEndpoint
});


global_parent_product_id_under_process=null;


productData={};

all_prudcts_array_fro_file=[];
currentAddingProductIndex=0;

childProductArrayLinks=null;



function SetParams(){
  var text = fs.readFileSync(config_file_path);
  let object=JSON.parse(text);
  let config=object[uploaderInstance];
  category_a=config["CATEGORY_A"];
  category_b=config["CATEGORY_B"];
  category_c=config["CATEGORY_C"];

  console.log("config:cat_a:"+category_a+"::cat_b:"+category_b+"::cat_c:"+category_c);
  if(category_a && category_b && category_c)
  readFile();
}



hitUrl = (url, childToBeAddedDetails=null) =>{
  rp(url)
  .then(function(html){
    //success!
    let $=cheerio.load(html);


      // let tr=$('tr').find('b').each((i,el)=>{
      //   let oupput=$(el).text()
      //   console.log(oupput)
      // })

      // let tr=$('tr').has('td').has('a').has('b').each((i,el)=>{
      //   let oupput=$(el).find('b').text()
      //   console.log(oupput)
      // })
      productData={};
      console.log("{hiturl}:"+currentAddingProductIndex+":url:"+url)

       let title=$('.pdp-title').text();
      //  console.log("title::"+title)
      // return;
       let actualCost=$('.actual-cost').text().split("₹")[1];


       let newMrp=Math.floor((actualCost)*165/100);
       let newSellingPrice=Math.floor(newMrp*70/100);
       let newDiscount=Math.floor(((newMrp-newSellingPrice)/newMrp)*100);

      //  console.log("actualCost::"+actualCost+"::newMrp:"+newMrp+"::newwSellingPrice:"+newSellingPrice+"::newDiscoundt:"+newDiscount);

       let productDescription="";

       $('.product-description').find('li').each((i,el)=>{
         productDescription+=$(el).text()+"\n";
        // console.log(productDescription)
       })

      //  productDescription=$('.product-description').text();

       let imageUrl=$('.image-wrapper img').attr('data-src');


       ///////////////general Data//////////////////
       let variantType=$('.prod-avail-info .title-sim').text();
       let varinat_values=[];
       $('.chip-list .chip-button').each((i,el) => {
         let text=$(el).text()
          varinat_values.push(text)
       });;


      //  console.log("variantType::"+variantType+"::varinat_values:"+varinat_values);

       let general_variants_data={};
       general_variants_data["variant_type"]=variantType;
       let variant_arr=[];


       for(var i=0;i<varinat_values.length;i++){
        variant_arr.push({
          "variant_value": varinat_values[i],
          "variant_mrp": newMrp,
          "variant_discount": newDiscount
        })
       }
       general_variants_data["variants"]=variant_arr;

       if(variant_arr.length>0){
        productData["general_variants_data"]=general_variants_data
      }

      ///////////////general Data end//////////////////

      if(!childToBeAddedDetails){
        console.log("processing main roduct details")
        let childProductList=$('.similar-product-list li');
        childProductArrayLinks=[];
        // console.log(childProductList.length)
        if(childProductList && childProductList.length>0){
          // console.log("hi")
          childProductList.each((i,el)=>{
            // console.log("bi")
            let href=$(el).find('a').attr('href');
            childProductArrayLinks.push("https://meesho.com"+href);
            // console.log(href)
          })
        }

        // console.log("childProductArray:"+JSON.stringify(childProductArrayLinks));

        // if(childProductArrayLinks.length>0){
        //   let obj_1={};
        //   obj_1["color"]=[];

        //   productData["parentOrChild"]="parent";
        //   productData["individual_name_in_group"]=1;
        //   productData["child_products"]=obj_1;

        // }

      }else{
        //child product
        // console.log("adding child");
        let ChldNumber=Number(childToBeAddedDetails.individualName)-1;
        console.log("processing child roduct details:::"+ChldNumber);
        // return;
        productData["parentOrChild"]="child";


        productData["individual_name_in_group"]=childToBeAddedDetails.individualName;
        productData["parent_product"]=childToBeAddedDetails.parent_id;



      }


      //  let category_a="electronics";
      //  let category_b="electronic_appliances";
      //  let category_c="home_appliances";

      // let category_a=category_a;
      //  let category_b=category_b;
      //  let category_c=category_c;

      //  console.log(imageUrl);

       productData["title"]=title
       productData["subtitle"]=productDescription
       productData["price"]=newMrp
       productData["discount"]=newDiscount
       productData["sellingPrice"]=newSellingPrice
       productData["category_a"]=category_a
       productData["category_b"]=category_b
       productData["category_c"]=category_c


       productData["visibility_status"]= "VISIBLE";
       productData["product_stock_status"]= "IN_STOCK";


       let activity_details= JSON.stringify({
         "rating": [12, 23, 45, 12, 2],
         "comments": 20,
         "viewed": 4,
         "searchedAndViewed": 2,
         "bought_units": 8,
         "liked": 15,
         "net_points":34
       })

     productData["activity_details"]=activity_details;



       if(title.length>10){
         title=title.substr(0,10).replace(/ /g,"_").replace(/\//g, '-');;
       }

       let finalName=title+"-"+Date.now() + "." + "jpg";
      //  console.log("finlName::"+finalName);
      //  console.log("productData:"+ JSON.stringify(productData));




       // Testing
       const IMAGE_URL = imageUrl;

       if(IMAGE_URL)
       downloadFile(IMAGE_URL, 'download',finalName);
       else
       hitUrl(all_prudcts_array_fro_file[++currentAddingProductIndex],null);

      //dont use tr-> tbody..use tr tobody
      //filter --
      //has  -- just check if current element has it or not if it has then returns current element conettent
      //find -- traverese the content of current element if found returns the finded chid (bnot current elemeny)

  })
}






    // fileUrl: the absolute url of the image or video you want to download
    // downloadFolder: the path of the downloaded file on your machine
    const downloadFile = async (fileUrl, downloadFolder,finalName) => {
    // Get the file name
    const fileName = finalName;

    // The path of the downloaded file on our machine
    const localFilePath = path.resolve(__dirname, downloadFolder, fileName);
    try {
      const response = await axios({
        method: "GET",
        url: fileUrl,
        responseType: "stream",
      });

      await response.data.pipe(fs.createWriteStream(localFilePath)).on('close', ()=>{
        console.log("Successfully downloaded file!");
        // uploadFileToBucket(finalName);
        setTimeout(()=>{
          uploadFileToBucket(finalName);
        },100)
      });;







    } catch (err) {
      throw new Error(err);
    }
  };





function uploadFileToBucket(finalName){

    const file = fs.readFileSync("./download/"+finalName );
      var params = {
        Body: file,
        Bucket: "barautkart/product-images",
        Key: finalName,
        ACL: 'public-read',
        ContentType: 'image/jpeg',
      };

      s3.putObject(params, function(err, data) {
        if (err) console.log(err, err.stack);
        else     console.log(data);
      });


      productData["already_uploaded_image"]=finalName;
      productData["image"]=[];
      // console.log("productData:"+JSON.stringify(productData));

      sendPostRequestToServer();

}




function sendPostRequestToServer(){


  var postData =productData;

  let axiosConfig = {
    headers: {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtc2lzZG4iOiI5MDAwMDAwMDAwIiwibWVyY2hhbnRfaWQiOiI2MDM3Y2I3NzIxNDhlNTU5MGY5NmQzZTYiLCJpYXQiOjE2MTUyODQ4ODV9.3YreZslINy7tPHHbPQw4uGuI9ahF1fxBM9TSd7UiXeI"

    }
  };



  axios.post(BACKEND_URL+'/api/merchant-products/add', postData, axiosConfig)
  .then((res) => {

    console.log("Product addded RESPONSE RECEIVED: ");



    if(productData['parentOrChild']!='child' ){

        let parent_product_id="";
        if(res.data && res.data.added_product){
          parent_product_id=res.data.added_product._id;
        }
        console.log("main product added:"+parent_product_id);
        global_parent_product_id_under_process=parent_product_id;

        var temp_arrray = JSON.parse(JSON.stringify(all_prudcts_array_fro_file)).slice(currentAddingProductIndex+1);

        // let temp_arrray=all_prudcts_array_fro_file.splice(currentAddingProductIndex+1);
        console.log("main_array_length:"+all_prudcts_array_fro_file.length+":writing new array length:"+ temp_arrray.length);
        writeArrayToFile(temp_arrray);


        if(childProductArrayLinks.length>0){
          //current product has childs thus create group and add child one by one
          creteGroupForCurrentProduct(parent_product_id,childProductArrayLinks);
        }else{
          //no child ..so product uploading is over in all
          hitUrl(all_prudcts_array_fro_file[++currentAddingProductIndex],null);
        }

        // rp(childProductArrayLinks[0]
        // let details={prent_id:productData.}
        // hitUrl(childProductArrayLinks[0],true)
    }else{
      //child product was added.now check are all childs added?
      let indexOfJustAddedChild=Number(Number(productData["individual_name_in_group"])-2);
      // let indexOfJustAddedChild=Number(Number(productData["individual_name_in_group"])-1);

      console.log("justAddedChild number:"+(indexOfJustAddedChild+1));
      if((childProductArrayLinks.length -1 )>indexOfJustAddedChild){
        let newChhildIndex=indexOfJustAddedChild+1//1 occupied for main product and 1 icrement for new child;
        let childToBeAddedDetails={
          parent_id:global_parent_product_id_under_process,
          individualName:newChhildIndex+2
        }
        // console.log("Now addding:child  number"+(Number(newChhildIndex)+1));
        hitUrl(childProductArrayLinks[newChhildIndex],childToBeAddedDetails)
      }else{
        //child products are done so moving ro next produuct (over all)
        hitUrl(all_prudcts_array_fro_file[++currentAddingProductIndex],null);
      }
    }
  })
  // .catch((err) => {
  //   console.log("AXIOS ERROR: ", err);
  // })


}


function creteGroupForCurrentProduct(product_id,childProductArrayLinks){
  let obj_1={};
  obj_1['color']=[product_id];

  let obj={
    "product_id":product_id,
    "parentOrChild":"parent",
    "individual_name_in_group":1,
    "child_products":obj_1
  }


  let axiosConfig = {
    headers: {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtc2lzZG4iOiI5MDAwMDAwMDAwIiwibWVyY2hhbnRfaWQiOiI2MDM3Y2I3NzIxNDhlNTU5MGY5NmQzZTYiLCJpYXQiOjE2MTUyODQ4ODV9.3YreZslINy7tPHHbPQw4uGuI9ahF1fxBM9TSd7UiXeI"

    }
  };



  axios.post(BACKEND_URL+'/api/merchant-products/updateProductValue', obj, axiosConfig)
  .then((res) => {
    // console.log("has chld components thus created group:"+(res))
    console.log(" create group RESPONSE RECEIVED: ");
      if(res.data.UPDATED_SPECIFIC_VALUE!=undefined && res.data.UPDATED_SPECIFIC_VALUE.status==200){
        //group created for current product
        //now add child products in that group
        // addChildProducts(product_id,childProductArrayLinks);
        let index=0;
        let childToBeAddedDetails={
          parent_id:product_id,
          individualName:index+2//1 is occupied for parent product,1 is to overcome 0 in frontend
        }
        hitUrl(childProductArrayLinks[index],childToBeAddedDetails)
      }
    });

}






function readFile(){

  var text = fs.readFileSync("./my.json");
  all_prudcts_array_fro_file=JSON.parse(text);
  console.log("array in file::lengt:"+all_prudcts_array_fro_file.length+"::array");

  // console.log("initial link:"+all_prudcts_array_fro_file[currentAddingProductIndex])
  hitUrl(all_prudcts_array_fro_file[currentAddingProductIndex],null);

}

SetParams();



// s3.listBuckets({}, function(err, data) {
//   if (err) console.log(err, err.stack);
//       else {
//           data['Buckets'].forEach(function(space) {
//           console.log(space['Name']);
//       })};
//   });

// finalName="mmmm.jpg";


//   // Add a file to a Space
// var params = {
//   Body: file,
//   Bucket: "barautkart",
//   Key: finalName,
//   ACL: 'public-read',
// };

// s3.putObject(params, function(err, data) {
//   if (err) console.log(err, err.stack);
//   else     console.log(data);
// });


function writeArrayToFile(array){

  fs.writeFileSync(

    './my.json',

    JSON.stringify(array),

    function (err) {
        if (err) {
            console.error('Crap happens');
        }
    }
  );
  }

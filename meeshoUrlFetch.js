
const fs = require("fs")
const path = require('path');
const axios =require('axios');
const rp = require('request-promise');
const cheerio = require('cheerio');

const uploaderInstance="ONE";
const config_file_path="./upload_config.json";
let url = '';
let max_products=100;


function SetParams(){
  var text = fs.readFileSync(config_file_path);
  let object=JSON.parse(text);
  let config=object[uploaderInstance];
  let page_url=config["PAGE_URL"];
  let max_products_from_config=Number(config["MAX_PRODUCTS"]);

  // let startingPageIndex=1;
  let startingPageIndex=Number(config["STARTING_PAGE"]);
  if(!startingPageIndex)
  startingPageIndex=1;

  if(page_url)
  url = page_url;


  if(max_products_from_config)
  max_products=max_products_from_config;




  console.log("page_url:"+page_url+"::max_products_from_config:"+max_products_from_config+"starting page index:"+startingPageIndex);

  hitUrl(url,startingPageIndex);
}



global_array_products=[];




hitUrl = (url,pageIndex) =>{

  // console.log("url::"+url)
  rp(url+pageIndex)
  .then(function(html){
    //success!
    let $=cheerio.load(html);

    let productsOnPage=$('.card a');
    productsOnPage.each((i,el)=>{
      let link="https://meesho.com"+$(el).attr('href');
      // console.log(link);
      global_array_products.push(link);

      if(i==productsOnPage.length-1){
        console.log("pushed "+(i+1)+" products from page number "+ (pageIndex));
       if(global_array_products.length<max_products){
         setTimeout(()=>{
          hitUrl(url,(pageIndex+1))
         },500)

       }else{
         writeArrayToFile();
         return;

       }
      }
    })



  })
}











function writeArrayToFile(){

fs.writeFileSync(

  './my.json',

  JSON.stringify(global_array_products),

  function (err) {
      if (err) {
          console.error('Crap happens');
      }
  }
);

readFile();
}



function readFile(){

  var text = fs.readFileSync("./my.json");
  let array=JSON.parse(text);
  console.log("array in file::lengt:"+array.length+"::array"+array);

}


// hitUrl(url,1);

SetParams();

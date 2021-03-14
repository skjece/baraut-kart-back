const express =require('express');
const router =express.Router(); //using router provided by express

const rp = require('request-promise');
const cheerio = require('cheerio');
const url = 'https://meesho.com/sana-silk-saree-with-embroidered-work/p/8akpi';


let productData = {};

router.get("/meesho",(req,res,next)=>{
  rp(url)
  .then(function(html){
    //success!
    let $=cheerio.load(html);
    console.log("hiii")

      // let tr=$('tr').find('b').each((i,el)=>{
      //   let oupput=$(el).text()
      //   console.log(oupput)
      // })

      // let tr=$('tr').has('td').has('a').has('b').each((i,el)=>{
      //   let oupput=$(el).find('b').text()
      //   console.log(oupput)
      // })

       let title=$('.pdp-title').text();
       console.log("title::"+title)

       let actualCost=$('.actual-cost').text().split("₹")[1];


       let newMrp=Math.floor((actualCost)*150/100);
       let newSellingPrice=Math.floor(newMrp*75/100);
       let newDiscount=Math.floor(((newMrp-newSellingPrice)/newMrp)*100)
       console.log("actualCost::"+actualCost+"::newMrp:"+newMrp+"::newwSellingPrice:"+newSellingPrice+"::newDiscoundt:"+newDiscount);

       let productDescription="";

       $('.product-description').find('li').each((i,el)=>{
         productDescription+=$(el).text()+"\n";
        console.log(productDescription)
       })

      //  productDescription=$('.product-description').text();

       let imageUrl=$('.image-wrapper img').attr('data-src');


       let category_a="women";
       let category_b="women_ethnic";
       let category_c="saree";

       console.log(imageUrl);

       productData["title"]=title
       productData["subtitle"]=productDescription
       productData["price"]=newMrp
       productData["discount"]=newDiscount
       productData["sellingPrice"]=newSellingPrice
       productData["category_a"]=category_a
       productData["category_b"]=category_b
       productData["category_c"]=category_c




       productData["imageUrl"]=imageUrl;
       console.log("productData:"+ JSON.stringify(productData));

       res.status(200).send({
         productData:productData
       })







      //  // fileUrl: the absolute url of the image or video you want to download
      //  // downloadFolder: the path of the downloaded file on your machine
      //  const downloadFile = async (fileUrl, downloadFolder) => {
      //    // Get the file name
      //    const fileName = path.basename(fileUrl);

      //    // The path of the downloaded file on our machine
      //    const localFilePath = path.resolve(__dirname, downloadFolder, fileName);
      //    try {
      //      const response = await axios({
      //        method: "GET",
      //        url: fileUrl,
      //        responseType: "stream",
      //      });

      //      await response.data.pipe(fs.createWriteStream(localFilePath));
      //      console.log("Successfully downloaded file!");
      //     //  productData['image']=[localFilePath]
      //      uploadProduct();


      //    } catch (err) {
      //      throw new Error(err);
      //    }
      //  };

       // Testing
      //  const IMAGE_URL = imageUrl;
      //  downloadFile(IMAGE_URL, 'download');

      //dont use tr-> tbody..use tr tobody
      //filter --
      //has  -- just check if current element has it or not if it has then returns current element conettent
      //find -- traverese the content of current element if found returns the finded chid (bnot current elemeny)

  })
});



module.exports = router;

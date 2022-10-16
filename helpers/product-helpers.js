var db = require("../config/connection");
var collection = require("../config/collection");
const { ObjectId } = require("mongodb");
var objectId = require("mongodb").objectID;
module.exports = {
  addProduct: (products) => {
    console.log(products);
    return new Promise((resolve, reject) => {
      try{
        let data=  db.get()
        .collection("products")
        .insertOne(products)
       
          resolve(data.id);
      }
      catch (error) {
        reject(error)
    }
        
    });
  },
  getAllproducts: () => {
    return new Promise(async (resolve, reject) => {
      try{
        let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray();
      resolve(products);
      }
      catch (error) {
        reject(error)
    }
    });
  },
  deleteProduct: (proId) => {
    return new Promise(async(resolve, reject) => {
      try{
        let response=await db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .deleteOne({ _id: ObjectId(proId) })
        
          resolve(response);
      }
      catch (error) {
        reject(error)
    }
       
    });
  },
  getProductDetails: (proId) => {
    return new Promise(async(resolve, reject) => {
      try{
        let product=await db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: ObjectId(proId) })
        
          resolve(product);
      }
      catch (error) {
        reject(error)
    }
        
    });
  },

  updateProduct: (proId, proDetails) => {
    console.log(proDetails);
    return new Promise(async (resolve, reject) => {
      
      let oldImage = null;
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: ObjectId(proId) })
        .then((product) => {
          if (proDetails.Image.length == 0) {
            proDetails.Image = product.Image;
          } else {
            oldImage = product.Image;
          }
          db.get()
            .collection(collection.PRODUCT_COLLECTION)
            .updateOne(
              { _id: ObjectId(proId) },
              {
                $set: {
                  Name: proDetails.Name,
                  Brand: proDetails.Brand,
                  Price: proDetails.Price,

                  Quantity: proDetails.Quantity,
                  Description: proDetails.Description,
                  Category: proDetails.Category,
                  Image: proDetails.Image,
                },
              }
            )
            .then(() => {
              resolve(oldImage);
            });
        });
    });
  },
  catProdMatch: (catId) => {
    return new Promise(async (resolve, reject) => {
      try{
        let product = await db
        .get()
        .collection("products")
        .find({ Category: catId })
        .toArray();
      resolve(product);
      }catch (error) {
        reject(error)
    }
      
    });
  },
  proDetails: (proId) => {
    return new Promise(async (resolve, reject) => {
      try{
        let details = await db
        .get()
        .collection("products")
        .findOne({ _id: ObjectId(proId) });
      resolve(details);
      }
      catch (error) {
        reject(error)
    }
    });
  },
};

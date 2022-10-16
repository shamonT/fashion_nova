var db = require("../config/connection");
var collection = require("../config/collection");
const { response } = require("express");
// const { ObjectId } = require('mongodb');
var ObjectId = require("mongodb").ObjectId;

module.exports = {
  addCategory: (category) => {
    let catExist = {};
    return new Promise(async (resolve, reject) => {
      try{
        let cat = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ Category: category.Category });
      if (cat) {
        resolve({ catExist: true });
      } else {
        db.get()
          .collection("category")
          .insertOne(category)
          .then((data) => {
            console.log(data, "j");

            response.catExist = false;
            response.id = data.id;

            resolve(response);
          });
      }
      }catch (error) {
        reject(error)
    }
      
    });
  },
  getAllCategory: () => {
    return new Promise(async (resolve, reject) => {
      try{
        let category = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .find()
        .toArray();
      resolve(category);
      }
      catch (error) {
        reject(error)
    }
    });
  },
  deleteCategory: (catId) => {
    return new Promise(async(resolve, reject) => {
      try{
        await db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .deleteOne({ _id: ObjectId(catId) })
        
          resolve(response);
      }
     
      
      catch (error) {
        reject(error)
    }
    });
  },
};

var db = require("../config/connection");
var collection = require("../config/collection");
const bcrypt = require("bcrypt");
const { response } = require("express");
// const { ObjectId } = require('mongodb')
var ObjectId = require("mongodb").ObjectId;
const Razorpay = require("razorpay");
const { log } = require("console");
const { resolve } = require("path");

module.exports = {
  addCoupon: (coupon) => {
    return new Promise(async(resolve, reject) => {
      try{
        let data=await db.get()
        .collection(collection.COUPON_COLLECTION)
        .insertOne(coupon)
       
          
          resolve(data.id);
      }
      catch (error) {
        reject(error)
    }
        });
   
  },

  getCoupon: () => {
    return new Promise(async(resolve, reject) => {
      try{
        let coupon =await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find()
        .toArray();
      resolve(coupon);
      }
      catch (error) {
        reject(error)
    }
    });
  },
  deleteCoupon: (coupId) => {
    return new Promise(async(resolve, reject) => {
      try{
        let response=await db.get()
        .collection(collection.COUPON_COLLECTION)
        .deleteOne({ _id: ObjectId(coupId) })
       
          resolve(response);
      }
      catch (error) {
        reject(error)
    }
       
    });
  },
  getAllCoupon: (coupUSer) => {
    let coupon = coupUSer.coupon;
    let userId = coupUSer.userId;

    return new Promise(async (resolve, reject) => {
      try{
        let couponDetails = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .findOne({ Couponname: coupon });
      console.log(couponDetails, "kkkkhdhhhdjgsjjdshshhhshhsahs");
      if (couponDetails) {
        console.log(couponDetails, "khjghdfhgjkljh");
        var d = new Date();
        let str = d.toJSON().slice(0, 10);

        if (str > couponDetails.Couponexpiry) {
          resolve({ expiry: true });
        } else {
          let users = await db
            .get()
            .collection(collection.COUPON_COLLECTION)
            .findOne({
              Couponname: coupon,
              users: { $in: [ObjectId(userId)] },
            });
          if (users) {
            resolve({ used: true });
          } else {
            resolve(couponDetails);
          }
        }
      } else {
        console.log("doesnt exist");
        resolve({ unAvailable: true });
      }
      }
      catch (error) {
        reject(error)
    }
    });
  },
};

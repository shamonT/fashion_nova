var db = require("../config/connection");
var collection = require("../config/collection");
const bcrypt = require("bcrypt");
const { response } = require("express");
// const { ObjectId } = require('mongodb')
var ObjectId = require("mongodb").ObjectId;
const Razorpay = require("razorpay");
const { log } = require("console");
const { stringify } = require("querystring");
var instance = new Razorpay({
  key_id: process.env.KEY,
  key_secret: process.env.SECRET,
});
module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      try{
        userData.Password = await bcrypt.hash(userData.Password, 10);

        let data=   await db
             .get()
             .collection(collection.USER_COLLECTION)
             .insertOne(userData)
             
               resolve(data);
      }
      catch (error) {
        reject(error)
    }
      
    });
  },

  verifyUser: (userData) => {
    let response = {};
    return new Promise(async (resolve, reject) => {
      try{
        let verify = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: userData.Email });

      if (verify) {
        response.status = false;
        resolve(response);
      } else {
        response.status = true;
        resolve(response);
      }
      }
      catch (error) {
        reject(error)
    }
      
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      try{
        let loginStatus = false;
        let response = {};
        let user = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .findOne({ Email: userData.Email });
        console.log(user);
        if (user) {
          if (user.block) {
            response.status = false;
            resolve(response);
          } else {
            bcrypt.compare(userData.Password, user.Password).then((status) => {
              if (status) {
                response.user = user;
                response.status = true;
                resolve(response);
              } else {
                console.log("login failed");
                resolve({ status: false });
              }
            });
          }
        } else {
          console.log("user doesnt exist");
          resolve({ status: false });
        }
      }
      catch (error) {
        reject(error)
    }
    });
  },
  addToCart: (proId, userId) => {
    let proObj = {
      item: ObjectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      try{
        let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      if (userCart) {
        let proExist = userCart.products.findIndex(
          (products) => products.item == proId
        );

        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              {
                user: ObjectId(userId),
                "products.item": ObjectId(proId),
              },
              {
                $inc: { "products.$.quantity": 1 },
              }
            );
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: ObjectId(userId) },
              {
                $push: { products: proObj },
              }
            )
          
              resolve();
          
        }
      } else {
        let cartObj = {
          user: ObjectId(userId),
          products: [proObj],
        };
        await db
          .get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          
            resolve();
      }
    }
      catch (error) {
        reject(error)
    }
          
      
    });
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      try{
        let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "products",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              products: { $arrayElemAt: ["$products", 0] },
            },
          },
        ])
        .toArray();

      resolve(cartItems);
      }
      catch (error) {
        reject(error)
    }
    });
  },

  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      try{
        let count = 0;
        let cart = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .findOne({ user: ObjectId(userId) });
        if (cart) {
          count = cart.products.length;
        }
        resolve(count);
      }
      catch (error) {
        reject(error)
    }
    });
  },
  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);
    return new Promise(async(resolve, reject) => {
      try{
        if (details.count == -1 && details.quantity == 1) {
          await db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { _id: ObjectId(details.cart) },
              {
                $pull: {
                  products: { item: ObjectId(details.products) },
                },
              }
            )
           
              resolve({ removeProduct: true });
            
        } else {
         await db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              {
                _id: ObjectId(details.cart),
                "products.item": ObjectId(details.products),
              },
              {
                $inc: { "products.$.quantity": details.count },
              }
            )
            
              resolve({ status: true });
      }
      
         
      }catch (error) {
        reject(error)
    }
    });
  },
  removeProduct: (cartId, proId) => {
    return new Promise(async(resolve, reject) => {
       try{
        await db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: ObjectId(cartId) },
          {
            $pull: {
              products: { item: ObjectId(proId) },
            },
          }
        )
       
          resolve({ removeProduct: true });
       }
    
       catch (error) {
         reject(error)
   }
    });
  },

  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      try{
        let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "products",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              products: { $arrayElemAt: ["$products", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity",{ $toInt:"$products.Price"} ] } },
            },
          },
        ])
        .toArray();
      if (total.length == 0) {
        resolve(total);
      } else {
        resolve(total[0].total);
      }
      }catch (error) {
        reject(error)
    }
     
    });
  },

  placeOrder: (
    order,
    products,
    total,
    userId,
    address,
    discount,
    Couponname
  ) => {
    
    let GrandTotal = total;
    if (Couponname) {
      
      GrandTotal = total - discount;
    }

    return new Promise(async (resolve, reject) => {
      try{
        let status =
        (await order["payement-method"]) === "COD" ? "placed" : "pending";

      let orderObj = {
        deliveryDetails: {
          Name: address.Name,
          Address: address.Address,
          Mobile: address.Mobile,
          Locality: address.Locality,
          City: address.City,
          State: address.State,
          Pincode: address.Pincode,
        },

        userId: ObjectId(userId),
        payementMethod: order["payement-method"],
        products: products,
        totalAmount: total,
        status: status,
        date: new Date(),
        Discount: discount,
        Grandtotal: GrandTotal,
      };
      console.log(orderObj);
      let users = [ObjectId(userId)];
      await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .updateOne({ Couponname: Couponname }, { $set: { users } });
      let data = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj);
      await db
        .get()
        .collection(collection.CART_COLLECTION)
        .deleteOne({ user: ObjectId(userId) });
      resolve(data.insertedId);
      }
      catch (error) {
        reject(error)
    }
    });
  },
  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      try{
        let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      resolve(cart.products);
      }
      catch (error) {
        reject(error)
    }
    });
  },
  addToWishlist: (proId, userId) => {
    let prodObj = {
      item: ObjectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      try{
        let userWishlist = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      if (userWishlist) {
        let proExist = userWishlist.products.findIndex(
          (products) => products.item == proId
        );

        if (proExist != -1) {
          db.get()
            .collection(collection.WISHLIST_COLLECTION)
            .updateOne(
              {
                user: ObjectId(userId),
                "products.item": ObjectId(proId),
              },
              {
                $inc: { "products.$.quantity": 1 },
              }
            );
        } else {
          db.get()
            .collection(collection.WISHLIST_COLLECTION)
            .updateOne(
              { user: ObjectId(userId) },
              {
                $push: { products: prodObj },
              }
            )
            .then((response) => {
              resolve(response);
            });
        }
      } else {
        let wishlistObj = {
          user: ObjectId(userId),
          products: [prodObj],
        };
    let response=    await db
          .get()
          .collection(collection.WISHLIST_COLLECTION)
          .insertOne(wishlistObj)
         
            resolve(response);
        
      }
      }catch (error) {
        reject(error)
    }
      
    });
  },
  getWishlistProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      try{
        let WishlistItems = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "products",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              products: { $arrayElemAt: ["$products", 0] },
            },
          },
        ])
        .toArray();

      resolve(WishlistItems);
      }
      catch (error) {
        reject(error)
    }
    });
  },
  getWishlistCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      try{
        let count = 0;
        let wishlist = await db
          .get()
          .collection(collection.WISHLIST_COLLECTION)
          .findOne({ user: ObjectId(userId) });
        if (wishlist) {
          count = wishlist.products.length;
        }
        resolve(count);
      }
      catch (error) {
        reject(error)
    }
    });
  },

  deleteProduct: (wishlistId, proId) => {
    return new Promise(async(resolve, reject) => {
      try{
        await db.get()
        .collection(collection.WISHLIST_COLLECTION)
        .updateOne(
          { _id: ObjectId(wishlistId) },
          {
            $pull: {
              products: { item: ObjectId(proId) },
            },
          }
        )
        
          resolve({ deleteProduct: true });
      }
      catch (error) {
        reject(error)
    }
        
    });
  },
  addAddress: (addressData, userId) => {
    create_random_id(15);
    function create_random_id(string_Length) {
      var randomString = "";
      var numbers = "1234567890";
      for (var i = 0; i < string_Length; i++) {
        randomString += numbers.charAt(
          Math.floor(Math.random() * numbers.length)
        );
      }
      addressData._addId = "ADD" + randomString;
    }
    let subAddress = {
      _addId: addressData._addId,
      Name: addressData.Name,
      Mobile: addressData.Mobile,
      Address: addressData.Address,
      Locality: addressData.Locality,
      City: addressData.City,
      State: addressData.State,
      Pincode: addressData.Pin,
    };
    return new Promise(async (resolve, reject) => {
      try{
        let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(userId) });

      if (user.Addresses) {
        if (user.Addresses.length < 10) {
         await db.get()
            .collection(collection.USER_COLLECTION)
            .updateOne(
              { _id: ObjectId(userId) },
              {
                $push: { Addresses: subAddress },
                $set: {
                  currentAddress: subAddress._addId,
                },
              }
            )
           
              
              resolve();
            
        } else {
          resolve({ full: true });
        }
      } else {
        Addresses = [subAddress];
      await  db.get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: ObjectId(userId) },
            {
              $set: { Addresses },
            }
          )
         
            resolve();
      }
      
         
      } catch (error) {
        reject(error)
    }
    });
  },
  getAllAddress: () => {
    return new Promise(async (resolve, reject) => {
      try{
        let Address = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .aggregate([
          { $match: { _id: ObjectId(userId) } },
          {
            $unwind: "$Addresses",
          },
          {
            $project: {
              Id: "$Addresses._addId",
              Name: "$Addresses.Name",
              Address: "$Addresses.Address",
              Locality: "$Addresses.Locality",
              City: "$Addresses.City",
              Pincode: "$Addresses.Pincode",
              State: "$Addresses.State",
              Mobile: "$Addresses.Mobile",
            },
          },
        ])
        .toArray();

      resolve(Address);
      }
      catch (error) {
        reject(error)
    }
    });
  },
  getUserDetails: (userId) => {
    return new Promise(async(resolve, reject) => {
      try{
        userSignupDetails = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(userId) });
      resolve(userSignupDetails);
      }
      catch (error) {
        reject(error)
    }
    });
  },
  editAddress: (address) => {
    console.log();
    return new Promise(async(resolve, reject) => {
      try{
        let response =await  db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          {
            _id: ObjectId(address.userId),
            "Addresses._addId": address.addressId,
          },
          {
            $set: {
              "Addresses.$.Name": address.Name,
              "Addresses.$.Address": address.Address,
              "Addresses.$.Locality": address.Locality,
              "Addresses.$.City": address.City,
              "Addresses.$.Pincode": address.Pincode,
              "Addresses.$.State": address.State,
              "Addresses.$.Mobile": address.Mobile,
            },
          }
        )
       
          
          resolve(response);
      }
      catch (error) {
        reject(error)
    }
       
    });
  },
  deleteAddress: (userId, addId) => {
    return new Promise(async(resolve, reject) => {
      try{
        let response =await  db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userId), "Addresses._addId": addId },
          {
            $pull: {
              Addresses: { _addId: addId },
            },
          }
        )
       
          
          resolve(response);
      }
      catch (error) {
        reject(error)
    }
     
    });
  },
  getAllAddresses: () => {
    return new Promise(async (resolve, reject) => {
      try{
        let Address = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .aggregate([
          { $match: { _id: ObjectId(userId), "Addresses._addId": addId } },
          {
            $unwind: "$Addresses",
          },
          {
            $project: {
              Id: "$Addresses._addId",
              Name: "$Addresses.Name",
              Address: "$Addresses.Address",
              Locality: "$Addresses.Locality",
              City: "$Addresses.City",
              Pincode: "$Addresses.Pincode",
              State: "$Addresses.State",
              Mobile: "$Addresses.Mobile",
            },
          },
        ])
        .toArray();

      resolve();
      }
      catch (error) {
        reject(error)
    }
    });
  },
  selectAddress: (Id, userId) => {
    return new Promise(async(resolve, reject) => {
      try{
       await db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userId) },
          {
            $set: {
              currentAddress: Id,
            },
          }
        )
        
          resolve();
      }
      catch (error) {
        reject(error)
    }
        });
   
  },
  getCurrentAddress: (userId, addId) => {
    return new Promise(async (resolve, reject) => {
      try{
        let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(userId), "Addresses._addId": addId });
      // console.log(user,'jbjgdshgjsd.j.kcbdsjgc');
      let addressIndex = user.Addresses.findIndex(
        (address) => address._addId == addId
      );
      resolve(user.Addresses[addressIndex]);
      }
      catch (error) {
        reject(error)
    }
    });
  },
  getAllOrders: () => {
    return new Promise(async (resolve, reject) => {
      try{
        let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find()
        .toArray();
      resolve(orders);
      }
      catch (error) {
        reject(error)
    }
    });
  },
  getSingleOrder: (orderId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let order = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectId(orderId) })
            resolve(order)
        } catch (error) {
            reject(error)
        }

    })
},
  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try{
        let products = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: ObjectId(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              productId: "$products.item",
              quantity: "$products.quantity",
              price: "$totalAmount",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "productId",
              foreignField: "_id",
              as: "orderProducts",
            },
          },
          {
            $unwind: "$orderProducts",
          },
        ])
        .toArray();

      resolve(products);
      }
      catch (error) {
        reject(error)
    }
    });
  },
  generateRazorpay: (orderId, GrandTotal) => {
    return new Promise((resolve, reject) => {
      try {
        var options = {
          amount: GrandTotal * 100,
          currency: "INR",
          receipt: "" + orderId,
        };
        instance.orders.create(options, function (err, order) {
          if (err) {
            console.log(err);
          } else {
            console.log("new order:", order);
            resolve(order);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  },
  verifyPayement: (details) => {
    
    return new Promise((resolve, reject) => {
    
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "Uttm6gRouo5sinS4yjzryjBV");

      hmac.update(
        details["payement[razorpay_order_id]"] +
          "|" +
          details["payement[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      console.log(hmac, "hmacc");
      if (hmac == details["payement[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },
  changePayementStatus: (orderId) => {
    
    return new Promise(async (resolve, reject) => {
     
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(orderId) },
          {
            $set: {
              status: "placed",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  totalUserCount: () => {
    return new Promise(async (resolve, reject) => {
      try{
        let usercount = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find({})
        .toArray();
      resolve(usercount.length);
      }
      catch (error) {
        reject(error)
    }
    });
  },
  totalOrderCount: () => {
    return new Promise(async (resolve, reject) => {
      try{
        let orderCount = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({})
        .toArray();
      resolve(orderCount.length);
      }
      catch (error) {
        reject(error)
    }
    });
  },
  totalDelivered: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let totalDeliveredCount = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .find({ status: "Delivered" })
          .count();
        resolve(totalDeliveredCount);
      } catch (error) {
        reject(error);
      }
    });
  },
  cancelled: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let cancelled = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .find({ status: "Order Cancelled" })
          .count();
        resolve(cancelled);
      } catch (error) {
        reject(error);
      }
    });
  },
  changeStatusCancelled: (orderId) => {
    console.log(orderId);
    return new Promise(async (resolve, reject) => {
      try{
        let changeOrderStatus = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(orderId) },
          { $set: { status: "Order Cancelled", value: false } }
        );
      resolve(changeOrderStatus)
      }
      catch (error) {
        reject(error);
      }
      
    });
  },
  changeStatus: (orderId) => {
    return new Promise(async (resolve, reject) => {
      console.log(orderId, "okhjnjkh");
      try {
        let changeOrderStatus = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: ObjectId(orderId) },
            { $set: { status: "packed" } }
          );
        resolve(changeOrderStatus);
      } catch (error) {
        reject(error);
      }
    });
  },
  changeStatusShipped: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let changeOrderStatus = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: ObjectId(orderId) },
            { $set: { status: "Shipped" } }
          );
        resolve(changeOrderStatus);
      } catch (error) {
        reject(error);
      }
    });
  },
  changeStatusDelivered: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let changeOrderStatus = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: ObjectId(orderId) },
            { $set: { status: "Delivered" } }
          );
        resolve(changeOrderStatus);
      } catch (error) {
        reject(error);
      }
    });
  },
  
   updateUserProfile: (userId, userData) => {

    return new Promise(async (resolve, reject) => {
         try {
            await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {
                $set: {
                    Name: userData.Name
                }
            })
            resolve(response)
        }
        catch (error) {
           reject(error)
         }

    })

},
searchProducts: (key) => {
  return new Promise(async (resolve, reject) => {
      try {
        console.log(key,"key")
        let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({Name:{$regex:key,$options:"i"}}).toArray()
        console.log(products);
          // let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({
          //     $or: [
          //         {
          //             Name: { $regex: key, $options: "i" }
          //         },
          //         {
          //           Category: { $regex: key, $options: "i" }
          //         }
          //     ]
          // }).toArray()
          resolve(products)
      } catch (error) {
          reject(error)
      }
  })
},
}


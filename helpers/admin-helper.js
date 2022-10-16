var db = require("../config/connection");
var collection = require("../config/collection");
const { ObjectId } = require("mongodb");
var objectId = require("mongodb").objectID;
module.exports = {
  // doSignup: (adminData) => {
  //     return new Promise(async (resolve, reject) => {
  //         let admin=await db.get().collection(collection.ADMIN_COLLECTION).findOne({Email:adminData.Email})
  //         if(admin){
  //             reject({adminExist:true})
  //         }else{
  //             adminData.Password = await bcrypt.hash(adminData.Password, 10)

  //          await   db.get().collection(collection.ADMIN_COLLECTION).insertOne(adminData).then((data) => {

  //                 resolve(data.insertedId)
  //             })}

  //     })
  // },

  doadminLogin: (adminData) => {
    
    return new Promise(async (resolve, reject) => {
      try{
        let loginStatus = false;
        let admin={
         Email:process.env.EMAIL,
         Password:process.env.Password

        }
        let response = {};
       
        ;
        if (admin.Email==adminData.Email) {
          if (admin.Password==adminData.Password) {
            console.log("login success");
            response.admin = admin;
            response.status = true;
            resolve(response);
          } else {
            console.log("login failed");
            resolve({ status: false });
          }
        } else {
          console.log("login failed");
          resolve({ status: false });
        }
      }
      catch (error) {
        reject(error)
    }
    });
  },

  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      try{
        let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray();
      resolve(user);
      }
      catch (error) {
        reject(error)
    }
    });
  },
  userBlock: (userId) => {
    return new Promise(async (resolve, reject) => {
      try{
        db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userId) },
          {
            $set: { block: true },
          }
        )
        
          resolve();
      }
     
      catch (error) {
        reject(error)
    }
    });
  },
  userActive: (userId) => {
    return new Promise(async (resolve, reject) => {
      try{
        db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userId) },
          {
            $set: { block: false },
          }
        )
        
          resolve();
      }
      
      catch (error) {
        reject(error)
    }
    });
  },
   
 totalONLINE: () => {
        return new Promise(async (resolve, reject) => {
        try {
         

                let onlineCount = await db.get().collection(collection.ORDER_COLLECTION).find({ payementMethod: "ONLINE", }).count()
                resolve(onlineCount)

       

        } catch (error) {
          reject(error)
        }
    })

    },
totalCOD: () => {
        return new Promise(async (resolve, reject) => {
        try {
           

                let count = await db.get().collection(collection.ORDER_COLLECTION).find({ payementMethod: "COD", }).count()
                resolve(count)

         

        } catch (error) {
          reject(error)
        }
    })
    },
    totalMonthRevenue:()=>{
      return new Promise(async(resolve, reject) => {
        try{
          let today= new Date()
          let before = new Date(today.getTime() - 250 * 24 * 60 * 60 * 1000);
          let monthlysales=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {$match:{
              status:"Delivered",
              date:{
                $gte:before,
                $lte:today
              }
            }
          },
          {$project:{
                _id:0,
                date:1,
                Grandtotal:1
          }
        },{
          $group:{
            _id: {
              date: { $dateToString: { format: "%m-%Y", date: "$date" }
             },
          }
      ,
      monthlysales:{ $sum: "$Grandtotal" },
      
    }
  },
          ]).toArray()
          resolve(monthlysales)
        }
        catch (error) {
          reject(error)
      }

      })
    }
    
};

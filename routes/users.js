const { response, query } = require("express");
var express = require("express");
const categoryHelpers = require("../helpers/category-helpers");
var router = express.Router();
var productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const twilioHelpers = require("../helpers/twilio-helper");
const { localsAsTemplateData } = require("hbs");
const couponHelpers = require("../helpers/coupon-helpers");
 const easyInvoice=require('easyinvoice');
const { getAllCategory } = require("../helpers/category-helpers");

/* GET home page. */
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};

router.get("/", async function (req, res, next) {
  try{
    let users = req.session.user;
  let cartCount = null;
  products = await productHelpers.getAllproducts();
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }

  res.render("user/index", {
    user: true,
    layout: "user-layout",
    users,
    cartCount,
    wishlistCount,
    products,
  });
  } catch (error) {
    console.log(error);
    next(error)
}
  
  // res.send('respond')
});
router.get("/products", async function (req, res) {
  try{
    products = await productHelpers.getAllproducts();
    category = await categoryHelpers.getAllCategory();
    let wishlistCount = null;
    let cartCount = null;
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(req.session.user._id);
    }
    if (req.session.user) {
      wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
    }
  
    res.render("user/products", {
      user: true,
      layout: "user-layout",
      products,
      category,
      cartCount,
      wishlistCount,
      users: req.session.user,
    })
  }
  catch (error) {
    console.log(error);
    next(error)
}
 
});
router.get("/login", (req, res) => {
  try{
    if (req.session.loggedIn) {
      res.redirect("/");
    } else
      res.render("user/login", {
        user: true,
        layout: "user-layout",
        loginErr: req.session.loginErr,
      });
    req.session.loginErr = false;
  }
  catch (error) {
    console.log(error);
    next(error)
}
   
});

router.get("/signup", (req, res) => {
  try{
    res.render("user/signup", { layout: "user-layout" });
  }
  catch (error) {
    console.log(error);
    next(error)
}
});

router.get("/otp", (req, res) => {
  res.render("user/otp", {
    user: true,
    layout: "user-layout",
    loginErr: req.session.loginErr,
  });
});
router.post("/signup",async (req, res) => {
  try{
   let response=await userHelpers.verifyUser(req.body)
      console.log(response);
      if (response.status) {
        req.session.body = req.body;
        console.log(req.session.body);

    let data= await twilioHelpers.doSms(req.body)
          req.session.body = req.body;

          console.log(req.session.body);

          if (data) {
            res.redirect("/otp");
          } else {
            res.redirect("/signup");
          }
        
      } else {
        req.session.signUpErr = "Email already exists";
        res.redirect("/signup");
      }
 

  }
  catch (error) {
    console.log(error);
    next(error)
}
 
}),
  router.post("/otp", async(req, res, next) => {
    try {
    let response= await twilioHelpers.otpVerify(req.body, req.session.body)
        if (response) {
      let response=  await  userHelpers.doSignup(req.session.body)
            res.redirect("/login");
          
        } else {
          req.session.message = "Invalid  OTP";
          res.redirect("/otp");
        }
   
    } catch (error) {
      res.render("/err", { error });
    }
  }),
  router.post("/login",async (req, res) => {
    try{
      let response= await  userHelpers.doLogin(req.body)
      if (response.status) {
        req.session.loggedIn = true;
        req.session.user = response.user;
        res.redirect("/");
      } else {
        req.session.loginErr = true;
        res.redirect("/login");
      }
    }catch (error) {
      res.render("/err", { error });
    }
 
    
  });
router.get("/logout", (req, res) => {
  try{
    req.session.destroy();
  res.redirect("/");
  }catch (error) {
    res.render("/err", { error });
  }
  
});
router.get("/cart", verifyLogin, async (req, res) => {
  try{
    let products = await userHelpers.getCartProducts(req.session.user._id);
  console.log(products);
  let total = await userHelpers.getTotalAmount(req.session.user._id);
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }

  res.render("user/cart", {
    user: true,
    layout: "user-layout",
    products,
    total,
    users: req.session.user,
    wishlistCount,
    cartCount,
  });
  }
  catch (error) {
    res.render("/err", { error });
  }
  
});

router.get("/add-to-cart/:id", verifyLogin,async (req, res) => {
  try{
  let response= await userHelpers.addToCart(req.params.id, req.session.user._id)
      res.json({ status: true });
  
  
  }
  catch (error) {
    res.render("/err", { error });
  }
 
  
});

router.get("/category-product", async (req, res) => {
  try{
    let catId = req.query.category;
  category = await categoryHelpers.getAllCategory();
  console.log(catId);
  let wishlistCount = null;
  if (req.session.user) {
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
  }
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  productHelpers.catProdMatch(catId).then((products) => {
    res.render("user/category-product", {
      user: true,
      layout: "user-layout",
      products,
      users: req.session.user,
      wishlistCount,
      category,
    });
  });
  }
  catch (error) {
    res.render("/err", { error });
  }
  
});
router.get("/single-product/:id", async (req, res) => {
  try{
    pro = req.params.id;
    products = await productHelpers.proDetails(pro);
    let wishlistCount = null;
    if (req.session.user) {
      wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
    }
  
    res.render("user/single-product", {
      user: true,
      layout: "user-layout",
      products,
      users: req.session.user,
      wishlistCount,
    })
  }
  catch (error) {
    res.render("/err", { error });
  }
  
});
router.post("/change-product-quantity",async (req, res, next) => {
  try{
   let response= await userHelpers.changeProductQuantity(req.body)
      response.total = await userHelpers.getTotalAmount(req.body.user);
      res.json(response);
    
  }
  catch (error) {
    res.render("/err", { error });
  }
  
});
router.get("/remove-product/:cartId/:proId",async (req, res) => {
   try{
    cartId = req.params.cartId;
    proId = req.params.proId;
  
   let response= await userHelpers.removeProduct(cartId, proId)
   console.log(response);
      res.json(response);
    
  }
  catch (error) {
    res.render("/err", { error });
  }
  
});

router.get("/place-order", verifyLogin, async (req, res) => {
  console.log(req.body);
  try{
    let total = await userHelpers.getTotalAmount(req.session.user._id);
    userId = req.session.user._id;
    let userAddress = await userHelpers.getAllAddress(userId);
    res.render("user/checkout", {
      user: true,
      layout: "user-layout",
      users: req.session.user,
      total,
      userAddress,
    });
  }
  catch (error) {
    res.render("/err", { error });
  }
 
});

router.post("/place-order", async (req, res) => {
  try{
    if (req.session.coupon) {
      let products = await userHelpers.getCartProductList(req.session.user._id);
      let total = await userHelpers.getTotalAmount(req.session.user._id);
      let user = await userHelpers.getUserDetails(req.session.user._id);
  
      let coupDetails = req.session.coupon;
  
      let Couponname = coupDetails.Couponname;
      let discount = coupDetails.Couponprice;
  
      let address = await userHelpers.getCurrentAddress(
        req.session.user._id,
        user.currentAddress
      );
      userHelpers
        .placeOrder(
          req.body,
          products,
          total,
          req.session.user._id,
          address,
          discount,
          Couponname
        )
        .then((orderId) => {
          if (req.body["payement-method"] == "COD") {
            res.json({ codSuccess: true });
          } else {
            GrandTotal = total - discount;
            userHelpers
              .generateRazorpay(orderId, GrandTotal, discount, Couponname)
              .then((response) => {
                res.json(response);
              });
          }
        });
    } else {
      let products = await userHelpers.getCartProductList(req.session.user._id);
      let total = await userHelpers.getTotalAmount(req.session.user._id);
      let user = await userHelpers.getUserDetails(req.session.user._id);
      let address = await userHelpers.getCurrentAddress(
        req.session.user._id,
        user.currentAddress
      );
      let GrandTotal = total;
      userHelpers
        .placeOrder(req.body, products, total, req.session.user._id, address)
        .then((orderId) => {
          if (req.body["payement-method"] == "COD") {
            res.json({ codSuccess: true });
          } else {
            GrandTotal = total;
            userHelpers.generateRazorpay(orderId, GrandTotal).then((response) => {
              res.json(response);
            });
          }
        });
    }
  }
  catch (error) {
    res.render("/err", { error });
  }
});
// router.get('/checkout-form',(req,res)=>{
//   console.log(req.body,'llkjuhsusfy');
//    userHelpers.singleAddress(req.body)
//   res.json()
// })
router.get("/wishlist", verifyLogin, async (req, res) => {
  try{
    let products = await userHelpers.getWishlistProducts(req.session.user._id);

    let wishlistCount = null;
    if (req.session.user) {
      wishlistCount = await userHelpers.getWishlistCount(req.session.user._id);
    }
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(req.session.user._id);
    }
    res.render("user/wishlist", {
      user: true,
      layout: "user-layout",
      products,
      users: req.session.user,
      wishlistCount,
      cartCount,
    })
  }catch (error) {
    res.render("/err", { error });
  }

});

router.get("/add-to-wishlist/:id", verifyLogin,async (req, res) => {
  try{
   let response= await userHelpers.addToWishlist(req.params.id, req.session.user._id)
      res.json({ status: true });

  }
  catch (error) {
    res.render("/err", { error });
  }

});

router.get("/delete-product/:wishlistId/:proId",async (req, res) => {
  try{
    wishlistId = req.params.wishlistId;
    proId = req.params.proId;
  
   let response=await userHelpers.deleteProduct(wishlistId, proId)
      res.json(response);
  
  }
  catch (error) {
    res.render("/err", { error });
  }
});

router.get("/confirmation", async (req, res) => {
  try{
    let userAddress = await userHelpers.getAllAddress(userId);
    res.render("user/confirmation", {
      user: true,
      layout: "user-layout",
      userAddress,
    });
  }
  catch (error) {
    res.render("/err", { error });
  }
});

router.get("/orders", async (req, res) => {
  try{
    
    // let orders = await userHelpers.getAllOrders();
    let orders = await userHelpers. getUserOrders(req.session.user._id);
    console.log(orders,' let single =');
   
    res.render("user/orders", { user: true, layout: "user-layout", orders});
  }
  catch (error) {
    res.render("/err", { error });
  }
});
router.get("/view-orders/:id", async (req, res) => {
  try{
    let orderId = req.params.id;
    console.log(orderId);
    let products = await userHelpers.getOrderProducts(orderId);
    console.log(products);
    res.render("user/view-orders", {
      user: true,
      layout: "user-layout",
      products,
    });
  }
  catch (error) {
    res.render("/err", { error });
  }
});

router.post("/AddAddress", verifyLogin,async (req, res) => {
  try{
    let userId = req.session.user._id;
   await userHelpers.addAddress(req.body, userId)
      // req.session.user=response
      // req.session.user.loggedIn=true
      res.redirect("/user-address");
   
  }
  catch (error) {
    res.render("/err", { error });
  }
});
router.post("/AddAddresscheckout", verifyLogin,async (req, res) => {
  try{
    let userId = req.session.user._id;
    await userHelpers.addAddress(req.body, userId)
      // req.session.user=response
      // req.session.user.loggedIn=true
      res.redirect("/place-order");
    
  }
  catch (error) {
    res.render("/err", { error });
  }
});

router.get("/user-address", verifyLogin, async function (req, res) {
  try{
    user = req.session.user;
    userId = req.session.user._id;
    let userDetails=null
    if(user){
       userDetails=await userHelpers.getUserDetails(userId)
    }
    let userAddress = await userHelpers.getAllAddress(userId);
  
    // let userSignUpDetails=await userHelpers.getUserDetails(userId)
    // console.log(userSignUpDetails,"dgsdgsdgsdfgsdf");
    res.render("user/user-address", {
      user: true,
      layout: "user-layout",
      user,userDetails,
      userAddress,
      users: req.session.user,
    });
  }
  catch (error) {
    res.render("/err", { error });
  }
 
});

router.get("/user-profile", verifyLogin, async function (req, res) {
  try{
    user = req.session.user;
    userId = req.session.user._id;
    let userDetails=null
    if(user){
       userDetails=await userHelpers.getUserDetails(userId)
    }
    // let userAddress=await userHelpers.getAllAddress(userId)
    // console.log(userAddress,"kikikiki");
   
    // console.log(userSignUpDetails,"dgsdgsdgsdfgsdf");
    res.render("user/user-profile", {
      user: true,
      layout: "user-layout",
      user,userDetails,
      users: req.session.user,
    });
  }
  catch (error) {
    res.render("/err", { error });
  }
 
});
router.post ("/edit-profile/:id", async (req, res, next) => {
   try {
    
      await userHelpers.updateUserProfile(req.params.id, req.body)
      console.log(req.params.id, req.body,'dcnksabhjvgtfdsxrscfygwhjxdk');
      res.redirect('/user-profile')
  } 
  catch (error) {
    res.render("/err", { error });
  }
});

router.post("/edit-address",async (req, res) => {
  try{
  let response= await userHelpers.editAddress(req.body)
      res.json(response);
    
  }
  catch (error) {
    res.render("/err", { error });
  }
  
});

router.post("/delete-address/:id",async (req, res) => {
try{
   let response=await userHelpers
  .deleteAddress(req.session.user._id, req.params.id)
  
    res.json(response);
  }
  catch (error) {
    res.render("/err", { error });
  }

   
});

router.post("/select-address/:id", async(req, res) => {
  try{
   await userHelpers
    .selectAddress(req.params.id, req.session.user._id)
    
  res.json({ status: true });
  }
  catch (error) {
    res.render("/err", { error });
  }

});

router.post("/verify-payement", (req, res) => {
  userHelpers
    .verifyPayement(req.body)
    .then((response) => {
      console.log(response, "datas");
      userHelpers
        .changePayementStatus(req.body["order[receipt]"])
        .then((response) => {
          res.json({ status: true });
        });
    })
    .catch((err) => {
      res.json({ status: false });
    });
});
router.get('/invoice/:id',async (req, res) => {
  try{
    let products = await userHelpers.getOrderProducts(req.params.id)
    let order = await userHelpers.getSingleOrder(req.params.id)
    console.log(products,order);
res.render('user/invoice',{  user: true, layout: "user-layout",
products,order
})
  }
  catch (error) {
    res.render("/err", { error });
  } 

})
router.post("/apply-coupon", async(req, res) => {
 try{
  let response=await couponHelpers.getAllCoupon(req.body)
 
    if (response.Couponname) {
      req.session.coupon = response;
    }
    
    res.json(response);
 }
 catch (error) {
  console.log(error);
  next(error)
}
  
});
router.get("/item-cancelled/:id", async (req, res) => {
  try{
    orderId = req.params.id;
 
  await userHelpers.changeStatusCancelled(orderId)
    
    res.redirect("/view-orders/" + orderId);
  }
  catch (error) {
    console.log(error);
    next(error)
  }

});
router.get('/search-products', async (req, res, next) => {
  try {
    //let product=req.body
      let key = req.query.productSearch
      console.log(key,"now")
      let category=await categoryHelpers.getAllCategory()
       await userHelpers.searchProducts(key).then(async(searchedProducts)=>{
       

          console.log(products,"filter")
          res.render('user/search-products',{user:true,layout:'user-layout',searchedProducts,category})
        

      })
  } catch (error) {
      next(error)
  }

}),


  (module.exports = router);

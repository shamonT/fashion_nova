var express = require("express");
var router = express.Router();
const store = require("../middleware/multer");
var productHelpers = require("../helpers/product-helpers");
const categoryHelpers = require("../helpers/category-helpers");
const adminHelpers = require("../helpers/admin-helper");
const userHelpers = require("../helpers/user-helpers");
const couponHelpers = require("../helpers/coupon-helpers");

/* GET home page. */

const verifyLog = (req, res, next) => {
  if (req.session.adminLogIn) {
    next();
  } else {
    res.render("admin/admin-login", { loginErr: req.session.adminLoginErr });
    req.session.adminloginErr = false;
  }
};
router.get("/", verifyLog, (req, res, next) => {
  try{
    if (req.session.adminLogIn) {
      res.redirect("/admin/login");
    } else {
      res.render("admin/admin-login", { loginErr: req.session.adminLoginErr });
    }
    req.session.adminLoginErr = false;
  }
  catch (error) {
    console.log("Error loading login page of admin")
    next(error)
}
});

router.post("/",async (req, res) => {
  try{
    let response= await adminHelpers.doadminLogin(req.body)
    
    if (response.status) {
      req.session.adminLogIn = true;
      req.session.admin = response.admin;
      res.redirect("/admin/login");
    } else {
      req.session.adminLoginErr = true;
      res.redirect("/admin/admin-login");
    }
  }
  catch (error) {
    console.log(error);
    next(error)
}
  
});

router.get("/login", verifyLog, async (req, res) => {
  try{
    let userCount = await userHelpers.totalUserCount();
    let orderCount = await userHelpers.totalOrderCount();
    let totalDelivered = await userHelpers.totalDelivered();
    let cancelled = await userHelpers.cancelled();
    let codCount = await adminHelpers.totalCOD()
      let ONLINECount = await adminHelpers.totalONLINE()
      let monthCount= await adminHelpers.totalMonthRevenue()
      
    res.render("admin/index", {
      admin: true,
      layout: "admin-layout",
      userCount,
      orderCount,
      totalDelivered,
      cancelled,
      codCount,
      ONLINECount,
      monthCount
     
    });
  }
  catch (error) {
    console.log(error);
    next(error)
}
});
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
});

router.get("/view-products",async function (req, res) {
  try{
    let products= await productHelpers.getAllproducts()
    console.log("brrrrrr");
    console.log(products);
    res.render("admin/view-products", {
      admin: true,
      layout: "admin-layout",
      products,
    });
  }
 
  catch (error) {
    console.log(error);
    next(error)
}
});

router.get("/add-products", async function (req, res) {
  try{
    category = await categoryHelpers.getAllCategory();
  res.render("admin/add-products", {
    admin: true,
    layout: "admin-layout",
    category,
  });
  }
  catch (error) {
    console.log(error)
    next(error)
}
});

router.post("/uploadmultiple", store.array("Image", 3),async (req, res, next) => {
 try{
  const files = req.files;
  if (!files) {
    const error = new Error("please choose files");
    error.httpStatusCode = 400;
    return next(error);
  }
  const Images = [];
  console.log(req.files.length);
  for (i = 0; i < req.files.length; i++) {
    Images[i] = req.files[i].filename;
  }
  req.body.Image = Images;
  // res.json(files)

   await productHelpers.addProduct(req.body)
    res.redirect("/admin/add-products");
 }
 catch (error) {
  console.log(error)
  next(error)
}
  });

router.get("/delete-product/:id",async (req, res) => {
  try{
    let proId = req.params.id;
   await productHelpers.deleteProduct(proId)
    res.redirect("/admin/view-products");

  }
  catch (error) {
    console.log(error)
    next(error)
  }
});
router.get("/edit-products/:id", async (req, res) => {
  try{
    category = await categoryHelpers.getAllCategory();
    let product = await productHelpers.getProductDetails(req.params.id);
    console.log(product, "hiii");
    res.render("admin/edit-products", {
      admin: true,
      layout: "admin-layout",
      product,
      category,
    });
  }
  catch (error) {
    console.log(error)
    next(error)
  }
});
router.post(
  "/edit-products/:id",
  store.array("Image", 3),
  async (req, res, next) => {
    

    try {
      let id = req.params.id;
      const editImg = [];
      for (i = 0; i < req.files.length; i++) {
        editImg[i] = req.files[i].filename;
      }
      req.body.Image = editImg;
      var oldImage = await productHelpers.updateProduct(id, req.body);
      if (oldImage) {
        for (i = 0; i < oldImage.length; i++) {
          var oldImagePath = path.join(
            __dirname,
            "../public/uploads" + oldImage[i]
          );
          fs.unlink(oldImagePath, function (err) {
            if (err) return;
          });
        }
      }
      res.redirect("/admin/view-products");
    } catch (error) {
      console.log(error);
      res.redirect("/admin/view-products");
    }
  }
);
router.get("/add-category", function (req, res) {
  try{
    res.render("admin/add-category", { admin: true, layout: "admin-layout" });
  }
  catch (error) {
    console.log(error)
    next(error)
  }
 
});

router.get("/view-category",async function (req, res) {
 try{
  let category= await categoryHelpers.getAllCategory()
    let message = req.session.message;
    res.render("admin/view-category", {
      admin: true,
      layout: "admin-layout",
      category,
      message,
    });
 } catch (error) {
  console.log(error)
  next(error)
}

});
router.post("/add-category",async (req, res) => {
  try{
    let response=await categoryHelpers.addCategory(req.body)
    if (response.catExist) {
      
      req.session.message = "category Exist";
      res.redirect("/admin/view-category");
    } else {
      req.session.message = null;
      
      res.redirect("/admin/view-category");
    }
  }
  catch (error) {
    console.log(error)
    next(error)
  }
  });


router.get("/delete-category/:id", async(req, res) => {
  try{
    let catId = req.params.id;
   await categoryHelpers.deleteCategory(catId)
      res.redirect("/admin/view-category");
   
  }
  catch (error) {
    console.log(error)
    next(error)
  }
});

router.get("/user-management", async(req, res) => {
try{
  let user= await adminHelpers.getAllUsers()
  res.render("admin/user-management", {
    admin: true,
    layout: "admin-layout",
    user,
  });
}
catch (error) {
  console.log(error)
  next(error)
}
});

router.get("/user-block/:id", async (req, res) => {
try{
  let userId = req.params.id;
  
 
  await adminHelpers.userBlock(userId)
     res.redirect("/admin/user-management");
}
 
catch (error) {
  console.log(error)
  next(error)
}
});
router.get("/user-active/:id",async (req, res) => {
  try{
    let userId = req.params.id;
  
 
  await  adminHelpers.userActive(userId)
      res.redirect("/admin/user-management");
  }
 
  catch (error) {
    console.log(error)
    next(error)
  }
});
router.get("/view-coupon",async function (req, res) {
  try{
  let coupon=  await couponHelpers.getCoupon()
      res.render("admin/view-coupon", {
        admin: true,
        coupon,
        layout: "admin-layout",
      });
   
  }
  catch (error) {
    console.log(error)
    next(error)
  }
});

router.get("/add-coupon", function (req, res) {
  try{
    res.render("admin/add-coupon", { admin: true, layout: "admin-layout" });
  }
  catch (error) {
    console.log(error)
    next(error)
  }
});
router.post("/add-coupon", async (req, res) => {
  try{
   await couponHelpers.addCoupon(req.body)
    res.redirect("/admin/view-coupon");
  }
  catch (error) {
    console.log(error)
    next(error)
  }
 
});
router.get("/delete-coupon/:id", async (req, res) => {
  try{
    let coupId = req.params.id;
   await couponHelpers.deleteCoupon(coupId)
      res.redirect("/admin/view-coupon");
  }
  catch (error) {
    console.log(error)
    next(error)
  }

});
router.get("/view-orders", async (req, res) => {
  try{
    let orders = await userHelpers.getAllOrders();
    res.render("admin/view-orders", {
      admin: true,
      layout: "admin-layout",
      orders,
    });
  }
  catch (error) {
    console.log(error)
    next(error)
  }
 
});
router.get("/view-order-products/:id", async (req, res) => {
  try{
    let orderId = req.params.id;
  
    let singleproducts = await userHelpers.getOrderProducts(orderId);
    console.log(singleproducts);
    res.render("admin/view-order-products", {
      admin: true,
      layout: "admin-layout",
      singleproducts,
    });
  }
  catch (error) {
    console.log(error)
    next(error)
  }
});
router.get("/item-packed/:id", async (req, res, next) => {
  try {
    orderId = req.params.id;

    changeStatusPacked = userHelpers.changeStatus(orderId);
    res.redirect("/admin/view-orders");
  } catch (error) {
    next(error);
  }
}),
  router.get("/item-shipped/:id", async (req, res, next) => {
    try {
      orderId = req.params.id;
      changeStatusShipped = userHelpers.changeStatusShipped(orderId);
      res.redirect("/admin/view-orders");
    } catch (error) {
      next(error);
    }
  });
router.get("/item-delivered/:id", async (req, res, next) => {
  try {
    orderId = req.params.id;
    changeStatusDelivered = userHelpers.changeStatusDelivered(orderId);
    res.redirect("/admin/view-orders");
  } catch (error) {
    next(error);
  }
});

router.use(function (req, res, next) {
  next(createError(404));
});

router.use(function (err, req, res, next) {
  console.log("admin error route handler")
  res.status(err.status || 500);
  res.render('admin/admin-error', { layout: 'admin-layout' });
});


module.exports = router;

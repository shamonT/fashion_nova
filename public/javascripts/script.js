// const { response } = require("express")

// const { response } = require("express");

function addToCart(proId) {
  $.ajax({
    url: '/add-to-cart/' + proId,
    method: 'get',
    success: (response) => {
      if (response.status) {
        let count = $('#cart-count').html()
        count = parseInt(count) + 1
        $('#cart-count').html(count)
        $("#myDiv").load(location.href + " #myDiv");
      }
      Swal.fire('Hooray!', 'product added successfully',
      'success')
    setTimeout(() => { location.reload() }, 2000)

      

    }
  })
}

function addToWishlist(proId) {
  $.ajax({
    url: '/add-to-wishlist/' + proId,
    method: 'get',
    success: (response) => {
      if (response.status) {
        let count = $('#wishlist-count').html()
        count = parseInt(count) + 1
        $('#cart-count').html(count)
        $("#myDiv").load(location.href + " #myDiv");
      }

      Swal.fire('Hooray!', 'product added successfully',
      'success')
    setTimeout(() => { location.reload() }, 2000)
      // alert(response)

      // Swal.fire({
      //     position: 'top-end',
      //     icon: 'success',
      //     title: 'Your work has been saved',
      //     showConfirmButton: false,
      //     timer: 1500
      //   })

     

    }
  })
}






// data:{
//     cart:cartId,
//     products:proId,


//       },
//       method:'post',
//       success:(response)=>{
//         if(response){
//           alert(response)
//            $("#myDiv").load(location.href + " #myDiv");
//            location.reload()
//         }else{
//           $("#myDiv").load(location.href + " #myDiv");
//         }



//       }

//   })

// }
function removeProduct(cartId, proId) {
  $.ajax({
    url: '/remove-product/' + cartId + '/' + proId,
    method: 'get',
    success: (response) => {
      if (response.removeProduct) {
        Swal.fire('Hooray!', ' removed successfully',
        'success')
      setTimeout(() => { location.reload() }, 2000)
        $("#myDiv").load(location.href + " #myDiv");
      }
    }
  })
}

function deleteProduct(wishlistId, proId) {
  $.ajax({
    url: '/delete-product/' + wishlistId + '/' + proId,
    method: 'get',
    success: (response) => {
      if (response.deleteProduct) {
      
        Swal.fire('Hooray!', ' deleted successfully',
        'success')
      setTimeout(() => { location.reload() }, 2000)
        $("#myDiv").load(location.href + " #myDiv");
        $("#wish").load(location.href + " #wish");
      }
    }
  })
}


// DATA TABLES
$(document).ready(function() {
    $('#productsTable').DataTable();
});



// User Add to Cart
function addToCart(proID){
    $.ajax({
        url:'/add-to-cart/'+ proID,
        method: 'get',
        success:(res)=>{
            if (res) {
                 let count = $('#cart-count').html()
                 count=parseInt(count)+1
                 $('#cart-count').html(count)
             }
        }
    })
}
// Contact Form
$('#message4').css('display', 'none')
function contactForm(user) {

    $('#message4').css('display', 'block')
    $('#message4').html("Hi " +user +", Contact form currently disabled")
}
function changeQuantity(cartId,proId,userId,count){
    let quantity=parseInt(document.getElementById(proId).innerHTML)
    count=parseInt(count)

        $.ajax({
            url:'/change-product-quantity',
            data:{
                user:userId,
                cart:cartId,
                product:proId,
                count:count,
                quantity:quantity
            },
            method:'post',
            success:(res)=>{
            if (res.removeProduct) {
            alert("Product Removed from cart")
            location.reload()
            } else {
                document.getElementById(proId).innerHTML=quantity+count
                document.getElementById('totalAmount').innerHTML=res.totalAmount 
                document.getElementById('finalAmount').innerHTML=res.finalAmt 
            }
        }
            })
    }
$('#message6').css('display', 'none')
function removeItemCart(proID){
    $.ajax({
        url:'/remove-item',
        data:{
            proId:proID
        },
        method:'post',
        success:(res)=>{

            if(res.status) {
                location.href='/cart'
                $('#message6').css('display', 'block')
                $('#message6').html('Item Removed' )

            } else {
                alert("Error removing Item")
            }
        }
    })
}
$('#message5').css('display', 'none')
// Place order scripts
$("#checkout-form").submit((e)=>{
    e.preventDefault()
    $.ajax({
        url:'/orders/payment/place-order',
        method:'post',
        data:$('#checkout-form').serialize(),
        success:(res)=>{

            if (res.status){
                
                alert('Order Placed successfully')
                $('#orders').fadeOut();
                $('#message5').css('display', 'block')
                $('#message5').html('Order Placed')
                setTimeout(location.href='/orders', 2000)
                
            } else {
                razorpayment(res.response, res.user)
            }
        }
    })
})

function razorpayment(order, user){
    var options = {
        "key": "RAZORPAY_KEY", 
        "amount": order.amount, 
        "currency": "INR",
        "name": "MYKART Shopping",
        "description": "Test Transaction",
        "image": "/images/body/mykartSqr.jpg",
        "order_id": order.id, 
        "handler": function (response){

            verifyPayment(response,order)
        },
        "prefill": {
            "name": user.fname,
            "email": user.email,
            "contact": user.phone
        },
        "notes": {
            "address": "MY KART "
        },
        "theme": {
            "color": "#3399cc"
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.open();
}
$('#message4').css('display', 'none')
function verifyPayment(payment, order){

    $.ajax({
        url:'/orders/verify-payment',
        data:{
            payment,
            order
        },
        method:'post',
        success:(res)=>{

            if (res.status){
                location.href='/orders'
                $('#message5').css('display', 'block')
                setTimeout(5000)
                $('#message5').html('<strong>Success</strong> Order PLaced')
                
            } else {
                location.href='/orders'
                $('#message4').css('display', 'block')
                alert('Payment failed')
                $('#message4').html('Payment Failed Please try again' )
               
            }
        }
    })
}

function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        
        reader.onload = function (e) {
            $('#uploadedImg').attr('src', e.target.result);
        }
        
        reader.readAsDataURL(input.files[0]);
    }
}

$("#imgInput").change(function(){
    readURL(this);
});

// Change Item delivery status
function changeStatus(orderId){
    $.ajax({
        url:'/admin/change-order-status',
        data:{order:orderId},
        method:'post',
        success:(res)=>{
            

        if (res.orderStatus) {
 
            document.getElementById(orderId).innerHTML='Shipped' 
               
        } 
    }
        })
}

function cancelOrder(order){
    $.ajax({
        url:'/admin/cancel-order',
        data:{orderId:order},
        method:'post',
        success:(res)=>{
            location.href='/admin/order-list'

            if (res.cancelStatus)  {
                $(orderId).html('Cancelled')
            }
        }
    })
}
// $(document).ready(function(){
//     $("#wishlist").click(function(){
//       $("p").hide();
//     });
$('#wishlist').css("display", "none") 
$('#message1').css("display", "none") 

function addToWish(proId){
    console.log(proId)
    $('#wishlist').css("display", "block") 
    $.ajax({
        type: 'POST',
        url: '/add-to-wish/', 
        data:proId,
        success: (result) =>{

          if(result.wishStatus) {
            let count = $('#wish-count').html()
            count=parseInt(count)+1
            $('#wish-count').html(count)
            $('#message1').css("display", "block") 
            $('#wishlist').css("display", "block") 
            $('#message1').html("<a href='/wish-list'> See Wish List</a>")
            
          }     
          else if(result.status) {
            let count = $('#wish-count').html()
            count=parseInt(count)+1
            $('#wish-count').html(count)
            $('#message1').css("display", "block")
            $('#message1').html('Added to wishlist see<a href="/wish-list">  Wish List</a>')
           }
           else {
            $('#message1').css("display", "block")
            $('#message1').html("Item Already Exists <a href='/wish-list'> See Wish List</a>")
           }
         
            
        }
    });

}
$('#message3').css("display","none") 
function removeItemWish(proId){
    console.log(proId)
    $.ajax({
        type: 'POST',
        url: '/remove-wishlist-item/', 
        data: proId,
        success: (result) =>{
            if(result){
                $('#message3').css("display","block") 
                $('#message3').html('Removed from Wish List')
                setTimeout( location.reload(),
                                 1000)
               
            }
            else {
                $('#message2').html('Error Try Again')
            }

        } 
        })
    }
function addToCartFromWish(proID){
        $.ajax({
            url:'/add-to-cartFromWish/'+ proID,
            method: 'get',
            success:(res)=>{
                console.log(res)
                if (res) {
                     let count = $('#cart-count').html()
                     count=parseInt(count)+1
                     $('#cart-count').html(count)
                     if(res.status) {
                        $('#message3').css("display","block") 
                        $('#message3').html('Item Added to the Cart')
                        setTimeout( location.reload(),
                        1700)
                     }

                 }
            }
        })
    }
    
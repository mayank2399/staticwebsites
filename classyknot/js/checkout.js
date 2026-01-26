import { fetchCart } from './cart.js';
import { beUrl as BASE_URL } from './constant.js';


let selectedAddressId = null;
let totalAmount = 0;

const placeOrderButton = document.getElementById("placeOrder");
placeOrderButton.addEventListener("click", () => {
  placeOrder();

});


const checkoutType = localStorage.getItem("checkoutType");
// "BUY_NOW" or "CART"

// ---------------- AUTH HEADER ----------------
function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + localStorage.getItem("token")
  };
}

// ---------------- LOAD ADDRESSES ----------------
function loadAddresses() {
  fetch(`${BASE_URL}api/addresses`, {
    headers: authHeaders()
  })
    .then(res => res.json())
    .then(addresses => {
      const list = document.getElementById("addressList");
      list.innerHTML = "";

      addresses.forEach(addr => {
        const div = document.createElement("div");
        div.className = "address";
        div.innerHTML = `
          <input type="radio" name="address"
            ${addr.isDefault ? "checked" : ""}
            onclick="selectAddress(${addr.id})">
          <strong>${addr.name}</strong><br>
          ${addr.addressLine1}, ${addr.city}, ${addr.state} - ${addr.pincode}
        `;
        list.appendChild(div);

        if (addr.isDefault) selectedAddressId = addr.id;
      });
    });
}

function selectAddress(id) {
  selectedAddressId = id;
}

// ---------------- LOAD ITEMS ----------------
async function loadItems() {
  if (checkoutType === "BUY_NOW") {
    loadBuyNowItem();
  } else {
    const cart = await fetchCart();
    console.log(cart);
    renderItems(cart);
  }
}

// ---------------- CART CHECKOUT ----------------
// function loadCartItems() {
//   fetch(`${BASE_URL}/cart`, {
//     headers: authHeaders()
//   })
//     .then(res => res.json())
//     .then(cart => renderItems(cart));
// }

// ---------------- BUY NOW CHECKOUT ----------------
function loadBuyNowItem() {
  const productId = localStorage.getItem("buyNowProductId");
  const quantity = Number(localStorage.getItem("buyNowQuantity"));
  fetch(`${BASE_URL}api/products/${productId}`)
    .then(res => res.json())
    .then(product => {
      renderItems([{
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: quantity
      }]);
    });
}

// ---------------- RENDER ITEMS ----------------
function renderItems(items) {
  console.log(items)
  const itemsDiv = document.getElementById("cartItems");
  itemsDiv.innerHTML = "";
  totalAmount = 0;

  items.forEach(item => {
    const itemTotal = item.price * item.quantity;
    totalAmount += itemTotal;

    itemsDiv.innerHTML += `
      <div class="cart-item">
        <span>${item.name} × ${item.quantity}</span>
        <span>₹${itemTotal}</span>
      </div>
    `;
  });

  document.getElementById("totalAmount").innerText = totalAmount;
}

// ---------------- PLACE ORDER ----------------
async function placeOrder() {
  if (!selectedAddressId) {
    alert("Please select an address");
    return;
  }

  // BUY NOW → add item to cart temporarily
  if (checkoutType === "BUY_NOW") {
    await addBuyNowToCart();
  }

  createOrder();
}

// ---------------- ADD BUY NOW ITEM TO CART ----------------
function addBuyNowToCart() {
  return fetch(`${BASE_URL}api/cart/add`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      productId: localStorage.getItem("buyNowProductId"),
      quantity: localStorage.getItem("buyNowQuantity")
    })
  });
}

// ---------------- CREATE ORDER ----------------
function createOrder() {
  fetch(`${BASE_URL}api/orders/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      addressId: selectedAddressId
    })
  })
    .then(res => res.json())
    .then(order => initiatePayment(order.orderId));
}

// ---------------- PAYMENT ----------------
function initiatePayment(orderId) {
  fetch(`${BASE_URL}api/payments/initiate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      orderId: orderId,
      paymentMode: "UPI"
    })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      setTimeout(() => {
  alert("Done! Redirecting to home page ...");
        window.location.href = "https://mayank2399.github.io/staticwebsites/classyknot/";
      }, 5000);


    })
  // .then(payment => confirmPayment(orderId, payment.paymentId));
}

function confirmPayment(orderId, paymentId) {
  fetch(`${BASE_URL}api/payments/confirm`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      orderId,
      paymentId
    })
  })
    .then(() => {
      clearBuyNowState();
      alert("Payment Successful 🎉");
      window.location.href = "orders.html";
    });
}

// ---------------- CLEANUP ----------------
function clearBuyNowState() {
  localStorage.removeItem("checkoutType");
  localStorage.removeItem("buyNowProductId");
  localStorage.removeItem("buyNowQuantity");
}

// ---------------- INIT ----------------
loadAddresses();
loadItems();

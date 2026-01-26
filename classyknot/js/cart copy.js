import { beUrl } from './constant.js';
export async function fetchCart() {
  const token = localStorage.getItem("token");
  let cart;


  if (!token) {
    // No token, get cart from localStorage
    cart = JSON.parse(localStorage.getItem("cart")) || [];
  } else {
    try {
      const url = new URL(beUrl + 'api/cart');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // response.json() already returns an object
      cart = await response.json();

      // Optional: ensure it's an array
      if (!Array.isArray(cart)) {
        cart = [];
      }

    } catch (err) {
      cart = [];
    }
  }

  return cart;
}


export function updateCartCount(cart) {
  const cartCount = document.getElementById("cart-count");


  console.log(cart)
  let totalquantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.innerText = totalquantity;
}

export async function saveCart(cart, item) {
  const token = localStorage.getItem("token");

  localStorage.setItem("cart", JSON.stringify(cart));
  if (token) {
    try {
      const url = beUrl + 'api/cart/update';

      const body =JSON.stringify({
          productId: item.productId,
          quantity: item.quantity
        });
      console.log(url)
      console.log(body)
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: body
      });

      // Parse response


    } catch (err) {
      throw err; // rethrow so caller can handle
    }
    cart = await fetchCart();
  }
  console.log(cart)
  updateCartCount(cart);
}


export async function displayCart(url) {
  const cart = await fetchCart();

  updateCartCount(cart);
  const cartContainer = document.getElementById("cart-container");
  if (!cartContainer) return;
  const totalAmountEl = document.getElementById("total-amount");

  cartContainer.innerHTML = "<h2>Your Cart</h2>";

  if (cart.length === 0) {
    cartContainer.innerHTML += "<p>Your cart is empty.</p>";
    totalAmountEl.innerText = "Total: ₹0";
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    total += item.price * item.quantity;

    const div = document.createElement("div");
    div.className = "cart-item";

    div.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-details">
        <h3>${item.name}</h3>
        <p>₹${item.price}</p>
      </div>
      <div class="cart-controls">
        <button class="decrease">-</button>
        <span class="qty">${item.quantity}</span>
        <button class="increase">+</button>
        <button class="remove-btn">Remove</button>
      </div>
    `;

    // Increase quantity
    div.querySelector(".increase").addEventListener("click", () => {
      item.quantity++;
      saveCart(cart, item);
      displayCart();
    });

    // Decrease quantity
    div.querySelector(".decrease").addEventListener("click", () => {
      item.quantity--;
      if (item.quantity <= 0) {
        cart.splice(index, 1);
      }
      saveCart(cart, item);
      displayCart();
    });

    // Remove button
    div.querySelector(".remove-btn").addEventListener("click", () => {
      cart.splice(index, 1);
      saveCart(cart, item);
      displayCart();
    });

    cartContainer.appendChild(div);
  });

  totalAmountEl.innerText = `Total: ₹${total}`;
}



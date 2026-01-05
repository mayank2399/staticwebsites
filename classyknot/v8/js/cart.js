const cartContainer = document.getElementById("cart-container");
const totalAmountEl = document.getElementById("total-amount");
const cartCount = document.getElementById("cart-count");

let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Save cart to localStorage
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

// Update navbar cart count
function updateCartCount() {
  let totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCount.innerText = totalQty;
}

// Display cart items
function displayCart() {
  cartContainer.innerHTML = "<h2>Your Cart</h2>";

  if (cart.length === 0) {
    cartContainer.innerHTML += "<p>Your cart is empty.</p>";
    totalAmountEl.innerText = "Total: ₹0";
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    total += item.price * item.qty;

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
        <span class="qty">${item.qty}</span>
        <button class="increase">+</button>
        <button class="remove-btn">Remove</button>
      </div>
    `;

    // Increase quantity
    div.querySelector(".increase").addEventListener("click", () => {
      item.qty++;
      saveCart();
      displayCart();
    });

    // Decrease quantity
    div.querySelector(".decrease").addEventListener("click", () => {
      item.qty--;
      if (item.qty <= 0) {
        cart.splice(index, 1);
      }
      saveCart();
      displayCart();
    });

    // Remove button
    div.querySelector(".remove-btn").addEventListener("click", () => {
      cart.splice(index, 1);
      saveCart();
      displayCart();
    });

    cartContainer.appendChild(div);
  });

  totalAmountEl.innerText = `Total: ₹${total}`;
}

updateCartCount();
displayCart();

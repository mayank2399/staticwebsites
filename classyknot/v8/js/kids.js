
let menProducts = [];
// Sample static products for home page
// Load data from JSON file
fetch("products.json")
  .then(response => response.json())
  .then(data => {
    menProducts = data.filter(product => product.tag === "kids");
    displayProducts();
  })
  .catch(error => console.error("Error loading products:", error));


const container = document.getElementById("men-products");
const cartCount = document.getElementById("cart-count");

let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Update cart count
function updateCartCount() {
  let totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCount.innerText = totalQty;
}

// Save cart to localStorage
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

// Render products
function displayProducts() {
  container.innerHTML = ""; // clear container
  menProducts.forEach(product => {
    const card = document.createElement("div");
    card.className = "card";

    // Check if product is already in cart
    const inCart = cart.find(item => item.id === product.id);

    card.innerHTML = `
      <img src="${product.image}">
      <h3>${product.name}</h3>
      <p class="price">₹${product.price}</p>
      <div class="cart-controls">
        ${inCart ? `
          <button class="decrease">-</button>
          <span class="qty">${inCart.qty}</span>
          <button class="increase">+</button>
        ` : `<button class="add-btn">Add to Cart</button>`}
      </div>
    `;

    // Event Listeners
    if (inCart) {
      card.querySelector(".increase").addEventListener("click", () => {
        inCart.qty++;
        saveCart();
        displayProducts();
      });
      card.querySelector(".decrease").addEventListener("click", () => {
        inCart.qty--;
        if (inCart.qty <= 0) {
          cart = cart.filter(item => item.id !== inCart.id);
        }
        saveCart();
        displayProducts();
      });
    } else {
      card.querySelector(".add-btn").addEventListener("click", () => {
        cart.push({ ...product, qty: 1 });
        saveCart();
        displayProducts();
      });
    }

    container.appendChild(card);
  });
}

displayProducts();
updateCartCount();

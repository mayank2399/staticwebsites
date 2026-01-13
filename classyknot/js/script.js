
let navbar = document.getElementById("navbar");
navbar.innerHTML = `
 <h1 class="logo">
            <a href="index.html">
                <img src="assets/logo.png" alt="StyleStore" height="35">
            </a>
        </h1>
        <ul>
            <li><a href="index.html">Home</a></li>
            <li><a href="men.html">Men</a></li>
            <li><a href="women.html">Women</a></li>
            <li><a href="kids.html">Kids</a></li>
            <li><a href="cart.html">Cart (<span id="cart-count">0</span>)</a></li>
        </ul>
`;

let footer = document.getElementById("footer");
footer.innerHTML = `
<div class="footer-container">

            <div class="footer-col">
                <h4>Online Shopping</h4>
                <ul>
                    <li>Men</li>
                    <li>Women</li>
                    <li>Kids</li>
                    <li>Footwear</li>
                    <li>Accessories</li>
                </ul>
            </div>

            <div class="footer-col">
                <h4>Customer Policies</h4>
                <ul>
                    <li>Contact Us</li>
                    <li>FAQ</li>
                    <li>Terms of Use</li>
                    <li>Privacy Policy</li>
                </ul>
            </div>

            <div class="footer-col">
                <h4>Experience App</h4>
                <p>Coming soon on Android & iOS</p>
            </div>

            <div class="footer-col">
                <h4>Keep in Touch</h4>
                <p>Facebook | Instagram | Twitter</p>
            </div>

        </div>

        <div class="footer-bottom">
            © 2026 StyleStore. All rights reserved.
        </div>
`;


let homeProducts = [];
// Sample static products for home page
// Load data from JSON file
fetch("products.json")
  .then(response => response.json())
  .then(data => {
    // 'data' is now your array of products
    homeProducts = data; // assign to your variable
    displayProducts();    // render products
  })
  .catch(error => console.error("Error loading products:", error));


const container = document.getElementById("home-products");
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
  container.innerHTML = "";
  
  homeProducts.forEach(product => {
    const card = document.createElement("div");
    card.className = "card";

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

    // Add event listeners
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

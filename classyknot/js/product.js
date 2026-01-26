import { fetchCart, updateCartCount, saveCart } from './cart.js';

let homeProducts = [];

const container = document.getElementById("home-products");





function fetchProducts(beUrl, cart) {
    const tags = window.pageConfig?.tags ? window.pageConfig.tags : null;
    let productUrl = beUrl + "api/products";

    if (tags !== null) {
        productUrl += "?tag=" + tags;
    }

    fetch(productUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // 'data' is now your array of products
            homeProducts = data;   // assign to your variable

            homeProducts.forEach(product => {
                if (product.id !== null) {
                    product.productId = product.id
                    delete product.id;
                    delete product.tag;
                }
            });
            displayProducts(cart);     // render products
        })
        .catch(error => console.error("Error loading products:", error));
}




function displayProducts(cart) {
    if (!container) return;
    container.innerHTML = "";


    homeProducts.forEach(product => {
        const card = document.createElement("div");
        card.className = "card";

        const inCart = cart.find(item => item.productId === product.productId);

        card.innerHTML = `
      <img src="${product.image}">
      <h3>${product.name}</h3>
      <p class="price">₹${product.price}</p>
      <div class="cart-controls">
        ${inCart ? `
          <button class="decrease">-</button>
          <span class="qty">${inCart.quantity}</span>
          <button class="increase">+</button>
        ` : `<button class="buy-now">Buy Now</button><button class="add-btn">Add to Cart</button>`}
      </div>
    `;



        const item = '';
        // Add event listeners
        if (inCart) {
            card.querySelector(".increase").addEventListener("click", () => {
                inCart.quantity++;
                const item = {
                    productId: product.productId,
                    quantity: inCart.quantity
                };
                saveCart(cart, item);
                displayProducts(cart);
            });

            card.querySelector(".decrease").addEventListener("click", () => {
                inCart.quantity--;
                if (inCart.quantity <= 0) {
                    cart = cart.filter(item => item.productId !== inCart.productId);
                }
                const item = {
                    productId: product.productId,
                    quantity: inCart.quantity
                };
                saveCart(cart, item);
                displayProducts(cart);
            });
        } else {
            // const 
            const item = {
                productId: product.productId,
                quantity: 1
            };
            card.querySelector(".add-btn").addEventListener("click", () => {
                cart.push({ ...product, quantity: 1 });
                saveCart(cart, item);
                displayProducts(cart);
            });
            card.querySelector(".buy-now").addEventListener("click", () => {
                localStorage.setItem("checkoutType", "BUY_NOW");
                localStorage.setItem("buyNowProductId",product.productId);
                localStorage.setItem("buyNowQuantity",1);
                window.location.href = "checkout.html";
            });
        }

        container.appendChild(card);
    });
}




export async function productPages(beUrl) {
    const cart = await fetchCart(beUrl);
    fetchProducts(beUrl, cart);
    // displayProducts(cart);
}
import { beUrl } from './constant.js';

import {loadDynamicData} from './dyanmicData.js';
import {productPages} from './product.js';
// import {script } from './script.js'
import {initAuth} from './auth.js'
import {displayCart} from './cart.js';
const BASE_URL = beUrl+"api";

document.addEventListener('DOMContentLoaded', () => {

    console.log("loading app...")
    loadDynamicData();
    productPages(beUrl);
    initAuth(beUrl);
    displayCart(beUrl);
});

// ---------- AUTH HEADER ----------
function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + localStorage.getItem("token")
  };
}

// ---------- LOAD MY ORDERS ----------
function loadOrders() {
  fetch(`${BASE_URL}/orders/my`, {
    headers: authHeaders()
  })
    .then(res => res.json())
    .then(orders => {
      const container = document.getElementById("ordersList");
      container.innerHTML = "";

      if (!orders || orders.length === 0) {
        container.innerHTML = `<p class="empty">No orders found</p>`;
        return;
      }

      orders.forEach(order => {
        const div = document.createElement("div");
        div.className = "order-card";

        div.innerHTML = `
          <div class="order-header">
            <div>
              <strong>Order #${order.orderId}</strong><br>
              <small>${new Date(order.date).toLocaleString()}</small>
            </div>
            <div class="status">${order.status}</div>
          </div>

          <div><strong>Total:</strong> ₹${order.totalAmount}</div>

          <div class="order-items">
            ${order.items.map(item => `
              <div class="order-item">
                <span>${item.name} × ${item.quantity}</span>
                <span>₹${item.price * item.quantity}</span>
              </div>
            `).join("")}
          </div>
        `;

        container.appendChild(div);
      });
    })
    .catch(() => {
      document.getElementById("ordersList").innerHTML =
        "<p class='empty'>Failed to load orders</p>";
    });
}

// ---------- INIT ----------
loadOrders();

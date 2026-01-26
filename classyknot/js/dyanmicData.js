

export function loadDynamicData() {

    let navbar = document.getElementById("navbar");
    navbar.innerHTML = `

    <h1 class="logo">
        <a href="index.html">
            <img src="assets/logo.png" alt="StyleStore" height="35">
        </a>
    </h1>

    <div class="hamburger" id="hamburger">
        ☰
    </div>

    <ul class="nav-links" id="nav-links">
        <li><a href="index.html">Home</a></li>
        <li><a href="men.html">Men</a></li>
        <li><a href="women.html">Women</a></li>
        <li><a href="kids.html">Kids</a></li>
        <li><a href="orders.html">My Orders</a></li>
        <li><a href="cart.html">Cart (<span id="cart-count">0</span>)</a></li>
        <div id="auth-guest">
        <li>
           <button class="auth-btn" id="loginButton"">Login</button>
        </li>
        <li>
              <button class="auth-btn register" id="registerButton">Register</button>
        </li>   
        </div>

        <div id="auth-user" style="display:none;">
            <li>
                <button class="user-email" id="userEmail">Logout</button>
            </li>
            <li>
                <button class="auth-btn logout" id="logout">Logout</button>
            </li>

    </ul>
</nav>

<!-- Login Modal -->
<div class="modal" id="loginModal">
    <div class="modal-content">
        <span class="close" onclick="closeModal('loginModal')">&times;</span>
        <h2>Login</h2>
        <form id="loginForm">
            <input type="email" id="loginEmail" placeholder="Email" required>
            <input type="password" id="loginPassword" placeholder="Password" required>
            <button type="button" id="loginButton2">Login</button>

            <p class="msg" id="loginMsg"></p>
        </form>
    </div>
</div>

<!-- Register Modal -->
<div class="modal" id="registerModal">
    <div class="modal-content">
        <span class="close" onclick="closeModal('registerModal')">&times;</span>
        <h2>Register</h2>
        <form id="registerForm">
            <input type="email" id="registerEmail" placeholder="Email" required>
            <input type="password" id="registerPassword" placeholder="Password" required>
            <button type="submit">Register</button>
            <p class="msg" id="registerMsg"></p>
        </form>
    </div>

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


    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("nav-links");

    hamburger.addEventListener("click", () => {
        navLinks.classList.toggle("active");
    });

}

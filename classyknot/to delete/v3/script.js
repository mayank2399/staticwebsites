// Hamburger Menu Toggle
const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("nav-menu");

hamburger.addEventListener("click", () => {
    navMenu.classList.toggle("active");
    hamburger.classList.toggle("open");
});

// Add to Cart Buttons
document.querySelectorAll(".product button").forEach(btn => {
    btn.addEventListener("click", () => {
        alert("Item added to cart!");
    });
});

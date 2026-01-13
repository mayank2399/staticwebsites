
const siteHeader=document.getElementById("site-header")
siteHeader.innerHTML=`
 <div class="container header-inner">
      <a class="brand" href="/">
        <img src="assets/logo.png" alt="ClassyKnot" class="brand-logo" />
      </a>

      <nav class="nav" id="mainNav">
        <a href="/" class="nav-item">Home</a>
        <a href="/category/men.html" class="nav-item">Men</a>
        <a href="/category/women.html" class="nav-item">Women</a>
        <a href="/category/others.html" class="nav-item">Others</a>
      </nav>

      <div class="header-actions">
        <button class="icon-btn" id="searchBtn" aria-label="Search">🔍</button>
        <a href="/cart" class="icon-btn" aria-label="Cart">🛒<span class="cart-count" id="cartCount">0</span></a>
        <button class="hamburger" id="hamburger" aria-label="Menu">☰</button>
      </div>
    </div>`;

const siteFooter=document.getElementById("site-footer")
siteFooter.innerHTML=` <div class="container footer-inner">
      <div class="brand-col">
        <img src="assets/logo.png" alt="ClassyKnot" class="brand-logo footer-logo" />
        <p>ClassyKnot — premium clothing crafted with care.</p>
      </div>
      <div class="links-col">
        <h4>Shop</h4>
        <a href="/category/men/">Men</a>
        <a href="/category/women/">Women</a>
        <a href="/category/others/">others</a>
      </div>
      <div class="help-col">
        <h4>Help</h4>
        <a href="/contact">Contact</a>
        <a href="/shipping">Shipping</a>
        <a href="/returns">Returns</a>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="container">© <span id="year"></span> ClassyKnot. All rights reserved.</div>
    </div>`;

    document.addEventListener('DOMContentLoaded', ()=>{
  // year in footer
  const y = new Date().getFullYear();
  ['year','year2','year3'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=y; });

  const hamb = document.getElementById('hamburger');
  console.log(hamburger)
  if(hamb){ hamb.addEventListener('click', ()=>{ 
    console.log("jo")
    const nav=document.getElementById('mainNav');
    console.log(nav)
    if(nav) nav.classList.toggle('open'); }); }

  // simple add to cart demo
  const form = document.getElementById('addToCartForm');
  if(form){ form.addEventListener('submit', (e)=>{ e.preventDefault(); const qty = Number(form.qty.value||1); const countEl = document.getElementById('cartCount'); if(countEl) countEl.textContent = Number(countEl.textContent||0)+qty; alert('Added to cart'); }); }

  // accessible nav open state
  const mainNav = document.getElementById('mainNav');
  if(mainNav){ mainNav.addEventListener('click', ()=> mainNav.classList.remove('open')); }
});




const containerCategories=document.getElementById("containerCategories");


const categories = {
  "White T-shits": {
    href: "/category/men-white-tshit.html",
    src: "assets/category/cat-white-tshit.jpg",
    alt: "White Tshit collection"
  },
  "Black T-shits": {
    href: "/category/men-black-tshit.html",
    src: "assets/category/cat-black-tshit.jpg",
    alt: "Black Tshit collection"
  },
  "Others": {
    href: "/category/others.html",
    src: "assets/category/other.jpg",
    alt: "Others"
  }
};




if(containerCategories){
  const div=document.createElement('div');
  div.classList.add('grid');
   div.classList.add('grid-3');
      Object.entries(categories).forEach(([title, data]) => {
  const innerDiv = document.createElement("div");
  innerDiv.innerHTML = `
    <a href="${data.href}">
      <img src="${data.src}" alt="${data.alt}">
      <h3>${title}</h3>
    </a>
  `;
  div.appendChild(innerDiv);
});

  containerCategories.appendChild(div)
}

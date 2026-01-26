import {loadDynamicData} from './dyanmicData.js';
import {productPages} from './product.js';
// import {script } from './script.js'
import {initAuth} from './auth.js'
import {displayCart} from './cart.js';
import { beUrl } from './constant.js';

document.addEventListener('DOMContentLoaded', () => {

    console.log("loading app...")
    loadDynamicData();
    productPages(beUrl);
    initAuth(beUrl);
    displayCart(beUrl);
});

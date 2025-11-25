import Player from "./player.js";
import InputHandler from "./input.js";
window.addEventListener('load',function(){

    const loading=this.document.getElementById("loading");
    loading.style.display='none';

    const canvas=this.document.getElementById("canvas");
    const ctx=canvas.getContext('2d');

    canvas.width=this.window.innerWidth;
    canvas.height=this.window.innerHeight;

    console.log(canvas.width)
    console.log(canvas.height);
    const player=new Player(canvas.width,canvas.height);

    const input=new InputHandler();

    function animate(){
            ctx.clearRect(0, 0, canvas.width, canvas.height);

        player.update(input.lastKey);
            player.draw(ctx);

        requestAnimationFrame(animate);
    }
    animate(0);
});
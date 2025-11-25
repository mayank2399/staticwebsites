export default class InputHandler{
    constructor(){
        this.lastKey='';
        window.addEventListener('keydown',(e)=>{
            switch (e.key) {
                case "ArrowLeft":
                    this.lastKey="PRESS LEFT";
                    break;
                 case "ArrowRight":
                    this.lastKey="PRESS RIGHT";
                    break;                
            }
        });

           window.addEventListener('keyup',(e)=>{
            switch (e.key) {
                case "ArrowLeft":
                    this.lastKey="RELEASE LEFT";
                    break;
                 case "ArrowRight":
                    this.lastKey="RELEASE RIGHT";
                    break;                
            }
        });
    }
}
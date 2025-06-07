
const resources = document.getElementById('Resources-div');
const sotd = document.getElementById('sotd-div');
const practice = document.getElementById('practice-div');
const h_view = document.getElementById('h-carousel-div');


const resourcesButton = document.getElementById('resources');
const sotdButton = document.getElementById('sotd');
const practiceButton = document.getElementById('practice');

history.replaceState({ page: 'home' }, '', '');


practiceButton.onclick = function () {
    resources.style.display = 'none';
    sotd.style.display='none'
    h_view.style.display='none'
    practice.style.display = 'block';
    history.pushState({ page: 'practice' }, '', '#practice');
};

sotdButton.onclick = function () {
    resources.style.display = 'none';
    practice.style.display='none'
    h_view.style.display='none'
    sotd.style.display = 'block';
    history.pushState({ page: 'sotd' }, '', '#sotd');
};

resourcesButton.onclick = function () {
    practice.style.display = 'none';
    sotd.style.display='none'
    resources.style.display = 'block';
    h_view.style.display='none'
    history.pushState({ page: 'resources' }, '', '#resources');
};


async function loadHeader(key,value){
    var upperHeader= document.getElementById('upper-header-2');
    const p =document.createElement('p');
    p.className ='header'+key;
    p.innerText= key;

     p.addEventListener('click', () => {
        console.log(value) 
         practice.style.display = 'none';
        sotd.style.display='none'
        resources.style.display='none'
        h_view.style.display = 'block';
        history.pushState({ page: 'h_view' }, '', '#'+key);       
        test(key,value);

    });
    upperHeader.appendChild(p);

 }

 async function test(key,value) {
  const h_carousel_div=document.getElementById("h-carousel-div");
   const section = document.createElement('div');
          section.className = 'h-carousel'

          const title = document.createElement('h2');
          title.className = 'carousel-title';
          title.textContent =key;

          const carousel = document.createElement('div');
          carousel.className = 'h-carousel';
        value.forEach(item => {
            const card = document.createElement('div');
            card.className = 'carousel-item';

            const img = document.createElement('img');
            img.src = "images/rubic_cube_world.jpg";

            const heading = document.createElement('h3');
            heading.textContent = item.name;

             const h4 = document.createElement('h4');
            h4.textContent = item.currency +" "+item.starting_price;

            const link = document.createElement('a');
            link.href = item.link;
            link.textContent = 'Learn more';
            link.target = '_blank';

            card.appendChild(img);
            card.appendChild(heading);
            card.appendChild(h4);
            card.appendChild(link);

            card.addEventListener('click', () => {
              // showDestination(item)
            });
            carousel.appendChild(card);
          });

          section.appendChild(title);
          section.appendChild(carousel);
          h_carousel_div.appendChild(section);
 }

 fetch('data.json')
      .then(response => response.json())
      .then(data => dataPopulate(data));
    function dataPopulate(data) {

        const container = document.getElementById('carousels');

        Object.keys(data).forEach(key => {
          loadHeader(key,data[key]);
          const section = document.createElement('div');
          section.className = 'carousel'

          const title = document.createElement('h2');
          title.className = 'carousel-title';
          title.textContent = key;

          const carousel = document.createElement('div');
          carousel.className = 'carousel';

          data[key].forEach(item => {
            const card = document.createElement('div');
            card.className = 'carousel-item';

            const img = document.createElement('img');
            img.src = "images/rubic_cube_world.jpg";

            const heading = document.createElement('h3');
            heading.textContent = item.name;

             const h4 = document.createElement('h4');
            h4.textContent = item.currency +" "+item.starting_price;

            const link = document.createElement('a');
            link.href = item.link;
            link.textContent = 'Learn More';
            link.target = '_blank';

            card.appendChild(img);
            card.appendChild(heading);
            card.appendChild(h4);
            card.appendChild(link);

            card.addEventListener('click', () => {
              // showDestination(item)
            });
            carousel.appendChild(card);
          });

          section.appendChild(title);
          section.appendChild(carousel);
          container.appendChild(section);
        });
      
    }
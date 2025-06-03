 function showDestination(data) {
    var carousels=document.getElementById('carousels')
    carousels.style.display='none';

    const destination = document.getElementById('destination');


    const destinationImage = document.createElement('div');
    destinationImage.className = 'destination-images';


    const leftDestinationImage =document.createElement('div');
    leftDestinationImage.className ='left-destination-image';
    const lefImg = document.createElement('img');
    lefImg.src = data.gallery_media[0].media_urls.original;
    leftDestinationImage.appendChild(lefImg)


    const rightDestinationImage =document.createElement('div');
    rightDestinationImage.className ='right-destination-image';
    const rightImg1 = document.createElement('img');
    rightImg1.src = data.gallery_media[1].media_urls.original;
    rightDestinationImage.appendChild(rightImg1)

    const rightImg2 = document.createElement('img');
    rightImg2.src = data.gallery_media[2].media_urls.original;
    rightDestinationImage.appendChild(rightImg2)


    destinationImage.appendChild(leftDestinationImage);
    destinationImage.appendChild(rightDestinationImage);


    const p1 =document.createElement('p');
    p1.className ='destination-title';
    p1.innerText= data.name;

    const p2 =document.createElement('p');
    p2.className ='destination-title';
    p2.innerText=data.currency +" "+data.starting_price;

    destination.appendChild(destinationImage);
    destination.appendChild(p1);
    destination.appendChild(p2);
 }


 fetch('data.json')
      .then(response => response.json())
      .then(data => dataPopulate(data));
    function dataPopulate(data) {
        const container = document.getElementById('carousels');

        Object.keys(data).forEach(key => {
          const section = document.createElement('div');
          section.className = 'carousel-container';

          const title = document.createElement('h2');
          title.className = 'carousel-title';
          title.textContent = key;

          const carousel = document.createElement('div');
          carousel.className = 'carousel';

          data[key].forEach(item => {
            const card = document.createElement('div');
            card.className = 'carousel-item';

            const img = document.createElement('img');
            img.src = item.gallery_media[0].media_urls.original;

            const heading = document.createElement('h3');
            heading.textContent = item.name;

             const h4 = document.createElement('h4');
            h4.textContent = item.currency +" "+item.starting_price;

            const link = document.createElement('a');
            link.href = item.link;
            link.textContent = 'Request Callback';
            link.target = '_blank';

            card.appendChild(img);
            card.appendChild(heading);
            card.appendChild(h4);
            card.appendChild(link);

            card.addEventListener('click', () => {
              showDestination(item)
              // document.querySelectorAll('.sidebar-child').forEach(el => el.style.display = 'none');
              //  submenu.style.display = 'block';
            });
            carousel.appendChild(card);
          });

          section.appendChild(title);
          section.appendChild(carousel);
          container.appendChild(section);
        });
      
    }
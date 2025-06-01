 function screen(data) {
    const sidebar = document.getElementById('carousels');
    
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
            // item['gallery_media']['media_urls'].get(0).['original'];

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
            carousel.appendChild(card);
          });

          section.appendChild(title);
          section.appendChild(carousel);
          container.appendChild(section);
        });
      
    }
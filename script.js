 const menuData = 
//  {
//     A: ['ax', 'ay', 'az'],
//     B: ['bx', 'by', 'bz'],
//     C: ['cx', 'cy', 'cz']
//   };
{
  "N X N Cube":{
    "2X2":[
    ],
    "3X3":[
    ],
    "4X4":[
    ],
    "5X5":[
    ]
    
  },
  "shape shifting":{    "mirror cube":[]
  }
}


  // Function to build sidebar from JSON
  function buildSidebar(data) {
    console.log(data)
      const sidebar = document.getElementById('sidebar');

    Object.keys(data).forEach(parent => {
      const parentDiv = document.createElement('div');
      parentDiv.classList.add('sidebar-parent');
      parentDiv.textContent = parent;
      parentDiv.setAttribute('data-key', parent);

      const submenu = document.createElement('div');
      submenu.classList.add('sidebar-child');
      submenu.id = `sidebar-child-${parent}`;

      Object.keys(data[parent]).forEach(child => {
        const childDiv = document.createElement('div');
        childDiv.classList.add('sidebar-child-item');
        childDiv.textContent = child;
        childDiv.addEventListener('click', () => {
            console.log(parent)
            console.log(child)
            console.log(data[parent][child])
            dataPopulate(data[parent][child])
      });
        submenu.appendChild(childDiv);
      });

      parentDiv.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-child').forEach(el => el.style.display = 'none');
        submenu.style.display = 'block';
      });

      sidebar.appendChild(parentDiv);
      sidebar.appendChild(submenu);
    });
  }

  fetch('data.json')
      .then(response => response.json())
      .then(data =>  buildSidebar(data));
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
            img.src = item.image;

            const heading = document.createElement('h3');
            heading.textContent = item.heading;

            const link = document.createElement('a');
            link.href = item.link;
            link.textContent = 'Visit';
            link.target = '_blank';

            card.appendChild(img);
            card.appendChild(heading);
            card.appendChild(link);
            carousel.appendChild(card);
          });

          section.appendChild(title);
          section.appendChild(carousel);
          container.appendChild(section);
        });
      
    }
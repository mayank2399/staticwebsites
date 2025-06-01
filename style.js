 function screen(data) {
    const sidebar = document.getElementById('screens');
    
    flag=true;
    Object.keys(data).forEach(parent => {
      const parentDiv = document.createElement('div');
      parentDiv.classList.add('screen');
      const submenu = document.createElement('div');
      submenu.classList.add('screen-img');
      submenu.id = `screen-img-${parent}`;
      const img = document.createElement("img");
      img.src=data[parent]['image']

      submenu.appendChild(img)

      const submenu2 = document.createElement('div');
      submenu2.classList.add('screen-text');
      submenu2.id = `screen-text-${parent}`;
      
      const location=document.createElement('div');
      location.classList.add('location');
      location.id = `screen-text-${parent}-location`;
      location.innerText=parent;

      submenu2.appendChild(location);
      data[parent]['p'].forEach(pt=>{
        const p=document.createElement('p');
        p.classList.add('p');
        p.id = `screen-text-${parent}-${pt}`;
        p.innerText=pt;
        submenu2.appendChild(p)
      });

      const places=document.createElement('h3');
      places.id = `screen-text-${parent}-location`;
      places.innerText="Places to visit in "+ parent;

      submenu2.appendChild(places);
      
      i=1;
      data[parent]['places'].forEach(pt=>{
        const p=document.createElement('p');
        p.classList.add('p');
        p.id = `screen-text-${parent}-${pt}`;
        p.innerText=i+". "+pt;
        submenu2.appendChild(p)
        i+=1;
      });

       const p=document.createElement('p');
        p.classList.add('p');
        p.id = `screen-text-${parent}-many-more`;
        p.innerText="and many more";
        submenu2.appendChild(p)


        const a=document.createElement('a')
        a.href='https://wa.me/8810201112?text=Hi Travel Guru Team, Please let me more about '+parent+ ' trip';
        a.target='_blank'

        const letsConnect=document.createElement('button')
        letsConnect.textContent='Know more';       
        
        a.appendChild(letsConnect);
        submenu2.appendChild(a)
        
      if(flag==true){
        parentDiv.appendChild(submenu);
        parentDiv.appendChild(submenu2);
        flag=false;
      }else{
        flag=true;
         parentDiv.appendChild(submenu2);
         parentDiv.appendChild(submenu);
        
      }
      sidebar.appendChild(parentDiv);
    }

    );
 }
 fetch('data.json')
      .then(response => response.json())
      .then(data =>  screen(data));
 currency="Rs.";
//  function showDestination(data,key) {

//     var horibanner=document.getElementById('horibanner1')
//     horibanner.style.display='none';

//     var horibanner2=document.getElementById('horibanner2')
//     horibanner2.style.display='none';


//     var carousels=document.getElementById('carousels')
//     carousels.style.display='none';

//     const destination = document.getElementById('destination');


//     const destinationImage = document.createElement('div');
//     destinationImage.className = 'destination-images';


//     const leftDestinationImage =document.createElement('div');
//     leftDestinationImage.className ='left-destination-image';
//     const lefImg = document.createElement('img');
//     lefImg.src = "images/"+key+"/"+data.name+"/1.jpg";
//     leftDestinationImage.appendChild(lefImg)


//     const rightDestinationImage =document.createElement('div');
//     rightDestinationImage.className ='right-destination-image';
//     const rightImg1 = document.createElement('img');
//     rightImg1.src = "images/"+key+"/"+data.name+"/2.jpg";
//     rightDestinationImage.appendChild(rightImg1)

//     const rightImg2 = document.createElement('img');
//     rightImg2.src = "images/"+key+"/"+data.name+"/3.jpg";
//     rightDestinationImage.appendChild(rightImg2)


//     destinationImage.appendChild(leftDestinationImage);
//     destinationImage.appendChild(rightDestinationImage);


//     const p1 =document.createElement('p');
//     p1.className ='destination-title';
//     p1.innerText= data.name;

//     const p2 =document.createElement('p');
//     p2.className ='destination-title';
//     p2.innerText=currency +" "+data.starting_price;
//     destination.appendChild(destinationImage);
//     destination.appendChild(p1);
//     destination.appendChild(p2);
    
//  }


function showDestination(data, key) {
  // Hide existing sections
  document.getElementById('horibanner1').style.display = 'none';
  document.getElementById('horibanner2').style.display = 'none';
  document.getElementById('carousels').style.display = 'none';

  // Clear and show destination
  const destination = document.getElementById('destination');
  destination.innerHTML = '';

  // Image section
  const destinationImage = document.createElement('div');
  destinationImage.className = 'destination-images';

    const leftDestinationImage =document.createElement('div');
    leftDestinationImage.className ='left-destination-image';
    const lefImg = document.createElement('img');
    lefImg.src = "images/"+key+"/"+data.name+"/1.jpg";
    leftDestinationImage.appendChild(lefImg)


    const rightDestinationImage =document.createElement('div');
    rightDestinationImage.className ='right-destination-image';
    const rightImg1 = document.createElement('img');
    rightImg1.src = "images/"+key+"/"+data.name+"/2.jpg";
    rightDestinationImage.appendChild(rightImg1)

    const rightImg2 = document.createElement('img');
    rightImg2.src = "images/"+key+"/"+data.name+"/3.jpg";
    rightDestinationImage.appendChild(rightImg2)


    destinationImage.appendChild(leftDestinationImage);
    destinationImage.appendChild(rightDestinationImage);

  destination.appendChild(destinationImage);

  // Title & Price
  const title = document.createElement('p');
  title.className = 'destination-title';
  title.innerText = data.name;
  destination.appendChild(title);

  const price = document.createElement('p');
  price.className = 'destination-title';
  price.innerText = currency + " " + data.starting_price;
  destination.appendChild(price);

 // Helper: Create section
  function createSection(titleText, contentArray) {
    const sectionTitle = document.createElement('h3');
    sectionTitle.innerText = titleText;
      sectionTitle.className = 'destination-title';

    destination.appendChild(sectionTitle);

    const ul = document.createElement('ul');
    contentArray.forEach(item => {
      const li = document.createElement('li');
      li.className = 'destination-title-2';
      li.innerText = item;
      ul.appendChild(li);
    });
    destination.appendChild(ul);
  }

  // Add sections
  createSection('Best Time to Visit', [data.best_time_to_visit]);
  createSection('Famous For', data.famous_for);
  createSection('Local Food to Try', data.local_food);
  createSection('Itinerary', data.itinerary);
  createSection('Inclusions', data.inclusions);
  createSection('Exclusions', data.exclusions);
  createSection('Nearby Attractions', data.nearby_attractions);

  // const reviewTitle = document.createElement('h3');
  // reviewTitle.innerText = 'Customer Reviews';
  // destination.appendChild(reviewTitle);
  // data.customer_reviews.forEach(review => {
  //   const blockquote = document.createElement('blockquote');
  //   blockquote.innerText = review;
  //   destination.appendChild(blockquote);
  // });

  // Travel Options
  const travelTitle = document.createElement('h3');
  travelTitle.innerText = 'Travel Options';
  travelTitle.className = 'destination-title';

  destination.appendChild(travelTitle);
  const travelList = document.createElement('ul');
  ['by_air', 'by_train', 'by_road'].forEach(mode => {
    const li = document.createElement('li');
      li.className = 'destination-title-2';

    li.innerHTML = `<strong>${mode.replace('by_', 'By ').replace('_', ' ')}:</strong> ${data.travel_options[mode]}`;
    travelList.appendChild(li);
  });
  destination.appendChild(travelList);

  // CTA Buttons
  const buttonContainer = document.createElement('div');
  
  buttonContainer.style.marginTop = '20px';


  const contactBtn = document.createElement('button');
  contactBtn.className = 'destination-title';

  contactBtn.innerText = 'Contact Us';
  contactBtn.style = 'background-color: #eee; padding: 10px 20px; font-size: 16px; border: 1px solid #ccc; cursor: pointer;';
  contactBtn.onclick=onclick;
  buttonContainer.appendChild(contactBtn);
  destination.appendChild(buttonContainer);
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
            img.src ="images/"+"/"+key+"/"+item.name+"/1.jpg";

            const heading = document.createElement('h3');
            heading.textContent = item.name;

             const h4 = document.createElement('h4');
            h4.textContent = currency+" "+item.starting_price;

            const link = document.createElement('a');
            link.href = item.link;
            link.textContent = 'Request Callback';
            link.target = '_blank';

            card.appendChild(img);
            card.appendChild(heading);
            card.appendChild(h4);
            card.appendChild(link);

            card.addEventListener('click', () => {
              showDestination(item,key)
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


function onclick() {
  // Check if popup already exists
  if (document.getElementById('popupForm')) return;

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'popupForm';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0,0,0,0.6)';
  overlay.style.zIndex = '1000';

  // Create popup content box
  const popup = document.createElement('div');
  popup.style.width = '90%';
  popup.style.maxWidth = '400px';
  popup.style.margin = '100px auto';
  popup.style.background = '#fff';
  popup.style.borderRadius = '8px';
  popup.style.padding = '30px';
  popup.style.position = 'relative';

  // Close button
  const closeBtn = document.createElement('span');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '8px';
  closeBtn.style.right = '12px';
  closeBtn.style.fontSize = '24px';
  closeBtn.style.color = '#999';
  closeBtn.style.cursor = 'pointer';
  closeBtn.onclick = () => document.body.removeChild(overlay);
  popup.appendChild(closeBtn);

  // Heading
  const heading = document.createElement('h2');
  heading.innerText = 'Tour Enquiry Form';
  heading.style.marginTop = '0';
  popup.appendChild(heading);

  // Form
  const form = document.createElement('form');
  form.id = 'enquiryForm';

  const fields = [
    { label: 'Full Name:', type: 'text', id: 'name' },
    { label: 'Email:', type: 'email', id: 'email' },
    { label: 'Phone Number:', type: 'tel', id: 'phone' },
    { label: 'No. of Travelers:', type: 'number', id: 'travelers', min: 1 },
    { label: 'Preferred Travel Date:', type: 'date', id: 'date' }
  ];

  fields.forEach(field => {
    const label = document.createElement('label');
    label.innerText = field.label;
    label.style.display = 'block';
    label.style.marginTop = '15px';
    label.style.fontWeight = 'bold';
    form.appendChild(label);

    const input = document.createElement('input');
    input.type = field.type;
    input.id = field.id;
    input.name = field.id;
    input.required = true;
    input.style.width = '100%';
    input.style.padding = '8px';
    input.style.marginTop = '5px';
    input.style.borderRadius = '4px';
    input.style.border = '1px solid #ccc';
    if (field.min) input.min = field.min;
    form.appendChild(input);
  });

  // Submit button
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.innerText = 'Submit';
  submit.style.marginTop = '20px';
  submit.style.backgroundColor = '#d4af37';
  submit.style.color = '#fff';
  submit.style.border = 'none';
  submit.style.padding = '10px';
  submit.style.width = '100%';
  submit.style.borderRadius = '5px';
  submit.style.fontSize = '16px';
  submit.style.cursor = 'pointer';
  form.appendChild(submit);

  // Handle form submission
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    alert('Thank you! We will contact you shortly.');
    document.body.removeChild(overlay);
  });

  popup.appendChild(form);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
};

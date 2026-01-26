

export function logoutUser() {
  localStorage.removeItem("useremail");
  localStorage.removeItem("token");
  updateNavbar();
}
function updateNavbar() {
  const user = localStorage.getItem("useremail");

  const guest = document.getElementById("auth-guest");
  const authUser = document.getElementById("auth-user");
  const userEmail = document.getElementById("userEmail");

  if (user) {
    guest.style.display = "none";
    authUser.style.display = "flex";
    userEmail.textContent = user;
  } else {
    guest.style.display = "flex";
    authUser.style.display = "none";
  }
}







export function initAuth(beUrl) {
  const loginButton = document.getElementById("loginButton");
  const registerButton = document.getElementById("registerButton");

  if (loginButton) {
    loginButton.addEventListener("click", () => {
      openModal("loginModal", beUrl);
    });
  }

  if (registerButton) {
    registerButton.addEventListener("click", () => {
      openModal("registerModal");
    });
  }


  const logout = document.getElementById("logout");

  if (logout) {
    console.log("d")
    logout.addEventListener("click", () => {
      logoutUser();
    });
  }
  updateNavbar();
}

/* Modal Control */
function openModal(id, beUrl) {
  document.getElementById(id).style.display = "flex";

  const loginButton = document.getElementById("loginButton2");
  console.log(loginButton)
  loginButton.addEventListener("click", () => {
    login(beUrl);
  })


}

export function closeModal(id) {
  document.getElementById(id).style.display = "none";
}


/* Hamburger Toggle */
async function login(beUrl) {

  console.log("klsdjlfs")
  const loginEmail = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  console.log(loginEmail)
  const response = await fetch(beUrl + 'api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: loginEmail,
      password: password
    })

  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const data = await response.json();
  const token = data.token;
  localStorage.setItem("useremail", loginEmail);
  localStorage.setItem("token", token);




  updateNavbar();
  closeModal("loginModal");
}
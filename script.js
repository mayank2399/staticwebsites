// const { createElement } = require("react");
const streamContainers = document.getElementsByClassName('stream');
const binary = ['0', '1'];
const count = 150;

for (const streamContainer of streamContainers) {
  for (let i = 0; i < count; i++) {
    const span = document.createElement('span');
    span.textContent = binary[Math.floor(Math.random() * binary.length)];
    span.style.left = Math.random() * 100 + 'vw';
    span.style.animationDelay = Math.random() * 5 + 's';
    streamContainer.appendChild(span);
  }
}
fetch("data.json")
  .then((response) => response.json())
  .then((data) => dataPopulate(data));

// firstName
function dataPopulate(data) {
  let nameLetters = data.firstName.split("");
  const nameLoader = document.getElementById("name-loader");
  nameLoader.className = "loading-text";
  nameLetters.forEach((alphabet) => {
    console.log(alphabet);
    const span = document.createElement("span");
    span.textContent = alphabet;
    span.dataset.text = alphabet;
    nameLoader.appendChild(span);
  });
  const letters = document.querySelectorAll(".loading-text span");
  gsap_effect(letters);

  const namespan1 = document.getElementById("namespan1");
  namespan1.innerText = data.name;

  const namespan2 = document.getElementById("namespan2");
  namespan2.innerText = data.name;

  const introMessage1 = document.getElementById("introMessage1");
  introMessage1.innerText = data.introMessage1;

  const introMessage2 = document.getElementById("introMessage2");
  introMessage2.innerText = data.introMessage2;

  const introMessage3 = document.getElementById("introMessage3");
  introMessage3.innerText = data.introMessage3;

  const timelineWrapper = document.getElementById("timeline-wrapper");

  data.experiences.forEach((item, index) => {
    const isLeft = index % 2 !== 0;

    const entry = document.createElement("div");
    entry.className = `relative mb-16 md:mb-24 md:flex ${
      isLeft ? "justify-start" : "justify-end"
    } opacity-0 transition-opacity duration-700`;
    entry.setAttribute("data-fade", "true");

    entry.innerHTML = `
      <div class="hidden md:block absolute w-4 h-4 bg-[#1DCD9F] rounded-full left-1/2 transform -translate-x-1/2 top-4 z-10"></div>
      ${
        isLeft
          ? `
          <div class="md:w-1/2 md:pr-10">
            <div class="bg-[#111] p-6 rounded-2xl border border-[#1DCD9F] shadow-lg journey-card">
              <h3 class="text-xl font-semibold text-[#1DCD9F]">${item.title}</h3>
              <span class="text-sm text-gray-400">${item.date}</span>
              <p class="mt-2 text-gray-300">${item.description}</p>
            </div>
          </div>
          <div class="md:w-1/2"></div>
        `
          : `
          <div class="md:w-1/2"></div>
          <div class="md:w-1/2 md:pl-10">
            <div class="bg-[#111] p-6 rounded-2xl border border-[#1DCD9F] shadow-lg journey-card">
              <h3 class="text-xl font-semibold text-[#1DCD9F]">${item.title}</h3>
              <span class="text-sm text-gray-400">${item.date}</span>
              <p class="mt-2 text-gray-300">${item.description}</p>
            </div>
          </div>
        `
      }
    `;

    timelineWrapper.appendChild(entry);
  });

  // Optional: Fade-in effect on scroll
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document
    .querySelectorAll("[data-fade]")
    .forEach((el) => observer.observe(el));

  traverseTechnology(data.technology);

  blogs(data.blogs);

  project(data.project)


  // const email=document.getElementById('email');
  // email.innerText=data.email

  //  const location=document.getElementById('location');
  // location.innerText=data.location
}

function project(obj){
 const project=document.getElementById('project');
  for (const i in obj) {

    console.log(obj[i])
    const projectDIv=document.createElement('div');
    projectDIv.className="project-card bg-white text-black shadow-xl rounded-2xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300"

    projectDIv.innerHTML=` <img src=${obj[i].image} alt=""
                        class="w-full h-60 object-cover" /> <div class="p-6">
                        <h3 class="text-2xl font-semibold mb-2">${obj[i].title}</h3>
                        <p class="text-gray-700 mb-4">
                          ${obj[i].desc}    
                        
                        </p>

                        

                        <!-- Project Links -->
                        <div class="flex gap-4">
                            <a href="" target="_blank"
                                class="bg-[#1DCD9F] text-white px-4 py-2 rounded hover:bg-[#17b890] transition-all text-sm">
                                Live Demo
                            </a>
                            <a href="" target="_blank"
                                class="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition-all text-sm">
                                GitHub
                            </a>
                        </div>
                    </div>`

      project.appendChild(projectDIv);
  }
}
function blogs(obj) {
  const blogs=document.getElementById('blogs');
  for (const i in obj) {
    console.log(obj[i]);
    const article=document.createElement('article');
    article.innerHTML=`<article
          class="blog-card bg-[#111] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
          <div class="relative">
            <img src="${obj[i].image}" alt="./assets/blog.jpg" class="w-full h-48 object-cover"
              loading="lazy">
            <div class="absolute top-4 left-4">
              <span class="bg-[#1DCD9F] text-black px-3 py-1 rounded-full text-xs font-semibold">${obj[i].title}</span>
            </div>
          </div>
          <div class="p-6">   
            <p class="text-gray-300 mb-4 line-clamp-3">
              ${obj[i].sample}
            </p>
            <div class="flex items-center justify-between">
              <a href=${obj[i].link}
                class="text-[#1DCD9F] hover:text-[#17b890] font-semibold transition-colors">
                Read More <i class="fas fa-arrow-right ml-1"></i>
              </a>
            </div>
          </div>`  
        blogs.appendChild(article)
      }
      
}

function traverseTechnology(obj) {
  console.log(obj);
  const techs = document.getElementById("techs");
  for (const key in obj) {
    console.log(key);
    const div = document.createElement("div");
    div.className = "flex md:flex-row flex-col gap-8 items-start";
    div.innerHTML = `<div class="w-full md:w-1/5 text-gray-400 text-lg font-bold sticky top-18">
          <div class="category-label cursor-pointer hover:text-white transition"
            onclick="document.querySelector('#tools').scrollIntoView({behavior: 'smooth'})">${key}</div>
        </div>`;

    const div2 = document.createElement("div");
    div2.className =
      "w-full md:w-4/5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 reveal-section";
    let inner = "";

    for (t in obj[key]) {
      console.log(obj[key][t]);
      inner =
        inner +
        `<div class="flex items-center gap-2"><img
              src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" class="w-6 h-6"><span
              class="text-lg">${obj[key][t].name}</span></div>`;
    }
    div2.innerHTML = inner;
    console.log(inner);

    div.appendChild(div2);
    techs.appendChild(div);
  }
}

// Animate each letter with stagger
function gsap_effect(letters) {
  gsap.to(letters, {
    opacity: 1,
    duration: 1.2,
    stagger: 0.15,
    onUpdate: function () {
      letters.forEach((el, i) => {
        gsap.to(el, {
          color: "#ffffff",
          duration: 0.2,
          delay: i * 0.15,
        });
        gsap.to(el, {
          color: "rgba(255,255,255,0.1)",
          duration: 0.2,
          delay: i * 0.15 + 0.4,
        });
        gsap.to(el.querySelector("::after"), {
          opacity: 1,
          duration: 0.2,
          delay: i * 0.15,
        });
      });
    },
    onComplete: () => {
      gsap.to("#loading", {
        opacity: 0,
        duration: 1,
        delay: 0.5,
        onComplete: () => {
          document.getElementById("loading").style.display = "none";
        },
      });
    },
  });

  // Animation for Hero Text
  gsap.from(".hero-left", {
    opacity: 0,
    x: -50,
    duration: 1.2,
    ease: "power3.out",
  });

  gsap.from(".hero-right", {
    opacity: 0,
    x: 50,
    duration: 1.2,
    ease: "power3.out",
    delay: 0.3,
  });

  gsap.utils.toArray(".journey-card").forEach((card, index) => {
    gsap.from(card, {
      opacity: 0,
      y: 80,
      duration: 0.4,
      ease: "power3.out",
      scrollTrigger: {
        trigger: card,
        start: "top 85%",
        toggleActions: "play none none reverse",
      },
      delay: index * 0.1,
    });
  });
}

// Github
document.addEventListener("DOMContentLoaded", function () {
  const username = "mayank2399";

  // GitHub API endpoints
  const endpoints = {
    user: `https://api.github.com/users/${username}`,
    repos: `https://api.github.com/users/${username}/repos`,
    activity: `https://api.github.com/users/${username}/events`,
  };

  // Fetch GitHub user data
  async function fetchGitHubData() {
    try {
      const [userResponse, reposResponse] = await Promise.all([
        fetch(endpoints.user),
        fetch(endpoints.repos),
      ]);

      if (userResponse.ok && reposResponse.ok) {
        const userData = await userResponse.json();
        const reposData = await reposResponse.json();

        // Update stats
        document.getElementById("githubRepos").textContent =
          userData.public_repos;
        document.getElementById("githubFollowers").textContent =
          userData.followers;

        // Calculate total stars
        const totalStars = reposData.reduce(
          (sum, repo) => sum + repo.stargazers_count,
          0
        );
        document.getElementById("githubStars").textContent = totalStars;

        // Calculate recent commits (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const commitsResponse = await fetch(
          `https://api.github.com/search/commits?q=author:${username}+committer-date:>${
            thirtyDaysAgo.toISOString().split("T")[0]
          }`
        );
        if (commitsResponse.ok) {
          const commitsData = await commitsResponse.json();
          document.getElementById("githubCommits").textContent =
            commitsData.total_count;
        }

        // Load activity feed
        loadGitHubActivity();

        // Load language stats
        loadGitHubLanguages(reposData);
      }
    } catch (error) {
      console.error("Error fetching GitHub data:", error);
      // Show fallback data
      document.getElementById("githubRepos").textContent = "15+";
      document.getElementById("githubStars").textContent = "25+";
      document.getElementById("githubFollowers").textContent = "10+";
      document.getElementById("githubCommits").textContent = "50+";
    }
  }

  // Load GitHub activity
  async function loadGitHubActivity() {
    try {
      const response = await fetch(endpoints.activity);
      if (response.ok) {
        const activityData = await response.json();
        const activityContainer = document.getElementById("githubActivity");

        // Clear loading state
        activityContainer.innerHTML = "";

        // Show recent activity (last 5 events)
        const recentActivity = activityData.slice(0, 5);

        recentActivity.forEach((event) => {
          const activityItem = createActivityItem(event);
          activityContainer.appendChild(activityItem);
        });
      }
    } catch (error) {
      console.error("Error loading GitHub activity:", error);
    }
  }

  // Create activity item element
  function createActivityItem(event) {
    const item = document.createElement("div");
    item.className =
      "flex items-center space-x-4 p-4 bg-[#0a0a0a] rounded-lg border border-gray-800";

    const eventType = event.type;
    const repoName = event.repo?.name || "Unknown Repository";
    const createdAt = new Date(event.created_at).toLocaleDateString();

    let icon, text;

    switch (eventType) {
      case "PushEvent":
        icon = "fas fa-code";
        text = `Pushed to ${repoName}`;
        break;
      case "CreateEvent":
        icon = "fas fa-plus";
        text = `Created ${repoName}`;
        break;
      case "ForkEvent":
        icon = "fas fa-code-branch";
        text = `Forked ${repoName}`;
        break;
      case "WatchEvent":
        icon = "fas fa-star";
        text = `Starred ${repoName}`;
        break;
      default:
        icon = "fas fa-circle";
        text = `Activity in ${repoName}`;
    }

    item.innerHTML = `
      <div class="w-10 h-10 bg-[#1DCD9F] rounded-full flex items-center justify-center">
        <i class="${icon} text-white"></i>
      </div>
      <div class="flex-1">
        <p class="text-white font-medium">${text}</p>
        <p class="text-gray-400 text-sm">${createdAt}</p>
      </div>
      <a href="https://github.com/${repoName}" target="_blank" class="text-[#1DCD9F] hover:text-[#17b890]">
        <i class="fas fa-external-link-alt"></i>
      </a>
    `;

    return item;
  }

  // Load GitHub languages
  function loadGitHubLanguages(reposData) {
    const languageStats = {};

    reposData.forEach((repo) => {
      if (repo.language) {
        languageStats[repo.language] = (languageStats[repo.language] || 0) + 1;
      }
    });

    // Sort languages by frequency
    const sortedLanguages = Object.entries(languageStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);

    const languagesContainer = document.getElementById("githubLanguages");
    languagesContainer.innerHTML = "";

    sortedLanguages.forEach(([language, count]) => {
      const languageCard = document.createElement("div");
      languageCard.className =
        "bg-[#111] p-4 rounded-xl border border-gray-800 text-center hover:border-[#1DCD9F] transition-all duration-300";

      languageCard.innerHTML = `
        <div class="text-2xl font-bold text-[#1DCD9F] mb-2">${language}</div>
        <div class="text-gray-400 text-sm">${count} repositories</div>
      `;

      languagesContainer.appendChild(languageCard);
    });
  }

  // Initialize GitHub data loading
  fetchGitHubData();
});

const apiKey = "ce7ee47b04a348ae81773047252209";

const landingInput = document.getElementById("landing-city-input");
const landingBtn   = document.getElementById("landing-search-btn");
const mainInput    = document.getElementById("city-input");
const mainBtn      = document.getElementById("search-btn");

// Error modal elements
const errorModal  = document.getElementById("error-modal");
const errorInput  = document.getElementById("error-city-input");
const errorBtn    = document.getElementById("error-search-btn");

// ============== Fetch API
async function fetchWeather(city) {
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=1&aqi=yes&alerts=no`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("City Not Found");
  return res.json();
}

// ============== Loader Overlay
function showLoader() {
  const loader = document.getElementById("global-loader");
  if (loader) loader.style.display = "flex";
}
function hideLoader() {
  const loader = document.getElementById("global-loader");
  if (loader) loader.style.display = "none";
}

// ============== Animate temperature smoothly
function animateValue(elem, start, end, duration = 800) {
  let startTime = null;
  function step(ts) {
    if (!startTime) startTime = ts;
    const progress = Math.min((ts - startTime) / duration, 1);
    const value = Math.floor(progress * (end - start) + start);
    elem.textContent = value + "°C";
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ============== Main Card
function updateMainCard(data) {
  document.getElementById("city-name").textContent   = data.location.name;
  document.getElementById("condition").textContent   = data.current.condition.text;
  document.getElementById("feels-like").textContent  = `Feels like: ${data.current.feelslike_c}°C`;

  // Animate temperature
  const tempElem = document.getElementById("temp");
  const current  = parseInt(tempElem.textContent) || 0;
  animateValue(tempElem, current, Math.round(data.current.temp_c));

  // Icon bounce
  const icon = document.getElementById("weather-icon");
  icon.src = "https:" + data.current.condition.icon;
  icon.classList.remove("icon-bounce");
  void icon.offsetWidth;
  icon.classList.add("icon-bounce");

  // Details
  document.getElementById("wind").textContent     = `${data.current.wind_kph} km/h`;
  document.getElementById("humidity").textContent = `${data.current.humidity}%`;
  document.getElementById("sunrise").textContent  = data.forecast.forecastday[0].astro.sunrise;
  document.getElementById("sunset").textContent   = data.forecast.forecastday[0].astro.sunset;
  document.getElementById("local-time").textContent = data.location.localtime;

  // Weather effects
  if (typeof setWeatherEffects === "function") {
    setWeatherEffects(data.current.condition.text, data.current.is_day === 1);
  }
}

// ============== Today Card
function updateTodayCard(data) {
  const list = document.querySelector(".forecast-list");
  list.innerHTML = "";

  const hours = data.forecast.forecastday[0].hour;
  // safe parse local hour: "YYYY-MM-DD HH:mm"
  const localHour = parseInt(data.location.localtime.split(" ")[1].split(":")[0]);

  const slots = [
    { hour: localHour,       label: "Now" },
    { hour: (localHour+3)%24 },
    { hour: (localHour+6)%24 },
  ];

  slots.forEach(s => {
    const h = hours[s.hour];
    if (!h) return; // guard

    const emoji = getWeatherEmoji(h.condition.code, h.is_day);
    const label = s.label || `${String(s.hour).padStart(2,"0")}:00`;

    list.insertAdjacentHTML("beforeend", `
      <div class="forecast-item fade-in">
        <div>${label}</div>
        <div style="display:flex;gap:6px;align-items:center">
          <div class="small-icon">${emoji}</div>
          <div>${Math.round(h.temp_c)}°C</div>
        </div>
      </div>
    `);
  });
}

// Emojis mapping
function getWeatherEmoji(code,isDay){
  const icons={
    1000:isDay?"☀️":"🌙",1003:isDay?"⛅":"☁️",1006:"☁️",1009:"☁️",1030:"🌫️",
    1063:"🌦️",1066:"🌨️",1087:"⛈️",1114:"❄️",1117:"❄️",1135:"🌫️",1153:"🌧️",
    1183:"🌧️",1189:"🌧️",1195:"🌧️",1210:"❄️",1213:"❄️",1219:"❄️",1225:"❄️",
    1240:"🌦️",1243:"🌧️",1246:"🌧️",1255:"❄️",1258:"❄️",1273:"⛈️",1276:"⛈️",
    1279:"⛈️",1282:"⛈️"
  };
  return icons[code] || (isDay?"☀️":"🌙");
}

// ============== Extras Card
function updateExtrasCard(data){
  const extras = document.getElementById("extrasContent");
  extras.innerHTML="";

  const scrollable = document.createElement("div");
  scrollable.className = "extras-scrollable";

  const rows = [
    {label:"UV Index",  value:data.current.uv ?? "—"},
    {label:"Pressure",  value:data.current.pressure_mb ? `${data.current.pressure_mb} hPa` : "—"},
    {label:"Visibility",value:data.current.vis_km ? `${data.current.vis_km} km` : "—"},
    {label:"Humidity",  value:data.current.humidity ? `${data.current.humidity}%` : "—"},
    {label:"Wind Gust", value:data.current.gust_kph ? `${data.current.gust_kph} km/h` : "—"},
  ];
  rows.forEach(r=>addRow(scrollable,r.label,r.value));

  const tips = [
    {label:"Umbrella",   value:data.forecast.forecastday[0].day.daily_chance_of_rain>40? "Recommended":"Not needed"},
    {label:"AC Usage",   value:data.current.temp_c>28?"Recommended":"Optional"},
    {label:"UV Protect", value:data.current.uv>6?"Required":"Optional"},
  ];
  tips.forEach(r=>addRow(scrollable,r.label,r.value));

  extras.appendChild(scrollable);
}

function addRow(parent,label,value){
  const div=document.createElement("div");
  div.style="display:flex;justify-content:space-between;padding:6px 0; font-size:14px; border-bottom:1px solid rgba(0,0,0,.05)";
  div.innerHTML=`<span style="color:#666">${label}</span><span style="font-weight:600">${value}</span>`;
  parent.appendChild(div);
}

// ============== Master Render
function renderWeather(data){
  updateMainCard(data);
  updateTodayCard(data);
  updateExtrasCard(data);
  hideLoader();
}

// ============== Error Modal
function showErrorModal(){ errorModal.style.display = "flex"; }
function hideErrorModal(){ errorModal.style.display = "none"; }

// Retry inside error modal
errorBtn.addEventListener("click",()=>{
  const city=errorInput.value.trim();
  if(!city){ errorInput.placeholder="⚠️ Enter a city!"; return;}
  hideErrorModal();
  showLoader();
  fetchWeather(city)
    .then(data=>{
      // Always switch to app on success
      document.getElementById("landing").style.display = "none";
      document.getElementById("app").style.display = "grid";
      mainInput.value = city; // sync to main search box
      renderWeather(data);
    })
    .catch(err=>{
      console.error(err);
      hideLoader();
      showErrorModal();
    });
});

// ============== Landing Event
landingBtn.addEventListener("click",()=>{
  const city=landingInput.value.trim();
  if(!city){
    document.querySelector(".landing .hint").textContent="⚠️ Enter a valid city!";
    return;
  }
  showLoader();
  fetchWeather(city)
    .then(data=>{
      document.getElementById("landing").style.display="none";
      document.getElementById("app").style.display="grid";
      mainInput.value=city;
      renderWeather(data);
    })
    .catch(err=>{
      console.error(err);
      hideLoader();
      showErrorModal(); // show modal on landing if first wrong
    });
});

// ============== Main Event
mainBtn.addEventListener("click",()=>{
  const city=mainInput.value.trim();
  if(!city){ mainInput.placeholder="⚠️ Please enter a city!"; return; }
  showLoader();
  fetchWeather(city)
    .then(renderWeather)
    .catch(err=>{
      console.error(err);
      hideLoader();
      showErrorModal(); // show modal on main
    });
});s
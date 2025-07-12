const weatherAPIKey = "ea05e34f90fb41ca90c172435251306";
const apiKeyGeoapify = "93b8f1a5ec204f5eaa74a65c21eeb3d6";

const weatherAPIBaseUrl = "https://api.weatherapi.com/v1/current.json";
const weatherForecastAPIBaseUrl = "https://api.weatherapi.com/v1/forecast.json";
const geoapifyBaseUrl = "https://api.geoapify.com/v1/geocode/autocomplete";
const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");
const hourlyBtn = document.getElementById("hourlyBtn");
const weeklyBtn = document.getElementById("weeklyBtn");
const weatherIcon = document.querySelector(".weather-icon");
const cityInput = document.getElementById("cityInput");
const suggestionBox = document.getElementById("suggestionBox");
const clearBtn = document.getElementById("clearBtn");
const hourlyForecastContainer = document.getElementById("hourlyForecast");
const weeklyForecastContainer = document.getElementById("weeklyForecast");

let weatherResponseData = []
let weatherWeeklyForecastResponseData = []
let debounceTimer;
let selectedCityName;

//#region suggestion search

async function fetchCitySuggestions(query) 
{
  const params = new URLSearchParams
  (
    {
      text: query,
      limit : 10,
      type : "city",
      apiKey: apiKeyGeoapify

    }
  );
  const fullURL = `${geoapifyBaseUrl}?${params.toString()}`;
  console.log("url : "+fullURL);
  try {
    const res = await fetch(fullURL);
    if (!res.ok) throw new Error("Fetch failed");
    const data = await res.json();
    return data.features;
  } catch (err) {
    console.error("Suggestion fetch error:", err);
    return [];
  }
}

function renderCitySuggestions(data, query) 
{
  const lowerQuery = query.toLowerCase();
  const items = data
    .filter(loc => (loc.properties.formatted || "").toLowerCase().includes(lowerQuery))
    .map(data => 
    {
      const props = data.properties;
      const latlon = props.lat +","+ props.lon;
      const formatted = props.formatted;
      const [cityName, ...rest] = formatted.split(",");
      const details = rest.join(",").trim();

      //const cityName = props.city || "";
      const countryName = props.country || "";
      const countyName = props.county || "";
      return `
        <li class="suggestion-item" data-city="${cityName}" data-latlon="${latlon}">
          <div class="text">
            <div class="cityName">${cityName}</div>
            <div class="details">${details}</div>
          </div>
          <span class="arrow">&gt;</span>
        </li>`;
    });

  suggestionBox.innerHTML = items.join("");
  suggestionBox.style.display = items.length ? "block" : "none";

  // Add click listeners
  suggestionBox.querySelectorAll(".suggestion-item").forEach(item => 
  {
    item.addEventListener("click", () => 
    {
      
      const city = item.dataset.city;
      const latlon = item.dataset.latlon;
      console.log(city);
      console.log(latlon);
      cityInput.value = city;
      suggestionBox.style.display = "none";
      SearchWeeklyWeatherForcast(latlon,city);
    });
  });
}

async function initSearch(query) 
{
  const results = await fetchCitySuggestions(query);
  console.log(results);
  renderCitySuggestions(results, query);
}

function debounceSearch(query) 
{
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => 
  {
    if (query.length > 2) initSearch(query);
  }, 600);
}

//#endregion

//#region weather function

async function SearchCurrentDataOfLocation(query) 
{
  console.log(query);
  weatherResponseData = await GetCurrentWeather(query); // Now safe to call
  
  if (!weatherResponseData || weatherResponseData.length === 0) return;
  console.log(weatherResponseData);
  // DisplayCurrentWeatherData(weatherResponseData);
  // DIsplayCurrentDateLocation(weatherResponseData);
}
async function SearchWeeklyWeatherForcast(query,location) 
{
  console.log("Search Weather For location :" + location +" LatLon:"+query);
  selectedCityName = location;
  weatherWeeklyForecastResponseData = await GetForecastWeatherForWeek(query); // Now safe to call
  
  if (!weatherWeeklyForecastResponseData || weatherWeeklyForecastResponseData.length === 0) return;
  
  DisplayCurrentWeatherData(weatherWeeklyForecastResponseData);

  DisplayForecastDataOfLocation(weatherWeeklyForecastResponseData);

  updateWeatherTheme(weatherWeeklyForecastResponseData.current.condition.text);
}
async function GetCurrentWeather(query)
{
  const params = new URLSearchParams
  (
    {
      q: query,
      key: weatherAPIKey,
      aqi:"no"
    }
  );
  const fullURL = `${weatherAPIBaseUrl}?${params.toString()}`;
  console.log("url : "+fullURL);
  try
  {
    const response = await fetch(fullURL);
    if (!response.ok) throw new Error("Failed to fetch current weather data");
    const data = await response.json();
    return data;
  }
  catch(err)
  {
    console.error("Failed:", err);
    return []; //Return empty array on error
  }

}

async function GetForecastWeatherForWeek(query) 
{
  const params = new URLSearchParams({
    q: query,
    key: weatherAPIKey,
    days: 7,       // today + 6 days
    aqi: "no",
    alerts: "no"
  });

  const fullURL = `${weatherForecastAPIBaseUrl}?${params.toString()}`;
  console.log("Forecast URL:", fullURL);

  try 
  {
    const response = await fetch(fullURL);
    if (!response.ok) throw new Error("Failed to fetch forecast data");
    const data = await response.json();
    return data; // contains forecast.forecastday[]
  } catch (err) {
    console.error("Forecast fetch failed:", err);
    return null;
  }
}

function DisplayCurrentWeatherData(data)
{
  console.log(data);
  document.querySelector(".temp").innerHTML = Math.round(data.current.temp_c);//"°c";
  document.querySelector(".condition-text").innerHTML = data.current.condition.text;
  document.querySelector("#humidity").innerHTML = data.current.humidity + "%";
  document.querySelector("#wind").innerHTML = data.current.wind_kph + " km/h";
  document.querySelector("#Precip").innerHTML = data.current.precip_mm + " mm";
  document.querySelector("#Pressure").innerHTML = data.current.pressure_mb + " mb";
  document.querySelector("#Sunrise").innerHTML = data.forecast.forecastday[0].astro.sunrise;
  document.querySelector("#Sunset").innerHTML = data.forecast.forecastday[0].astro.sunset;

  const iconUrl = data.current.condition.icon.startsWith('//') ? 'https:' + data.current.condition.icon : data.current.condition.icon;
  document.querySelector('#conditionIcon').src = iconUrl;
  const condition = data.current.condition.text.toLowerCase();

  const feelsLike = data.current.feelslike_c;
  const todayForecast = data.forecast.forecastday[0];
  const maxTemp = todayForecast.day.maxtemp_c;
  const minTemp = todayForecast.day.mintemp_c;
  document.querySelector(".temp-details").innerHTML = `Feels Like${feelsLike} | Max ${maxTemp}°c | Min${minTemp}°c`;

  const localtime = data.location.localtime;
  const [date] = localtime.split(" ");
  const formattedDate = formatPrettyDate(date);
  const weekday = new Date(date).toLocaleDateString("en-US", 
  {
    weekday: "long"
  });

  document.querySelector(".city-name").innerHTML = selectedCityName;
  document.querySelector(".date").innerHTML = formattedDate;
  document.querySelector(".week").innerHTML = weekday;
}
function DisplayForecastDataOfLocation(data)
{
  const forecast = data.forecast;
  const todayHourlyForecast = forecast.forecastday[0];

  renderHourlyForecast(todayHourlyForecast.hour)
  renderWeeklyForecast(forecast.forecastday)
}
function renderHourlyForecast(hourArray) 
{

  hourlyForecastContainer.innerHTML = ""; // Clear previous cards

  hourArray.forEach((hour) => 
  {
    const card = document.createElement("div");
    card.className = "forecast-card";

    const time = hour.time.split(" ")[1].slice(0, 5); // Extract HH:MM
    const icon = "https:" + hour.condition.icon; // Ensure full URL
    const temp = `${hour.temp_c}°C`;
    const condition = hour.condition.text;

    card.innerHTML = `
      <div class="forecast-hour">${time}</div>
      <img src="${icon}" alt="Condition" />
      <div class="forecast-temp">${temp}</div>
      <div class="forecast-condition">${condition}</div>
    `;

    hourlyForecastContainer.appendChild(card);
  });

  hourlyForecastContainer.scrollLeft = 0;
}
function renderWeeklyForecast(weekArray) 
{
  weeklyForecastContainer.innerHTML = ""; // Clear previous cards

  weekArray.forEach((day)=>
  {
    
    const localtime = day.date;

    
    const [date] = localtime.split(" ");
    
    const formattedDate = formatPrettyDate(date);
    const weekday = new Date(date).toLocaleDateString("en-US", 
    {
      weekday: "long"
    });

    const card = document.createElement("div");
    card.className = "forecast-card";

    const icon = "https:" + day.day.condition.icon; // Ensure full URL
    const temp = `${day.day.mintemp_c} / ${day.day.maxtemp_c} °C`;
    const condition = day.day.condition.text;

    card.innerHTML = `
      <div class="forecast-week">${weekday}</div>
      <img src="${icon}" alt="Condition" />
      <div class="forecast-tempMinMax">${temp}</div>
      <div class="forecast-condition">${condition}</div>
    `;

    weeklyForecastContainer.appendChild(card);
  });
}
// searchBtn.addEventListener("click",()=>{checkWeather(searchBox.value);});
//#endregion

//#region Utilities
function formatPrettyDate(dateStr) 
{
  const date = new Date(dateStr); // e.g., "2025-06-24"
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();

  const suffix =
    day % 10 === 1 && day !== 11 ? "st" :
    day % 10 === 2 && day !== 12 ? "nd" :
    day % 10 === 3 && day !== 13 ? "rd" : "th";

  return `${day}${suffix} ${month} ${year}`;
}

function updateWeatherTheme(conditionText)
{
  console.log("Condition: "+ conditionText);
  const body = document.body;
  const blocks = document.querySelectorAll('.weather-block');
  const blocks_bottom = document.querySelectorAll('.weather-bottom');
  
  body.className = 'theme-light'; // Reset to default
  blocks.forEach(block => {
    block.classList.remove(
      'weather-clear',
      'weather-cloudy',
      'weather-rainy',
      'weather-snowy',
      'weather-thunder'
    );
  });

  blocks_bottom.forEach(block => {
    block.classList.remove(
      'weather-clear-bottom',
      'weather-cloudy-bottom',
      'weather-rainy-bottom',
      'weather-snowy-bottom',
      'weather-thunder-bottom'
    );
  });

  // Mapping conditions to themes
  const lowerCond = conditionText.toLowerCase();
  let bgUrl = '';
  let styleClass = '';
  let styleBottomClass = '';

  if (lowerCond.includes('sun') || lowerCond.includes('clear')) 
  {
    bgUrl = 'url(images/bg_clear.jpg)';
    styleClass = 'weather-clear';
    styleBottomClass = 'weather-clear-bottom';
  }
  else if (lowerCond.includes('cloud')) 
  {
    bgUrl = 'url(images/bg_cloudy.jpg)';
    styleClass = 'weather-cloudy';
    styleBottomClass = 'weather-cloudy-bottom';
  }
  else if (lowerCond.includes('rain') || lowerCond.includes('drizzle')) 
  {
    bgUrl = 'url(images/bg_rain.jpg)';
    styleClass = 'weather-rainy';
    styleBottomClass = 'weather-rainy-bottom';
  }
  else if (lowerCond.includes('snow') || lowerCond.includes('ice')) 
  {
    bgUrl = 'url(images/bg_snow.jpg)';
    styleClass = 'weather-snowy';
    styleBottomClass = 'weather-snowy-bottom';
  }
  else if (lowerCond.includes('thunder') || lowerCond.includes('storm')) 
  {
    bgUrl = 'url(images/bg_thunder.jpg)';
    styleClass = 'weather-thunder';
    styleBottomClass = 'weather-thunder-bottom';
  }
  else 
  {
    bgUrl = 'url(images/bg_default.jpg)';
    styleClass = 'weather-clear';
    styleBottomClass = 'weather-clear-bottom';
  }

  body.style.backgroundImage = bgUrl;
  blocks.forEach(block => block.classList.add(styleClass));
  blocks_bottom.forEach(block => block.classList.add(styleBottomClass));
}

function main()
{
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      console.log("Latitude:", lat);
      console.log("Longitude:", lon);
      const latlon = lat+","+lon;
      SearchWeeklyWeatherForcast(latlon,"Current");
    },
    (error) => {
      console.error("Error getting location:", error.message);
    }
  );
} else {
  console.error("Geolocation is not supported by this browser.");
}
}
//#endregion


//#region input event function
cityInput.addEventListener("input", () => 
{
  const query = cityInput.value.trim();
  debounceSearch(query);
});
clearBtn.addEventListener("click", () => 
{
  cityInput.value = "";
  suggestionBox.style.display = "none";
  cityInput.focus();
});
weeklyBtn.addEventListener("click", () => 
{
  weeklyForecastContainer.classList.remove("hidden");
  hourlyForecastContainer.classList.add("hidden");
  weeklyBtn.classList.add("active");
  hourlyBtn.classList.remove("active");
});
hourlyBtn.addEventListener("click", () => 
{
  hourlyForecastContainer.classList.remove("hidden");
  weeklyForecastContainer.classList.add("hidden");
  hourlyBtn.classList.add("active");
  weeklyBtn.classList.remove("active");
});

//#endregion

main();
//updateWeatherTheme("snowy");
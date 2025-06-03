const apiKey = "5fa57508a48131c1e69d6738e9118870";
//const apiUrl = "https://pro.openweathermap.org/data/2.5/forecast/climate?q={city name},{country code}&appid={API key}";
const baseUrl = "https://api.openweathermap.org/data/2.5/weather";
const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");
const weatherIcon = document.querySelector(".weather-icon");

async function checkWeather(city)
{
  const params = new URLSearchParams
  (
    {
      q: city,
      units: "metric",
      appid: apiKey,
    }
  );
  const fullURL = `${baseUrl}?${params.toString()}`;
  console.log("url : "+fullURL);

  const response = await fetch(fullURL);

  if(response.status == 404)
  {
      document.querySelector(".error").style.display = "block";
      document.querySelector(".weather").style.display = "none";
  }
  else
  {
    var data = await response.json();
    console.log(data);

    document.querySelector(".city").innerHTML = data.name;
    document.querySelector(".temp").innerHTML = Math.round( data.main.temp) + "°c";
    document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
    document.querySelector(".wind").innerHTML = data.wind.speed +" km/h";

    if(data.weather[0].main="Clouds")
    {
      weatherIcon.src = "images/clouds.png"
    }
    else if(data.weather[0].main="Clear")
    {
      weatherIcon.src = "images/clear.png"
    }
    else if(data.weather[0].main="Rain")
    {
      weatherIcon.src = "images/rain.png"
    }
    else if(data.weather[0].main="Drizzle")
    {
      weatherIcon.src = "images/drizzle.png"
    }
    else if(data.weather[0].main="Mist")
    {
      weatherIcon.src = "images/mist.png"
    }
    else if(data.weather[0].main="Snow")
    {
      weatherIcon.src = "images/snow.png"
    }
    document.querySelector(".weather").style.display = "block";
  }
}

searchBtn.addEventListener("click",()=>{checkWeather(searchBox.value);});

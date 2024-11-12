document.addEventListener("DOMContentLoaded", function() {
    const searchBar = document.getElementById("search-bar");
    const searchButton = document.getElementById("search-button");
    const autoSuggest = document.getElementById("auto-suggest");
    const weatherInfo = document.getElementById("weather-info");
    const currentWeather = document.getElementById("current-weather");
    const forecastContainer = document.getElementById("forecast-container");
    const celsiusBtn = document.getElementById("celsius-btn");
    const fahrenheitBtn = document.getElementById("fahrenheit-btn");
    const useLocationButton = document.getElementById("use-location");
    const cityTitle = document.getElementById("city-title");

    let forecastData = [];
    let units = "metric";
    const apiKey = "f85f9c8bd8b3816803651c5bcee94488";

    // Переменная которая отслеживает текущее местоположение
    let currentLocation = {
        type: 'coords', // 'coords' или 'city'
        data: null
    };

    function fetchWeatherDataByCity(city) {
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`)
            .then(response => response.json())
            .then(data => {
                if (data.cod === "404") {
                    alert("City not found!");
                } else {
                    setCityTitle(data.name, data.sys.country);
                    displayCurrentWeather(data);
                    fetchForecastData(data.coord.lat, data.coord.lon);
                    currentLocation = {
                        type: 'city',
                        data: city
                    };
                }
            })
            .catch(error => console.error('Error fetching weather data:', error));
    }

    function fetchWeatherDataByCoords(lat, lon) {
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`)
            .then(response => response.json())
            .then(data => {
                setCityTitle(data.name, data.sys.country);
                displayCurrentWeather(data);
                fetchForecastData(lat, lon);
                currentLocation = {
                    type: 'coords',
                    data: { lat, lon }
                };
            })
            .catch(error => console.error('Error fetching weather data by coordinates:', error));
    }

    function fetchForecastData(lat, lon) {
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`)
            .then(response => response.json())
            .then(data => {
                const dailyData = data.list.filter(item => item.dt_txt.includes("12:00:00"));
                forecastData = dailyData;
                displayForecast(forecastData);
            })
            .catch(error => console.error('Error fetching forecast data:', error));
    }

    function setCityTitle(city, country) {
        cityTitle.textContent = `${city}, ${country}`;
    }

    function displayCurrentWeather(data) {
        currentWeather.innerHTML = `
            <img id="weather-icon" src="http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}">
            <div id="temperature">${Math.round(data.main.temp)}°${units === "metric" ? "C" : "F"}</div>
            <div id="humidity">Humidity: ${data.main.humidity}%</div>
            <div id="wind-speed">Wind: ${data.wind.speed} ${units === "metric" ? "m/s" : "mph"}</div>
            <div id="weather-condition">${capitalizeFirstLetter(data.weather[0].description)}</div>
        `;
        weatherInfo.style.display = "block";
    }

    function displayForecast(forecastData) {
        forecastContainer.innerHTML = "";
        forecastData.forEach(day => {
            const forecastDay = document.createElement('div');
            forecastDay.classList.add('forecast-day');
            const date = new Date(day.dt * 1000);
            const dateString = `${date.toLocaleString('en', { weekday: 'short' })}, ${date.getDate()} ${date.toLocaleString('en', { month: 'short' })}`;
            forecastDay.innerHTML = `
                <img src="http://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}">
                <p>${dateString}</p>
                <p><strong>${Math.round(day.main.temp_max)}°/${Math.round(day.main.temp_min)}°</strong></p>
                <p>${capitalizeFirstLetter(day.weather[0].description)}</p>
            `;
            forecastContainer.appendChild(forecastDay);
        });
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    searchButton.addEventListener("click", function() {
        const city = searchBar.value.trim();
        if (city) {
            fetchWeatherDataByCity(city);
            autoSuggest.innerHTML = "";
            autoSuggest.style.display = "none";
        }
    });

    searchBar.addEventListener("input", function() {
        const query = searchBar.value.trim();
        if (query.length > 2) {
            fetch(`https://api.openweathermap.org/data/2.5/find?q=${query}&type=like&sort=population&appid=${apiKey}`)
                .then(response => response.json())
                .then(data => {
                    autoSuggest.innerHTML = "";
                    if (data.list && data.list.length > 0) {
                        data.list.forEach(city => {
                            const suggestion = document.createElement("li");
                            suggestion.textContent = `${city.name}, ${city.sys.country}`;
                            suggestion.addEventListener("click", function() {
                                searchBar.value = city.name;
                                fetchWeatherDataByCity(city.name);
                                autoSuggest.innerHTML = "";
                                autoSuggest.style.display = "none";
                            });
                            autoSuggest.appendChild(suggestion);
                        });
                        autoSuggest.style.display = "block";
                    } else {
                        autoSuggest.style.display = "none";
                    }
                })
                .catch(error => console.error('Error fetching suggestions:', error));
        } else {
            autoSuggest.innerHTML = "";
            autoSuggest.style.display = "none";
        }
    });

    celsiusBtn.addEventListener("click", function() {
        if (units !== "metric") {
            units = "metric";
            updateUnits();
        }
    });

    fahrenheitBtn.addEventListener("click", function() {
        if (units !== "imperial") {
            units = "imperial";
            updateUnits();
        }
    });

    function updateUnits() {
        if (currentLocation.type === 'city') {
            fetchWeatherDataByCity(currentLocation.data);
        } else if (currentLocation.type === 'coords') {
            const { lat, lon } = currentLocation.data;
            fetchWeatherDataByCoords(lat, lon);
        }
    }

    useLocationButton.addEventListener("click", function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherDataByCoords(lat, lon);
                autoSuggest.innerHTML = "";
                autoSuggest.style.display = "none";
            }, function(error) {
                alert("Geolocation error: " + error.message);
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    });

    window.onload = () => {
        useLocationButton.click();
    };
});

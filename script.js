class WeatherApp {
    constructor() {
        this.apiKey = '82d142fddd0ec3952f54ce1c8e9dc2d7'; 
        this.baseUrl = 'https://api.openweathermap.org/data/2.5/';
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateTime();
        setInterval(() => this.updateTime(), 60000);
    }

    bindEvents() {
        const searchBtn = document.getElementById('searchBtn');
        const locationBtn = document.getElementById('locationBtn');
        const locationInput = document.getElementById('locationInput');

        searchBtn.addEventListener('click', () => this.searchWeather());
        locationBtn.addEventListener('click', () => this.getCurrentLocation());
        
        locationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchWeather();
            }
        });
    }

    async searchWeather() {
        const location = document.getElementById('locationInput').value.trim();
        if (!location) {
            this.showError('Please enter a city name');
            return;
        }

        try {
            const weatherData = await this.fetchWeatherByCity(location);
            this.displayWeather(weatherData);
        } catch (error) {
            console.error('Weather fetch error:', error);
            this.showError('City not found. Please check the spelling and try again.');
        }
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser');
            return;
        }

        this.showLoading();
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const weatherData = await this.fetchWeatherByCoords(latitude, longitude);
                    this.displayWeather(weatherData);
                } catch (error) {
                    console.error('Location weather error:', error);
                    this.showError('Unable to fetch weather for your location');
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                this.showError('Unable to retrieve your location');
            }
        );
    }

    async fetchWeatherByCity(city) {
        this.showLoading();
        
        try {
            // Fetch current weather
            const currentUrl = `${this.baseUrl}weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`;
            console.log('Fetching current weather:', currentUrl);
            
            const currentResponse = await fetch(currentUrl);
            
            if (!currentResponse.ok) {
                // If API key is invalid, show demo data
                if (currentResponse.status === 401) {
                    console.log('API key invalid, showing demo data');
                    return this.getDemoData(city);
                }
                throw new Error(`HTTP error! status: ${currentResponse.status}`);
            }
            
            const currentData = await currentResponse.json();
            console.log('Current weather data:', currentData);
            
            // Fetch forecast
            const forecastUrl = `${this.baseUrl}forecast?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`;
            const forecastResponse = await fetch(forecastUrl);
            
            let forecastData = null;
            if (forecastResponse.ok) {
                forecastData = await forecastResponse.json();
                console.log('Forecast data:', forecastData);
            }
            
            return { current: currentData, forecast: forecastData };
            
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    async fetchWeatherByCoords(lat, lon) {
        this.showLoading();
        
        try {
            // Fetch current weather
            const currentUrl = `${this.baseUrl}weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
            console.log('Fetching current weather by coords:', currentUrl);
            
            const currentResponse = await fetch(currentUrl);
            
            if (!currentResponse.ok) {
                // If API key is invalid, show demo data
                if (currentResponse.status === 401) {
                    console.log('API key invalid, showing demo data for location');
                    return this.getDemoData('Your Location');
                }
                throw new Error(`HTTP error! status: ${currentResponse.status}`);
            }
            
            const currentData = await currentResponse.json();
            
            // Fetch forecast
            const forecastUrl = `${this.baseUrl}forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
            const forecastResponse = await fetch(forecastUrl);
            
            let forecastData = null;
            if (forecastResponse.ok) {
                forecastData = await forecastResponse.json();
            }
            
            return { current: currentData, forecast: forecastData };
            
        } catch (error) {
            console.error('Fetch by coords error:', error);
            throw error;
        }
    }

    displayWeather(data) {
        try {
            const { current, forecast } = data;
            
            // Update location info
            document.getElementById('locationName').textContent = 
                `${current.name}, ${current.sys.country}`;
            
            // Update current weather
            document.getElementById('temp').textContent = Math.round(current.main.temp);
            document.getElementById('description').textContent = current.weather[0].description;
            document.getElementById('weatherIcon').src = 
                `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`;
            
            // Update weather details
            document.getElementById('feelsLike').textContent = `${Math.round(current.main.feels_like)}°C`;
            document.getElementById('humidity').textContent = `${current.main.humidity}%`;
            document.getElementById('windSpeed').textContent = `${current.wind ? current.wind.speed : 0} m/s`;
            document.getElementById('pressure').textContent = `${current.main.pressure} hPa`;
            document.getElementById('visibility').textContent = 
                `${current.visibility ? (current.visibility / 1000).toFixed(1) : 'N/A'} km`;
            
            // UV Index (usually not available in basic plan)
            document.getElementById('uvIndex').textContent = 'N/A';
            
            // Display forecast if available
            if (forecast && forecast.list) {
                this.displayForecast(forecast);
            }
            
            this.hideLoading();
            this.hideError();
            this.showWeatherData();
            
        } catch (error) {
            console.error('Display weather error:', error);
            this.showError('Error displaying weather data');
        }
    }

    displayForecast(forecastData) {
        try {
            const forecastContainer = document.getElementById('forecast');
            forecastContainer.innerHTML = '';
            
            // Group forecast by day
            const dailyForecasts = [];
            const processedDates = new Set();
            
            forecastData.list.forEach(item => {
                const date = new Date(item.dt * 1000);
                const dateString = date.toDateString();
                
                if (!processedDates.has(dateString) && dailyForecasts.length < 5) {
                    const hour = date.getHours();
                    if (hour >= 11 && hour <= 14) {
                        dailyForecasts.push(item);
                        processedDates.add(dateString);
                    }
                }
            });
            
            // Fill remaining slots with any available forecasts
            if (dailyForecasts.length < 5) {
                forecastData.list.forEach(item => {
                    const date = new Date(item.dt * 1000);
                    const dateString = date.toDateString();
                    
                    if (!processedDates.has(dateString) && dailyForecasts.length < 5) {
                        dailyForecasts.push(item);
                        processedDates.add(dateString);
                    }
                });
            }
            
            dailyForecasts.forEach(item => {
                const forecastItem = document.createElement('div');
                forecastItem.className = 'forecast-item';
                
                const date = new Date(item.dt * 1000);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                
                forecastItem.innerHTML = `
                    <div class="forecast-day">${dayName}</div>
                    <div class="forecast-icon">
                        <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" 
                             alt="${item.weather[0].description}">
                    </div>
                    <div class="forecast-temps">
                        <span class="forecast-high">${Math.round(item.main.temp_max)}°</span>
                        <span class="forecast-low">${Math.round(item.main.temp_min)}°</span>
                    </div>
                `;
                
                forecastContainer.appendChild(forecastItem);
            });
            
        } catch (error) {
            console.error('Display forecast error:', error);
        }
    }

    updateTime() {
        try {
            const now = new Date();
            const timeString = now.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const timeElement = document.getElementById('currentTime');
            if (timeElement) {
                timeElement.textContent = timeString;
            }
        } catch (error) {
            console.error('Update time error:', error);
        }
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('error').classList.add('hidden');
        document.getElementById('weatherData').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showError(message) {
        const errorDiv = document.getElementById('error');
        const errorParagraph = errorDiv.querySelector('p');
        if (errorParagraph) {
            errorParagraph.textContent = message;
        }
        errorDiv.classList.remove('hidden');
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('weatherData').classList.add('hidden');
    }

    hideError() {
        document.getElementById('error').classList.add('hidden');
    }

    showWeatherData() {
        document.getElementById('weatherData').classList.remove('hidden');
    }

    getDemoData(locationName) {
        // Demo data for when API key is invalid
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    current: {
                        name: locationName,
                        sys: { country: 'DEMO' },
                        main: {
                            temp: 22,
                            feels_like: 25,
                            humidity: 65,
                            pressure: 1013,
                            temp_max: 25,
                            temp_min: 18
                        },
                        weather: [{
                            description: 'partly cloudy',
                            icon: '02d'
                        }],
                        wind: { speed: 3.5 },
                        visibility: 10000
                    },
                    forecast: {
                        list: [
                            {
                                dt: Date.now() / 1000,
                                main: { temp_max: 25, temp_min: 18, temp: 22 },
                                weather: [{ icon: '02d', description: 'partly cloudy' }]
                            },
                            {
                                dt: (Date.now() / 1000) + 86400,
                                main: { temp_max: 28, temp_min: 20, temp: 24 },
                                weather: [{ icon: '01d', description: 'clear sky' }]
                            },
                            {
                                dt: (Date.now() / 1000) + 172800,
                                main: { temp_max: 23, temp_min: 16, temp: 19 },
                                weather: [{ icon: '10d', description: 'light rain' }]
                            },
                            {
                                dt: (Date.now() / 1000) + 259200,
                                main: { temp_max: 26, temp_min: 19, temp: 23 },
                                weather: [{ icon: '03d', description: 'scattered clouds' }]
                            },
                            {
                                dt: (Date.now() / 1000) + 345600,
                                main: { temp_max: 29, temp_min: 22, temp: 26 },
                                weather: [{ icon: '01d', description: 'clear sky' }]
                            }
                        ]
                    }
                });
            }, 1000);
        });
    }
}

// Initialize the weather app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Weather App...');
    try {
        new WeatherApp();
        console.log('Weather App initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Weather App:', error);
    }
});

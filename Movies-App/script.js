const API_KEY = '2c28ba44dc8d34cb0013f59c471c7f91';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
let movieList = [];
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

function displayMovies(movies) {
    const movieGrid = document.getElementById('movies-grid');
    movieGrid.innerHTML = '';

    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        movieCard.onclick = () => showMovieDetails(movie.id);

        movieCard.innerHTML = `
            <img src="${IMAGE_URL}${movie.poster_path}" alt="${movie.title}">
            <h2>${movie.title}</h2>
            <button class="watchlist-btn" onclick="addToWatchlist(event, ${movie.id})">
                ${watchlist.includes(movie.id) ? 'Remove from Watchlist' : 'Add to Watchlist'}
            </button>
        `;
        movieGrid.appendChild(movieCard);
    });
}

async function searchMovies(query) {
    const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}`);
    const data = await response.json();
    movieList = data.results;
    displayMovies(movieList);
}

function sortMovies(criteria) {
    let sortedMovies = [...movieList];
    if (criteria === 'popularity') {
        sortedMovies.sort((a, b) => b.popularity - a.popularity);
    } else if (criteria === 'release_date') {
        sortedMovies.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
    } else if (criteria === 'rating') {
        sortedMovies.sort((a, b) => b.vote_average - a.vote_average);
    }
    displayMovies(sortedMovies);
}

async function showMovieDetails(movieId) {
    const modal = document.getElementById('movie-details-modal');
    const detailsContainer = document.getElementById('movie-details');

    const movie = await fetchMovieDetails(movieId);

    detailsContainer.innerHTML = `
        <div class="modal-header">
            <h2 class="movie-title">${movie.title}</h2>
            <p class="movie-release-date">Release Date: ${movie.release_date}</p>
        </div>

        <div class="movie-poster">
            <img src="${IMAGE_URL}${movie.poster_path}" alt="${movie.title}" class="poster-img" />
        </div>

        <div class="movie-info">
            <h3>Synopsis</h3>
            <p>${movie.overview || 'No synopsis available'}</p>

            <h3>Rating</h3>
            <p>${movie.vote_average} / 10 (${movie.vote_count} votes)</p>

            <h3>Runtime</h3>
            <p>${movie.runtime} minutes</p>
        </div>

        <div class="movie-cast">
            <h3>Cast</h3>
            <ul>
                ${movie.cast ? movie.cast.map(actor => `
                    <li><strong>${actor.name}</strong> as <em>${actor.character}</em></li>
                `).join('') : 'No cast information available'}
            </ul>
        </div>

        <div class="movie-trailer">
            <h3>Trailer</h3>
            ${movie.trailer ? `
                <iframe src="https://www.youtube.com/embed/${movie.trailer}" frameborder="0" allowfullscreen></iframe>
            ` : 'No trailer available'}
        </div>

        <div class="movie-watchlist">
            <button class="watchlist-btn" onclick="addToWatchlist(event, ${movie.id})">
                ${watchlist.includes(movie.id) ? 'Remove from Watchlist' : 'Add to Watchlist'}
            </button>
        </div>
    `;

    modal.style.display = 'flex';
}

function closeMovieDetails() {
    const modal = document.getElementById('movie-details-modal');
    modal.style.display = 'none';
}

async function fetchMovieDetails(movieId) {
    const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
    const movie = await response.json();

    const castResponse = await fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`);
    const castData = await castResponse.json();

    const trailerResponse = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`);
    const trailerData = await trailerResponse.json();
    const trailer = trailerData.results.length ? trailerData.results[0].key : null;

    return {
        ...movie,
        cast: castData.cast,
        trailer: trailer,
    };
}

function addToWatchlist(event, movieId) {
    event.stopPropagation();

    if (watchlist.includes(movieId)) {
        watchlist = watchlist.filter(id => id !== movieId);
    } else {
        watchlist.push(movieId);
    }

    localStorage.setItem('watchlist', JSON.stringify(watchlist));

    displayMovies(movieList);
}

function showWatchlist() {
    const watchlistMovies = movieList.filter(movie => watchlist.includes(movie.id));
    displayMovies(watchlistMovies);
}

async function handleAutoSuggest() {
    const query = document.getElementById('search-input').value;
    const suggestContainer = document.getElementById('autosuggest-container');

    if (query.length === 0) {
        suggestContainer.innerHTML = '';
        suggestContainer.style.display = 'none';
        return;
    }

    const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}`);
    const data = await response.json();
    const suggestions = data.results.slice(0, 5);

    suggestContainer.innerHTML = suggestions
        .map(suggestion => `<div onclick="selectSuggestion('${suggestion.title}')">${suggestion.title}</div>`)
        .join('');
    suggestContainer.style.display = 'block';
}

function selectSuggestion(title) {
    document.getElementById('search-input').value = title;
    document.getElementById('autosuggest-container').style.display = 'none';
    searchMovies(title);
}

document.querySelector('.search-btn').addEventListener('click', () => {
    const query = document.getElementById('search-input').value;
    searchMovies(query);
});

document.getElementById('search-input').addEventListener('input', handleAutoSuggest);

window.onload = async () => {
    const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`);
    const data = await response.json();
    movieList = data.results;
    displayMovies(movieList);
};
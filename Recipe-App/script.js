const apiKey = '39dcb91acbfd4e6086dbd11abacf97a7';
const searchQuery = document.getElementById('search-bar');
const searchButton = document.getElementById('search-button');
const favoritesButton = document.getElementById('favorites-button');
const recipeContainer = document.getElementById('recipe-container');
const recipeModal = document.getElementById('recipe-modal');
const closeModal = document.querySelector('.close');
const modalRecipeTitle = document.getElementById('modal-recipe-title');
const modalRecipeImage = document.getElementById('modal-recipe-image');
const modalIngredients = document.getElementById('modal-ingredients');
const modalInstructions = document.getElementById('modal-instructions');
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

searchButton.addEventListener('click', searchRecipes);
favoritesButton.addEventListener('click', displayFavorites);

function searchRecipes() {
    const query = searchQuery.value;
    if (!query) return;

    fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${query}&apiKey=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            displayRecipes(data.results);
        });
}

function displayRecipes(recipes) {
    recipeContainer.innerHTML = '';
    recipes.forEach(recipe => {
        const card = createRecipeCard(recipe);
        recipeContainer.appendChild(card);
    });
}

function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.classList.add('recipe-card');
    const cardInner = document.createElement('div');
    cardInner.classList.add('recipe-card-inner');

    const img = document.createElement('img');
    img.src = recipe.image;
    cardInner.appendChild(img);

    const title = document.createElement('h3');
    title.innerText = recipe.title;
    cardInner.appendChild(title);

    const description = document.createElement('p');
    description.innerText = recipe.summary ? recipe.summary.substring(0, 100) + '...' : 'No description available';
    cardInner.appendChild(description);

    const buttons = document.createElement('div');
    buttons.classList.add('buttons');

    const seeFullRecipeButton = document.createElement('button');
    seeFullRecipeButton.innerText = 'Recipe';
    seeFullRecipeButton.addEventListener('click', () => openFullRecipe(recipe.id));
    buttons.appendChild(seeFullRecipeButton);

    const favoriteButton = document.createElement('button');
    favoriteButton.innerText = 'Favorite';
    favoriteButton.addEventListener('click', () => addToFavorites(recipe));
    buttons.appendChild(favoriteButton);

    cardInner.appendChild(buttons);
    card.appendChild(cardInner);
    return card;
}

function openFullRecipe(recipeId) {
    fetch(`https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}`)
        .then(response => response.json())
        .then(recipe => {
            modalRecipeTitle.innerText = recipe.title;
            modalRecipeImage.src = recipe.image;
            modalIngredients.innerHTML = '';
            recipe.extendedIngredients.forEach(ingredient => {
                const li = document.createElement('li');
                li.innerText = `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`;
                modalIngredients.appendChild(li);
            });
            modalInstructions.innerHTML = recipe.instructions || 'Instructions not available';
            recipeModal.style.display = 'flex';
        })
        .catch(error => {
            console.error('Error fetching full recipe:', error);
            alert('Sorry, we could not fetch the full recipe.');
        });
}

closeModal.addEventListener('click', () => {
    recipeModal.style.display = 'none';
});

function addToFavorites(recipe) {
    if (!favorites.some(fav => fav.id === recipe.id)) {
        favorites.push(recipe);
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }
}

function displayFavorites() {
    recipeContainer.innerHTML = '';
    favorites.forEach(recipe => {
        const card = createRecipeCard(recipe);
        recipeContainer.appendChild(card);
    });
}


searchQuery.addEventListener('input', getSuggestions);

function getSuggestions() {
    const query = searchQuery.value;
    if (query.length < 2) {
        suggestions.classList.add('hidden');
        return;
    }

    fetch(`https://api.spoonacular.com/recipes/autocomplete?query=${query}&apiKey=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            displaySuggestions(data);
        });
}

function displaySuggestions(suggestionsData) {
    const suggestions = document.getElementById('suggestions');
    suggestions.innerHTML = '';
    if (suggestionsData.length === 0) {
        suggestions.classList.add('hidden');
        return;
    }

    suggestionsData.forEach(item => {
        const suggestionItem = document.createElement('div');
        suggestionItem.classList.add('suggestion-item');
        suggestionItem.innerText = item.title;
        suggestionItem.addEventListener('click', () => {
            searchQuery.value = item.title;
            suggestions.classList.add('hidden');
        });
        suggestions.appendChild(suggestionItem);
    });
    suggestions.classList.remove('hidden');
}

document.addEventListener('click', (event) => {
    if (!event.target.closest('.search-container')) {
        document.getElementById('suggestions').classList.add('hidden');
    }
});
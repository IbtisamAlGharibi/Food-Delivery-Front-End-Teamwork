import { api } from "./api.js";

const restaurantsContainer = document.getElementById("restaurants-container");
const loadingSkeletons = document.getElementById("loading-skeletons");
const errorBanner = document.getElementById("error-banner");
const retryBtn = document.getElementById("retry-btn");
const emptyState = document.getElementById("empty-state");
const searchInput = document.getElementById("restaurant-search");
const chips = document.querySelectorAll(".chip");

let restaurants = [];
let currentCuisine = "All";
let debounceTimer = null;

window.addEventListener("DOMContentLoaded", initializePage);

function initializePage() {

    loadRestaurants();

    searchInput.addEventListener("input", debounceSearch);

    retryBtn.addEventListener("click", loadRestaurants);

    chips.forEach(chip => {

        chip.addEventListener("click", () => {

            chips.forEach(item => {
                item.classList.remove("chip--active");
            });

            chip.classList.add("chip--active");

            currentCuisine = chip.textContent.trim();

            loadRestaurants();

        });

    });

}

async function loadRestaurants() {

    showLoading();

    try {

        if (currentCuisine === "All") {

            restaurants = await api("/restaurants");

        } else {

            restaurants = await api(`/restaurants/cuisine/${currentCuisine}`);

        }

        hideLoading();
        hideError();

        filterRestaurants();

    } catch (error) {

        hideLoading();

        showError(error.message);

    }

}

function debounceSearch() {

    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(filterRestaurants, 300);

}

function filterRestaurants() {

    const keyword = searchInput.value.trim().toLowerCase();

    const filteredRestaurants = restaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(keyword)
    );

    renderRestaurants(filteredRestaurants);

}

function renderRestaurants(list) {

    restaurantsContainer.innerHTML = "";

    if (list.length === 0) {

        restaurantsContainer.classList.add("hidden");
        emptyState.classList.remove("hidden");

        return;

    }

    emptyState.classList.add("hidden");
    restaurantsContainer.classList.remove("hidden");

    list.forEach(restaurant => {

        const card = createRestaurantCard(restaurant);

        restaurantsContainer.appendChild(card);

    });

}

function createRestaurantCard(restaurant) {

    const card = document.createElement("article");

    card.className = "restaurant-card";

    card.innerHTML = `

        <div class="restaurant-card__image"></div>

        <div class="restaurant-card__body">

            <div class="restaurant-card__header-row">

                <h2 class="restaurant-card__title">

                    ${restaurant.name}

                </h2>

                <span class="restaurant-card__status ${restaurant.acceptingOrders ? "restaurant-card__status--open" : "restaurant-card__status--paused"}">

                    ${restaurant.acceptingOrders ? "Open" : "Paused"}

                </span>

            </div>

            <div class="restaurant-card__meta-row">

                <span class="restaurant-card__cuisine">

                    ${restaurant.cuisineType}

                </span>

                <span class="restaurant-card__rating">

                    ★ ${restaurant.averageRating ?? "N/A"}

                </span>

            </div>

            <p class="restaurant-card__fee">

                Fee <strong>${Number(restaurant.deliveryFee).toFixed(3)} OMR</strong>

                &middot;

                Min <strong>${Number(restaurant.minOrderAmount).toFixed(3)} OMR</strong>

            </p>

            <div class="restaurant-card__footer">

                <button
                    class="button button--primary view-menu-btn"
                    ${restaurant.acceptingOrders ? "" : "disabled"}>

                    View Menu

                </button>

            </div>

        </div>

    `;

    const viewMenuButton = card.querySelector(".view-menu-btn");

    viewMenuButton.addEventListener("click", () => {

        window.location.href = `menu.html?restaurantId=${restaurant.id}`;

    });

    return card;

}

function showLoading() {

    loadingSkeletons.classList.remove("hidden");

    restaurantsContainer.classList.add("hidden");

    emptyState.classList.add("hidden");

    hideError();

}

function hideLoading() {

    loadingSkeletons.classList.add("hidden");

}

function showError(message) {

    errorBanner.classList.remove("hidden");

    const messageElement = errorBanner.querySelector(".error-banner__message");

    messageElement.textContent = message;

}

function hideError() {

    errorBanner.classList.add("hidden");

}
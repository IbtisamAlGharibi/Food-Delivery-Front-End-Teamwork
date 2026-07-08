import { api } from "./api.js";

const MOCK_USER_ID = 1;
const queryParams = new URLSearchParams(window.location.search);
let currentRestaurantId = queryParams.get("restaurantId") || "1";
let activeCart = [];
let restaurantProfileContext = null;
const resNameEl = document.getElementById("res-name");
const resCuisineEl = document.getElementById("res-cuisine");
const resRatingEl = document.getElementById("res-rating");
const resEtaEl = document.getElementById("res-eta");

const combosGrid = document.getElementById("combos-grid");
const combosWrapper = document.getElementById("combos-wrapper");
const menuListStack = document.getElementById("menu-list");

const cartItemsContainer = document.getElementById("cart-items-container");
const emptyCartView = document.getElementById("empty-cart-view");
const cartBadgeCount = document.getElementById("cart-badge-count");

const billSubtotal = document.getElementById("bill-subtotal");
const billDelivery = document.getElementById("bill-delivery");
const billTotal = document.getElementById("bill-total");
const checkoutCta = document.getElementById("checkout-cta");
const minOrderPill = document.getElementById("min-order-pill");

const errorBanner = document.getElementById("error-banner");
const retryBtn = document.getElementById("retry-btn");

window.addEventListener("DOMContentLoaded", startAppPipeline);

function startAppPipeline() {
    loadRestaurantMenu();
    retryBtn.addEventListener("click", loadRestaurantMenu);
    checkoutCta.addEventListener("click", processCartCheckout);
}

async function loadRestaurantMenu() {
    try {
        errorBanner.classList.add("hidden");
        const allRestaurantsList = await api("/restaurants");
        restaurantProfileContext = allRestaurantsList.find(r => r.id == currentRestaurantId);

        if (!restaurantProfileContext) {
            throw new Error("Unable to identify the selected restaurant endpoint context.");
        }

        resNameEl.textContent = restaurantProfileContext.name;
        resCuisineEl.textContent = restaurantProfileContext.cuisineType;
        resRatingEl.textContent = Number(restaurantProfileContext.averageRating || 0).toFixed(1);
        resEtaEl.textContent = restaurantProfileContext.deliveryTime || "25-35 min";
        billDelivery.textContent = `${Number(restaurantProfileContext.deliveryFee).toFixed(3)} OMR`;
        const [menuCatalog, comboBundles] = await Promise.all([
            api(`/restaurants/${currentRestaurantId}/menu`),
            api(`/restaurants/${currentRestaurantId}/combos`).catch(() => [])
        ]);

        renderCatalogView(menuCatalog, comboBundles);
        refreshCartDisplay();

    } catch (err) {
        errorBanner.classList.remove("hidden");
    }
}

function renderCatalogView(items, combos) {
    menuListStack.innerHTML = "";
    combosGrid.innerHTML = "";
    if (combos && combos.length > 0) {
        combosWrapper.classList.remove("hidden");
        combos.forEach(combo => {
            const card = document.createElement("div");
            card.className = "combo-card";
            const isAvail = combo.available !== false;

            card.innerHTML = `
                <div class="combo-card__thumb"></div>
                <div class="combo-card__details">
                    <h3 class="combo-card__name">${combo.name}</h3>
                    <p class="combo-card__desc">${combo.description || "Special group combination platter selection."}</p>
                    <span class="combo-card__price">${Number(combo.price).toFixed(3)} OMR</span>
                </div>
                <div class="action-trigger-box" id="combo-action-${combo.id}"></div>
            `;
            combosGrid.appendChild(card);
            renderActionControls(`combo-action-${combo.id}`, combo, isAvail);
        });
    } else {
        combosWrapper.classList.add("hidden");
    }
    items.forEach(item => {
        const row = document.createElement("div");
        const isAvail = item.available !== false && item.isAvailable !== false;
        row.className = `menu-row ${!isAvail ? "menu-row--unavailable" : ""}`;

        row.innerHTML = `
            <div class="menu-row__meta">
                <div class="menu-row__thumb"></div>
                <div>
                    <h3 class="menu-row__title">${item.name}</h3>
                    <span class="menu-row__kcal">${item.calories || "320"} kcal</span>
                </div>
            </div>
            <span class="menu-row__price">${Number(item.price).toFixed(3)}</span>
            <div class="action-trigger-box" id="menu-action-${item.id}"></div>
        `;
        menuListStack.appendChild(row);
        renderActionControls(`menu-action-${item.id}`, item, isAvail);
    });
}

function renderActionControls(containerId, item, isAvailable) {
    const targetBox = document.getElementById(containerId);
    if (!targetBox) return;

    targetBox.innerHTML = "";
    const cartMatch = activeCart.find(c => c.id === item.id);

    if (!isAvailable) {
        targetBox.innerHTML = `<button class="btn-action-add" disabled>Out of stock</button>`;
        return;
    }

    if (cartMatch) {
        const widget = document.createElement("div");
        widget.className = "counter-widget";
        widget.innerHTML = `
            <button class="btn-counter-ctrl down-trigger">−</button>
            <span class="counter-widget__value">${cartMatch.quantity}</span>
            <button class="btn-counter-ctrl up-trigger">+</button>
        `;

        widget.querySelector(".down-trigger").addEventListener("click", () => alterQuantity(item.id, -1));
        widget.querySelector(".up-trigger").addEventListener("click", () => alterQuantity(item.id, 1));
        targetBox.appendChild(widget);
    } else {
        const addBtn = document.createElement("button");
        addBtn.className = "btn-action-add";
        addBtn.innerHTML = `<span>+</span> Add`;
        addBtn.addEventListener("click", () => appendToCartMemory(item));
        targetBox.appendChild(addBtn);
    }
}

function appendToCartMemory(item) {
    activeCart.push({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: 1
    });
    refreshCartDisplay();
    rebuildAllActionTriggers();
}

function alterQuantity(itemId, variance) {
    const match = activeCart.find(c => c.id === itemId);
    if (!match) return;

    match.quantity += variance;
    if (match.quantity <= 0) {
        activeCart = activeCart.filter(c => c.id !== itemId);
    }
    refreshCartDisplay();
    rebuildAllActionTriggers();
}

function rebuildAllActionTriggers() {
    const actionBoxes = document.querySelectorAll(".action-trigger-box");
    actionBoxes.forEach(box => {
        const componentId = box.id;
        const lookupId = componentId.split("-").pop();
        const activeItemData = { id: parseInt(lookupId) || lookupId };
        const cartMatch = activeCart.find(c => c.id == activeItemData.id);
        
        if (cartMatch) {
            box.innerHTML = `
                <div class="counter-widget">
                    <button class="btn-counter-ctrl down-trigger">−</button>
                    <span class="counter-widget__value">${cartMatch.quantity}</span>
                    <button class="btn-counter-ctrl up-trigger">+</button>
                </div>
            `;
            box.querySelector(".down-trigger").addEventListener("click", () => alterQuantity(cartMatch.id, -1));
            box.querySelector(".up-trigger").addEventListener("click", () => alterQuantity(cartMatch.id, 1));
        } else {
            box.innerHTML = `<button class="btn-action-add"><span>+</span> Add</button>`;
            box.querySelector(".btn-action-add").addEventListener("click", () => {
                loadRestaurantMenu();
            });
        }
    });
}

function refreshCartDisplay() {
    const existingRows = cartItemsContainer.querySelectorAll(".cart-line-item");
    existingRows.forEach(row => row.remove());

    if (activeCart.length === 0) {
        emptyCartView.classList.remove("hidden");
        cartBadgeCount.textContent = "0";
        billSubtotal.textContent = "0.000 OMR";
        billTotal.textContent = "0.000 OMR";
        checkoutCta.disabled = true;
        minOrderPill.classList.add("hidden");
        return;
    }

    emptyCartView.classList.add("hidden");
    let cumulativeSum = 0;
    let unitsCounter = 0;

    activeCart.forEach(item => {
        const extensionSum = item.price * item.quantity;
        cumulativeSum += extensionSum;
        unitsCounter += item.quantity;

        const cartItemRow = document.createElement("div");
        cartItemRow.className = "cart-line-item";
        cartItemRow.innerHTML = `
            <div class="cart-line-item__info">
                <p class="cart-line-item__name">${item.name}</p>
                <span class="cart-line-item__pricing-calc">${Number(item.price).toFixed(3)} OMR each</span>
            </div>
            <div class="cart-line-item__actions-group">
                <span class="cart-line-item__final-sum">${extensionSum.toFixed(3)}</span>
                <div class="counter-widget">
                    <button class="btn-counter-ctrl down-sub">−</button>
                    <span class="counter-widget__value">${item.quantity}</span>
                    <button class="btn-counter-ctrl up-sub">+</button>
                </div>
            </div>
        `;

        cartItemRow.querySelector(".down-sub").addEventListener("click", () => alterQuantity(item.id, -1));
        cartItemRow.querySelector(".up-sub").addEventListener("click", () => alterQuantity(item.id, 1));
        cartItemsContainer.appendChild(cartItemRow);
    });

    cartBadgeCount.textContent = unitsCounter;
    
    const deliveryFee = restaurantProfileContext ? Number(restaurantProfileContext.deliveryFee) : 0;
    const minOrderThreshold = restaurantProfileContext ? Number(restaurantProfileContext.minOrderAmount) : 0;
    const absoluteTotal = cumulativeSum + deliveryFee;

    billSubtotal.textContent = `${cumulativeSum.toFixed(3)} OMR`;
    billTotal.textContent = `${absoluteTotal.toFixed(3)} OMR`;
    minOrderPill.classList.remove("hidden");
    if (cumulativeSum >= minOrderThreshold) {
        minOrderPill.className = "min-order-pill";
        minOrderPill.textContent = `Min order ${minOrderThreshold.toFixed(3)} OMR met ✓`;
        checkoutCta.disabled = restaurantProfileContext.acceptingOrders === false;
    } else {
        minOrderPill.className = "min-order-pill min-order-pill--failed";
        minOrderPill.textContent = `Minimum order amount of ${minOrderThreshold.toFixed(3)} OMR not reached.`;
        checkoutCta.disabled = true;
    }
}
async function processCartCheckout() {
    try {
        checkoutCta.disabled = true;
        checkoutCta.textContent = "Processing...";
        const remoteOrderHeaderObj = await api(`/orders/customer/${MOCK_USER_ID}/restaurant/${currentRestaurantId}`, {
            method: "POST"
        });
        for (const lineItem of activeCart) {
            await api(`/orders/${remoteOrderHeaderObj.id}/items/${lineItem.id}`, {
                method: "POST",
                body: { quantity: lineItem.quantity }
            });
        }

        await api(`/orders/${remoteOrderHeaderObj.id}/confirm`, {
            method: "PUT"
        });

        activeCart = [];
        window.location.href = `track.html?orderId=${remoteOrderHeaderObj.id}`;

    } catch (err) {
        alert(`Checkout pipeline error encountered: ${err.message || "Please try again."}`);
        checkoutCta.disabled = false;
        checkoutCta.textContent = "Place Order";
    }
}
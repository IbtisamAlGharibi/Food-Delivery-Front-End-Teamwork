import { api } from "./api.js";

const orderId = new URLSearchParams(window.location.search).get("orderId");

const orderTitle = document.getElementById("order-title-label");
const restaurantName = document.getElementById("order-restaurant-subtitle");
const itemsContainer = document.getElementById("tracking-items-stack");
const totalPrice = document.getElementById("tracking-grand-total");
const countdown = document.getElementById("countdown-clock");
const statusBadge = document.getElementById("order-status-badge");

const driverEmpty = document.getElementById("driver-profile-empty");
const driverCard = document.getElementById("driver-profile-wrapper");
const driverName = document.getElementById("driver-name");
const driverId = document.getElementById("driver-id");

const fillLine = document.getElementById("timeline-fill-line");

const statuses = ["PENDING", "PREPARING", "READY", "DELIVERED"];

let pollInterval;
let timerInterval;
let seconds = 0;

window.addEventListener("DOMContentLoaded", init);

function init() {

    if (!orderId) {
        orderTitle.textContent = "Invalid Order";
        return;
    }

    orderTitle.textContent = `Order ORD-${orderId}`;

    loadOrder();

    pollInterval = setInterval(loadOrder, 5000);

}

async function loadOrder() {

    try {

        const order = await api(`/orders/${orderId}`);

        updateOrder(order);
        updateTimeline(order.status);

        const eta = await api(`/orders/${orderId}/eta`).catch(() => null);

        if (eta) {
            startCountdown(eta.etaMinutes);
        }

        if (order.status === "DELIVERED" || order.status === "CANCELLED") {

            clearInterval(pollInterval);
            clearInterval(timerInterval);

        }

    } catch (error) {

        console.error(error);

    }

}

function updateOrder(order) {

    restaurantName.textContent = order.restaurant?.name ?? "";

    itemsContainer.innerHTML = "";

    order.items.forEach(item => {

        itemsContainer.innerHTML += `
            <div class="menu-row">
                <div class="menu-row__meta">
                    <div>
                        <h4 class="menu-row__title">${item.menuItemName}</h4>
                        <span class="menu-row__kcal">Qty: ${item.quantity}</span>
                    </div>
                </div>

                <span class="menu-row__price">
                    ${(item.price * item.quantity).toFixed(3)} OMR
                </span>
            </div>
        `;

    });

    totalPrice.textContent = `${Number(order.totalPrice).toFixed(3)} OMR`;

    statusBadge.textContent = `STATUS: ${order.status}`;

    if (order.driver) {

        driverEmpty.classList.add("hidden");
        driverCard.classList.remove("hidden");

        driverName.textContent = order.driver.name;
        driverId.textContent = `ID: ${order.driver.id}`;

    }

}

function updateTimeline(status) {

    const index = statuses.indexOf(status);

    fillLine.style.width = `${index * 100 / 3}%`;

    statuses.forEach((item, i) => {

        const node = document.getElementById(`node-${item}`);

        node.className = "timeline-node";

        if (i < index) {

            node.classList.add("timeline-node--completed");

        } else if (i === index) {

            node.classList.add("timeline-node--current");

        }

    });

}

function startCountdown(minutes) {

    if (timerInterval || !minutes) return;

    seconds = minutes * 60;

    showTime();

    timerInterval = setInterval(() => {

        seconds--;

        if (seconds <= 0) {

            countdown.textContent = "Any minute now";

            clearInterval(timerInterval);

            return;

        }

        showTime();

    }, 1000);

}

function showTime() {

    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;

    countdown.textContent =
        `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

}
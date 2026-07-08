import { api } from "./api.js";

const today = new Date().toISOString().split("T")[0];

window.addEventListener("DOMContentLoaded", init);

function init() {
    document.getElementById("current-date-pill").textContent = today;
    loadDashboard();
}

async function loadDashboard() {
    try {

        const summary = await api(`/reports/platform/daily-summary?date=${today}`)
            .catch(() => ({
                totalOrders: 120,
                totalRevenue: 350.500,
                averageOrderValue: 2.920,
                cancellationRate: 3.5
            }));

        const hours = await api("/reports/platform/busiest-hours")
            .catch(() => []);

        const customers = await api("/reports/customers/top-loyalty")
            .catch(() => []);

        const drivers = await api("/reports/drivers/leaderboard")
            .catch(() => []);

        showSummary(summary);
        showChart(hours);
        showCustomers(customers);
        showDrivers(drivers);

    } catch (error) {
        console.error(error);
    }
}

function showSummary(data) {

    document.getElementById("metric-orders").textContent =
        data.totalOrders;

    document.getElementById("metric-revenue").textContent =
        Number(data.totalRevenue).toFixed(3) + " OMR";

    document.getElementById("metric-avg-basket").textContent =
        Number(data.averageOrderValue).toFixed(3) + " OMR";

    document.getElementById("metric-cancel-rate").textContent =
        data.cancellationRate + "%";
}

function showChart(hours) {

    const labels = [];
    const values = [];

    if (hours.length > 0) {

        hours.forEach(hour => {
            labels.push((hour.hour ?? hour.hourOfDay) + ":00");
            values.push(hour.orderCount ?? hour.count);
        });

    } else {

        labels.push("10:00", "12:00", "14:00", "16:00", "18:00");

        values.push(10, 25, 40, 35, 20);
    }

    new Chart(document.getElementById("busiest-hours-chart-canvas"), {

        type: "bar",

        data: {

            labels: labels,

            datasets: [{
                data: values,
                backgroundColor: "#1F4E79"
            }]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                }
            }
        }

    });

}

function showCustomers(customers) {
    const container = document.getElementById("loyalty-table-body");
    container.innerHTML = "";
    if (customers.length === 0) {

        customers = [
            { name: "Sara", points: 1200 },
            { name: "Ahmed", points: 950 },
            { name: "Fatma", points: 820 }
        ];

    }

    customers.forEach((customer, index) => {
        const row = document.createElement("div");
        row.className = "menu-row";
        row.innerHTML = `
            <div class="menu-row__meta">

                <strong>#${index + 1}</strong>

                <span class="menu-row__title">

                    ${customer.name || customer.customerName}

                </span>

            </div>

            <span class="menu-row__price">

                ${customer.points || customer.loyaltyPoints} pts

            </span>

        `;
        container.appendChild(row);
    });

}
function showDrivers(drivers) {

    const container = document.getElementById("driver-table-body");

    container.innerHTML = "";

    if (drivers.length === 0) {

        drivers = [
            { name: "Ali", completedOrders: 42, rating: 4.9 },
            { name: "Mohammed", completedOrders: 38, rating: 4.8 },
            { name: "Salim", completedOrders: 30, rating: 4.7 }
        ];

    }
    drivers.forEach(driver => {

        const row = document.createElement("div");

        row.className = "menu-row";

        row.innerHTML = `
            <div class="menu-row__meta">
                <div class="menu-row__thumb"></div>
                <div>

                    <h4 class="menu-row__title">

                        ${driver.name || driver.driverName}

                    </h4>

                    <span class="menu-row__kcal">

                        ${driver.completedOrders || driver.deliveryCount} Deliveries

                    </span>

                </div>

            </div>

            <span class="menu-row__price">

                ★ ${driver.rating || driver.averageRating}
            </span>

        `;
        container.appendChild(row);
    });

}
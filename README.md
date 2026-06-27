# Personal Budget Tracker

A lightweight, clean, and intuitive web application to track daily income and expenses. This project was built from scratch using **pure JavaScript** (Vanilla JS) to master DOM manipulation, event handling, and core algorithmic logic. It also features visual analytics powered by **Chart.js**.

---

# Features

* **Real-Time Calculation:** The global balance updates instantly whenever a transaction is added or removed.
* **Visual Indicators:** The balance dynamically changes color based on your financial status (green for positive, red for negative/overdrawn).
* **Currency Formatting:** All amounts and operations are restricted to two decimal places (`.toFixed(2)`) for precise cents management.
* **Dynamic History Log:** A clean list layout displaying past transactions with distinct color-coding for income (+) and expenses (-).
* **Advanced Category Filters:** Transactions can be classified into specific categories (Food, Housing, Leisure, Transport...) and filtered dynamically via a dropdown menu.
* **User Personalization:** Features a dynamic greeting input that automatically updates the dashboard title with the user's name.
* **Data Persistence:** Integrated browser `LocalStorage`. Your transactions, recurring budget plans, and username remain saved even if you refresh the page (`F5`) or close the browser.
* **Secure Reset:** A dedicated global reset button wipes the entire history and local storage after a user confirmation prompt.

# Visual Analytics & Interactive Charts
* **Expense Distribution (Pie Chart):** Automatically tracks and aggregates all expenses by category into an interactive pie chart, providing an immediate breakdown of your spending habits (hidden if no expenses are recorded).
* **12-Month Rolling Projection (Line Chart):** Simulates and draws the future path of your bank account balance over the next 12 months based on your custom forecast data.

# Intelligent Month-by-Month Forecasting (Excel-Style)
Unlike standard linear trackers, this app includes an advanced, time-aware forecasting engine:
* **Recurring Fixed Cashflow:** Set up continuous monthly income or expenses (e.g., *Rent, Base Salary, Subscriptions*).
* **One-Time / Seasonal Cashflow:** Target a specific month of the year for isolated financial events (e.g., *December Bonus, March Insurance Premium*). 
* **Dynamic Chronology:** The line chart automatically detects the current month from your computer's system clock. As the timeline sweeps across the upcoming 12 months, it dynamically triggers and injects these one-time events at the exact predicted month, creating a highly accurate financial simulation.

---

#  Tech Stack

The application avoids heavy frameworks to focus on core web engineering principles:

* **HTML5**: Semantic structure, input forms, and native canvas elements for rendering graphics.
* **CSS3**: Modern, responsive, and dark-themed interface inspired by modern developer environments.
* **JavaScript (ES6+)**: 
  * Dynamic DOM manipulation and structural updates.
  * Real-time event listening (`addEventListener`).
  * Structured data manipulation using JS Arrays, Objects, and Arrow functions.
  * Local state storage via JSON serialization in `LocalStorage`.
* **Chart.js (v4.4.4)**: Integrated via a fast, reliable CDN (jsDelivr) to handle the drawing, animation, and responsive layout of financial charts.

---

#  How to Run Locally

1. **Clone** or download this repository to your local computer.
2. Open the project folder in your favorite code editor (e.g., **Visual Studio Code**).
3. **Run with a Local Server (Required for Charts):** Due to modern browser security restrictions on the `file://` protocol, external scripts like Chart.js cannot be loaded by simply double-clicking the HTML file from your desktop.
   * Install the **Live Server** extension in VS Code.
   * Open `index.html` and click the **`Go Live`** button in the bottom-right corner of the editor status bar.
   * The app will automatically launch in your browser at `http://127.0.0.1:5500/index.html` with all charts fully functional.

---

# Live Deployment

This project is automatically built and hosted in the cloud. You can access the production environment from any device (Desktop, Tablet, or Mobile) here:

(https://axel19121997-arch.github.io/my-first-budget-app/)/]

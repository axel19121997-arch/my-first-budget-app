#  Personal Budget Tracker

A lightweight, clean, and intuitive web application to track daily income and expenses. This project was built from scratch using **pure JavaScript** (Vanilla JS) to master DOM manipulation, event handling, and core algorithmic logic.

---

#  Features

* **Real-Time Calculation:** The global balance updates instantly whenever a transaction is added.
* **Visual Indicators:** The balance dynamically changes color based on your financial status (green for positive, red for negative/overdrawn).
* **Currency Formatting:** All amounts and operations are restricted to two decimal places (`.toFixed(2)`) for precise cents management.
* **Dynamic History Log:** A clean list layout displaying your past transactions with distinct color-coding for income (+) and expenses (-).
* **Data Persistence:** Integrated browser `LocalStorage`. Your data remains saved even if you refresh the page (`F5`) or close the browser.
* **Secure Reset:** A dedicated global reset button wipes the history and storage after a user confirmation prompt.

---

# Tech Stack

No external frameworks or heavy libraries were used. The application relies entirely on standard web technologies:

* **HTML5**: Semantics, structures, and user input forms.
* **CSS3**: Modern, clean, and responsive design.
* **JavaScript (ES6)**: 
  * Dynamic DOM selection and updating.
  * Event listening (`addEventListener`).
  * Data handling using JavaScript arrays and objects.
  * JSON formatting and storage in `LocalStorage`.

---

# How to Run Locally

1. **Clone** or download this repository to your local machine.
2. Open the project folder.
3. Double-click the `index.html` file to launch it directly in your web browser (Chrome, Firefox, Edge, etc.).
4. *Optional:* You can also run it using the **Live Server** extension in Visual Studio Code.

---

# Future Roadmaps

* Add a category system (Food, Leisure, Salary...).
* Implement filters to view only expenses or only income.
* Integrate a visual pie chart to track expense distribution.

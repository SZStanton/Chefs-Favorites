const API_BASE = 'https://www.themealdb.com/api/json/v1/1/filter.php?i=';

// == Session Storage ==

const getOrders = () => JSON.parse(sessionStorage.getItem('orders') || '[]');

const saveOrders = orders =>
  sessionStorage.setItem('orders', JSON.stringify(orders));

const getLastOrderNum = () =>
  parseInt(sessionStorage.getItem('lastOrderNum') || '0', 10);

const saveLastOrderNum = num => sessionStorage.setItem('lastOrderNum', num);

// == Place Order ==
// Triggered on user clicking "order" button

document.getElementById('btn-order').addEventListener('click', placeOrder);

async function placeOrder() {
  const input = document.getElementById('ingredient-input');
  const feedback = document.getElementById('order-feedback');

  // Clean up input to match API format
  const ingredient = input.value.trim().toLowerCase().replace(/\s+/g, '_');

  if (!ingredient) {
    feedback.textContent = 'Please enter an ingredient.';
    return;
  }

  feedback.textContent = 'Checking the kitchen...';

  // Fetches meals that include ingredient provided
  // Additionally I added a try catch block in case of no response, probably overkill...
  try {
    const res = await fetch(API_BASE + ingredient);

    if (!res.ok) {
      throw new Error('Network response was not OK');
    }

    const data = await res.json();

    // Returns null if not found
    if (!data.meals) {
      feedback.textContent = `No dishes found for "${input.value}". Try another ingredient!`;
      input.value = '';
      return;
    }

    // Picks a random meal from matching ingredients
    const meal = data.meals[Math.floor(Math.random() * data.meals.length)];
    const orderNum = getLastOrderNum() + 1; // generates order number
    const order = { orderNum, description: meal.strMeal, completed: false }; // Create order object

    // Saves order
    const orders = getOrders();
    orders.push(order);
    saveOrders(orders);
    saveLastOrderNum(orderNum);

    feedback.textContent = `order #${orderNum} placed: "${meal.strMeal}"`;
    input.value = '';
    renderOrders(); // Refreshes UI
  } catch (error) {
    feedback.textContent =
      'Something went wrong while contacting the kitchen. Please try again.';
    console.error(error);
  }
}

// == Complete Order ==
// Marks an order as completed using order number

document
  .getElementById('btn-complete')
  .addEventListener('click', completeOrder);

function completeOrder() {
  const input = document.getElementById('complete-input');
  const feedback = document.getElementById('complete-feedback');
  const num = parseInt(input.value, 10);

  // If no orders completed
  if (num === 0) {
    feedback.textContent = 'No order completed.';
    input.value = '';
    return;
  }

  const orders = getOrders();
  // Finds order by the number
  const idx = orders.findIndex(o => o.orderNum === num);

  if (idx === -1) {
    feedback.textContent = `Order #${num} does not exist.`;
    input.value = '';
    return;
  }

  // Marks order as completed and saves it
  orders[idx].completed = true;
  saveOrders(orders);

  feedback.textContent = `Order #${num} marked as complete!`;
  input.value = '';
  renderOrders();
}

// == Pending Orders ==
// Displays orders not yet completed

function renderOrders() {
  const ordersList = document.getElementById('orders-list');
  const completeControls = document.getElementById('complete-controls');

  // Filters out completed orders
  const pending = getOrders().filter(o => !o.completed);

  // Clear previous feedback on re-rendering
  document.getElementById('complete-feedback').textContent = '';

  if (pending.length === 0) {
    ordersList.innerHTML = '<p class="empty-msg">No pending orders yet.</p>';
    completeControls.style.display = 'none';
    return;
  }

  // Each order is a ticket
  completeControls.style.display = 'flex';
  ordersList.innerHTML = pending
    .map(
      o =>
        `<div class="order-ticket">
    <span class="ticket-num">#${o.orderNum}</span>
    <span class="ticket-desc">${o.description}</span>
  </div>`,
    )
    .join('');
}

// == Initialization ==
// Renders existing orders on page load
renderOrders();

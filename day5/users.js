const loadButton = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusMessage = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

let users = [];

/*
 * Render any array of users.
 */
function renderUsers(list) {
  usersList.textContent = "";

  if (list.length === 0) {
    const noUsersMessage = document.createElement("li");
    noUsersMessage.textContent = "No users match your filter.";
    usersList.appendChild(noUsersMessage);
    return;
  }

  list.forEach((user) => {
    const listItem = document.createElement("li");

    const name = document.createElement("h2");
    name.textContent = user.name;

    const email = document.createElement("p");
    email.textContent = `Email: ${user.email}`;

    const city = document.createElement("p");
    city.textContent = `City: ${user.address.city}`;

    const company = document.createElement("p");
    company.textContent = `Company: ${user.company.name}`;

    listItem.appendChild(name);
    listItem.appendChild(email);
    listItem.appendChild(city);
    listItem.appendChild(company);

    usersList.appendChild(listItem);
  });
}

/*
 * Load users from the API.
 */
async function loadUsers() {
  loadButton.disabled = true;
  statusMessage.textContent = "Loading users...";
  usersList.textContent = "";

  try {
    const response = await fetch(
      "https://jsonplaceholder.typicode.com/users"
    );

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    users = await response.json();

    renderUsers(users);

    statusMessage.textContent = `Successfully loaded ${users.length} users.`;
  } catch (error) {
    users = [];

    statusMessage.textContent =
      "Unable to load users. Please try again.";

    console.error("Error loading users:", error);
  } finally {
    loadButton.disabled = false;
  }
}

/*
 * Filter users as the user types.
 */
filterInput.addEventListener("input", () => {
  const searchText = filterInput.value.trim().toLowerCase();

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchText)
  );

  renderUsers(filteredUsers);
});

/*
 * Load users when the button is clicked.
 */
loadButton.addEventListener("click", loadUsers);
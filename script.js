

const API_URL = 'https://jsonplaceholder.typicode.com/users';

// DOM 
const userForm = document.getElementById('userForm');
const userIdField = document.getElementById('userId');
const nameField = document.getElementById('name');
const emailField = document.getElementById('email');
const phoneField = document.getElementById('phone');
const companyField = document.getElementById('company');

const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const refreshBtn = document.getElementById('refreshBtn');

const tableBody = document.getElementById('userTableBody');
const loader = document.getElementById('loader');
const alertBox = document.getElementById('alertBox');

// Local cache of users (since JSONPlaceholder doesn't truly persist changes,
// we keep a working copy in memory so the UI reflects CRUD actions).
let users = [];
let isEditMode = false;

// ---------- Utility: show alert messages ----------
function showAlert(message, type = 'success') {
  alertBox.textContent = message;
  alertBox.className = `alert ${type}`;
  alertBox.classList.remove('hidden');
  setTimeout(() => alertBox.classList.add('hidden'), 3000);
}

// ---------- READ: Fetch all users (GET) ----------
async function fetchUsers() {
  loader.classList.remove('hidden');
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
    const data = await response.json();
    users = data;
    renderTable();
  } catch (error) {
    console.error('Fetch error:', error);
    showAlert(`Failed to load users: ${error.message}`, 'error');
  } finally {
    loader.classList.add('hidden');
  }
}

// ---------- Render table rows ----------
function renderTable() {
  tableBody.innerHTML = '';

  if (users.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#999;">No users found.</td></tr>`;
    return;
  }

  users.forEach(user => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user.id}</td>
      <td>${escapeHtml(user.name)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>${escapeHtml(user.phone || '-')}</td>
      <td>${escapeHtml(user.company?.name || '-')}</td>
      <td>
        <button class="btn-edit" onclick="editUser(${user.id})">Edit</button>
        <button class="btn-delete" onclick="deleteUser(${user.id})">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Basic HTML escaping to avoid injection when rendering user data
function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ---------- CREATE: Add new user (POST) ----------
async function createUser(userData) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
    const newUser = await response.json();

    // JSONPlaceholder doesn't really save it, so we add it locally
    // with a generated id so the UI reflects the change.
    newUser.id = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
    users.unshift(newUser);
    renderTable();
    showAlert('User created successfully!', 'success');
  } catch (error) {
    console.error('Create error:', error);
    showAlert(`Failed to create user: ${error.message}`, 'error');
  }
}

// ---------- UPDATE: Edit existing user (PUT) ----------
async function updateUser(id, userData) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
    const updatedUser = await response.json();

    // Update local cache to reflect the change in the UI
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...userData, id };
    }
    renderTable();
    showAlert('User updated successfully!', 'success');
  } catch (error) {
    console.error('Update error:', error);
    showAlert(`Failed to update user: ${error.message}`, 'error');
  }
}

// ---------- DELETE: Remove user (DELETE) ----------
async function deleteUser(id) {
  const confirmed = confirm('Are you sure you want to delete this user?');
  if (!confirmed) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Server responded with status ${response.status}`);

    users = users.filter(u => u.id !== id);
    renderTable();
    showAlert('User deleted successfully!', 'success');
  } catch (error) {
    console.error('Delete error:', error);
    showAlert(`Failed to delete user: ${error.message}`, 'error');
  }
}

// ---------- Edit button handler: populate form ----------
function editUser(id) {
  const user = users.find(u => u.id === id);
  if (!user) return;

  isEditMode = true;
  userIdField.value = user.id;
  nameField.value = user.name || '';
  emailField.value = user.email || '';
  phoneField.value = user.phone || '';
  companyField.value = user.company?.name || '';

  formTitle.textContent = `Edit User #${user.id}`;
  submitBtn.textContent = 'Update User';
  cancelBtn.classList.remove('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- Cancel edit mode ----------
function resetForm() {
  isEditMode = false;
  userForm.reset();
  userIdField.value = '';
  formTitle.textContent = 'Add New User';
  submitBtn.textContent = 'Add User';
  cancelBtn.classList.add('hidden');
}

// ---------- Form submit handler (Create or Update) ----------
userForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const userData = {
    name: nameField.value.trim(),
    email: emailField.value.trim(),
    phone: phoneField.value.trim(),
    company: { name: companyField.value.trim() }
  };

  if (!userData.name || !userData.email) {
    showAlert('Name and Email are required.', 'error');
    return;
  }

  if (isEditMode) {
    const id = parseInt(userIdField.value, 10);
    await updateUser(id, userData);
  } else {
    await createUser(userData);
  }

  resetForm();
});

// ---------- Button events ----------
cancelBtn.addEventListener('click', resetForm);
refreshBtn.addEventListener('click', fetchUsers);

// Make handlers available to inline onclick attributes
window.editUser = editUser;
window.deleteUser = deleteUser;

// ---------- Initial load ----------
fetchUsers();
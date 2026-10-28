/* College Library Management System — CodePen demo only.
   Real authentication, shared database and email resets require a backend. */

const $ = (s) => document.querySelector(s);
const app = $("#app");
const headerActions = $("#header-actions");

const COURSES = [
  "B.Com",
  "BBA",
  "B.A. Tamil",
  "B.A. English",
  "B.Sc. Computer Science"
];

const seedBooks = [
  {
    id: 1,
    title: "Financial Accounting",
    author: "S. P. Jain",
    isbn: "9781000000011",
    category: "Commerce",
    course: "B.Com",
    total: 8,
    issued: 2
  },
  {
    id: 2,
    title: "Principles of Management",
    author: "P. C. Tripathi",
    isbn: "9781000000012",
    category: "Management",
    course: "BBA",
    total: 6,
    issued: 1
  },
  {
    id: 3,
    title: "தமிழ் இலக்கிய வரலாறு",
    author: "மு. வரதராசன்",
    isbn: "9781000000013",
    category: "Tamil",
    course: "B.A. Tamil",
    total: 5,
    issued: 1
  },
  {
    id: 4,
    title: "English Poetry",
    author: "Selected Authors",
    isbn: "9781000000014",
    category: "English",
    course: "B.A. English",
    total: 7,
    issued: 0
  },
  {
    id: 5,
    title: "Programming in C++",
    author: "E. Balagurusamy",
    isbn: "9781000000015",
    category: "Computer Science",
    course: "B.Sc. Computer Science",
    total: 10,
    issued: 3
  },
  {
    id: 6,
    title: "Database Management Systems",
    author: "Raghu Ramakrishnan",
    isbn: "9781000000016",
    category: "Computer Science",
    course: "B.Sc. Computer Science",
    total: 8,
    issued: 2
  }
];

const read = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

let users = read("clms_users", []);
let books = read("clms_books", seedBooks);
let loans = read("clms_loans", []);
let notices = read("clms_notices", []);
let session = read("clms_session", null);

let page = "Dashboard";
let profileOpen = false;

let catalogSearch = "";
let catalogCourse = "All Courses";
let catalogCategory = "All Categories";
let catalogAvailability = "All Books";

let selectedBookId = null;
let selectedStudentId = null;

function save() {
  localStorage.setItem("clms_users", JSON.stringify(users));
  localStorage.setItem("clms_books", JSON.stringify(books));
  localStorage.setItem("clms_loans", JSON.stringify(loans));
  localStorage.setItem("clms_notices", JSON.stringify(notices));
  localStorage.setItem("clms_session", JSON.stringify(session));
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.style.display = "block";

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    el.style.display = "none";
  }, 2800);
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function addNotice(message, target = "all") {
  notices.unshift({
    id: Date.now() + Math.random(),
    message,
    target,
    date: new Date().toLocaleDateString()
  });

  save();
}

function currentUser() {
  return session
    ? users.find(u => u.id === session.userId)
    : null;
}

function isAdmin() {
  return currentUser()?.role === "Admin";
}

function setPage(next) {
  page = next;
  profileOpen = false;
  render();
}

function logout() {
  session = null;
  page = "Dashboard";
  save();
  render();
  toast("You have logged out.");
}

function renderHeader() {
  const user = currentUser();

  if (!user) {
    headerActions.innerHTML = `
      <button class="btn btn-light"
        onclick="showLogin('Admin')">
        Admin Log In
      </button>

      <button class="btn"
        onclick="showLogin('Student')">
        Student Log In
      </button>
    `;
    return;
  }

  const count = notices.filter(n =>
    n.target === "all" ||
    n.target === user.role ||
    n.target === user.username
  ).length;

  headerActions.innerHTML = `
    <button class="btn btn-light"
      onclick="setPage('Notifications')"
      title="Notifications"
      aria-label="Notifications">
      🔔
      <span class="notification-count">${count}</span>
    </button>

    <div class="profile-menu">
      <button class="btn" onclick="toggleProfile()">
        👤 ${escapeHTML(user.fullName.split(" ")[0])} ▾
      </button>

      ${profileOpen ? `
        <div class="profile-dropdown">
          <button onclick="setPage('My Profile')">
            👤 My Profile
          </button>

          <button onclick="setPage('Account Settings')">
            ⚙ Account Settings
          </button>

          <button onclick="setPage('Change Password')">
            🔑 Change Password
          </button>

          <button onclick="logout()">
            ↪ Logout
          </button>
        </div>
      ` : ""}
    </div>
  `;
}

function showLogin(role = "Student") {
  profileOpen = false;
  renderHeader();

  app.innerHTML = `
    <section class="login-layout">
      <div class="welcome-panel">
        <div class="welcome-copy">
          <p class="eyebrow">LEARN · READ · GROW</p>

          <h2>
            Welcome to the<br>
            College Library
          </h2>

          <p>
            Access books, manage your requests, and make the
            most of your library resources.
          </p>
        </div>

        <div class="welcome-features">
          <div>
            <span>▤</span>
            <b>Find Books</b>
            <small>Search the collection</small>
          </div>

          <div>
            <span>♧</span>
            <b>Manage Requests</b>
            <small>Request and track</small>
          </div>

          <div>
            <span>◷</span>
            <b>View History</b>
            <small>Track your loans</small>
          </div>
        </div>
      </div>

      <div class="login-area">
        <section class="card auth-wrap login-card">
          <div class="login-logo">▤</div>

          <div class="role-choice" aria-label="Choose login type">
            <button
              type="button"
              class="role-box ${role === "Admin" ? "active" : ""}"
              onclick="showLogin('Admin')">
              <span class="role-icon">🛡️</span>
              <strong>Admin</strong>
              <small>Library management</small>
            </button>

            <button
              type="button"
              class="role-box ${role === "Student" ? "active" : ""}"
              onclick="showLogin('Student')">
              <span class="role-icon">🎓</span>
              <strong>Student</strong>
              <small>Browse and borrow books</small>
            </button>
          </div>

          <h2>${role} Log In</h2>

          <p class="subtitle">
            Sign in to access your ${role.toLowerCase()}
            library dashboard.
          </p>

          <form id="login-form">
            <label for="login-username">Email or Username</label>
            <input
              id="login-username"
              required
              autocomplete="username"
              placeholder="Enter your email or username">

            <label for="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              required
              autocomplete="current-password"
              placeholder="Enter your password">

            <div class="login-options">
              <label class="remember-label">
                <input type="checkbox" id="remember-me">
                Remember me
              </label>

              <button
                type="button"
                class="link-btn"
                onclick="showForgotPassword()">
                Forgot Password?
              </button>
            </div>

            <button class="btn btn-full" type="submit">
              Log In <span>→</span>
            </button>
          </form>

          <div class="auth-links">
            ${role === "Admin"
              ? `<button class="link-btn"
                   onclick="showAdminRegister()">
                   Don't have an account? Register
                 </button>`
              : `<span>For new registration, contact the library.</span>`
            }
          </div>

          <div class="warning">
            Demo prototype: real email verification and secure
            authentication require a backend service.
          </div>
        </section>
      </div>
    </section>
  `;

  $("#login-form").addEventListener("submit", e => {
    e.preventDefault();

    const username = $("#login-username").value.trim();
    const password = $("#login-password").value;

    const user = users.find(u =>
      (
        u.username.toLowerCase() === username.toLowerCase() ||
        (u.email || "").toLowerCase() === username.toLowerCase()
      ) &&
      u.password === password &&
      u.role === role &&
      u.active !== false
    );

    if (!user) {
      return toast("Login failed. Check your details or account role.");
    }

    session = { userId: user.id };
    page = "Dashboard";

    save();
    render();

    toast(`Welcome, ${user.fullName}!`);
  });
}

function showAdminRegister() {
  renderHeader();

  app.innerHTML = `
    <section class="card auth-wrap">
      <h2>Admin Registration</h2>

      <p class="subtitle">
        Create the first Admin account for this demo.
      </p>

      ${
        users.some(u => u.role === "Admin")
          ? `
            <div class="warning">
              An Admin account already exists in this browser.
              Additional Admin registration is disabled in this demo.
              Ask the existing Admin to manage access.
            </div>

            <button class="btn btn-full"
              onclick="showLogin('Admin')">
              Return to Admin Log In
            </button>
          `
          : `
            <form id="admin-register">
              <label>Full name</label>
              <input name="fullName" required maxlength="80">

              <label>Email address</label>
              <input name="email" type="email" required>

              <label>Username</label>
              <input name="username" required minlength="4"
                autocomplete="username">

              <label>Password</label>
              <input name="password" type="password"
                required minlength="6" autocomplete="new-password">

              <label>Confirm password</label>
              <input name="confirm" type="password"
                required minlength="6" autocomplete="new-password">

              <button class="btn btn-full" type="submit">
                Create Admin Account
              </button>
            </form>

            <div class="warning">
              This is local demo registration, not secure production
              authentication. Use a sample password only.
            </div>

            <button class="link-btn" onclick="showLogin('Admin')">
              Back to Admin Log In
            </button>
          `
      }
    </section>
  `;

  const form = $("#admin-register");

  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();

      const data = Object.fromEntries(new FormData(form));

      if (data.password !== data.confirm) {
        return toast("Passwords do not match.");
      }

      if (users.some(u =>
        u.username.toLowerCase() === data.username.trim().toLowerCase()
      )) {
        return toast("That username already exists.");
      }

      const user = {
        id: Date.now(),
        role: "Admin",
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        username: data.username.trim(),
        password: data.password,
        active: true,
        course: ""
      };

      users.push(user);
      save();

      toast("Admin account created. You can now log in.");

      showLogin("Admin");
      $("#login-username").value = user.username;
    });
  }
}

function showForgotPassword() {
  renderHeader();

  app.innerHTML = `
    <section class="card auth-wrap recovery-card">
      <h2>Forgot Password?</h2>

      <p class="subtitle">
        Enter the email address registered to your account.
        A real website would send a one-time password to this email.
      </p>

      <form id="forgot-form">
        <label>Registered email address</label>
        <input
          name="email"
          type="email"
          required
          autocomplete="email"
          placeholder="you@example.com">

        <button class="btn btn-full" type="submit">
          Continue
        </button>
      </form>

      <div class="warning">
        CodePen cannot send real email OTPs. This prototype
        simulates the verification step locally; connect a
        backend/email service before using it publicly.
      </div>

      <button class="link-btn" onclick="showLogin('Student')">
        Back to Log In
      </button>
    </section>
  `;

  $("#forgot-form").addEventListener("submit", e => {
    e.preventDefault();

    const email = new FormData(e.currentTarget)
      .get("email")
      .trim()
      .toLowerCase();

    const user = users.find(u =>
      (u.email || "").toLowerCase() === email
    );

    if (!user) {
      return toast(
        "No account with that registered email was found in this browser."
      );
    }

    showDemoOtp(user.id);
  });
}

function showDemoOtp(userId) {
  const demoOtp = String(
    Math.floor(100000 + Math.random() * 900000)
  );

  renderHeader();

  app.innerHTML = `
    <section class="card auth-wrap recovery-card">
      <h2>Verify Email</h2>

      <p class="subtitle">
        Enter the one-time code to continue to password reset.
      </p>

      <div class="notice">
        <strong>Demo OTP: ${demoOtp}</strong><br>
        This code is displayed here for testing only.
        It has not been emailed.
      </div>

      <form id="otp-form">
        <label>One-time password</label>
        <input
          name="otp"
          inputmode="numeric"
          pattern="[0-9]{6}"
          maxlength="6"
          required
          placeholder="Enter 6-digit code">

        <button class="btn btn-full" type="submit">
          Verify OTP
        </button>
      </form>

      <button class="link-btn" onclick="showForgotPassword()">
        Use another email
      </button>
    </section>
  `;

  $("#otp-form").addEventListener("submit", e => {
    e.preventDefault();

    const entered = new FormData(e.currentTarget)
      .get("otp")
      .trim();

    if (entered !== demoOtp) {
      return toast("Incorrect OTP. Please try again.");
    }

    showDemoReset(userId);
  });
}

function showDemoReset(userId) {
  renderHeader();

  app.innerHTML = `
    <section class="card auth-wrap recovery-card">
      <h2>Set a New Password</h2>

      <p class="subtitle">
        Create a new password. You do not need to enter
        your current password.
      </p>

      <form id="reset-form">
        <label>New password</label>
        <input
          name="password"
          type="password"
          required
          minlength="6"
          autocomplete="new-password">

        <label>Confirm new password</label>
        <input
          name="confirm"
          type="password"
          required
          minlength="6"
          autocomplete="new-password">

        <button class="btn btn-full" type="submit">
          Save New Password
        </button>
      </form>

      <div class="warning">
        Demo only: password changes are stored in this browser.
        Production password resets must validate OTPs on a secure server.
      </div>
    </section>
  `;

  $("#reset-form").addEventListener("submit", e => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.currentTarget));

    if (data.password !== data.confirm) {
      return toast("Passwords do not match.");
    }

    const user = users.find(u => u.id === userId);

    if (!user) {
      return showForgotPassword();
    }

    user.password = data.password;

    save();
    toast("Demo password updated.");
    showLogin(user.role);
  });
}

function render() {
  renderHeader();

  if (!session || !currentUser()) {
    session = null;
    showLogin("Student");
    return;
  }

  const user = currentUser();
  const admin = user.role === "Admin";

  const nav = admin
    ? [
        "Dashboard",
        "Manage Books",
        "Manage Students",
        "Issue Books",
        "Return Books",
        "Issue & Return History",
        "Reports",
        "My Profile"
      ]
    : [
        "Dashboard",
        "Book Catalog",
        "My Issued Books",
        "Borrowing History",
        "Due Dates",
        "My Profile"
      ];

  if (
    !nav.includes(page) &&
    page !== "Notifications" &&
    page !== "Change Password" &&
    page !== "Account Settings" &&
    page !== "Book Details" &&
    page !== "View Student Issues" &&
    page !== "Edit Student Returns"
  ) {
    page = "Dashboard";
  }

  const totalCopies = books.reduce(
    (s, b) => s + Number(b.total || 0),
    0
  );

  const availableCopies = books.reduce(
    (s, b) => s + Math.max(
      0,
      Number(b.total || 0) - Number(b.issued || 0)
    ),
    0
  );

  const activeLoans = loans.filter(
    l => !l.returned && l.status !== "Pending"
  );

  const stats = admin
    ? [
        ["Total Books", totalCopies],
        [
          "Issued Books",
          books.reduce((s, b) => s + Number(b.issued || 0), 0)
        ],
        ["Available Books", availableCopies],
        [
          "Total Students",
          users.filter(
            u => u.role === "Student" && u.active !== false
          ).length
        ]
      ]
    : [
        ["Total Library Books", totalCopies],
        [
          "My Issued Books",
          activeLoans.filter(l => l.studentId === user.id).length
        ],
        ["Available Books", availableCopies],
        [
          "My Returned Books",
          loans.filter(
            l => l.studentId === user.id && l.returned
          ).length
        ]
      ];

  const statHTML = stats.map(([label, value]) => `
    <div class="stat">
      <p>${label}</p>
      <strong>${value}</strong>
    </div>
  `).join("");

  const noticeCount = notices.filter(n =>
    n.target === "all" ||
    n.target === user.role ||
    n.target === user.username
  ).length;

  app.innerHTML = `
    <div class="dashboard-head">
      <div>
        <h2>${admin ? "Admin Dashboard" : "Student Dashboard"}</h2>
        <div class="muted">
          Welcome back, ${escapeHTML(user.fullName)} ·
          ${escapeHTML(user.role)}
        </div>
      </div>

      ${
        admin
          ? `<button class="btn" onclick="setPage('Manage Books')">
               ＋ Add New Book
             </button>`
          : `<button class="btn" onclick="setPage('Book Catalog')">
               Open Book Catalog
             </button>`
      }
    </div>

    <div class="dashboard-notice">
      <span class="notice-symbol">🔔</span>

      <div>
        <strong>Library notifications</strong>
        <p>
          ${
            noticeCount
              ? `You have ${noticeCount} library update(s).
                 Open the bell icon to view details.`
              : "You're all caught up. New library updates will appear here."
          }
        </p>
      </div>
    </div>

    <div class="stats">${statHTML}</div>

    <div class="layout">
      <nav class="sidebar">
        ${nav.map(n => `
          <button
            class="nav-btn ${page === n ? "active" : ""}"
            onclick="setPage('${n}')">
            ${navIcon(n)} ${n}
          </button>
        `).join("")}
      </nav>

      <section class="content">
        ${renderPage(user, page)}
      </section>
    </div>
  `;
}

function navIcon(n) {
  return ({
    "Dashboard": "▦",
    "Manage Books": "📚",
    "Manage Students": "👥",
    "Issue Books": "📤",
    "Return Books": "📥",
    "Issue & Return History": "◷",
    "Reports": "▤",
    "Book Catalog": "⌕",
    "My Issued Books": "📖",
    "Borrowing History": "◷",
    "Due Dates": "📅",
    "My Profile": "👤",
    "Change Password": "🔑",
    "Account Settings": "⚙"
  })[n] || "•";
}

function renderPage(user, p) {
  if (p === "Dashboard") {
    return `
      <div class="card">
        <h2>Quick Overview</h2>

        <p class="subtitle">
          ${
            isAdmin()
              ? "Manage books, student accounts and borrowing activity from the menu."
              : "Browse the book catalog, check availability and review your borrowing records."
          }
        </p>

        <div class="notice">
          This demo saves changes in this browser.
          A production website needs a secure backend and shared database.
        </div>
      </div>

      ${
        isAdmin()
          ? `
            <div class="card">
              <h2>Recent Activity</h2>
              ${
                loans.length
                  ? loans.slice(-5).reverse().map(l => `
                      <p>
                        📘 ${escapeHTML(l.title)} —
                        ${
                          l.returned
                            ? "Returned"
                            : escapeHTML(l.status || "Issued")
                        }
                        to ${escapeHTML(l.studentName)}
                      </p>
                    `).join("")
                  : `<p class="empty">No borrowing activity yet.</p>`
              }
            </div>
          `
          : `
            <div class="card">
              <h2>Library Guide</h2>
              <p>
                Use Book Catalog to search by title, author or ISBN,
                then filter by course, category and availability.
                To borrow a book, send a request for library staff approval.
              </p>
            </div>
          `
      }
    `;
  }

  if (p === "Manage Books") {
    return isAdmin() ? renderManageBooks() : renderCatalog();
  }

  if (p === "Manage Students") {
    return isAdmin() ? renderStudents() : "";
  }

  if (p === "Issue Books") {
    return isAdmin() ? renderIssueBooks() : "";
  }

  if (p === "Return Books") {
    return isAdmin() ? renderReturnBooks() : "";
  }

  if (p === "Issue & Return History") {
    return isAdmin() ? renderHistory() : "";
  }

  if (p === "Book Catalog") return renderCatalog();

  if (p === "My Issued Books") {
    return renderMyLoans(user, false);
  }

  if (p === "Borrowing History") {
    return renderMyLoans(user, true);
  }

  if (p === "Due Dates") return renderDueDates(user);

  if (p === "Reports") {
    return isAdmin() ? renderReports() : "";
  }

  if (p === "Notifications") return renderNotifications(user);

  if (p === "My Profile" || p === "Account Settings") {
    return renderMyProfile(user, p);
  }

  if (p === "Change Password") {
    return renderChangePassword(user);
  }

  if (p === "Book Details") {
    return renderBookDetails(selectedBookId);
  }

  if (p === "View Student Issues") {
    return renderStudentLoanDetails(selectedStudentId, false);
  }

  if (p === "Edit Student Returns") {
    return renderStudentLoanDetails(selectedStudentId, true);
  }

  return `<div class="card">Select a menu item.</div>`;
}

function categories() {
  return [
    ...new Set(
      books.map(b => (b.category || "General").trim()).filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b));
}

function renderManageBooks() {
  const rows = books.map((b, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHTML(b.title)}</td>
      <td>${escapeHTML(b.author)}</td>
      <td>${escapeHTML(b.isbn)}</td>
      <td>${escapeHTML(b.course)}</td>
      <td>${escapeHTML(b.category)}</td>
      <td>${b.total}</td>
      <td>${b.total - b.issued}</td>
      <td>
        <button class="btn btn-small"
          onclick="viewBook(${b.id})">View</button>

        <button class="btn btn-small"
          onclick="editBook(${b.id})">Edit</button>

        <button class="btn btn-small btn-danger"
          onclick="deleteBook(${b.id})">Delete</button>
      </td>
    </tr>
  `).join("");

  return `
    <div class="card">
      <h2>＋ Add New Book</h2>

      <form id="book-form" class="grid-2">
        <div>
          <label>Book Name / Title</label>
          <input name="title" required maxlength="180">
        </div>

        <div>
          <label>Author</label>
          <input name="author" required>
        </div>

        <div>
          <label>ISBN</label>
          <input name="isbn" required>
        </div>

        <div>
          <label>Course</label>
          <select name="course" required>
            ${COURSES.map(c => `<option>${c}</option>`).join("")}
          </select>
        </div>

        <div>
          <label>Book Category</label>
          <input
            name="category"
            list="category-options"
            required
            placeholder="Select or type a new category">

          <datalist id="category-options">
            ${categories().map(c =>
              `<option value="${escapeHTML(c)}">`
            ).join("")}
          </datalist>

          <small class="muted">
            Enter a new category to add it automatically to the student filter.
          </small>
        </div>

        <div>
          <label>Publisher</label>
          <input name="publisher">
        </div>

        <div>
          <label>Publication Year</label>
          <input name="year" type="number" min="1000" max="2100">
        </div>

        <div>
          <label>Total Copies</label>
          <input name="total" type="number" min="1" step="1" value="1" required>
        </div>

        <div class="full-row">
          <label>Description (optional)</label>
          <textarea name="description" rows="2"></textarea>
        </div>

        <div>
          <button class="btn" type="submit">＋ Add Book</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h2>Manage Books</h2>

      <div class="toolbar">
        <input
          id="admin-book-search"
          placeholder="Search book, author, ISBN or course…">
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Book Name</th>
              <th>Author</th>
              <th>ISBN</th>
              <th>Course</th>
              <th>Category</th>
              <th>Total</th>
              <th>Available</th>
              <th>Activity</th>
            </tr>
          </thead>

          <tbody id="admin-book-rows">
            ${rows || `<tr><td colspan="9">No books have been added.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderCatalog() {
  const cats = categories();

  const filtered = books.filter(b => {
    const q = catalogSearch.toLowerCase();

    const match = `${b.title} ${b.author} ${b.isbn}`
      .toLowerCase()
      .includes(q);

    return match &&
      (catalogCourse === "All Courses" || b.course === catalogCourse) &&
      (catalogCategory === "All Categories" || b.category === catalogCategory) &&
      (
        catalogAvailability === "All Books" ||
        (
          catalogAvailability === "Available"
            ? b.total > b.issued
            : b.total <= b.issued
        )
      );
  });

  return `
    <div class="card">
      <div class="catalog-top">
        <div class="catalog-search">
          <label for="catalog-search">Book Catalog Search</label>

          <input
            id="catalog-search"
            value="${escapeHTML(catalogSearch)}"
            placeholder="Search book name, author or ISBN…">
        </div>

        <div class="catalog-filters">
          <h3>⚙ Filter</h3>

          <label>Course</label>
          <select id="catalog-course">
            <option>All Courses</option>
            ${COURSES.map(c => `
              <option ${catalogCourse === c ? "selected" : ""}>
                ${c}
              </option>
            `).join("")}
          </select>

          <label>Category</label>
          <select id="catalog-category">
            <option>All Categories</option>
            ${cats.map(c => `
              <option ${catalogCategory === c ? "selected" : ""}>
                ${escapeHTML(c)}
              </option>
            `).join("")}
          </select>

          <label>Availability</label>
          <select id="catalog-availability">
            <option ${catalogAvailability === "All Books" ? "selected" : ""}>
              All Books
            </option>
            <option ${catalogAvailability === "Available" ? "selected" : ""}>
              Available
            </option>
            <option ${catalogAvailability === "Unavailable" ? "selected" : ""}>
              Unavailable
            </option>
          </select>

          <button class="btn btn-small" onclick="clearCatalogFilters()">
            Clear Filters
          </button>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Book List</h2>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Serial Number</th>
              <th>Book Name</th>
              <th>Author</th>
              <th>Total Copies</th>
              <th>Available Copies</th>
              <th>Activity</th>
            </tr>
          </thead>

          <tbody>
            ${
              filtered.map((b, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${escapeHTML(b.title)}</td>
                  <td>${escapeHTML(b.author)}</td>
                  <td>${b.total}</td>
                  <td>${b.total - b.issued}</td>
                  <td>
                    <button class="btn btn-small"
                      onclick="viewBook(${b.id})">
                      View Details
                    </button>

                    <button class="btn btn-small"
                      onclick="requestBook(${b.id})"
                      ${b.total <= b.issued ? "disabled" : ""}>
                      Issue
                    </button>
                  </td>
                </tr>
              `).join("") ||
              `<tr><td colspan="6">No matching books found.</td></tr>`
            }
          </tbody>
        </table>
      </div>

      <p class="muted">
        Issue requests are sent to library staff for approval.
        Only staff can officially issue books.
      </p>
    </div>
  `;
}

function clearCatalogFilters() {
  catalogSearch = "";
  catalogCourse = "All Courses";
  catalogCategory = "All Categories";
  catalogAvailability = "All Books";
  render();
}

function viewBook(id) {
  selectedBookId = id;
  setPage("Book Details");
}

function renderBookDetails(id) {
  const b = books.find(x => x.id === id);

  if (!b) {
    return `
      <div class="card">
        <p>Book not found.</p>
        <button class="btn"
          onclick="setPage(isAdmin()?'Manage Books':'Book Catalog')">
          Back
        </button>
      </div>
    `;
  }

  return `
    <div class="card">
      <h2>Book Details</h2>

      <dl class="details-grid">
        ${
          [
            ["Book Name", b.title],
            ["Author", b.author],
            ["ISBN", b.isbn],
            ["Course", b.course],
            ["Category", b.category],
            ["Publisher", b.publisher || "—"],
            ["Publication Year", b.year || "—"],
            ["Description", b.description || "No description provided"],
            ["Total Copies", b.total],
            ["Available Copies", b.total - b.issued],
            ["Issued Copies", b.issued]
          ].map(([k, v]) => `
            <div>
              <dt>${k}</dt>
              <dd>${escapeHTML(v)}</dd>
            </div>
          `).join("")
        }
      </dl>

      <button class="btn"
        onclick="setPage(isAdmin()?'Manage Books':'Book Catalog')">
        Back to ${isAdmin() ? "Manage Books" : "Book Catalog"}
      </button>
    </div>
  `;
}

function renderStudents() {
  const students = users.filter(u => u.role === "Student");

  return `
    <div class="card">
      <h2>＋ Add New Student</h2>

      <form id="student-form" class="grid-2">
        <div>
          <label>Full name</label>
          <input name="fullName" required>
        </div>

        <div>
          <label>Student ID / Roll number</label>
          <input name="studentId" required>
        </div>

        <div>
          <label>Course</label>
          <select name="course">
            ${COURSES.map(c => `<option>${c}</option>`).join("")}
          </select>
        </div>

        <div>
          <label>Year of study</label>
          <select name="year">
            <option>First Year</option>
            <option>Second Year</option>
            <option>Third Year</option>
          </select>
        </div>

        <div>
          <label>Email</label>
          <input name="email" type="email" required>
        </div>

        <div>
          <label>Username</label>
          <input name="username" required minlength="4">
        </div>

        <div>
          <label>Temporary password</label>
          <input name="password" type="password" required minlength="6">
        </div>

        <div>
          <label>Confirm password</label>
          <input name="confirm" type="password" required minlength="6">
        </div>

        <div>
          <button class="btn" type="submit">Create Student</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h2>Student Accounts</h2>

      <div class="toolbar">
        <input id="student-search"
          placeholder="Search name, ID, username or course…">
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Student Name</th>
              <th>Student ID</th>
              <th>Course</th>
              <th>Email</th>
              <th>Username</th>
              <th>Status</th>
              <th>Activity</th>
            </tr>
          </thead>

          <tbody>
            ${
              students.map((s, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${escapeHTML(s.fullName)}</td>
                  <td>${escapeHTML(s.studentId || "—")}</td>
                  <td>${escapeHTML(s.course || "—")}</td>
                  <td>${escapeHTML(s.email)}</td>
                  <td>${escapeHTML(s.username)}</td>
                  <td>${s.active === false ? "Inactive" : "Active"}</td>
                  <td>
                    <button class="btn btn-small"
                      onclick="viewStudent(${s.id})">View</button>

                    <button class="btn btn-small"
                      onclick="editStudent(${s.id})">Edit</button>

                    <button class="btn btn-small btn-danger"
                      onclick="deleteStudent(${s.id})">Delete</button>
                  </td>
                </tr>
              `).join("") ||
              `<tr><td colspan="8">No student accounts created yet.</td></tr>`
            }
          </tbody>
        </table>
      </div>

      <p class="muted">
        Student accounts are created by library staff.
        Passwords are not displayed.
      </p>
    </div>
  `;
}

function renderIssueBooks() {
  const active = loans.filter(
    l => !l.returned && l.status !== "Pending"
  );

  const students = users.filter(
    u => u.role === "Student" && u.active !== false
  );

  const pending = loans.filter(
    l => l.status === "Pending" && !l.returned
  );

  const studentRows = [...new Set(active.map(l => l.studentId))]
    .map((id, i) => {
      const s = users.find(u => u.id === id);
      const list = active.filter(l => l.studentId === id);

      return `
        <tr data-search="${escapeHTML([
          s?.fullName,
          s?.studentId,
          s?.course,
          ...list.map(l => l.title + " " + (l.isbn || ""))
        ].join(" "))}">
          <td>${i + 1}</td>
          <td>${escapeHTML(s?.fullName || list[0].studentName)}</td>
          <td>${escapeHTML(s?.course || "—")}</td>
          <td>${list.length}</td>
          <td>
            <button class="btn btn-small"
              onclick="viewStudent(${id})">View</button>
          </td>
        </tr>
      `;
    }).join("");

  return `
    <div class="card">
      <h2>＋ Add New Issue</h2>

      <form id="issue-form" class="grid-2">
        <div>
          <label>Student Name</label>
          <select name="studentId" required>
            ${students.map(s => `
              <option value="${s.id}">
                ${escapeHTML(s.fullName)}
              </option>
            `).join("")}
          </select>
        </div>

        <div>
          <label>Student ID</label>
          <input name="studentCode"
            placeholder="Enter student ID to confirm" required>
        </div>

        <div>
          <label>Book Name</label>
          <select name="bookId" required>
            ${
              books.filter(b => b.total > b.issued).map(b => `
                <option value="${b.id}">
                  ${escapeHTML(b.title)}
                  (${b.total - b.issued} available)
                </option>
              `).join("")
            }
          </select>
        </div>

        <div>
          <label>ISBN</label>
          <input name="isbn" required placeholder="Enter ISBN to confirm">
        </div>

        <div>
          <label>Issue Date</label>
          <input
            name="issueDate"
            type="date"
            value="${new Date().toISOString().slice(0, 10)}"
            required>
        </div>

        <div>
          <label>Return Due Date</label>
          <input name="dueDate" type="date" required>
        </div>

        <div>
          <button class="btn" type="submit"
            ${!students.length || !books.some(b => b.total > b.issued)
              ? "disabled"
              : ""}>
            Confirm Issue
          </button>
        </div>
      </form>
    </div>

    ${
      pending.length
        ? `
          <div class="card">
            <h2>Student Issue Requests</h2>

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Book</th>
                    <th>Requested</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  ${pending.map(l => `
                    <tr>
                      <td>${escapeHTML(l.studentName)}</td>
                      <td>${escapeHTML(l.title)}</td>
                      <td>${escapeHTML(l.issueDate)}</td>
                      <td>
                        <button class="btn btn-small"
                          onclick="approveRequest(${l.id})">Approve</button>

                        <button class="btn btn-small btn-danger"
                          onclick="rejectRequest(${l.id})">Reject</button>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        `
        : ""
    }

    <div class="card">
      <h2>Currently Issued Books</h2>

      <div class="toolbar">
        <input id="issue-search"
          placeholder="Search student name or book name…">
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Serial Number</th>
              <th>Student Name</th>
              <th>Course</th>
              <th>Total Books Issued</th>
              <th>Activity</th>
            </tr>
          </thead>

          <tbody>
            ${studentRows || `<tr><td colspan="5">No active issue records.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderReturnBooks() {
  const active = loans.filter(
    l => !l.returned && l.status !== "Pending"
  );

  const ids = [...new Set(active.map(l => l.studentId))];

  return `
    <div class="card">
      <h2>Return Books</h2>

      <div class="toolbar">
        <input id="return-search"
          placeholder="Search student name or book name…">
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Serial Number</th>
              <th>Student Name</th>
              <th>Course</th>
              <th>Total Books Issued</th>
              <th>Activity</th>
            </tr>
          </thead>

          <tbody>
            ${
              ids.map((id, i) => {
                const s = users.find(u => u.id === id);
                const list = active.filter(l => l.studentId === id);

                return `
                  <tr data-search="${escapeHTML([
                    s?.fullName,
                    s?.studentId,
                    s?.course,
                    ...list.map(l => l.title + " " + (l.isbn || ""))
                  ].join(" "))}">
                    <td>${i + 1}</td>
                    <td>${escapeHTML(s?.fullName || list[0].studentName)}</td>
                    <td>${escapeHTML(s?.course || "—")}</td>
                    <td>${list.length}</td>
                    <td>
                      <button class="btn btn-small"
                        onclick="viewStudent(${id})">View</button>

                      <button class="btn btn-small"
                        onclick="editStudentReturns(${id})">Edit</button>
                    </td>
                  </tr>
                `;
              }).join("") ||
              `<tr><td colspan="5">No active issue records.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderStudentLoanDetails(studentId, editable) {
  const s = users.find(u => u.id === studentId);

  if (!s) {
    return `<div class="card">Student not found.</div>`;
  }

  const list = loans.filter(
    l => l.studentId === studentId &&
      !l.returned &&
      l.status !== "Pending"
  );

  return `
    <div class="card">
      <h2>${editable ? "Edit Return Records" : "Student Issue Details"}</h2>

      <p>
        <b>Student Name:</b> ${escapeHTML(s.fullName)}
        &nbsp;
        <b>Student ID:</b> ${escapeHTML(s.studentId || "—")}
      </p>

      <p><b>Course:</b> ${escapeHTML(s.course || "—")}</p>

      ${
        editable
          ? `<button class="btn btn-small"
               onclick="editStudent(${s.id})">
               Edit Student Details
             </button>`
          : ""
      }

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Book Name</th>
              <th>Book ISBN</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Status</th>
              ${editable ? "<th>Action</th>" : ""}
            </tr>
          </thead>

          <tbody>
            ${
              list.map((l, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${escapeHTML(l.title)}</td>
                  <td>${escapeHTML(
                    l.isbn ||
                    books.find(b => b.id === l.bookId)?.isbn ||
                    "—"
                  )}</td>
                  <td>${escapeHTML(l.issueDate || "—")}</td>
                  <td>${escapeHTML(l.dueDate || "—")}</td>
                  <td>${escapeHTML(l.status || "Issued")}</td>

                  ${
                    editable
                      ? `
                        <td>
                          <button class="btn btn-small btn-success"
                            onclick="markReturned(${l.id})">Returned</button>

                          <button class="btn btn-small"
                            onclick="markOverdue(${l.id})">Overdue</button>

                          <button class="btn btn-small"
                            onclick="renewLoan(${l.id})">Renewal</button>
                        </td>
                      `
                      : ""
                  }
                </tr>
              `).join("") ||
              `<tr><td colspan="${editable ? 7 : 6}">
                No active books for this student.
              </td></tr>`
            }
          </tbody>
        </table>
      </div>

      <button class="btn" onclick="setPage('Return Books')">
        Back to Return Books
      </button>
    </div>
  `;
}

function renderHistory() {
  const rows = loans.slice().reverse().map((l, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHTML(l.studentName)}</td>
      <td>${escapeHTML(l.title)}</td>
      <td>${escapeHTML(l.issueDate || "—")}</td>
      <td>${escapeHTML(l.dueDate || "—")}</td>
      <td>${escapeHTML(l.actualReturnDate || "—")}</td>
      <td>${escapeHTML(l.status || (l.returned ? "Returned" : "Issued"))}</td>
    </tr>
  `).join("");

  return `
    <div class="card">
      <h2>Issue & Return History</h2>

      <div class="toolbar">
        <input id="history-search"
          placeholder="Search student, book, student ID or ISBN…">
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Student</th>
              <th>Book</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Actual Return Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            ${rows || `<tr><td colspan="7">No history records.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderMyLoans(user, history) {
  const mine = loans.filter(l =>
    l.studentId === user.id &&
    (history || !l.returned) &&
    l.status !== "Pending"
  );

  return `
    <div class="card">
      <h2>${history ? "Borrowing History" : "My Issued Books"}</h2>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Book</th>
              <th>ISBN</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Actual Return Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            ${
              mine.map((l, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${escapeHTML(l.title)}</td>
                  <td>${escapeHTML(l.isbn || "—")}</td>
                  <td>${escapeHTML(l.issueDate || "—")}</td>
                  <td>${escapeHTML(l.dueDate || "—")}</td>
                  <td>${escapeHTML(l.actualReturnDate || "—")}</td>
                  <td>
                    <span class="status ${l.returned ? "" : "out"}">
                      ${escapeHTML(l.status || (l.returned ? "Returned" : "Issued"))}
                    </span>
                  </td>
                </tr>
              `).join("") ||
              `<tr><td colspan="7">
                No ${history ? "borrowing history" : "currently issued books"} to display.
              </td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderDueDates(user) {
  const today = new Date();

  const mine = loans.filter(l =>
    l.studentId === user.id &&
    !l.returned &&
    l.status !== "Pending"
  );

  return `
    <div class="card">
      <h2>Due Dates</h2>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Book</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            ${
              mine.map(l => {
                const due = l.dueDate
                  ? new Date(l.dueDate + "T23:59:59")
                  : null;

                const overdue = due && due < today;

                return `
                  <tr>
                    <td>${escapeHTML(l.title)}</td>
                    <td>${escapeHTML(l.dueDate || "Not set")}</td>
                    <td>
                      <span class="status ${overdue ? "out" : ""}">
                        ${overdue ? "Overdue" : "Due soon / Issued"}
                      </span>
                    </td>
                  </tr>
                `;
              }).join("") ||
              `<tr><td colspan="3">You have no active due dates.</td></tr>`
            }
          </tbody>
        </table>
      </div>

      <p class="muted">
        Any overdue fee is determined by library policy and staff.
      </p>
    </div>
  `;
}

function renderNotifications(user) {
  const mine = notices.filter(n =>
    n.target === "all" ||
    n.target === user.role ||
    n.target === user.username
  );

  return `
    <div class="card">
      <h2>Notifications</h2>

      ${
        mine.length
          ? mine.map(n => `
              <div class="notice">
                <strong>${escapeHTML(n.date)}</strong>
                <p>${escapeHTML(n.message)}</p>
              </div>
            `).join("")
          : `<p class="empty">You have no notifications.</p>`
      }
    </div>
  `;
}

function renderReports() {
  return `
    <div class="card">
      <h2>Library Reports</h2>

      <div class="stats">
        <div class="stat">
          <p>Total copies</p>
          <strong>${books.reduce((s, b) => s + b.total, 0)}</strong>
        </div>

        <div class="stat">
          <p>Available copies</p>
          <strong>${books.reduce((s, b) => s + b.total - b.issued, 0)}</strong>
        </div>

        <div class="stat">
          <p>Active loans</p>
          <strong>${loans.filter(l => !l.returned && l.status !== "Pending").length}</strong>
        </div>

        <div class="stat">
          <p>Returned loans</p>
          <strong>${loans.filter(l => l.returned).length}</strong>
        </div>
      </div>

      <h3>Books by category</h3>

      ${
        categories().map(c => `
          <p>
            ${escapeHTML(c)}:
            ${books.filter(b => b.category === c)
              .reduce((n, b) => n + b.total, 0)}
            copies
          </p>
        `).join("")
      }
    </div>
  `;
}

function renderMyProfile(user, p) {
  return `
    <div class="card">
      <h2>${p}</h2>

      <dl class="details-grid">
        ${
          [
            ["Full Name", user.fullName],
            ["Username", user.username],
            ["Email", user.email || "—"],
            ["Role", user.role],
            ["Student ID", user.studentId || "—"],
            ["Course", user.course || "—"]
          ].map(([k, v]) => `
            <div>
              <dt>${k}</dt>
              <dd>${escapeHTML(v)}</dd>
            </div>
          `).join("")
        }
      </dl>

      <button class="btn" onclick="setPage('Change Password')">
        Change Password
      </button>
    </div>
  `;
}

function renderChangePassword(user) {
  return `
    <div class="card auth-wrap">
      <h2>Change Password</h2>

      <p class="subtitle">
        For this demo, enter a new password below.
        A live system should verify identity securely.
      </p>

      <form id="change-password-form">
        <label>New password</label>
        <input name="password" type="password" required minlength="6">

        <label>Confirm new password</label>
        <input name="confirm" type="password" required minlength="6">

        <button class="btn btn-full" type="submit">
          Update Password
        </button>
      </form>

      <div class="warning">
        This demo does not send email verification.
        Real password changes must be handled by a secure authentication provider.
      </div>
    </div>
  `;
}

function editBook(id) {
  const b = books.find(x => x.id === id);
  if (!b) return;

  const title = prompt("Book title:", b.title);
  if (title === null) return;

  const author = prompt("Author:", b.author);
  if (author === null) return;

  const isbn = prompt("ISBN:", b.isbn);
  if (isbn === null) return;

  const course = prompt(`Course (${COURSES.join(", ")}):`, b.course);
  if (course === null) return;

  const category = prompt("Book category:", b.category);
  if (category === null) return;

  const publisher = prompt("Publisher:", b.publisher || "");
  if (publisher === null) return;

  const year = prompt("Publication year:", b.year || "");
  if (year === null) return;

  const description = prompt("Description:", b.description || "");
  if (description === null) return;

  const total = Number(prompt(
    "Total copies (cannot be less than copies already issued):",
    b.total
  ));

  if (
    !title.trim() ||
    !author.trim() ||
    !isbn.trim() ||
    !COURSES.includes(course.trim()) ||
    !category.trim() ||
    !Number.isInteger(total) ||
    total < b.issued ||
    total < 1
  ) {
    return toast("Please enter valid book details.");
  }

  b.title = title.trim();
  b.author = author.trim();
  b.isbn = isbn.trim();
  b.course = course.trim();
  b.category = category.trim();
  b.publisher = publisher.trim();
  b.year = year.trim();
  b.description = description.trim();
  b.total = total;

  save();
  render();
  toast("Book updated.");
}

function deleteBook(id) {
  const b = books.find(x => x.id === id);
  if (!b) return;

  if (b.issued > 0) {
    return toast("This book cannot be removed until all copies are returned.");
  }

  if (!confirm(`Remove “${b.title}” from the catalogue?`)) return;

  books = books.filter(x => x.id !== id);

  save();
  render();
  toast("Book removed.");
}

function viewStudent(id) {
  selectedStudentId = id;
  setPage("View Student Issues");
}

function editStudentReturns(id) {
  selectedStudentId = id;
  setPage("Edit Student Returns");
}

function editStudent(id) {
  const s = users.find(u => u.id === id && u.role === "Student");
  if (!s) return;

  const name = prompt("Student full name:", s.fullName);
  if (name === null) return;

  const email = prompt("Registered email:", s.email);
  if (email === null) return;

  const course = prompt(`Course (${COURSES.join(", ")}):`, s.course);
  if (course === null) return;

  if (
    !name.trim() ||
    !email.trim() ||
    !COURSES.includes(course.trim())
  ) {
    return toast("Enter valid student details.");
  }

  s.fullName = name.trim();
  s.email = email.trim();
  s.course = course.trim();

  save();
  render();
  toast("Student details updated.");
}

function deleteStudent(id) {
  const s = users.find(u => u.id === id && u.role === "Student");
  if (!s) return;

  if (loans.some(l =>
    l.studentId === id &&
    !l.returned &&
    l.status !== "Pending"
  )) {
    return toast(
      "Return all borrowed books before deleting this student account."
    );
  }

  if (!confirm(
    `Delete student account for ${s.fullName}? Borrowing history will be retained.`
  )) return;

  s.active = false;
  s.deleted = true;

  save();
  render();
  toast("Student account disabled; history preserved.");
}

function toggleStudent(id) {
  const s = users.find(u => u.id === id);
  if (!s) return;

  s.active = s.active === false;

  save();
  render();

  toast(`Student account ${s.active ? "activated" : "deactivated"}.`);
}

function requestBook(bookId) {
  const user = currentUser();
  const book = books.find(b => b.id === bookId);

  if (!user || !book || book.total <= book.issued) {
    return toast("This book is currently unavailable.");
  }

  if (loans.some(l =>
    l.studentId === user.id &&
    l.bookId === bookId &&
    !l.returned &&
    l.status === "Pending"
  )) {
    return toast("You already requested this book.");
  }

  loans.push({
    id: Date.now(),
    studentId: user.id,
    studentName: user.fullName,
    studentUsername: user.username,
    bookId: book.id,
    title: book.title,
    isbn: book.isbn,
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    returned: false,
    status: "Pending"
  });

  addNotice(
    `${user.fullName} requested the book “${book.title}”. Please review it in Issue Books.`,
    "Admin"
  );

  save();
  render();

  toast("Issue request sent to library staff.");
}

function approveRequest(id) {
  const l = loans.find(x => x.id === id && x.status === "Pending");
  if (!l) return;

  const s = users.find(u => u.id === l.studentId);
  const b = books.find(x => x.id === l.bookId);

  if (!s || !b || b.total <= b.issued) {
    return toast("Student or book is unavailable; request not approved.");
  }

  const studentCode = prompt("Confirm Student ID:", s.studentId || "");
  if (studentCode === null) return;

  if (
    (s.studentId || "").trim().toLowerCase() !==
    studentCode.trim().toLowerCase()
  ) {
    return toast("Student ID did not match.");
  }

  const due = prompt(
    "Enter due date (YYYY-MM-DD):",
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );

  if (!due) return;

  l.status = "Issued";
  l.issueDate = new Date().toISOString().slice(0, 10);
  l.dueDate = due;

  b.issued++;

  addNotice(
    `Your request for “${l.title}” was approved. Due date: ${due}.`,
    l.studentUsername
  );

  save();
  render();

  toast("Issue request approved.");
}

function rejectRequest(id) {
  const l = loans.find(x => x.id === id && x.status === "Pending");
  if (!l) return;

  if (!confirm("Reject this book request?")) return;

  l.status = "Rejected";
  l.returned = true;
  l.actualReturnDate = new Date().toISOString().slice(0, 10);

  addNotice(
    `Your request for “${l.title}” was not approved. Please contact library staff.`,
    l.studentUsername
  );

  save();
  render();

  toast("Request rejected.");
}

function markReturned(id) {
  const l = loans.find(x => x.id === id && !x.returned);
  if (!l) return;

  if (!confirm(`Mark “${l.title}” as returned?`)) return;

  l.returned = true;
  l.status = "Returned";
  l.actualReturnDate = new Date().toISOString().slice(0, 10);

  const b = books.find(x => x.id === l.bookId);

  if (b) {
    b.issued = Math.max(0, b.issued - 1);
  }

  addNotice(
    `Your book “${l.title}” has been marked as returned.`,
    l.studentUsername
  );

  save();
  render();

  toast("Book marked as returned.");
}

function markOverdue(id) {
  const l = loans.find(x => x.id === id && !x.returned);
  if (!l) return;

  const type = prompt(
    "Overdue fee type: enter PER_DAY or OVERALL",
    l.feeType || "PER_DAY"
  );

  if (type === null) return;

  const normalized = type.trim().toUpperCase();

  if (!["PER_DAY", "OVERALL"].includes(normalized)) {
    return toast("Enter PER_DAY or OVERALL.");
  }

  const amount = Number(prompt(
    normalized === "PER_DAY"
      ? "Fee in rupees per overdue day:"
      : "One-time overall overdue fee in rupees:",
    l.feeAmount || 0
  ));

  if (!Number.isFinite(amount) || amount < 0) {
    return toast("Enter a valid non-negative fee.");
  }

  l.status = "Overdue";
  l.feeType = normalized;
  l.feeAmount = amount;

  const due = l.dueDate
    ? new Date(l.dueDate + "T00:00:00")
    : null;

  const days = due
    ? Math.max(0, Math.floor((Date.now() - due.getTime()) / 86400000))
    : 0;

  l.overdueDays = days;
  l.feeTotal = normalized === "PER_DAY" ? amount * days : amount;

  save();
  render();

  toast(
    `Overdue status saved. Calculated fee: ₹${l.feeTotal.toFixed(2)}.`
  );
}

function renewLoan(id) {
  const l = loans.find(x => x.id === id && !x.returned);
  if (!l) return;

  const s = users.find(u => u.id === l.studentId);

  if (!confirm(
    `Renew “${l.title}” for ${s?.fullName || l.studentName}? Current due date: ${l.dueDate || "not set"}.`
  )) return;

  const due = prompt(
    "Enter new due date (YYYY-MM-DD):",
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );

  if (!due) return;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) {
    return toast("Enter the date as YYYY-MM-DD.");
  }

  l.renewals = l.renewals || [];

  l.renewals.push({
    oldDueDate: l.dueDate || "",
    newDueDate: due,
    renewedAt: new Date().toISOString().slice(0, 10)
  });

  l.dueDate = due;
  l.status = "Issued";

  addNotice(
    `The due date for “${l.title}” was renewed to ${due}.`,
    l.studentUsername
  );

  save();
  render();

  toast("Due date renewed; inventory unchanged.");
}

function toggleProfile() {
  profileOpen = !profileOpen;
  renderHeader();
}

/* Form handling */

document.addEventListener("submit", e => {
  if (e.target.id === "book-form") {
    e.preventDefault();

    const d = Object.fromEntries(new FormData(e.target));
    const isbn = d.isbn.trim();

    if (books.some(b => b.isbn === isbn)) {
      return toast("A book with this ISBN already exists.");
    }

    const total = Number(d.total);

    if (!Number.isInteger(total) || total < 1) {
      return toast("Enter a valid number of copies.");
    }

    books.push({
      id: Date.now(),
      title: d.title.trim(),
      author: d.author.trim(),
      isbn,
      category: d.category.trim(),
      course: d.course,
      total,
      issued: 0,
      publisher: d.publisher.trim(),
      year: d.year.trim(),
      description: d.description.trim()
    });

    addNotice(`New book added: ${d.title.trim()}.`, "Student");

    save();
    render();

    toast("Book added. Its category is now available in the student filter.");
  }

  if (e.target.id === "student-form") {
    e.preventDefault();

    const d = Object.fromEntries(new FormData(e.target));

    if (d.password !== d.confirm) {
      return toast("Passwords do not match.");
    }

    if (users.some(u =>
      u.username.toLowerCase() === d.username.trim().toLowerCase()
    )) {
      return toast("That username already exists.");
    }

    if (users.some(u =>
      (u.studentId || "").toLowerCase() ===
        d.studentId.trim().toLowerCase() &&
      u.role === "Student"
    )) {
      return toast("That Student ID already exists.");
    }

    users.push({
      id: Date.now(),
      role: "Student",
      fullName: d.fullName.trim(),
      studentId: d.studentId.trim(),
      course: d.course,
      year: d.year,
      email: d.email.trim(),
      username: d.username.trim(),
      password: d.password,
      active: true
    });

    addNotice("Your student account has been created.", d.username.trim());

    save();
    render();

    toast("Student account created.");
  }

  if (e.target.id === "issue-form") {
    e.preventDefault();

    const d = Object.fromEntries(new FormData(e.target));

    const student = users.find(u =>
      u.id === Number(d.studentId) &&
      u.role === "Student" &&
      u.active !== false
    );

    const book = books.find(b => b.id === Number(d.bookId));

    if (!student || !book || book.issued >= book.total) {
      return toast("Select a valid student and available book.");
    }

    if (
      (student.studentId || "").trim().toLowerCase() !==
      d.studentCode.trim().toLowerCase()
    ) {
      return toast("Student ID does not match the selected student.");
    }

    if (book.isbn.trim().toLowerCase() !== d.isbn.trim().toLowerCase()) {
      return toast("ISBN does not match the selected book.");
    }

    if (!d.dueDate) {
      return toast("Enter a due date.");
    }

    book.issued++;

    loans.push({
      id: Date.now(),
      studentId: student.id,
      studentName: student.fullName,
      studentUsername: student.username,
      bookId: book.id,
      title: book.title,
      isbn: book.isbn,
      issueDate: d.issueDate,
      dueDate: d.dueDate,
      returned: false,
      status: "Issued"
    });

    addNotice(
      `The book “${book.title}” has been issued to you. Due date: ${d.dueDate}.`,
      student.username
    );

    save();
    render();

    toast("Book issued successfully.");
  }

  if (e.target.id === "change-password-form") {
    e.preventDefault();

    const d = Object.fromEntries(new FormData(e.target));

    if (d.password !== d.confirm) {
      return toast("Passwords do not match.");
    }

    const u = currentUser();
    if (!u) return;

    u.password = d.password;

    save();
    setPage("Dashboard");

    toast("Demo password updated.");
  }
});

/* Search and filter handling */

document.addEventListener("input", e => {
  if (e.target.id === "catalog-search") {
    catalogSearch = e.target.value;

    const pos = e.target.selectionStart;

    render();

    const el = $("#catalog-search");

    if (el) {
      el.focus();
      el.setSelectionRange(pos, pos);
    }
  }

  if (e.target.id === "admin-book-search") {
    const q = e.target.value.toLowerCase();

    document.querySelectorAll("#admin-book-rows tr").forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(q)
        ? ""
        : "none";
    });
  }

  if (e.target.id === "student-search") {
    const q = e.target.value.toLowerCase();

    e.target.closest(".card")
      .querySelectorAll("tbody tr")
      .forEach(tr => {
        tr.style.display = tr.textContent.toLowerCase().includes(q)
          ? ""
          : "none";
      });
  }

  if (["issue-search", "return-search", "history-search"].includes(e.target.id)) {
    const q = e.target.value.toLowerCase();

    e.target.closest(".card")
      .querySelectorAll("tbody tr")
      .forEach(tr => {
        tr.style.display = (
          (tr.dataset.search || tr.textContent).toLowerCase().includes(q)
        ) ? "" : "none";
      });
  }
});

document.addEventListener("change", e => {
  if (e.target.id === "catalog-course") {
    catalogCourse = e.target.value;
    render();
  }

  if (e.target.id === "catalog-category") {
    catalogCategory = e.target.value;
    render();
  }

  if (e.target.id === "catalog-availability") {
    catalogAvailability = e.target.value;
    render();
  }
});

/* Make functions available to buttons in the HTML */

window.showLogin = showLogin;
window.showAdminRegister = showAdminRegister;
window.showForgotPassword = showForgotPassword;
window.setPage = setPage;
window.logout = logout;
window.toggleProfile = toggleProfile;
window.editBook = editBook;
window.deleteBook = deleteBook;
window.toggleStudent = toggleStudent;
window.viewBook = viewBook;
window.requestBook = requestBook;
window.clearCatalogFilters = clearCatalogFilters;
window.viewStudent = viewStudent;
window.editStudentReturns = editStudentReturns;
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
window.markReturned = markReturned;
window.markOverdue = markOverdue;
window.renewLoan = renewLoan;

render();

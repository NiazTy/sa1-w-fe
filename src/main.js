const loginPage = document.getElementById("login-page");
const chatPage = document.getElementById("chat-page");
const loginBtn = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");

let token = null;

// ===== Login =====
loginBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !password) return;

  try {
    const res = await fetch("https://sa1-w.vercel.app/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (res.ok) {
      token = data.token;
      loginPage.classList.add("hidden");
      chatPage.classList.remove("hidden");
    } else {
      loginError.textContent = data.error || "Login gagal";
      loginError.classList.remove("hidden");
    }
  } catch (err) {
    loginError.textContent = "Server tidak bisa diakses";
    loginError.classList.remove("hidden");
  }
});

// ===== Chat =====
function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = role === "user" ? "text-right" : "text-left";
  div.innerHTML = `<div class="inline-block px-4 py-2 rounded-2xl ${
    role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
  }">${text}</div>`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (!message) return;

  addMessage("user", message);
  messageInput.value = "";

  try {
    const res = await fetch("https://sa1-w.vercel.app/sa1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    addMessage("bot", data.reply);
  } catch (err) {
    addMessage("bot", "❌ Error: tidak bisa terhubung ke server");
  }
});

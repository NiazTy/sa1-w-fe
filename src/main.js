// Ambil semua elemen DOM yang diperlukan
const loginPage = document.getElementById("login-page");
const chatPage = document.getElementById("chat-page");
const loginBtn = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");

// State Global
let token = null;

// URL API
const API_BASE_URL = "https://sa1-w.vercel.app";
const LOGIN_URL = `${API_BASE_URL}/auth/login`;
const CHAT_URL = `${API_BASE_URL}/sa1`;

// === UTILS ===

/**
 * Mengubah status tombol login menjadi loading atau normal.
 * @param {boolean} isLoading
 */
function setLoading(isLoading) {
    loginBtn.disabled = isLoading;
    loginBtn.innerHTML = isLoading ? 
        '<span class="animate-spin inline-block w-5 h-5 mr-2 border-3 border-white border-t-transparent rounded-full"></span> Loading...' : 
        'Sign In';
}

/**
 * Menampilkan pesan error pada halaman login.
 * @param {string} message
 */
function showError(message) {
    loginError.textContent = `❌ ${message}`;
    loginError.classList.remove("hidden");
}

/**
 * Menghapus pesan error.
 */
function clearError() {
    loginError.textContent = "";
    loginError.classList.add("hidden");
}

/**
 * Menggulir chatBox ke bawah secara halus (Smooth Scroll).
 */
function scrollToBottom() {
    // Menggunakan 'smooth' behavior untuk pengalaman yang lebih baik
    chatBox.scrollTo({
        top: chatBox.scrollHeight,
        behavior: 'smooth' 
    });
}

// === CHAT MESSAGE HANDLER ===

/**
 * Menambahkan pesan ke chat box dengan styling yang sesuai.
 * @param {'user' | 'bot'} role - Peran pengirim pesan.
 * @param {string} text - Isi pesan.
 * @param {string} [id=null] - ID opsional untuk elemen, berguna untuk typing indicator.
 */
function addMessage(role, text, id = null) {
    const divWrapper = document.createElement("div");
    divWrapper.className = role === "user" ? "flex justify-end" : "flex justify-start items-start space-x-2";
    if (id) divWrapper.id = id;
    
    if (role === "bot") {
        const avatar = document.createElement("div");
        avatar.className = "flex items-center justify-center flex-shrink-0 w-8 h-8 mt-auto text-xs font-bold text-white rounded-full shadow-sm bg-primary-500";
        avatar.textContent = "A"; // 'A' for Awa
        divWrapper.appendChild(avatar);
    }
    
    const messageDiv = document.createElement("div");
    const baseClasses = "max-w-[80%] px-4 py-2.5 shadow-md break-words text-sm";
    
    if (role === "user") {
        messageDiv.className = `${baseClasses} bg-primary-500 text-white rounded-t-xl rounded-bl-xl`;
    } else {
        messageDiv.className = `${baseClasses} bg-white border border-gray-200 text-gray-800 rounded-t-xl rounded-br-xl`;
    }
    
    messageDiv.innerHTML = text; 
    
    divWrapper.appendChild(messageDiv);
    chatBox.appendChild(divWrapper);
    
    // Panggil scroll setelah pesan ditambahkan
    scrollToBottom();
}

/**
 * Menghapus indikator mengetik bot.
 */
function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Menambahkan indikator mengetik bot.
 */
function addTypingIndicator() {
    // Jika indikator sudah ada, jangan tambahkan lagi
    if (document.getElementById('typing-indicator')) return;

    const indicatorHTML = `
        <div class="flex items-center space-x-1">
            <span class="inline-block w-2 h-2 bg-gray-400 rounded-full animate-pulse-slow"></span>
            <span class="inline-block w-2 h-2 bg-gray-400 rounded-full animate-pulse-slow delay-150"></span>
            <span class="inline-block w-2 h-2 bg-gray-400 rounded-full animate-pulse-slow delay-300"></span>
        </div>
    `;
    addMessage('bot', indicatorHTML, 'typing-indicator');
}


// === EVENT LISTENERS ===

// 1. Login Handler
loginBtn.addEventListener("click", async () => {
    clearError();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!username) return showError("Username tidak boleh kosong");
    if (!password) return showError("Password tidak boleh kosong");
    
    setLoading(true);
    
    try {
        const res = await fetch(LOGIN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        
        const data = await res.json();
        
        if (res.ok && data.token) {
            token = data.token;
            loginPage.classList.add("hidden");
            chatPage.classList.remove("hidden");
        } else {
            showError(data.error || "Login gagal, cek kembali kredensial Anda.");
        }
    } catch (err) {
        showError("Server tidak bisa diakses. Periksa koneksi atau coba lagi nanti.");
    } finally {
        setLoading(false);
    }
});


// 2. Chat Form Submission Handler
chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const message = messageInput.value.trim();
    if (!message) return;
    
    addMessage("user", message);
    
    messageInput.value = "";
    messageInput.disabled = true;
    
    addTypingIndicator(); // Tampilkan sebelum fetch
    
    try {
        const res = await fetch(CHAT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ message }),
        });

        // Hapus sebelum memproses respons/error
        removeTypingIndicator(); 

        if (!res.ok) {
            if (res.status === 401) {
                addMessage("bot", "🔒 Token kedaluwarsa. Silakan login ulang.");
                token = null;
                chatPage.classList.add("hidden");
                loginPage.classList.remove("hidden");
                usernameInput.value = "";
                passwordInput.value = "";
                return;
            }
            throw new Error(`Server error: ${res.status}`);
        }
        
        const data = await res.json();
        addMessage("bot", data.reply || "Tidak ada balasan dari Subaru Awa.");
        
    } catch (err) {
        // PENTING: Pastikan dihapus juga jika terjadi error koneksi
        removeTypingIndicator(); 
        console.error("Chat Error:", err);
        addMessage("bot", "❌ Maaf, ada masalah saat menghubungi server AI.");
    } finally {
        messageInput.disabled = false;
        messageInput.focus();
    }
});
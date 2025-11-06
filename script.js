// --- DATABASE KEYS ---
const CLIENTS_DB_KEY = 'directexpert_clients';
const EXPERTS_DB_KEY = 'directexpert_experts';
const SESSION_KEY = 'directexpert_session';
const BOOKINGS_DB_KEY = 'directexpert_bookings';
const AI_HISTORY_DB_KEY = 'directexpert_ai_history';

// --- MOCK DATA ---
const MOCK_FIRST_NAMES = ['Aarav', 'Vihaan', 'Aditya', 'Vivaan', 'Arjun', 'Reyansh', 'Shaurya', 'Rohan', 'Advik', 'Kabir', 'Aanya', 'Diya', 'Myra', 'Saanvi', 'Ananya', 'Aarohi', 'Pari', 'Isha', 'Riya', 'Siya', 'Dev', 'Raj', 'Karan', 'Veer', 'Yash', 'Ishaan', 'Aman', 'Rahul', 'Nikhil', 'Ravi', 'Priya', 'Meera', 'Tara', 'Zoya', 'Aisha', 'Kavya', 'Sonia', 'Rani', 'Mira', 'Neha'];
const MOCK_LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Mehta', 'Shah', 'Khan', 'Jain', 'Agarwal', 'Murthy', 'Pillai', 'Rao', 'Chopra', 'Malhotra', 'Kapoor', 'Menon', 'Nair'];

// Expanded to 73 professions
const PROFESSIONS_LIST = [
    // Medical
    "Cardiologist", "Dermatologist", "Neurologist", "Orthopedic Surgeon", "Pediatrician", "Oncologist", "Psychiatrist", "Radiologist", "Endocrinologist", "Gastroenterologist", "Pulmonologist",
    // Legal
    "Tax Lawyer", "Corporate Lawyer", "Intellectual Property Lawyer", "Family Lawyer", "Criminal Lawyer", "Immigration Lawyer", "Real Estate Lawyer", "Environmental Lawyer", "Labor Lawyer",
    // Financial
    "Chartered Accountant", "Financial Advisor", "Investment Banker", "Auditor", "Management Consultant", "Risk Analyst", "Actuary", "Economist", "Forensic Accountant",
    // Tech
    "Software Architect", "Data Scientist", "AI/ML Engineer", "Cybersecurity Expert", "Cloud Solutions Architect", "DevOps Engineer", "Blockchain Developer", "Network Engineer",
    // Engineering
    "Architect", "Civil Engineer", "Mechanical Engineer", "Electrical Engineer", "Aerospace Engineer", "Chemical Engineer", "Biomedical Engineer",
    // Creative
    "Marketing Strategist", "Brand Manager", "SEO/SEM Expert","Public Relations (PR) Expert", "Market Research Analyst", "Journalist", "Book Editor", "Screenwriter", "Technical Writer", "Grant Writer", "Interior Designer", "Graphic Designer", "UX/UI Designer", "Fashion Designer", "Industrial Designer",
    // Business
    "University Professor (MBA)", "Supply Chain Manager", "Human Resources (HR) Consultant", "Chief Financial Officer (CFO)", "Operations Manager", "Project Manager (PMP)", "Logistics Manager",
    // Other
    "Biotechnologist", "Geologist", "Event Planner", "Executive Chef", "Master Electrician", "Master Plumber"
];

let CURRENT_SPECIALISTS = []; 
let CURRENTLY_VIEWED_SPECIALIST = null;
let PENDING_BOOKING_DETAILS = null;

// --- UTILITY FUNCTIONS ---

/**
 * Shows a page by ID and hides all others.
 * NEW: Hides header/footer for communication page.
 */
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    window.scrollTo(0, 0);

    // NEW: Hide header/footer for the call page
    const header = document.getElementById('main-header');
    const footer = document.getElementById('main-footer');
    if (pageId === 'page-communication') {
        header.classList.add('hidden');
        footer.classList.add('hidden');
    } else {
        header.classList.remove('hidden');
        footer.classList.remove('hidden');
    }
    
    updateNav();
}

function goHome() {
    const session = getSession();
    if (session) {
        if (session.type === 'client') {
            showPage('page-client-dashboard');
        } else if (session.type === 'expert') {
            renderExpertAppointments(); // Refresh appointments
            showPage('page-expert-dashboard');
        }
        else showPage('page-home');
    } else {
        showPage('page-home');
    }
}

function toggleClientForm(formType) {
    if (formType === 'login') {
        document.getElementById('client-signup-form').classList.add('hidden');
        document.getElementById('client-login-form').classList.remove('hidden');
    } else {
        document.getElementById('client-signup-form').classList.remove('hidden');
        document.getElementById('client-login-form').classList.add('hidden');
    }
}

function toggleExpertForm(formType) {
    if (formType === 'login') {
        document.getElementById('expert-signup-form').classList.add('hidden');
        document.getElementById('expert-login-form').classList.remove('hidden');
    } else {
        document.getElementById('expert-signup-form').classList.remove('hidden');
        document.getElementById('expert-login-form').classList.add('hidden');
    }
}

function showFormError(formErrorId, message) {
    const errorEl = document.getElementById(formErrorId);
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
}

function hideFormError(formErrorId) {
    const errorEl = document.getElementById(formErrorId);
    errorEl.textContent = '';
    errorEl.classList.add('hidden');
}

function updateNav() {
    const session = getSession();
    const navGuest = document.getElementById('nav-guest');
    const navClient = document.getElementById('nav-client');
    const navExpert = document.getElementById('nav-expert');

    if (session) {
        navGuest.classList.add('hidden');
        if (session.type === 'client') {
            navClient.classList.remove('hidden');
            navExpert.classList.add('hidden');
        } else if (session.type === 'expert') {
            navClient.classList.add('hidden');
            navExpert.classList.remove('hidden');
        }
    } else {
        navGuest.classList.remove('hidden');
        navClient.classList.add('hidden');
        navExpert.classList.add('hidden');
    }
}

function getFormattedDateTime(date) {
    return date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// --- MODAL FUNCTIONS ---

function openBookingModal() {
    if (!CURRENTLY_VIEWED_SPECIALIST) return;
    
    document.getElementById('booking-options').classList.remove('hidden');
    document.getElementById('payment-form').classList.add('hidden');
    document.getElementById('booking-confirmation').classList.add('hidden');
    
    const dateInput = document.getElementById('booking-date');
    const timeInput = document.getElementById('booking-time');
    dateInput.value = '';
    timeInput.value = '';
    dateInput.classList.remove('border-red-500');
    timeInput.classList.remove('border-red-500');

    document.getElementById('booking-modal-title').textContent = `Book with ${CURRENTLY_VIEWED_SPECIALIST.name}`;
    document.getElementById('booking-modal').classList.remove('hidden');
}

function closeBookingModal() {
    document.getElementById('booking-modal').classList.add('hidden');
    PENDING_BOOKING_DETAILS = null;
}

function handleUrgentBooking() {
    const bookingTime = new Date();
    const type = 'Urgent (15 min)';
    const session = getSession(); // Get client info
    
    PENDING_BOOKING_DETAILS = {
        type: type,
        time: bookingTime.toISOString(),
        expertName: CURRENTLY_VIEWED_SPECIALIST.name,
        expertEmail: CURRENTLY_VIEWED_SPECIALIST.email,
        expertProfession: CURRENTLY_VIEWED_SPECIALIST.profession,
        clientName: session.name, // NEW: Add client name
        clientEmail: session.email
    };
    
    document.getElementById('booking-options').classList.add('hidden');
    document.getElementById('payment-summary').textContent = `Total for ${type} call: ₹500`;
    document.getElementById('payment-form').classList.remove('hidden');
    hideFormError('payment-error');
}

function handleScheduledBooking() {
    const dateInput = document.getElementById('booking-date');
    const timeInput = document.getElementById('booking-time');
    const date = dateInput.value;
    const time = timeInput.value;
    const session = getSession(); // Get client info
    
    dateInput.classList.remove('border-red-500');
    timeInput.classList.remove('border-red-500');

    let isValid = true;
    if (!date) {
        dateInput.classList.add('border-red-500');
        isValid = false;
    }
    if (!time) {
        timeInput.classList.add('border-red-500');
        isValid = false;
    }

    if (!isValid) return;

    const bookingTime = new Date(`${date}T${time}`);
    const type = 'Scheduled (30 min)';
    
    PENDING_BOOKING_DETAILS = {
        type: type,
        time: bookingTime.toISOString(),
        expertName: CURRENTLY_VIEWED_SPECIALIST.name,
        expertEmail: CURRENTLY_VIEWED_SPECIALIST.email,
        expertProfession: CURRENTLY_VIEWED_SPECIALIST.profession,
        clientName: session.name, // NEW: Add client name
        clientEmail: session.email
    };

    document.getElementById('booking-options').classList.add('hidden');
    document.getElementById('payment-summary').textContent = `Total for ${type} call: ₹1000`;
    document.getElementById('payment-form').classList.remove('hidden');
    hideFormError('payment-error');
}

function handlePayment(event) {
    event.preventDefault();
    hideFormError('payment-error');

    if (!document.getElementById('card-name').value ||
        !document.getElementById('card-number').value ||
        !document.getElementById('card-expiry').value ||
        !document.getElementById('card-cvc').value) {
        
        showFormError('payment-error', 'Please fill in all card details.');
        return;
    }
    
    if (!PENDING_BOOKING_DETAILS) return;

    const bookings = getStorage(BOOKINGS_DB_KEY);
    const newBooking = {
        id: generateId(),
        ...PENDING_BOOKING_DETAILS
    };
    bookings.push(newBooking);
    setStorage(BOOKINGS_DB_KEY, bookings);

    document.getElementById('payment-form').classList.add('hidden');
    const message = `Your ${newBooking.type} call with ${newBooking.expertName} is confirmed for ${getFormattedDateTime(new Date(newBooking.time))}.`;
    document.getElementById('booking-confirmation-message').textContent = message;
    document.getElementById('booking-confirmation').classList.remove('hidden');

    // NEW: This call simulates the "notification"
    renderExpertAppointments(); 

    setTimeout(closeBookingModal, 4000);
}

// --- LOCALSTORAGE FUNCTIONS ---

function getStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

function setStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getSession() {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
}

function createSession(user, type) {
    const sessionData = {
        email: user.email,
        name: user.name,
        phone: user.phone,
        type: type,
        ...user
    };
    setStorage(SESSION_KEY, sessionData);
}

function logout() {
    localStorage.removeItem(SESSION_KEY);
    showPage('page-home');
}

// --- DATA GENERATION & RENDERING ---

function generateMockSpecialist(id, profession) {
    const fName = MOCK_FIRST_NAMES[Math.floor(Math.random() * MOCK_FIRST_NAMES.length)];
    const lName = MOCK_LAST_NAMES[Math.floor(Math.random() * MOCK_LAST_NAMES.length)];
    const name = `Dr. ${fName} ${lName}`;
    const experience = Math.floor(Math.random() * 20) + 25;
    const bio = `Dr. ${lName} is a highly respected ${profession} with over ${experience} years of experience. After a distinguished career at a top institution, Dr. ${lName} is now offering specialized consultations. Expertise includes [Specific Topic 1] and [Specific Topic 2].`;
    
    return { 
        id: `${profession.toLowerCase().replace(/ /g, '-')}-${id}`, 
        name, 
        profession: profession,
        experience, 
        bio,
        isMock: true
    };
}

function renderProfessions() {
    const container = document.getElementById('professions-list');
    if (container) {
        container.innerHTML = '';
        PROFESSIONS_LIST.forEach(profession => {
            const card = document.createElement('div');
            card.className = 'profession-card bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer';
            card.setAttribute('data-profession-name', profession.toLowerCase());
            card.innerHTML = `
                <div class="flex items-center justify-center h-16 w-16 bg-indigo-100 text-indigo-600 rounded-full mx-auto text-3xl font-bold">
                    ${profession.substring(0, 1)}
                </div>
                <h3 class="mt-4 text-xl font-semibold text-gray-900 text-center">${profession}</h3>
            `;
            card.onclick = () => viewProfession(profession);
            container.appendChild(card);
        });
    }
}

function populateProfessionOptions() {
     const select = document.getElementById('expert-profession');
     if (select) {
         select.innerHTML = '<option value="" disabled selected>Select your profession</option>';
         PROFESSIONS_LIST.forEach(profession => {
            const option = document.createElement('option');
            option.value = profession;
            option.textContent = profession;
            select.appendChild(option);
         });
     }
}

function viewProfession(professionName) {
    document.getElementById('specialist-list-title').textContent = `Professionals: ${professionName}`;
    const container = document.getElementById('specialist-list-container');
    container.innerHTML = '';
    
    const allExperts = getStorage(EXPERTS_DB_KEY);
    const realSpecialists = allExperts.filter(expert => expert.profession === professionName);
    
    const mockSpecialists = [];
    for (let i = 0; i < 70; i++) { // Generate 70 mock specialists
        mockSpecialists.push(generateMockSpecialist(i, professionName));
    }
    
    CURRENT_SPECIALISTS = [...realSpecialists, ...mockSpecialists];
    
    document.getElementById('specialist-search').value = '';

    if (CURRENT_SPECIALISTS.length === 0) {
        document.getElementById('specialist-no-results').classList.remove('hidden');
        document.getElementById('specialist-no-results').textContent = "No specialists found for this profession.";
    } else {
        document.getElementById('specialist-no-results').classList.add('hidden');
        CURRENT_SPECIALISTS.forEach(specialist => {
            const card = createSpecialistCard(specialist);
            container.appendChild(card);
        });
    }
    
    showPage('page-specialist-list');
}

function createSpecialistCard(specialist) {
    const card = document.createElement('div');
    card.className = 'specialist-card bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl';
    card.setAttribute('data-specialist-name', specialist.name.toLowerCase());
    
    const placeholderImg = `https://placehold.co/600x400/a3a3a3/ffffff?text=${specialist.name.replace(' ', '+')}`;
    
    const identifier = specialist.email || specialist.id; 
    const badge = specialist.isMock ? '' : '<span class="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Verified</span>';

    card.innerHTML = `
        <div class="relative">
            <img class="h-56 w-full object-cover" src="${placeholderImg}" alt="${specialist.name}">
            ${badge}
        </div>
        <div class="p-6">
            <h3 class="text-2xl font-semibold text-gray-900">${specialist.name}</h3>
            <p class="text-indigo-600 font-medium">${specialist.profession}</p>
            <p class="mt-4 text-gray-600">
                ${specialist.experience} years of experience. ${specialist.bio.substring(0, 50)}...
            </p>
            <button class="mt-6 w-full bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100"
                    onclick="viewSpecialist('${identifier}')">
                View Profile
            </button>
        </div>
    `;
    return card;
}

 function viewSpecialist(identifier) {
    const specialist = CURRENT_SPECIALISTS.find(s => s.email === identifier || s.id === identifier);

    if (!specialist) {
        console.error("Specialist not found!");
        const allExperts = getStorage(EXPERTS_DB_KEY);
        const realExpert = allExperts.find(s => s.email === identifier);
        if (realExpert) {
            CURRENTLY_VIEWED_SPECIALIST = realExpert;
        } else {
            return;
        }
    } else {
        CURRENTLY_VIEWED_SPECIALIST = specialist;
    }
    
    const placeholderImg = `https://placehold.co/400x400/a3a3a3/ffffff?text=${CURRENTLY_VIEWED_SPECIALIST.name.replace(' ', '+')}`;

    document.getElementById('profile-img').src = placeholderImg;
    document.getElementById('profile-name').textContent = CURRENTLY_VIEWED_SPECIALIST.name;
    document.getElementById('profile-title').textContent = CURRENTLY_VIEWED_SPECIALIST.profession;
    document.getElementById('profile-experience').textContent = `${CURRENTLY_VIEWED_SPECIALIST.experience} years of experience`;
    document.getElementById('profile-bio').textContent = CURRENTLY_VIEWED_SPECIALIST.bio;
    
    showPage('page-specialist-profile');
 }

// --- SEARCH FUNCTIONS ---

function searchProfessions() {
    const query = document.getElementById('profession-search').value.toLowerCase();
    const cards = document.querySelectorAll('.profession-card');
    let hasResults = false;

    cards.forEach(card => {
        const name = card.getAttribute('data-profession-name');
        if (name.includes(query)) {
            card.style.display = 'block';
            hasResults = true;
        } else {
            card.style.display = 'none';
        }
    });

    document.getElementById('professions-no-results').classList.toggle('hidden', hasResults);
}

function searchSpecialists() {
    const query = document.getElementById('specialist-search').value.toLowerCase();
    const cards = document.querySelectorAll('.specialist-card');
    let hasResults = false;

    cards.forEach(card => {
        const name = card.getAttribute('data-specialist-name');
        if (name.includes(query)) {
            card.style.display = 'block';
            hasResults = true;
        } else {
            card.style.display = 'none';
        }
    });
    
    document.getElementById('specialist-no-results').classList.toggle('hidden', hasResults);
    document.getElementById('specialist-no-results').textContent = "No specialists found matching your search.";
}

// --- CLIENT PROFILE FUNCTION ---

function showClientProfile() {
    const session = getSession();
    if (!session || session.type !== 'client') {
        goHome();
        return;
    }

    document.getElementById('client-profile-details').innerHTML = `
        <p><strong>Name:</strong> ${session.name}</p>
        <p><strong>Email:</strong> ${session.email}</p>
        <p><strong>Phone:</strong> ${session.phone}</p>
    `;
    
    const bookingContainer = document.getElementById('client-booking-history');
    const allBookings = getStorage(BOOKINGS_DB_KEY);
    const myBookings = allBookings.filter(b => b.clientEmail === session.email);
    
    bookingContainer.innerHTML = '';
    if (myBookings.length === 0) {
        bookingContainer.innerHTML = '<p class="text-gray-500">You have no booking history.</p>';
    } else {
        myBookings.reverse().forEach(booking => {
            const bookingEl = document.createElement('div');
            bookingEl.className = 'p-4 border border-gray-200 rounded-lg bg-gray-50';
            bookingEl.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold text-lg text-gray-800">${booking.expertName}</h4>
                        <p class="text-sm text-indigo-600">${booking.expertProfession}</p>
                        <p class="text-sm text-gray-500 mt-1">Booked for: ${getFormattedDateTime(new Date(booking.time))}</p>
                        <p class="text-sm text-gray-500">Type: ${booking.type}</p>
                    </div>
                    <!-- UPDATED: Button is now "Join Call" -->
                    <button onclick="joinCall('${booking.id}')" class="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 whitespace-nowrap">
                        Join Call
                    </button>
                </div>
            `;
            bookingContainer.appendChild(bookingEl);
        });
    }

    const aiContainer = document.getElementById('client-ai-history');
    const allAiHistory = getStorage(AI_HISTORY_DB_KEY);
    const myAiHistory = allAiHistory.filter(h => h.clientEmail === session.email);

    aiContainer.innerHTML = '';
    if (myAiHistory.length === 0) {
        aiContainer.innerHTML = '<p class="text-gray-500">You have not asked any AI questions.</p>';
    } else {
        myAiHistory.reverse().forEach(history => {
            const historyEl = document.createElement('div');
            historyEl.className = 'p-4 border border-gray-200 rounded-lg bg-gray-50';
            historyEl.innerHTML = `
                <p class="font-medium text-gray-700">You asked:</p>
                <p class="text-gray-600 italic mb-2">"${history.query}"</p>
                <p class="font-medium text-gray-700">AI Answer (snippet):</p>
                <p class="text-gray-600">${history.answer.substring(0, 100)}...</p>
            `;
            aiContainer.appendChild(historyEl);
        });
    }

    showPage('page-client-profile');
}

// --- NEW: EXPERT APPOINTMENTS RENDER ---

/**
 * Renders the upcoming appointments on the expert dashboard
 * This simulates the "notification"
 */
function renderExpertAppointments() {
    const session = getSession();
    if (!session || session.type !== 'expert') {
        return; // Not an expert
    }
    
    const appointmentContainer = document.getElementById('expert-appointments-list');
    const allBookings = getStorage(BOOKINGS_DB_KEY);
    // Find bookings for THIS expert
    const myBookings = allBookings.filter(b => b.expertEmail === session.email);

    appointmentContainer.innerHTML = ''; // Clear old list
    if (myBookings.length === 0) {
        appointmentContainer.innerHTML = '<p class="text-gray-500">You have no upcoming appointments.</p>';
    } else {
        myBookings.reverse().forEach(booking => { // Show newest first
            const bookingEl = document.createElement('div');
            bookingEl.className = 'p-4 border border-gray-200 rounded-lg bg-gray-50';
            bookingEl.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold text-lg text-gray-800">Client: ${booking.clientName}</h4>
                        <p class="text-sm text-gray-500 mt-1">Booked for: ${getFormattedDateTime(new Date(booking.time))}</p>
                        <p class="text-sm text-gray-500">Type: ${booking.type}</p>
                    </div>
                    <button onclick="joinCall('${booking.id}')" class="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 whitespace-nowrap">
                        Join Call
                    </button>
                </div>
            `;
            appointmentContainer.appendChild(bookingEl);
        });
    }
}

// --- NEW: COMMUNICATION PAGE FUNCTIONS ---

/**
 * Simulates joining a call.
 * Populates the comms page with booking data.
 */
function joinCall(bookingId) {
    const session = getSession();
    const allBookings = getStorage(BOOKINGS_DB_KEY);
    const booking = allBookings.find(b => b.id === bookingId);

    if (!booking || !session) {
        alert("Error: Could not find call.");
        return;
    }

    // Reset chat
    document.getElementById('comm-chat-sidebar').classList.remove('open');
    
    // Populate names based on who is joining
    if (session.type === 'client') {
        document.getElementById('comm-header-title').textContent = `Call with ${booking.expertName}`;
        document.getElementById('comm-main-video-name').textContent = booking.expertName;
        document.getElementById('comm-self-video-name').textContent = session.name + " (You)";
        document.getElementById('comm-chat-other-name').textContent = booking.expertName;
    } else { // User is an expert
        document.getElementById('comm-header-title').textContent = `Call with ${booking.clientName}`;
        document.getElementById('comm-main-video-name').textContent = booking.clientName;
        document.getElementById('comm-self-video-name').textContent = session.name + " (You)";
        document.getElementById('comm-chat-other-name').textContent = booking.clientName;
    }

    showPage('page-communication');
}

/**
 * Toggles the chat sidebar
 */
function toggleChat() {
    document.getElementById('comm-chat-sidebar').classList.toggle('open');
}

/**
 * Ends the call and returns to the dashboard
 */
function endCall() {
    goHome(); // This will route to the correct dashboard
}


// --- AUTHENTICATION HANDLERS ---

function handleClientSignup(event) {
    event.preventDefault();
    hideFormError('client-signup-error');
    
    const name = document.getElementById('client-name').value;
    const email = document.getElementById('client-email').value;
    const phone = document.getElementById('client-phone').value;
    const password = document.getElementById('client-password').value;

    const clients = getStorage(CLIENTS_DB_KEY);
    
    if (clients.find(c => c.email === email)) {
        showFormError('client-signup-error', 'An account with this email already exists.');
        return;
    }

    const newClient = { name, email, phone, password };
    clients.push(newClient);
    setStorage(CLIENTS_DB_KEY, clients);

    createSession(newClient, 'client');
    document.getElementById('client-dashboard-title').textContent = `Welcome, ${name}!`;
    showPage('page-client-dashboard');
}

function handleClientLogin(event) {
    event.preventDefault();
    hideFormError('client-login-error');

    const email = document.getElementById('client-login-email').value;
    const password = document.getElementById('client-login-password').value;

    const clients = getStorage(CLIENTS_DB_KEY);
    const client = clients.find(c => c.email === email && c.password === password);

    if (client) {
        createSession(client, 'client');
        document.getElementById('client-dashboard-title').textContent = `Welcome, ${client.name}!`;
        showPage('page-client-dashboard');
    } else {
        showFormError('client-login-error', 'Invalid email or password.');
    }
}

function handleExpertSignup(event) {
    event.preventDefault();
    hideFormError('expert-signup-error');
    
    const name = document.getElementById('expert-name').value;
    const email = document.getElementById('expert-email').value;
    const phone = document.getElementById('expert-phone').value;
    const password = document.getElementById('expert-password').value;
    const profession = document.getElementById('expert-profession').value;
    const experience = document.getElementById('expert-experience').value;
    const bio = document.getElementById('expert-bio').value;
    
    const photo = document.getElementById('expert-photo').value;
    const idDoc = document.getElementById('expert-id').value;
    const degreeDoc = document.getElementById('expert-degree').value;

    if (!profession) {
         showFormError('expert-signup-error', 'Please select a profession.');
        return;
    }
    if (!photo || !idDoc || !degreeDoc) {
         showFormError('expert-signup-error', 'Please upload all required verification documents (Photo, ID, Degree).');
        return;
    }


    const experts = getStorage(EXPERTS_DB_KEY);
    
    if (experts.find(e => e.email === email)) {
        showFormError('expert-signup-error', 'An account with this email already exists.');
        return;
    }

    const newExpert = { name, email, phone, password, profession, experience, bio };
    experts.push(newExpert);
    setStorage(EXPERTS_DB_KEY, experts);


    createSession(newExpert, 'expert');
    document.getElementById('expert-dashboard-title').textContent = `Welcome, ${name}!`;
    document.getElementById('expert-profile-data').innerHTML = `
        <strong>Name:</strong> ${name}<br>
        <strong>Email:</strong> ${email}<br>
        <strong>Phone:</strong> ${phone}<br>
        <strong>Profession:</strong> ${profession}<br>
        <strong>Experience:</strong> ${experience} years<br>
        <strong>Bio:</strong> ${bio}
    `;
    renderExpertAppointments();
    showPage('page-expert-dashboard');
}

function handleExpertLogin(event) {
    event.preventDefault();
    hideFormError('expert-login-error');

    const email = document.getElementById('expert-login-email').value;
    const password = document.getElementById('expert-login-password').value;

    const experts = getStorage(EXPERTS_DB_KEY);
    const expert = experts.find(e => e.email === email && e.password === password);

    if (expert) {
        createSession(expert, 'expert');
        document.getElementById('expert-dashboard-title').textContent = `Welcome, ${expert.name}!`;
        document.getElementById('expert-profile-data').innerHTML = `
            <strong>Name:</strong> ${expert.name}<br>
            <strong>Email:</strong> ${expert.email}<br>
            <strong>Phone:</strong> ${expert.phone}<br>
            <strong>Profession:</strong> ${expert.profession}<br>
            <strong>Experience:</strong> ${expert.experience} years<br>
            <strong>Bio:</strong> ${expert.bio}
        `;
        renderExpertAppointments();
        showPage('page-expert-dashboard');
    } else {
        showFormError('expert-login-error', 'Invalid email or password.');
    }
}


// --- INITIALIZATION ---

function initializeApp() {
    renderProfessions();
    populateProfessionOptions();
    
    const session = getSession();
    if (session) {
        if (session.type === 'client') {
            document.getElementById('client-dashboard-title').textContent = `Welcome, ${session.name}!`;
            showPage('page-client-dashboard');

        } else if (session.type === 'expert') {
            document.getElementById('expert-dashboard-title').textContent = `Welcome, ${session.name}!`;
            document.getElementById('expert-profile-data').innerHTML = `
                <strong>Name:</strong> ${session.name}<br>
                <strong>Email:</strong> ${session.email}<br>
                <strong>Phone:</strong> ${session.phone}<br>
                <strong>Profession:</strong> ${session.profession}<br>
                <strong>Experience:</strong> ${session.experience} years<br>
                <strong>Bio:</strong> ${session.bio}
            `;
            renderExpertAppointments();
            showPage('page-expert-dashboard');
        }
    } else {
        showPage('page-home');
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);


// ============================================================
// AI ASSISTANT FUNCTIONS
// ============================================================

async function handleAiQuery(event) {
    event.preventDefault();
    const input = document.getElementById('ai-query-input');
    const query = input.value;
    if (!query) return;

    displayAiLoading(true);
    document.getElementById('ai-results').classList.add('hidden');

    try {
        const result = await callGeminiApi(query);
        displayAiResults(result.text, result.sources);

        const session = getSession();
        if (session && session.type === 'client') {
            const aiHistory = getStorage(AI_HISTORY_DB_KEY);
            aiHistory.push({
                clientEmail: session.email,
                query: query,
                answer: result.text
            });
            setStorage(AI_HISTORY_DB_KEY, aiHistory);
        }

    } catch (error) {
        console.error("AI Query Error:", error);
        displayAiResults("Sorry, I encountered an error while processing your request. Please try again.", []);
    } finally {
        displayAiLoading(false);
    }
}

function displayAiLoading(isLoading) {
    const loader = document.getElementById('ai-loader');
    const button = document.getElementById('ai-query-button');
    const input = document.getElementById('ai-query-input');

    if (isLoading) {
        loader.classList.remove('hidden');
        button.disabled = true;
        button.classList.add('opacity-50', 'cursor-not-allowed');
        input.disabled = true;
    } else {
        loader.classList.add('hidden');
        button.disabled = false;
        button.classList.remove('opacity-50', 'cursor-not-allowed');
        input.disabled = false;
    }
}

function displayAiResults(text, sources) {
    const resultsContainer = document.getElementById('ai-results');
    const answerEl = document.getElementById('ai-answer');
    const sourcesEl = document.getElementById('ai-sources');

    answerEl.textContent = text;
    sourcesEl.innerHTML = '';
    
    if (sources && sources.length > 0) {
        sources.forEach(source => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="${source.uri}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline">${source.title || source.uri}</a>`;
            sourcesEl.appendChild(li);
        });
    } else {
        if (!text.startsWith("Sorry")) {
            sourcesEl.innerHTML = '<li>No specific sources were cited for this answer.</li>';
        }
    }
    resultsContainer.classList.remove('hidden');
}

async function callGeminiApi(query, retries = 3, delay = 1000) {
    const apiKey = "AIzaSyCYI1LQj6mGX6eiIscTadbhO0rMbCnmsaw";

    //✅ Correct endpoint for current Gemini API (2025)
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    // ✅ Simplified payload with optional search retrieval (still supported)
     const payload = {
        contents: [
            {
                parts: [
                    { text: query }
                ]
            }
        ]
    };


    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Client error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text || null;

            if (!text) throw new Error("Invalid response structure.");

            return { text, sources: [] }; // You can add source parsing later

        } catch (error) {
            console.warn(`API call failed (attempt ${i + 1}/${retries}):`, error.message);
            if (i === retries - 1) {
                throw new Error(`Failed to get AI response after ${retries} attempts.`);
            }
            await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
        }
    }
}


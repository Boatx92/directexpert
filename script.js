// --- STORAGE KEYS ---
const CLIENTS_DB_KEY = 'directexpert_clients';
const EXPERTS_DB_KEY = 'directexpert_experts';
const SESSION_KEY = 'directexpert_session';
const BOOKINGS_DB_KEY = 'directexpert_bookings';
const AI_HISTORY_DB_KEY = 'directexpert_ai_history';

// --- MOCK DATA ---
const MOCK_FIRST_NAMES = ['Aarav','Vihaan','Aditya','Vivaan','Arjun','Reyansh','Shaurya','Rohan','Advik','Kabir','Aanya','Diya','Myra','Saanvi','Ananya','Aarohi','Pari','Isha','Riya','Siya','Dev','Raj','Karan','Veer','Yash','Ishaan','Aman','Rahul','Nikhil','Ravi','Priya','Meera','Tara','Zoya','Aisha','Kavya','Sonia','Rani','Mira','Neha'];
const MOCK_LAST_NAMES = ['Sharma','Verma','Gupta','Singh','Kumar','Patel','Reddy','Mehta','Shah','Khan','Jain','Agarwal','Murthy','Pillai','Rao','Chopra','Malhotra','Kapoor','Menon','Nair'];

// PROFESSIONS LIST (73 items as in your original file)
const PROFESSIONS_LIST = [
    "Cardiologist","Dermatologist","Neurologist","Orthopedic Surgeon","Pediatrician","Oncologist","Psychiatrist","Radiologist","Endocrinologist","Gastroenterologist","Pulmonologist",
    "Tax Lawyer","Corporate Lawyer","Intellectual Property Lawyer","Family Lawyer","Criminal Lawyer","Immigration Lawyer","Real Estate Lawyer","Environmental Lawyer","Labor Lawyer",
    "Chartered Accountant","Financial Advisor","Investment Banker","Auditor","Management Consultant","Risk Analyst","Actuary","Economist","Forensic Accountant",
    "Software Architect","Data Scientist","AI/ML Engineer","Cybersecurity Expert","Cloud Solutions Architect","DevOps Engineer","Blockchain Developer","Network Engineer",
    "Architect","Civil Engineer","Mechanical Engineer","Electrical Engineer","Aerospace Engineer","Chemical Engineer","Biomedical Engineer",
    "Marketing Strategist","Brand Manager","SEO/SEM Expert","Public Relations (PR) Expert","Market Research Analyst","Journalist","Book Editor","Screenwriter","Technical Writer","Grant Writer","Interior Designer","Graphic Designer","UX/UI Designer","Fashion Designer","Industrial Designer",
    "University Professor (MBA)","Supply Chain Manager","Human Resources (HR) Consultant","Chief Financial Officer (CFO)","Operations Manager","Project Manager (PMP)","Logistics Manager",
    "Biotechnologist","Geologist","Event Planner","Executive Chef","Master Electrician","Master Plumber"
];

let CURRENT_SPECIALISTS = []; 
let CURRENTLY_VIEWED_SPECIALIST = null;
let PENDING_BOOKING_DETAILS = null;

// Helpers
function getStorage(key){ const d = localStorage.getItem(key); return d? JSON.parse(d): []; }
function setStorage(key,data){ localStorage.setItem(key,JSON.stringify(data)); }
function getSession(){ const s = localStorage.getItem(SESSION_KEY); return s? JSON.parse(s) : null; }
function createSession(user,type){ const sessionData = { email: user.email, name: user.name, phone: user.phone, type: type, ...user }; localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData)); }
function logout(){ localStorage.removeItem(SESSION_KEY); showPage('page-home'); }
function generateId(){ return Date.now().toString(36)+Math.random().toString(36).slice(2); }
function getFormattedDateTime(date){ return new Date(date).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' }); }

// Page navigation
function showPage(pageId){
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if(target) target.classList.add('active');
    window.scrollTo(0,0);
    const header = document.getElementById('main-header');
    if(pageId === 'page-communication') header.classList.add('hidden'); else header.classList.remove('hidden');
    updateNav();
}

// Toggle auth forms
function toggleClientForm(formType){ if(formType==='login'){ document.getElementById('client-signup-form').classList.add('hidden'); document.getElementById('client-login-form').classList.remove('hidden'); } else { document.getElementById('client-signup-form').classList.remove('hidden'); document.getElementById('client-login-form').classList.add('hidden'); } }
function toggleExpertForm(formType){ if(formType==='login'){ document.getElementById('expert-signup-form').classList.add('hidden'); document.getElementById('expert-login-form').classList.remove('hidden'); } else { document.getElementById('expert-signup-form').classList.remove('hidden'); document.getElementById('expert-login-form').classList.add('hidden'); } }

function showFormError(id,msg){ const el = document.getElementById(id); el.textContent = msg; el.classList.remove('hidden'); }
function hideFormError(id){ const el = document.getElementById(id); el.textContent = ''; el.classList.add('hidden'); }

// Nav update
function updateNav(){
    const session = getSession();
    document.getElementById('nav-guest').classList.toggle('hidden', !!session);
    document.getElementById('nav-client').classList.toggle('hidden', !(session && session.type==='client'));
    document.getElementById('nav-expert').classList.toggle('hidden', !(session && session.type==='expert'));
}

// Generate mock specialists
function generateMockSpecialist(id,profession){
    const f = MOCK_FIRST_NAMES[Math.floor(Math.random()*MOCK_FIRST_NAMES.length)];
    const l = MOCK_LAST_NAMES[Math.floor(Math.random()*MOCK_LAST_NAMES.length)];
    const name = `Dr. ${f} ${l}`;
    const experience = Math.floor(Math.random()*20)+25;
    const bio = `Dr. ${l} is a respected ${profession} with ${experience} years experience.`;
    return { id: `${profession.toLowerCase().replace(/ /g,'-')}-${id}`, name, profession, experience, bio, isMock:true };
}

// Render professions on dashboard
function renderProfessions(){
    const container = document.getElementById('professions-list');
    container.innerHTML = '';
    PROFESSIONS_LIST.forEach(prof => {
        const card = document.createElement('div');
        card.className = 'profession-card bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer';
        card.setAttribute('data-profession-name', prof.toLowerCase());
        card.innerHTML = `
            <div class="flex items-center justify-center h-16 w-16 bg-indigo-100 text-indigo-600 rounded-full mx-auto text-3xl font-bold">
                ${prof.substring(0,1)}
            </div>
            <h3 class="mt-4 text-xl font-semibold text-gray-900 text-center">${prof}</h3>
        `;
        card.onclick = ()=> viewProfession(prof);
        container.appendChild(card);
    });
}

// Populate expert profession select (signup)
function populateProfessionOptions(){
    const select = document.getElementById('expert-profession');
    if(!select) return;
    select.innerHTML = '<option value="" disabled selected>Select your profession</option>';
    PROFESSIONS_LIST.forEach(p => { const o = document.createElement('option'); o.value = p; o.textContent = p; select.appendChild(o); });
}

// View profession -> list of specialists
function viewProfession(professionName){
    document.getElementById('specialist-list-title').textContent = `Professionals: ${professionName}`;
    const container = document.getElementById('specialist-list-container');
    container.innerHTML = '';

    const allExperts = getStorage(EXPERTS_DB_KEY);
    const real = allExperts.filter(e => e.profession === professionName);
    const mock = [];
    for(let i=0;i<30;i++) mock.push(generateMockSpecialist(i,professionName));
    CURRENT_SPECIALISTS = [...real, ...mock];

    if(CURRENT_SPECIALISTS.length===0){
        document.getElementById('specialist-no-results').classList.remove('hidden');
    } else {
        document.getElementById('specialist-no-results').classList.add('hidden');
        CURRENT_SPECIALISTS.forEach(s => container.appendChild(createSpecialistCard(s)));
    }
    showPage('page-specialist-list');
}

function createSpecialistCard(specialist){
    const card = document.createElement('div');
    card.className = 'specialist-card bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl';
    const placeholderImg = `https://placehold.co/600x400/a3a3a3/ffffff?text=${encodeURIComponent(specialist.name)}`;
    const badge = specialist.isMock ? '' : '<span class="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Verified</span>';
    const identifier = specialist.email || specialist.id;
    card.innerHTML = `
        <div class="relative">
            <img class="h-56 w-full object-cover" src="${placeholderImg}" alt="${specialist.name}">
            ${badge}
        </div>
        <div class="p-6">
            <h3 class="text-2xl font-semibold text-gray-900">${specialist.name}</h3>
            <p class="text-indigo-600 font-medium">${specialist.profession}</p>
            <p class="mt-4 text-gray-600">${specialist.experience} years of experience. ${specialist.bio.substring(0,60)}...</p>
            <button class="mt-6 w-full bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100" onclick="viewSpecialist('${identifier}')">View Profile</button>
        </div>
    `;
    return card;
}

function viewSpecialist(identifier){
    const allExperts = getStorage(EXPERTS_DB_KEY);
    let specialist = CURRENT_SPECIALISTS.find(s => s.email === identifier || s.id === identifier);
    if(!specialist){
        specialist = allExperts.find(s => s.email === identifier) || allExperts.find(s => s.id === identifier);
    }
    if(!specialist) return alert('Specialist not found');
    CURRENTLY_VIEWED_SPECIALIST = specialist;
    document.getElementById('profile-img').src = `https://placehold.co/400x400/a3a3a3/ffffff?text=${encodeURIComponent(specialist.name)}`;
    document.getElementById('profile-name').textContent = specialist.name;
    document.getElementById('profile-title').textContent = specialist.profession;
    document.getElementById('profile-experience').textContent = `${specialist.experience} years of experience`;
    document.getElementById('profile-bio').textContent = specialist.bio;
    showPage('page-specialist-profile');
}

// Search functions
function searchProfessions(){
    const q = document.getElementById('profession-search').value.toLowerCase();
    const cards = document.querySelectorAll('.profession-card');
    let has=false;
    cards.forEach(c => {
        const n = c.getAttribute('data-profession-name');
        if(n.includes(q)){ c.style.display='block'; has=true; } else c.style.display='none';
    });
    document.getElementById('professions-no-results').classList.toggle('hidden', has);
}
function searchSpecialists(){
    const q = document.getElementById('specialist-search').value.toLowerCase();
    const cards = document.querySelectorAll('.specialist-card');
    let has=false;
    cards.forEach(c => {
        const n = c.getAttribute('data-specialist-name');
        if(n?.includes(q)) { c.style.display='block'; has=true; } else c.style.display='none';
    });
    document.getElementById('specialist-no-results').classList.toggle('hidden', has);
}

// Show client profile + bookings + ai history
function showClientProfile(){
    const session = getSession();
    if(!session || session.type !== 'client'){ goHome(); return; }
    document.getElementById('client-profile-details').innerHTML = `<p><strong>Name:</strong> ${session.name}</p><p><strong>Email:</strong> ${session.email}</p><p><strong>Phone:</strong> ${session.phone}</p>`;

    // bookings
    const bookingContainer = document.getElementById('client-booking-history');
    const allBookings = getStorage(BOOKINGS_DB_KEY);
    const myBookings = allBookings.filter(b => b.clientEmail === session.email);
    bookingContainer.innerHTML = '';
    if(myBookings.length===0) bookingContainer.innerHTML = '<p class="text-gray-500">You have no booking history.</p>';
    else myBookings.reverse().forEach(b => {
        const el = document.createElement('div');
        el.className = 'p-4 border border-gray-200 rounded-lg bg-gray-50';
        el.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-semibold text-lg text-gray-800">${b.type === 'Group Discussion' ? 'Group Discussion' : b.expertName}</h4>
                    <p class="text-sm text-indigo-600">${b.expertProfession || (b.participatingExperts ? 'Multiple Experts' : '')}</p>
                    <p class="text-sm text-gray-500 mt-1">Scheduled: ${getFormattedDateTime(new Date(b.time))}</p>
                    <p class="text-sm text-gray-500">Type: ${b.type}</p>
                </div>
                <button onclick="joinCall('${b.id}')" class="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 whitespace-nowrap">Join Call</button>
            </div>
        `;
        bookingContainer.appendChild(el);
    });

    // AI history
    const aiContainer = document.getElementById('client-ai-history');
    const allAiHistory = getStorage(AI_HISTORY_DB_KEY);
    const myAi = allAiHistory.filter(h => h.clientEmail === session.email);
    aiContainer.innerHTML = '';
    if(myAi.length===0) aiContainer.innerHTML = '<p class="text-gray-500">You have not asked any AI questions.</p>';
    else myAi.reverse().forEach(h => {
        const el = document.createElement('div');
        el.className = 'p-4 border border-gray-200 rounded-lg bg-gray-50';
        el.innerHTML = `<p class="font-medium text-gray-700">You asked:</p><p class="text-gray-600 italic mb-2">"${h.query}"</p><p class="font-medium text-gray-700">AI Answer (snippet):</p><p class="text-gray-600">${h.answer.substring(0,100)}...</p>`;
        aiContainer.appendChild(el);
    });

    showPage('page-client-profile');
}

// Expert appointments (expert dashboard)
function renderExpertAppointments(){
    const session = getSession();
    if(!session || session.type !== 'expert') return;
    const appointmentContainer = document.getElementById('expert-appointments-list');
    const allBookings = getStorage(BOOKINGS_DB_KEY);
    const myBookings = allBookings.filter(b => b.expertEmail === session.email);
    appointmentContainer.innerHTML = '';
    if(myBookings.length===0) appointmentContainer.innerHTML = '<p class="text-gray-500">You have no upcoming appointments.</p>';
    else myBookings.reverse().forEach(b => {
        const el = document.createElement('div');
        el.className = 'p-4 border border-gray-200 rounded-lg bg-gray-50';
        el.innerHTML = `<div class="flex justify-between items-start"><div><h4 class="font-semibold text-lg text-gray-800">Client: ${b.clientName}</h4><p class="text-sm text-gray-500 mt-1">Booked for: ${getFormattedDateTime(new Date(b.time))}</p><p class="text-sm text-gray-500">Type: ${b.type}</p></div><button onclick="joinCall('${b.id}')" class="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 whitespace-nowrap">Join Call</button></div>`;
        appointmentContainer.appendChild(el);
    });
}

// COMMUNICATION: join call -> single or group
function joinCall(bookingId){
    const session = getSession();
    const allBookings = getStorage(BOOKINGS_DB_KEY);
    const booking = allBookings.find(b => b.id === bookingId);
    if(!booking || !session){ alert("Error: Could not find call."); return; }

    // Names for display
    if(booking.type === 'Group Discussion'){
        // show list of experts in group
        const names = booking.participatingExperts || [];
        document.getElementById('comm-header-title').textContent = `Group Discussion (${names.length} experts)`;
        document.getElementById('comm-main-video-name').innerHTML = names.map(n => `<div>${n}</div>`).join('');
        document.getElementById('comm-self-video-name').textContent = session.name + " (You)";
        // chat other name shows first expert
        document.getElementById('comm-chat-messages').innerHTML = `<div class="text-sm"><span class="font-semibold text-indigo-300">System</span><p class="bg-gray-700 p-2 rounded-lg inline-block">You have joined the group discussion.</p></div>`;
    } else {
        if(session.type === 'client'){
            document.getElementById('comm-header-title').textContent = `Call with ${booking.expertName}`;
            document.getElementById('comm-main-video-name').textContent = booking.expertName;
            document.getElementById('comm-self-video-name').textContent = session.name + " (You)";
        } else {
            document.getElementById('comm-header-title').textContent = `Call with ${booking.clientName}`;
            document.getElementById('comm-main-video-name').textContent = booking.clientName;
            document.getElementById('comm-self-video-name').textContent = session.name + " (You)";
        }
        document.getElementById('comm-chat-messages').innerHTML = `<div class="text-sm"><span class="font-semibold text-indigo-300">System</span><p class="bg-gray-700 p-2 rounded-lg inline-block">You have joined the call.</p></div>`;
    }

    showPage('page-communication');
}

function toggleChat(){ document.getElementById('comm-chat-sidebar').classList.toggle('open'); }
function endCall(){ goHome(); }

// BOOKING modal reused for single bookings (existing functions)
function openBookingModal(){
    if(!CURRENTLY_VIEWED_SPECIALIST) return;
    document.getElementById('booking-options').classList.remove('hidden');
    document.getElementById('payment-form').classList.add('hidden');
    document.getElementById('booking-confirmation').classList.add('hidden');
    document.getElementById('booking-modal-title').textContent = `Book with ${CURRENTLY_VIEWED_SPECIALIST.name}`;
    document.getElementById('booking-modal').classList.remove('hidden');
}
function closeBookingModal(){ document.getElementById('booking-modal').classList.add('hidden'); PENDING_BOOKING_DETAILS = null; }

// Urgent / Scheduled booking for single specialist (existing behavior)
function handleUrgentBooking(){
    const bookingTime = new Date();
    const type = 'Urgent (15 min)';
    const session = getSession();
    PENDING_BOOKING_DETAILS = {
        type,
        time: bookingTime.toISOString(),
        expertName: CURRENTLY_VIEWED_SPECIALIST.name,
        expertEmail: CURRENTLY_VIEWED_SPECIALIST.email || null,
        expertProfession: CURRENTLY_VIEWED_SPECIALIST.profession,
        clientName: session.name,
        clientEmail: session.email
    };
    document.getElementById('booking-options').classList.add('hidden');
    document.getElementById('payment-summary').textContent = `Total for ${type} call: ₹500`;
    document.getElementById('payment-form').classList.remove('hidden');
    hideFormError('payment-error');
}
function handleScheduledBooking(){
    const dateInput = document.getElementById('booking-date');
    const timeInput = document.getElementById('booking-time');
    const date = dateInput.value; const time = timeInput.value;
    dateInput.classList.remove('border-red-500'); timeInput.classList.remove('border-red-500');
    let valid = true;
    if(!date){ dateInput.classList.add('border-red-500'); valid=false; }
    if(!time){ timeInput.classList.add('border-red-500'); valid=false; }
    if(!valid) return;
    const bookingTime = new Date(`${date}T${time}`);
    const type = 'Scheduled (30 min)';
    const session = getSession();
    PENDING_BOOKING_DETAILS = {
        type,
        time: bookingTime.toISOString(),
        expertName: CURRENTLY_VIEWED_SPECIALIST.name,
        expertEmail: CURRENTLY_VIEWED_SPECIALIST.email || null,
        expertProfession: CURRENTLY_VIEWED_SPECIALIST.profession,
        clientName: session.name,
        clientEmail: session.email
    };
    document.getElementById('booking-options').classList.add('hidden');
    document.getElementById('payment-summary').textContent = `Total for ${type} call: ₹1000`;
    document.getElementById('payment-form').classList.remove('hidden');
    hideFormError('payment-error');
}

// Payment handling for single booking
function handlePayment(event){
    event.preventDefault();
    hideFormError('payment-error');
    if(!document.getElementById('card-name').value || !document.getElementById('card-number').value || !document.getElementById('card-expiry').value || !document.getElementById('card-cvc').value){
        showFormError('payment-error','Please fill in all card details.');
        return;
    }
    if(!PENDING_BOOKING_DETAILS) return;
    const bookings = getStorage(BOOKINGS_DB_KEY);
    const newBooking = { id: generateId(), ...PENDING_BOOKING_DETAILS };
    bookings.push(newBooking);
    setStorage(BOOKINGS_DB_KEY, bookings);
    document.getElementById('payment-form').classList.add('hidden');
    document.getElementById('booking-confirmation-message').textContent = `Your ${newBooking.type} call with ${newBooking.expertName} is confirmed for ${getFormattedDateTime(newBooking.time)}.`;
    document.getElementById('booking-confirmation').classList.remove('hidden');
    renderExpertAppointments();
    setTimeout(closeBookingModal, 1200);
}

// AUTH handlers
function handleClientSignup(event){
    event.preventDefault(); hideFormError('client-signup-error');
    const name = document.getElementById('client-name').value;
    const email = document.getElementById('client-email').value;
    const phone = document.getElementById('client-phone').value;
    const password = document.getElementById('client-password').value;
    const clients = getStorage(CLIENTS_DB_KEY);
    if(clients.find(c => c.email===email)){ showFormError('client-signup-error','An account with this email already exists.'); return; }
    const newClient = { name, email, phone, password };
    clients.push(newClient); setStorage(CLIENTS_DB_KEY, clients);
    createSession(newClient,'client'); document.getElementById('client-dashboard-title').textContent = `Welcome, ${name}!`; showPage('page-client-dashboard');
}
function handleClientLogin(event){ event.preventDefault(); hideFormError('client-login-error'); const email = document.getElementById('client-login-email').value; const password = document.getElementById('client-login-password').value; const clients = getStorage(CLIENTS_DB_KEY); const client = clients.find(c => c.email===email && c.password===password); if(client){ createSession(client,'client'); document.getElementById('client-dashboard-title').textContent = `Welcome, ${client.name}!`; showPage('page-client-dashboard'); } else { showFormError('client-login-error','Invalid email or password.'); } }
function handleExpertSignup(event){ event.preventDefault(); hideFormError('expert-signup-error'); const name = document.getElementById('expert-name').value; const email = document.getElementById('expert-email').value; const phone = document.getElementById('expert-phone').value; const password = document.getElementById('expert-password').value; const profession = document.getElementById('expert-profession').value; const experience = document.getElementById('expert-experience').value; const bio = document.getElementById('expert-bio').value; const photo = document.getElementById('expert-photo').value; const idDoc = document.getElementById('expert-id').value; const degreeDoc = document.getElementById('expert-degree').value; if(!profession){ showFormError('expert-signup-error','Please select a profession.'); return; } if(!photo || !idDoc || !degreeDoc){ showFormError('expert-signup-error','Please upload all required verification documents (Photo, ID, Degree).'); return; } const experts = getStorage(EXPERTS_DB_KEY); if(experts.find(e => e.email===email)){ showFormError('expert-signup-error','An account with this email already exists.'); return; } const newExpert = { name,email,phone,password,profession,experience,bio }; experts.push(newExpert); setStorage(EXPERTS_DB_KEY,experts); createSession(newExpert,'expert'); document.getElementById('expert-dashboard-title').textContent = `Welcome, ${name}!`; document.getElementById('expert-profile-data').innerHTML = `<strong>Name:</strong> ${name}<br><strong>Email:</strong> ${email}`; showPage('page-expert-dashboard'); }
function handleExpertLogin(event){ event.preventDefault(); hideFormError('expert-login-error'); const email = document.getElementById('expert-login-email').value; const password = document.getElementById('expert-login-password').value; const experts = getStorage(EXPERTS_DB_KEY); const expert = experts.find(e => e.email===email && e.password===password); if(expert){ createSession(expert,'expert'); document.getElementById('expert-dashboard-title').textContent = `Welcome, ${expert.name}!`; document.getElementById('expert-profile-data').innerHTML = `<strong>Name:</strong> ${expert.name}<br><strong>Email:</strong> ${expert.email}`; renderExpertAppointments(); showPage('page-expert-dashboard'); } else { showFormError('expert-login-error','Invalid email or password.'); } }

// AI assistant (simple mock that stores queries)
function handleAiQuery(e){ e.preventDefault(); const q = document.getElementById('ai-query-input').value.trim(); if(!q) return; document.getElementById('ai-loader').classList.remove('hidden'); document.getElementById('ai-results').classList.add('hidden'); setTimeout(()=>{ document.getElementById('ai-loader').classList.add('hidden'); document.getElementById('ai-results').classList.remove('hidden'); const answer = `This is a mock summarized answer for: "${q}". (Replace with real Google + AI integration.)`; document.getElementById('ai-answer').textContent = answer; document.getElementById('ai-sources').innerHTML = '<li>Example Source A</li><li>Example Source B</li>'; const session = getSession(); if(session && session.type==='client'){ const hist = getStorage(AI_HISTORY_DB_KEY); hist.push({ id: generateId(), clientEmail: session.email, query: q, answer, time: new Date().toISOString() }); setStorage(AI_HISTORY_DB_KEY,hist); } }, 900); }

// -------------------- GROUP DISCUSSION FEATURE --------------------
// Display page where user can select multiple professions and pay a combined fee (₹500 per profession)

// Open group discussion page handler (page is in index.html)
function openGroupDiscussionPage(){
    showPage('page-group-discussion');
}

// We'll create and render the page dynamically on first load to keep index.html clean.
// Build the group discussion page DOM and logic
function buildGroupDiscussionPage(){
    if(document.getElementById('page-group-discussion')) return; // already built

    const section = document.createElement('section');
    section.id = 'page-group-discussion';
    section.className = 'page py-16 sm:py-24';
    section.innerHTML = `
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <button onclick="showPage('page-client-dashboard')" class="text-indigo-600 hover:text-indigo-800 font-medium mb-4">&larr; Back to Dashboard</button>
            <h1 class="text-3xl font-bold text-gray-900 mb-4">Group Discussion</h1>
            <p class="text-gray-600 mb-6">Select multiple professions to invite specialists. ₹500 per selected profession. After payment we'll connect you to a simulated group call with multiple experts.</p>

            <div class="bg-white p-6 rounded-xl shadow-lg mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Select Professions</label>
                <div id="group-professions-list" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"></div>
            </div>

            <div class="bg-white p-6 rounded-xl shadow-lg mb-6">
                <h3 class="text-lg font-semibold text-gray-900">Selected Experts (preview)</h3>
                <div id="group-experts-preview" class="mt-4 space-y-3"></div>
            </div>

            <div class="bg-white p-6 rounded-xl shadow-lg mb-6">
                <div class="flex justify-between items-center">
                    <div>
                        <p class="text-gray-700">Selected professions: <span id="group-selected-count">0</span></p>
                        <p class="text-gray-700">Fee per profession: ₹500</p>
                    </div>
                    <div class="text-right">
                        <p class="text-2xl font-semibold text-indigo-600">Total: ₹<span id="group-total-fee">0</span></p>
                    </div>
                </div>
                <div class="mt-6">
                    <button onclick="openGroupPayment()" id="group-pay-btn" class="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-300">Pay & Start Discussion</button>
                </div>
            </div>
        </div>
    `;
    // insert before footer (append to body)
    document.body.appendChild(section);

    // Render profession buttons
    const profContainer = document.getElementById('group-professions-list');
    PROFESSIONS_LIST.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'group-profession-btn w-full text-left p-3 border border-gray-200 rounded-lg hover:shadow-sm transition';
        btn.setAttribute('data-profession', p);
        btn.innerHTML = `<div class="font-medium text-gray-800">${p}</div><div class="text-sm text-gray-500">Click to select</div>`;
        btn.onclick = () => toggleGroupProfession(p, btn);
        profContainer.appendChild(btn);
    });

    // prepare storage for selected professions
    window.GROUP_SELECTED_PROFESSIONS = new Set();
    window.GROUP_SELECTED_EXPERTS = []; // preview list of experts aggregated from selected professions
}

// Toggle select profession for group discussion
function toggleGroupProfession(profession, btn){
    const set = window.GROUP_SELECTED_PROFESSIONS;
    if(set.has(profession)){
        set.delete(profession);
        btn.classList.remove('bg-indigo-50','border-indigo-400');
    } else {
        set.add(profession);
        btn.classList.add('bg-indigo-50','border-indigo-400');
    }
    updateGroupSelectionUI();
}

// Update preview & fee
function updateGroupSelectionUI(){
    const set = window.GROUP_SELECTED_PROFESSIONS;
    document.getElementById('group-selected-count').textContent = String(set.size);
    const fee = 500;
    document.getElementById('group-total-fee').textContent = String(set.size * fee);

    // Build preview list of experts (from real experts + mock)
    const preview = document.getElementById('group-experts-preview');
    preview.innerHTML = '';
    window.GROUP_SELECTED_EXPERTS = [];
    const expertsDB = getStorage(EXPERTS_DB_KEY);

    // For each selected profession, pick up to 2 real experts if available, otherwise mock
    set.forEach((prof) => {
        const real = expertsDB.filter(e => e.profession === prof).slice(0,2);
        if(real.length){
            real.forEach(r => { window.GROUP_SELECTED_EXPERTS.push(r.name); const el = document.createElement('div'); el.className='p-3 border border-gray-200 rounded-lg'; el.innerHTML = `<div class="font-semibold">${r.name}</div><div class="text-sm text-gray-500">${r.profession}</div>`; preview.appendChild(el); });
        } else {
            // create 1 mock specialist for preview
            const m = generateMockSpecialist(Math.floor(Math.random()*10000), prof);
            window.GROUP_SELECTED_EXPERTS.push(m.name);
            const el = document.createElement('div'); el.className='p-3 border border-gray-200 rounded-lg'; el.innerHTML = `<div class="font-semibold">${m.name}</div><div class="text-sm text-gray-500">${m.profession}</div>`; preview.appendChild(el);
        }
    });
}

// Open group payment panel (reuse booking modal payment form)
function openGroupPayment(){
    const count = window.GROUP_SELECTED_PROFESSIONS.size || 0;
    if(count === 0) return alert('Please select at least one profession.');
    // Prepare pending group booking
    const session = getSession();
    if(!session) return alert('Please login as client to start a group discussion.');
    const bookingTime = new Date(); // immediate for demo
    PENDING_BOOKING_DETAILS = {
        type: 'Group Discussion',
        time: bookingTime.toISOString(),
        clientName: session.name,
        clientEmail: session.email,
        participatingProfessions: Array.from(window.GROUP_SELECTED_PROFESSIONS),
        participatingExperts: window.GROUP_SELECTED_EXPERTS.slice()
    };
    document.getElementById('booking-options').classList.add('hidden');
    const total = count * 500;
    document.getElementById('payment-summary').textContent = `Total for Group Discussion (${count} professions): ₹${total}`;
    document.getElementById('payment-form').classList.remove('hidden');
    hideFormError('payment-error');
    document.getElementById('booking-modal-title').textContent = `Group Discussion — Pay ₹${total}`;
    document.getElementById('booking-modal').classList.remove('hidden');
}

// Payment handling for group booking uses same handlePayment function but we need to intercept and create group booking
// We'll modify handlePayment to support group details (already done because it saves PENDING_BOOKING_DETAILS)
// After payment we need to route to group call page
// We'll add a small wrapper to detect group bookings
const originalHandlePayment = window.handlePayment;
window.handlePayment = function(event){
    // call existing handlePayment logic (defined later) - but it exists in this file; direct call below
    handlePaymentCore(event);
};

// Core payment logic (handles both single and group)
function handlePaymentCore(event){
    event.preventDefault();
    hideFormError('payment-error');
    if(!document.getElementById('card-name').value || !document.getElementById('card-number').value || !document.getElementById('card-expiry').value || !document.getElementById('card-cvc').value){
        showFormError('payment-error','Please fill in all card details.');
        return;
    }
    if(!PENDING_BOOKING_DETAILS) return;
    const bookings = getStorage(BOOKINGS_DB_KEY);
    const newBooking = { id: generateId(), ...PENDING_BOOKING_DETAILS };
    bookings.push(newBooking);
    setStorage(BOOKINGS_DB_KEY, bookings);

    document.getElementById('payment-form').classList.add('hidden');
    document.getElementById('booking-confirmation-message').textContent = `Your ${newBooking.type} is confirmed. Connecting you now...`;
    document.getElementById('booking-confirmation').classList.remove('hidden');
    renderExpertAppointments();

    // Close modal and open the communication page for group immediately after a short delay
    setTimeout(()=>{ document.getElementById('booking-modal').classList.add('hidden'); PENDING_BOOKING_DETAILS = null;
        if(newBooking.type === 'Group Discussion'){
            // navigate to communication page showing all expert names
            // we will store booking id in localStorage to be able to join
            joinCall(newBooking.id);
        } else {
            // single booking -> show confirmation then auto-close
            setTimeout(closeBookingModal,1200);
        }
    },900);
}

// ---------------------- INITIALIZATION ----------------------
function goHome(){
    const session = getSession();
    if(session){
        if(session.type === 'client') showPage('page-client-dashboard');
        else if(session.type === 'expert') { renderExpertAppointments(); showPage('page-expert-dashboard'); }
        else showPage('page-home');
    } else showPage('page-home');
}

// Build group page and populate professions on start
window.addEventListener('load', ()=>{
    // ensure localstorage keys exist
    if(!localStorage.getItem(CLIENTS_DB_KEY)) setStorage(CLIENTS_DB_KEY,[]);
    if(!localStorage.getItem(EXPERTS_DB_KEY)) setStorage(EXPERTS_DB_KEY,[]);
    if(!localStorage.getItem(BOOKINGS_DB_KEY)) setStorage(BOOKINGS_DB_KEY,[]);
    if(!localStorage.getItem(AI_HISTORY_DB_KEY)) setStorage(AI_HISTORY_DB_KEY,[]);

    populateProfessionOptions();
    renderProfessions();
    buildGroupDiscussionPage();
    updateNav();
});


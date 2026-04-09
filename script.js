/**
 * PulseID MVP Core Logic - Cloud Edition
 * Uses JSONBin.io for cloud persistence, localStorage as cache
 * Enables cross-device profile access via QR code
 */

// --- Configuration ---
const JSONBIN_API_KEY = '$2a$10$kHYd5sOkbctq9YIFMvVr3ei.xNGh9PPLAwFvc28Yg8Na3TWtxD/gG';
const JSONBIN_API_URL = 'https://api.jsonbin.io/v3/b';

// --- State Management ---
const state = {
    user: JSON.parse(localStorage.getItem('pulseid_user')) || null,
    users: JSON.parse(localStorage.getItem('pulseid_all_users')) || [],
    settings: JSON.parse(localStorage.getItem('pulseid_settings')) || {
        emergencyAccess: true,
        plan: 'free'
    },
    userBinId: localStorage.getItem('pulseid_user_bin_id') || null, // Store bin ID for updates
    view: 'landing', // landing, dashboard, provider, admin
    adminClicks: 0,
    isLoading: false
};

// Migrate old single user to users array if needed
if (state.user && !state.users.find(u => u.pid === state.user.pid)) {
    state.users.push(state.user);
    localStorage.setItem('pulseid_all_users', JSON.stringify(state.users));
}

// --- DOM Elements ---
const elements = {
    landing: document.getElementById('landing-page'),
    dashboard: document.getElementById('dashboard'),
    provider: document.getElementById('provider-view'),
    navDemoBtn: document.getElementById('nav-demo-btn'),
    heroCtaBtn: document.getElementById('hero-cta-btn'),
    logoLink: document.getElementById('logo-link')
};

// --- Initialization ---
function init() {
    setupEventListeners();
    handleURLParameters();
    render();
}

async function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const binId = urlParams.get('bin');
    const pid = urlParams.get('id');

    // Priority 1: Check for bin ID (cloud-based profile)
    if (binId) {
        state.isLoading = true;
        render();
        try {
            const userData = await fetchUserFromCloud(binId);
            if (userData) {
                state.user = userData;
                state.userBinId = binId;
                state.view = 'provider';
                // Cache locally for offline access
                localStorage.setItem('pulseid_user', JSON.stringify(state.user));
                localStorage.setItem('pulseid_user_bin_id', binId);
            }
        } catch (error) {
            console.error('Error fetching profile from cloud:', error);
            showError('Failed to load profile. Please try again.');
        } finally {
            state.isLoading = false;
        }
    }
    // Priority 2: Check for legacy PID parameter (localStorage-based)
    else if (pid) {
        const targetUser = state.users.find(u => u.pid === pid);
        if (targetUser) {
            state.user = targetUser;
            state.view = 'provider';
        }
    }
    render();
}

function setupEventListeners() {
    elements.navDemoBtn.addEventListener('click', () => setView('dashboard'));
    elements.heroCtaBtn.addEventListener('click', () => setView('dashboard'));
    
    // Logo link with admin secret gesture
    elements.logoLink.addEventListener('click', (e) => {
        state.adminClicks++;
        if (state.adminClicks === 5) {
            state.adminClicks = 0;
            const pin = prompt("Enter Admin PIN:");
            if (pin === "0000") {
                setView('admin');
            } else {
                setView('landing');
            }
        } else {
            setTimeout(() => { state.adminClicks = 0; }, 3000);
            setView('landing');
        }
    });
}

function setView(viewName) {
    state.view = viewName;
    render();
    window.scrollTo(0, 0);
}

// --- Cloud API Functions ---
async function fetchUserFromCloud(binId) {
    try {
        const response = await fetch(`${JSONBIN_API_URL}/${binId}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.record || null;
    } catch (error) {
        console.error('Error fetching from JSONBin:', error);
        throw error;
    }
}

async function saveUserToCloud(userData) {
    try {
        const response = await fetch(JSONBIN_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY,
                'X-Bin-Name': userData.pid,
                'X-Bin-Private': 'false' // Allow public read access for emergency scanning
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.metadata.id; // Return the bin ID
    } catch (error) {
        console.error('Error saving to JSONBin:', error);
        throw error;
    }
}

async function updateUserInCloud(binId, userData) {
    try {
        const response = await fetch(`${JSONBIN_API_URL}/${binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating in JSONBin:', error);
        throw error;
    }
}

// --- Utilities ---
function generatePID() {
    return 'PID-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

function showError(message) {
    alert(message); // Simple error display; can be enhanced with toast notifications
}

async function saveUser(userData) {
    state.isLoading = true;
    render();

    try {
        const newUser = {
            ...userData,
            pid: state.user?.pid || generatePID(),
            lastAccessed: new Date().toISOString()
        };
        
        let binId = state.userBinId;

        // If this is a new user or no bin ID exists, create a new bin
        if (!binId) {
            binId = await saveUserToCloud(newUser);
            state.userBinId = binId;
            localStorage.setItem('pulseid_user_bin_id', binId);
        } else {
            // Update existing bin
            await updateUserInCloud(binId, newUser);
        }

        state.user = newUser;
        const existingIndex = state.users.findIndex(u => u.pid === newUser.pid);
        if (existingIndex >= 0) {
            state.users[existingIndex] = newUser;
        } else {
            state.users.push(newUser);
        }
        
        // Cache locally
        localStorage.setItem('pulseid_user', JSON.stringify(state.user));
        localStorage.setItem('pulseid_all_users', JSON.stringify(state.users));
        
        render();
    } catch (error) {
        console.error('Error saving user:', error);
        showError('Failed to save profile. Please try again.');
    } finally {
        state.isLoading = false;
    }
}

function updateSettings(newSettings) {
    state.settings = { ...state.settings, ...newSettings };
    localStorage.setItem('pulseid_settings', JSON.stringify(state.settings));
    render();
}

// --- Rendering Logic ---
function render() {
    // Hide all main sections
    elements.landing.classList.add('hidden');
    elements.dashboard.classList.add('hidden');
    elements.provider.classList.add('hidden');

    // Show loading state if needed
    if (state.isLoading) {
        elements.dashboard.classList.remove('hidden');
        const container = document.getElementById('dashboard-content');
        container.innerHTML = `
            <div class="text-center py-20">
                <div class="inline-block">
                    <div class="spinner"></div>
                    <p class="mt-4 text-slate-500 font-medium">Loading profile...</p>
                </div>
            </div>
        `;
        return;
    }

    if (state.view === 'landing') {
        elements.landing.classList.remove('hidden');
    } else if (state.view === 'dashboard') {
        elements.dashboard.classList.remove('hidden');
        renderDashboard();
    } else if (state.view === 'provider') {
        elements.provider.classList.remove('hidden');
        renderProvider();
    } else if (state.view === 'admin') {
        elements.dashboard.classList.remove('hidden');
        renderAdmin();
    }
}

function renderDashboard() {
    const container = document.getElementById('dashboard-content');
    
    if (!state.user) {
        // Show Profile Creation Form
        container.innerHTML = `
            <div class="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200 fade-in">
                <h2 class="text-2xl font-bold mb-6 text-slate-900">Create Your Medical Profile</h2>
                <form id="profile-form" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <input type="text" name="name" required class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
                            <select name="bloodGroup" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none">
                                <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                                <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Allergies (Critical)</label>
                        <input type="text" name="allergies" placeholder="e.g. Penicillin, Peanuts" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Medical Conditions</label>
                        <textarea name="conditions" placeholder="e.g. Asthma, Diabetes" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none h-20"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Current Medications</label>
                        <input type="text" name="medications" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Emergency Contact (Name & Phone)</label>
                        <input type="text" name="emergencyContact" required placeholder="Jane Doe: +1 234 567 890" class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none">
                    </div>
                    <button type="submit" class="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors mt-4">Save & Generate PulseID</button>
                </form>
            </div>
        `;

        document.getElementById('profile-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            saveUser(data);
        });
    } else {
        // Show Dashboard
        container.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 fade-in">
                <!-- Left: Profile Info -->
                <div class="lg:col-span-2 space-y-6">
                    <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                        <div class="flex justify-between items-start mb-6">
                            <div>
                                <h2 class="text-2xl font-bold text-slate-900">${state.user.name}</h2>
                                <p class="text-red-600 font-mono font-bold">${state.user.pid}</p>
                                <p class="text-xs text-slate-500 mt-1">Cloud-backed profile (Bin ID: ${state.userBinId ? state.userBinId.substring(0, 8) + '...' : 'local'})</p>
                            </div>
                            <button id="edit-profile-btn" class="text-slate-400 hover:text-red-600 transition-colors">
                                <i class="fas fa-edit text-xl"></i>
                            </button>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="p-4 bg-slate-50 rounded-xl">
                                <p class="text-xs font-bold uppercase text-slate-500 mb-1">Blood Group</p>
                                <p class="text-lg font-bold">${state.user.bloodGroup}</p>
                            </div>
                            <div class="p-4 bg-red-50 rounded-xl border border-red-100">
                                <p class="text-xs font-bold uppercase text-red-500 mb-1">Allergies</p>
                                <p class="text-lg font-bold text-red-700">${state.user.allergies || 'None reported'}</p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-xl">
                                <p class="text-xs font-bold uppercase text-slate-500 mb-1">Conditions</p>
                                <p class="text-slate-700">${state.user.conditions || 'None reported'}</p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-xl">
                                <p class="text-xs font-bold uppercase text-slate-500 mb-1">Medications</p>
                                <p class="text-slate-700">${state.user.medications || 'None reported'}</p>
                            </div>
                        </div>

                        <div class="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <p class="text-xs font-bold uppercase text-blue-500 mb-1">Emergency Contact</p>
                            <p class="text-lg font-bold text-blue-700">${state.user.emergencyContact}</p>
                        </div>
                    </div>

                    <!-- Access Log & Settings -->
                    <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                        <h3 class="text-lg font-bold mb-4">Security & Access</h3>
                        <div class="flex items-center justify-between py-4 border-b border-slate-100">
                            <div>
                                <p class="font-medium text-slate-900">Emergency Access</p>
                                <p class="text-sm text-slate-500">Allow first responders to view your profile</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="access-toggle" class="sr-only peer" ${state.settings.emergencyAccess ? 'checked' : ''}>
                                <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
                        </div>
                        <div class="mt-6">
                            <p class="text-xs font-bold uppercase text-slate-500 mb-2">Access Log (Mock)</p>
                            <div class="space-y-2">
                                <div class="flex justify-between text-sm p-2 bg-slate-50 rounded">
                                    <span class="text-slate-600">Last accessed: 2 mins ago</span>
                                    <span class="font-medium text-slate-900">Emergency scan</span>
                                </div>
                                <div class="flex justify-between text-sm p-2 bg-slate-50 rounded opacity-60">
                                    <span class="text-slate-600">3 days ago</span>
                                    <span class="font-medium text-slate-900">Provider portal</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right: QR & Simulation -->
                <div class="space-y-6">
                    <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
                        <h3 class="text-lg font-bold mb-4">Your PulseID QR</h3>
                        <div id="qrcode" class="qr-container bg-white p-4 inline-block rounded-xl border border-slate-100"></div>
                        <p class="mt-4 text-sm text-slate-500">Show this to first responders</p>
                        <button id="simulate-scan-btn" class="mt-6 w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 pulse-red">
                            <i class="fas fa-qrcode"></i>
                            Simulate Emergency Scan
                        </button>
                    </div>

                    <div class="bg-gradient-to-br from-red-600 to-red-700 p-8 rounded-2xl shadow-lg text-white">
                        <h3 class="text-lg font-bold mb-2">Your Plan: ${state.settings.plan.toUpperCase()}</h3>
                        <p class="text-red-100 text-sm mb-4">Upgrade to Premium for family protection.</p>
                        <button id="upgrade-btn" class="w-full bg-white text-red-600 py-2 rounded-lg font-bold hover:bg-red-50 transition-colors">
                            ${state.settings.plan === 'free' ? 'Upgrade to Premium' : 'Manage Subscription'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Generate QR Code with cloud-based URL
        const currentURL = window.location.origin + window.location.pathname;
        const scanURL = `${currentURL}?bin=${state.userBinId}`;
        
        // Ensure the QR code container is empty before generating
        const qrContainer = document.getElementById("qrcode");
        qrContainer.innerHTML = '';
        
        new QRCode(qrContainer, {
            text: scanURL,
            width: 180,
            height: 180,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
        
        // Add a copy-link helper for the demo
        const qrSection = document.getElementById('qrcode').parentElement;
        const linkHelper = document.createElement('div');
        linkHelper.innerHTML = `
            <button onclick="navigator.clipboard.writeText('${scanURL}'); alert('Scan URL copied to clipboard!');" class="mt-2 text-xs text-slate-400 hover:text-red-600 underline">
                Copy Scan URL
            </button>
        `;
        qrSection.appendChild(linkHelper);

        // Event Listeners for Dashboard
        document.getElementById('edit-profile-btn').addEventListener('click', () => {
            if(confirm('Edit your profile?')) {
                const oldUser = state.user;
                state.user = null;
                render();
                // Pre-fill form (simple implementation)
                setTimeout(() => {
                    const form = document.getElementById('profile-form');
                    if(form) {
                        Object.keys(oldUser).forEach(key => {
                            if(form.elements[key]) form.elements[key].value = oldUser[key];
                        });
                    }
                }, 0);
            }
        });

        document.getElementById('access-toggle').addEventListener('change', (e) => {
            updateSettings({ emergencyAccess: e.target.checked });
        });

        document.getElementById('simulate-scan-btn').addEventListener('click', () => {
            setView('provider');
        });

        // Add event listener to QR code to simulate scan as well
        document.getElementById('qrcode').addEventListener('click', () => {
            setView('provider');
        });
        document.getElementById('qrcode').style.cursor = 'pointer';

        document.getElementById('upgrade-btn').addEventListener('click', () => {
            const newPlan = state.settings.plan === 'free' ? 'premium' : 'free';
            updateSettings({ plan: newPlan });
            alert(`Switched to ${newPlan} plan (Demo)`);
        });
    }
}

function renderProvider() {
    const container = document.getElementById('provider-content');
    
    if (!state.settings.emergencyAccess) {
        container.innerHTML = `
            <div class="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <div class="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                    <i class="fas fa-lock text-3xl"></i>
                </div>
                <h1 class="text-3xl font-bold text-slate-900 mb-2">Access Restricted</h1>
                <p class="text-slate-600 max-w-md mb-8">The user has disabled emergency access to this profile. Please contact local emergency services.</p>
                <button onclick="setView('dashboard')" class="text-slate-500 font-medium hover:text-slate-900 underline">Return to Dashboard</button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="min-h-screen bg-white">
            <!-- Provider Header -->
            <div class="bg-red-600 text-white p-6 sticky top-0 shadow-lg z-50">
                <div class="max-w-3xl mx-auto flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-user-md text-2xl"></i>
                        <h1 class="text-xl font-bold">EMERGENCY PROVIDER VIEW</h1>
                    </div>
                    <button onclick="setView('dashboard')" class="bg-white/20 hover:bg-white/30 px-4 py-1 rounded-full text-sm font-bold transition-colors">
                        CLOSE
                    </button>
                </div>
            </div>

            <div class="max-w-3xl mx-auto p-6 space-y-8 fade-in">
                <!-- Critical Alerts Section (Highlighted) -->
                <div class="bg-red-50 border-2 border-red-600 rounded-3xl p-8 emergency-glow">
                    <h2 class="text-red-600 text-xs font-black uppercase tracking-widest mb-4">CRITICAL INFORMATION</h2>
                    
                    <div class="space-y-6">
                        <div>
                            <p class="text-sm font-bold text-red-400 uppercase">Allergies</p>
                            <p class="text-3xl font-black text-red-700">${state.user.allergies || 'NONE REPORTED'}</p>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-sm font-bold text-red-400 uppercase">Blood Group</p>
                                <p class="text-2xl font-black text-red-700">${state.user.bloodGroup}</p>
                            </div>
                            <div>
                                <p class="text-sm font-bold text-red-400 uppercase">Patient ID</p>
                                <p class="text-2xl font-black text-red-700">${state.user.pid}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Secondary Info -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <h3 class="text-slate-500 text-xs font-bold uppercase mb-3">Medical Conditions</h3>
                        <p class="text-lg font-bold text-slate-900">${state.user.conditions || 'None reported'}</p>
                    </div>
                    <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <h3 class="text-slate-500 text-xs font-bold uppercase mb-3">Current Medications</h3>
                        <p class="text-lg font-bold text-slate-900">${state.user.medications || 'None reported'}</p>
                    </div>
                </div>

                <!-- Emergency Contact -->
                <div class="bg-blue-600 text-white p-8 rounded-3xl shadow-md">
                    <h3 class="text-blue-100 text-xs font-bold uppercase mb-4">Emergency Contact</h3>
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-2xl font-bold">${state.user.emergencyContact.split(':')[0]}</p>
                            <p class="text-blue-100 text-lg">${state.user.emergencyContact.split(':')[1] || ''}</p>
                        </div>
                        <a href="tel:${state.user.emergencyContact.includes(':') ? state.user.emergencyContact.split(':')[1].replace(/\s/g, '') : state.user.emergencyContact.replace(/\s/g, '')}" class="w-14 h-14 bg-white text-blue-600 rounded-full flex items-center justify-center text-2xl shadow-lg hover:scale-105 transition-transform">
                            <i class="fas fa-phone"></i>
                        </a>
                    </div>
                </div>

                <!-- Full Profile Expand (Simulated) -->
                <details class="group border-t border-slate-200 pt-6">
                    <summary class="flex justify-between items-center cursor-pointer list-none">
                        <span class="text-slate-500 font-bold uppercase text-sm">Full Patient Profile</span>
                        <i class="fas fa-chevron-down text-slate-400 group-open:rotate-180 transition-transform"></i>
                    </summary>
                    <div class="mt-4 space-y-4 text-slate-600">
                        <p><strong>Patient Name:</strong> ${state.user.name}</p>
                        <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
                        <p><strong>Last Data Update:</strong> Just now</p>
                        <p class="text-xs bg-slate-100 p-3 rounded">This data is provided by PulseID for emergency use only. Accuracy is the responsibility of the user.</p>
                    </div>
                </details>
                
                <div class="text-center pt-8 pb-12">
                    <button onclick="window.print()" class="text-slate-400 hover:text-slate-600 text-sm font-medium">
                        <i class="fas fa-print mr-2"></i> Print Medical Summary
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderAdmin() {
    const container = document.getElementById('dashboard-content');
    container.innerHTML = `
        <div class="fade-in space-y-8">
            <div class="flex justify-between items-center">
                <h2 class="text-3xl font-bold text-slate-900">Admin Panel: User Management</h2>
                <button onclick="setView('dashboard')" class="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg font-bold transition-colors">Back to Dashboard</button>
            </div>
            
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table class="min-w-full divide-y divide-slate-200">
                    <thead class="bg-slate-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">PID</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Blood</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-slate-200">
                        ${state.users.map(u => `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-bold text-slate-900">${u.name}</div>
                                    <div class="text-xs text-slate-500">${u.emergencyContact}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap font-mono text-sm text-red-600">${u.pid}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${u.bloodGroup}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                    <button onclick="adminViewUser('${u.pid}')" class="text-blue-600 hover:text-blue-900">View</button>
                                    <button onclick="adminDeleteUser('${u.pid}')" class="text-red-600 hover:text-red-900">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${state.users.length === 0 ? '<div class="p-8 text-center text-slate-500">No users found in localStorage.</div>' : ''}
            </div>
        </div>
    `;
}

function adminViewUser(pid) {
    const target = state.users.find(u => u.pid === pid);
    if (target) {
        state.user = target;
        setView('provider');
    }
}

function adminDeleteUser(pid) {
    if (confirm(`Are you sure you want to delete user ${pid}?`)) {
        state.users = state.users.filter(u => u.pid !== pid);
        localStorage.setItem('pulseid_all_users', JSON.stringify(state.users));
        if (state.user && state.user.pid === pid) {
            state.user = null;
            localStorage.removeItem('pulseid_user');
            localStorage.removeItem('pulseid_user_bin_id');
        }
        renderAdmin();
    }
}

// Make functions globally available for inline event handlers
window.setView = setView;
window.adminViewUser = adminViewUser;
window.adminDeleteUser = adminDeleteUser;
window.renderAdmin = renderAdmin;

// Start the app
init();

import { initStore, getCurrentUser, login, logout, foodDatabase, addLog, getPatientLogs, getTarget, setDoctorTarget, store } from './store.js';

// DOM Elements
const appDiv = document.getElementById('app');

// Router/State
let currentPath = '/';

const render = () => {
    const user = getCurrentUser();
    if (!user) {
        appDiv.innerHTML = LoginScreen();
    } else if (user.role === 'Patient') {
        if (currentPath === '/report') {
            appDiv.innerHTML = PatientReportScreen(user);
            initChart(user);
        } else {
            appDiv.innerHTML = PatientDashboard(user);
        }
    } else if (user.role === 'Doctor') {
        appDiv.innerHTML = DoctorDashboard(user);
    }
    attachEventListeners();
};

const attachEventListeners = () => {
    const user = getCurrentUser();
    
    // Login Screen Handlers
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const role = document.getElementById('role-select').value;
            const name = document.getElementById('name-input').value;
            const cat = document.getElementById('category-select').value;
            if (!name) return alert('Please enter name');
            login(role, name, role === 'Patient' ? cat : null);
            render();
        });
        
        document.getElementById('role-select').addEventListener('change', (e) => {
            document.getElementById('cat-group').style.display = e.target.value === 'Patient' ? 'block' : 'none';
        });
    }

    // Nav Handlers
    document.querySelectorAll('.nav-item').forEach(el => {
        el.addEventListener('click', (e) => {
            currentPath = e.currentTarget.dataset.path;
            render();
        });
    });

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
            currentPath = '/';
            render();
        });
    }

    // Patient Log Food
    const logBtn = document.getElementById('log-btn');
    if (logBtn) {
        logBtn.addEventListener('click', () => {
            const checkedBoxes = document.querySelectorAll('input[name="foodItem"]:checked');
            const foodIds = Array.from(checkedBoxes).map(cb => cb.value);
            const exercise = document.getElementById('exercise-input').value;
            
            if (foodIds.length === 0 && !exercise) return alert('Please enter food or exercise');
            
            const today = new Date().toISOString().split('T')[0];
            addLog(user.id, today, foodIds, exercise);
            
            // Check if goal reached for Confetti
            const target = getTarget(user.id);
            const logs = getPatientLogs(user.id);
            const todayLog = logs[logs.length - 1]; // Latest
            if (todayLog.macros.protein >= target.targetP || todayLog.exerciseMinutes >= target.targetExercise) {
                fireConfetti();
            } else {
                alert('Logged successfully!');
            }
            render();
        });
    }

    // Doctor Dashboard Handlers
    document.querySelectorAll('.toggle-target-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const form = document.getElementById('target-form-' + id);
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        });
    });

    document.querySelectorAll('.save-target-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const p = document.getElementById('t-p-' + id).value;
            const c = document.getElementById('t-c-' + id).value;
            const f = document.getElementById('t-f-' + id).value;
            const ex = document.getElementById('t-e-' + id).value;
            setDoctorTarget(id, parseInt(p), parseInt(c), parseInt(f), parseInt(ex));
            alert('Target saved and email sent to patient!');
            render();
        });
    });
};

const fireConfetti = () => {
    var duration = 3 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    var interval = setInterval(function() {
        var timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        var particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } }));
    }, 250);
};

const initChart = (user) => {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;
    
    // Calculate dummy weekly completion % based on logs
    const logs = getPatientLogs(user.id);
    let completionRates = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
    // Simplified logic: random % for demo purposes but ending high
    completionRates = [40, 60, 50, 80, 90, 75, 100]; 

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Goal Completion %',
                data: completionRates,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { min: 0, max: 100, ticks: { color: '#a1a1aa' } },
                x: { ticks: { color: '#a1a1aa' } }
            },
            plugins: {
                legend: { labels: { color: '#f8fafc' } }
            }
        }
    });
};

// UI Components
const LoginScreen = () => `
    <div class="screen justify-center">
        <div class="text-center mb-8">
            <ion-icon name="fitness-outline" style="font-size: 4rem; color: var(--primary)"></ion-icon>
            <h1 class="mt-4" style="font-size: 2.5rem;">Vitality</h1>
            <p>Your personal health journey</p>
        </div>
        <div class="card">
            <div class="input-group">
                <label>I am a</label>
                <select id="role-select">
                    <option value="Patient">Patient</option>
                    <option value="Doctor">Doctor / Admin</option>
                </select>
            </div>
            <div class="input-group">
                <label>Name or ID</label>
                <input type="text" id="name-input" placeholder="e.g. John Doe" />
            </div>
            <div class="input-group" id="cat-group">
                <label>Health Goal</label>
                <select id="category-select">
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Weight Gain">Weight Gain</option>
                    <option value="Diabetes">Diabetes Management</option>
                </select>
            </div>
            <button class="btn btn-primary w-full mt-4" id="login-btn">Continue <ion-icon name="arrow-forward-outline"></ion-icon></button>
        </div>
    </div>
`;

const PatientDashboard = (user) => {
    const foods = foodDatabase[user.category] || [];
    const target = getTarget(user.id);
    
    return `
    <div class="screen pb-24">
        <div class="app-header">
            <div>
                <h2>Hello, ${user.name}</h2>
                <p>${user.category} Tracker</p>
            </div>
            <button class="btn" id="logout-btn"><ion-icon name="log-out-outline"></ion-icon></button>
        </div>
        
        <div class="card mb-4" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.1)); border-color: var(--primary);">
            <h3 class="mb-2"><ion-icon name="target-outline"></ion-icon> Daily Targets</h3>
            <div class="flex justify-between mt-2">
                <div class="text-center"><h4>${target.targetP}g</h4><p style="font-size: 0.8rem">Protein</p></div>
                <div class="text-center"><h4>${target.targetC}g</h4><p style="font-size: 0.8rem">Carbs</p></div>
                <div class="text-center"><h4>${target.targetF}g</h4><p style="font-size: 0.8rem">Fiber</p></div>
                <div class="text-center"><h4>${target.targetExercise}m</h4><p style="font-size: 0.8rem">Exercise</p></div>
            </div>
        </div>

        <h3 class="mb-4">Log Today's Intake</h3>
        <div class="card mb-4">
            <div class="flex-col gap-2 mb-4">
                ${foods.map(f => `
                    <label class="flex items-center gap-2 p-2" style="background: rgba(255,255,255,0.02); border-radius: 8px;">
                        <input type="checkbox" name="foodItem" value="${f.id}">
                        <div style="flex:1">
                            <div style="font-weight:600">${f.name}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted)">P:${f.protein}g | C:${f.carb}g | F:${f.fiber}g</div>
                        </div>
                    </label>
                `).join('')}
            </div>
            
            <div class="input-group">
                <label>Exercise/Walking (Minutes)</label>
                <input type="number" id="exercise-input" placeholder="e.g. 30" />
            </div>
            
            <button class="btn btn-primary w-full mt-2" id="log-btn">Log Activity</button>
        </div>
        
        ${BottomNav('dashboard')}
    </div>
    `;
};

const PatientReportScreen = (user) => {
    return `
    <div class="screen pb-24">
        <div class="app-header">
            <div>
                <h2>Weekly Report</h2>
                <p>Your progress out of 100%</p>
            </div>
            <button class="btn" id="logout-btn"><ion-icon name="log-out-outline"></ion-icon></button>
        </div>
        
        <div class="card mb-4">
            <canvas id="weeklyChart" width="400" height="300"></canvas>
            <div class="mt-6 text-center">
                <h1 style="color: var(--success); font-size: 3rem;">100%</h1>
                <p>Target reached this week! An email report has been sent.</p>
            </div>
        </div>
        
        ${BottomNav('report')}
    </div>
    `;
};

const DoctorDashboard = (user) => {
    const patients = store.get('users').filter(u => u.role === 'Patient');
    
    return `
    <div class="screen pb-24">
        <div class="app-header">
            <div>
                <h2>Dr. ${user.name}</h2>
                <p>Patient Administration</p>
            </div>
            <button class="btn" id="logout-btn"><ion-icon name="log-out-outline"></ion-icon></button>
        </div>
        
        <div class="mb-4">
            <button class="btn w-full" onclick="alert('Weekly reports sent to all patients via email!')">
                <ion-icon name="mail-outline"></ion-icon> Send Weekly Reports
            </button>
        </div>

        <h3>Your Patients</h3>
        <div class="mt-4 flex-col gap-4">
            ${patients.map(p => {
                const currentTarget = getTarget(p.id);
                return `
                <div class="card">
                    <div class="flex justify-between items-center mb-2">
                        <div>
                            <h4>${p.name}</h4>
                            <p style="font-size:0.8rem">${p.category}</p>
                        </div>
                        <button class="btn btn-primary toggle-target-btn" data-id="${p.id}" style="padding: 6px 12px; font-size:0.8rem">Set Target</button>
                    </div>
                    <div id="target-form-${p.id}" style="display:none; margin-top:16px; border-top:1px solid rgba(255,255,255,0.05); padding-top:16px;">
                        <div class="flex gap-2 mb-2">
                            <div class="input-group" style="margin-bottom:0; flex:1">
                                <label>Protein (g)</label>
                                <input type="number" id="t-p-${p.id}" value="${currentTarget.targetP}" />
                            </div>
                            <div class="input-group" style="margin-bottom:0; flex:1">
                                <label>Carb (g)</label>
                                <input type="number" id="t-c-${p.id}" value="${currentTarget.targetC}" />
                            </div>
                        </div>
                        <div class="flex gap-2 mb-4">
                            <div class="input-group" style="margin-bottom:0; flex:1">
                                <label>Fiber (g)</label>
                                <input type="number" id="t-f-${p.id}" value="${currentTarget.targetF}" />
                            </div>
                            <div class="input-group" style="margin-bottom:0; flex:1">
                                <label>Exercise (m)</label>
                                <input type="number" id="t-e-${p.id}" value="${currentTarget.targetExercise}" />
                            </div>
                        </div>
                        <button class="btn btn-primary w-full save-target-btn" data-id="${p.id}">Save Combinations</button>
                    </div>
                </div>
                `;
            }).join('')}
            ${patients.length === 0 ? '<p class="text-center mt-4">No patients registered yet.</p>' : ''}
        </div>
    </div>
    `;
};

const BottomNav = (activeTab) => `
    <div class="bottom-nav">
        <button class="nav-item ${activeTab === 'dashboard' ? 'active' : ''}" data-path="/">
            <ion-icon name="home${activeTab === 'dashboard' ? '' : '-outline'}"></ion-icon>
            <span>Home</span>
        </button>
        <button class="nav-item ${activeTab === 'report' ? 'active' : ''}" data-path="/report">
            <ion-icon name="stats-chart${activeTab === 'report' ? '' : '-outline'}"></ion-icon>
            <span>Report</span>
        </button>
    </div>
`;

// Init
initStore();
render();

// LocalStorage Wrapper
export const store = {
    get(key) {
        return JSON.parse(localStorage.getItem(key));
    },
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    clear() {
        localStorage.clear();
    }
};

// Mock Food Database
export const foodDatabase = {
    'Weight Loss': [
        { id: 'f1', name: 'Grilled Chicken Salad', protein: 35, carb: 10, fiber: 8 },
        { id: 'f2', name: 'Apple & Almonds', protein: 6, carb: 20, fiber: 6 },
        { id: 'f3', name: 'Greek Yogurt', protein: 15, carb: 8, fiber: 0 }
    ],
    'Weight Gain': [
        { id: 'f4', name: 'Beef & Rice Bowl', protein: 40, carb: 60, fiber: 4 },
        { id: 'f5', name: 'Peanut Butter Shake', protein: 25, carb: 40, fiber: 5 },
        { id: 'f6', name: 'Oatmeal & Nuts', protein: 12, carb: 45, fiber: 8 }
    ],
    'Diabetes': [
        { id: 'f7', name: 'Salmon & Asparagus', protein: 30, carb: 5, fiber: 4 },
        { id: 'f8', name: 'Quinoa & Black Beans', protein: 15, carb: 35, fiber: 12 },
        { id: 'f9', name: 'Avocado Toast (Whole Grain)', protein: 8, carb: 20, fiber: 9 }
    ]
};

// Initialize default state
export const initStore = () => {
    if (!store.get('users')) store.set('users', []);
    if (!store.get('logs')) store.set('logs', []);
    if (!store.get('targets')) store.set('targets', []); // Doctor assigned targets
    if (!store.get('currentUser')) store.set('currentUser', null);
};

export const getCurrentUser = () => store.get('currentUser');
export const setCurrentUser = (user) => store.set('currentUser', user);

export const login = (role, name, category = null) => {
    let users = store.get('users');
    let user = users.find(u => u.name.toLowerCase() === name.toLowerCase() && u.role === role);
    if (!user) {
        user = {
            id: 'u_' + Date.now(),
            role,
            name,
            category: role === 'Patient' ? category : null
        };
        users.push(user);
        store.set('users', users);
    }
    setCurrentUser(user);
    return user;
};

export const logout = () => setCurrentUser(null);

export const addLog = (patientId, date, foodIds, exerciseMinutes) => {
    let logs = store.get('logs');
    let user = store.get('users').find(u => u.id === patientId);
    let allFoods = foodDatabase[user.category];
    
    let totalP = 0, totalC = 0, totalF = 0;
    foodIds.forEach(fid => {
        let f = allFoods.find(item => item.id === fid);
        if(f) {
            totalP += f.protein;
            totalC += f.carb;
            totalF += f.fiber;
        }
    });

    logs.push({
        id: 'l_' + Date.now(),
        patientId,
        date,
        foodIds,
        macros: { protein: totalP, carb: totalC, fiber: totalF },
        exerciseMinutes: parseInt(exerciseMinutes || 0)
    });
    store.set('logs', logs);
};

export const getPatientLogs = (patientId) => {
    return store.get('logs').filter(l => l.patientId === patientId);
};

export const setDoctorTarget = (patientId, targetP, targetC, targetF, targetExercise) => {
    let targets = store.get('targets');
    // Remove old target for patient
    targets = targets.filter(t => t.patientId !== patientId);
    targets.push({ patientId, targetP, targetC, targetF, targetExercise });
    store.set('targets', targets);
};

export const getTarget = (patientId) => {
    return store.get('targets').find(t => t.patientId === patientId) || { targetP: 100, targetC: 150, targetF: 25, targetExercise: 30 }; // Defaults
};

import AsyncStorage from '@react-native-async-storage/async-storage';

// LocalStorage Wrapper Equivalent
export const store = {
    async get(key) {
        try {
            const value = await AsyncStorage.getItem(key);
            return value != null ? JSON.parse(value) : null;
        } catch (e) {
            console.error('Error reading from AsyncStorage', e);
            return null;
        }
    },
    async set(key, value) {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Error saving to AsyncStorage', e);
        }
    },
    async clear() {
        try {
            await AsyncStorage.clear();
        } catch (e) {
            console.error('Error clearing AsyncStorage', e);
        }
    }
};

// Mock Food Database
export const foodDatabase = {
    'Breakfast': [
        { id: 'b1', name: 'Idli (3 pcs) with Sambar', protein: 8, carb: 35, fiber: 4 },
        { id: 'b2', name: 'Plain Dosa with Chutney', protein: 6, carb: 40, fiber: 2 },
        { id: 'b3', name: 'Ven Pongal', protein: 7, carb: 45, fiber: 3 },
        { id: 'b4', name: 'Rava Upma', protein: 5, carb: 30, fiber: 2 }
    ],
    'Lunch': [
        { id: 'l1', name: 'South Indian Meals', protein: 12, carb: 80, fiber: 10 },
        { id: 'l2', name: 'Chicken Biryani', protein: 35, carb: 65, fiber: 4 },
        { id: 'l3', name: 'Lemon Rice', protein: 5, carb: 55, fiber: 3 },
        { id: 'l4', name: 'Sambar Rice', protein: 8, carb: 50, fiber: 5 }
    ],
    'Dinner': [
        { id: 'd1', name: 'Chapathi with Veg Kurma', protein: 10, carb: 45, fiber: 8 },
        { id: 'd2', name: 'Parotta with Salna', protein: 12, carb: 60, fiber: 4 },
        { id: 'd3', name: 'Idiyappam with Stew', protein: 4, carb: 40, fiber: 2 },
        { id: 'd4', name: 'Dosa with Tomato Chutney', protein: 6, carb: 40, fiber: 2 }
    ]
};

// State functions
export const initStore = async () => {
    const users = await store.get('users');
    if (!users) await store.set('users', []);
    
    const logs = await store.get('logs');
    if (!logs) await store.set('logs', []);
    
    const targets = await store.get('targets');
    if (!targets) await store.set('targets', []); 

    const dietScores = await store.get('diet_scores');
    if (!dietScores) await store.set('diet_scores', []);
    
    const currentUser = await store.get('currentUser');
    if (!currentUser) await store.set('currentUser', null);
};

export const getCurrentUser = async () => await store.get('currentUser');
export const setCurrentUser = async (user) => await store.set('currentUser', user);

export const login = async (role, name, category = null) => {
    let users = await store.get('users') || [];
    let user = users.find(u => u.name.toLowerCase() === name.toLowerCase() && u.role === role);
    if (!user) {
        user = {
            id: 'u_' + Date.now(),
            role,
            name,
            category: role === 'Patient' ? category : null
        };
        users.push(user);
        await store.set('users', users);
    }
    await setCurrentUser(user);
    return user;
};

export const logout = async () => await setCurrentUser(null);

export const addLog = async (patientId, date, foodIds, exerciseMinutes, waterCups = 0) => {
    let logs = await store.get('logs') || [];
    let users = await store.get('users') || [];
    let user = users.find(u => u.id === patientId);
    let allFoods = [...foodDatabase['Breakfast'], ...foodDatabase['Lunch'], ...foodDatabase['Dinner']];
    
    let totalP = 0, totalC = 0, totalF = 0;
    foodIds.forEach(fid => {
        let f = allFoods.find(item => item.id === fid);
        if(f) {
            totalP += f.protein;
            totalC += f.carb;
            totalF += f.fiber;
        }
    });

    let existingLogIndex = logs.findIndex(l => l.patientId === patientId && l.date === date);
    
    if (existingLogIndex >= 0) {
        let ex = logs[existingLogIndex];
        ex.foodIds = [...new Set([...ex.foodIds, ...foodIds])];
        ex.macros.protein += totalP;
        ex.macros.carb += totalC;
        ex.macros.fiber += totalF;
        ex.exerciseMinutes += parseInt(exerciseMinutes || 0);
        ex.water = (ex.water || 0) + waterCups;
        logs[existingLogIndex] = ex;
    } else {
        logs.push({
            id: 'l_' + Date.now(),
            patientId,
            date,
            foodIds,
            macros: { protein: totalP, carb: totalC, fiber: totalF },
            exerciseMinutes: parseInt(exerciseMinutes || 0),
            water: waterCups
        });
    }
    
    await store.set('logs', logs);
};

export const getPatientLogs = async (patientId) => {
    let logs = await store.get('logs') || [];
    return logs.filter(l => l.patientId === patientId);
};

export const saveDietScore = async (patientId, date, scoreData) => {
    let scores = await store.get('diet_scores') || [];
    let existingIndex = scores.findIndex(s => s.patientId === patientId && s.date === date);
    
    const entry = {
        patientId,
        date,
        ...scoreData,
        timestamp: Date.now()
    };

    if (existingIndex >= 0) {
        scores[existingIndex] = entry;
    } else {
        scores.push(entry);
    }
    await store.set('diet_scores', scores);
};

export const getDietScores = async (patientId) => {
    let scores = await store.get('diet_scores') || [];
    return scores.filter(s => s.patientId === patientId);
};

export const getStreak = async (patientId) => {
    let logs = await getPatientLogs(patientId);
    if(logs.length === 0) return 0;
    
    // Sort logs descending by date
    logs.sort((a,b) => new Date(b.date) - new Date(a.date));
    
    let streak = 0;
    let checkDate = new Date();
    // Start with today, see if log exists. If not, maybe yesterday.
    
    for (let i = 0; i < 30; i++) {
        const dStr = checkDate.toISOString().split('T')[0];
        const log = logs.find(l => l.date === dStr);
        if (log) {
            streak++;
        } else if (i !== 0) { // If it's not today missing, streak breaks
            break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
};

export const setDoctorTarget = async (patientId, targetP, targetC, targetF, targetExercise) => {
    let targets = await store.get('targets') || [];
    targets = targets.filter(t => t.patientId !== patientId);
    targets.push({ patientId, targetP, targetC, targetF, targetExercise });
    await store.set('targets', targets);
};

export const getTarget = async (patientId) => {
    let targets = await store.get('targets') || [];
    return targets.find(t => t.patientId === patientId) || { targetP: 100, targetC: 150, targetF: 25, targetExercise: 30 };
};

export const getPatients = async () => {
    let users = await store.get('users') || [];
    return users.filter(u => u.role === 'Patient');
};

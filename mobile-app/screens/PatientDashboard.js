import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { foodDatabase, getTarget, addLog, getPatientLogs, logout, getStreak } from '../utils/store';

const { width } = Dimensions.get('window');

const CircularProgress = ({ size, strokeWidth, progress, color, icon, label, value }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const safeProgress = Math.min(100, Math.max(0, progress));
    const strokeDashoffset = circumference - (safeProgress / 100) * circumference;
    
    return (
        <View style={{ alignItems: 'center', width: size }}>
            <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
                <Svg width={size} height={size} style={{ position: 'absolute' }}>
                    <Circle
                        stroke="rgba(255,255,255,0.05)"
                        fill="none"
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                    />
                    <Circle
                        stroke={color}
                        fill="none"
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    />
                </Svg>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text style={{ color: '#f8fafc', fontWeight: 'bold', marginTop: 8 }}>{value}</Text>
            <Text style={{ color: '#a1a1aa', fontSize: 10, textTransform: 'uppercase' }}>{label}</Text>
        </View>
    );
};

export default function PatientDashboard({ user, setUser }) {
    const [target, setTarget] = useState({ targetP: 100, targetC: 150, targetF: 25, targetExercise: 30 });
    const [foods, setFoods] = useState({ Breakfast: [], Lunch: [], Dinner: [] });
    const [selectedFoods, setSelectedFoods] = useState([]);
    const [exercise, setExercise] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);
    const [streak, setStreak] = useState(0);
    const [todayLog, setTodayLog] = useState({ macros: { protein: 0, carb: 0, fiber: 0 }, exerciseMinutes: 0, water: 0 });

    const loadData = async () => {
        const t = await getTarget(user.id);
        setTarget(t);
        setFoods(foodDatabase);
        
        const s = await getStreak(user.id);
        setStreak(s);

        const logs = await getPatientLogs(user.id);
        const todayStr = new Date().toISOString().split('T')[0];
        const log = logs.find(l => l.date === todayStr);
        if (log) {
            setTodayLog(log);
        } else {
            setTodayLog({ macros: { protein: 0, carb: 0, fiber: 0 }, exerciseMinutes: 0, water: 0 });
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [user])
    );

    const toggleFood = (id) => {
        if (selectedFoods.includes(id)) {
            setSelectedFoods(selectedFoods.filter(f => f !== id));
        } else {
            setSelectedFoods([...selectedFoods, id]);
        }
    };

    const handleLog = async () => {
        if (selectedFoods.length === 0 && !exercise) {
            Alert.alert('Error', 'Please select at least one food or enter exercise minutes.');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        await addLog(user.id, today, selectedFoods, exercise, 0);
        
        await loadData(); // Reload to get updated stats
        
        if (todayLog.macros.protein >= target.targetP || todayLog.exerciseMinutes >= target.targetExercise) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
        } else {
            Alert.alert('Success', 'Activity logged successfully!');
        }

        setSelectedFoods([]);
        setExercise('');
    };

    const handleWaterAdd = async () => {
        const today = new Date().toISOString().split('T')[0];
        await addLog(user.id, today, [], 0, 1);
        await loadData();
    };

    const getP = (val, max) => max > 0 ? (val / max) * 100 : 0;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <View style={styles.profileRow}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={24} color="#0ea5e9" />
                        </View>
                        <View>
                            <Text style={styles.title}>Hi, {user.name} 👋</Text>
                            <Text style={styles.subtitle}>{user.category} Plan</Text>
                        </View>
                    </View>
                    <View style={styles.streakBadge}>
                        <Ionicons name="flame" size={16} color="#fb923c" />
                        <Text style={styles.streakText}>{streak} Day Streak</Text>
                    </View>
                </View>

                {/* Progress Rings Card */}
                <View style={styles.progressCard}>
                    <Text style={styles.sectionTitle}>Daily Overview</Text>
                    <View style={styles.ringsRow}>
                        <CircularProgress 
                            size={70} strokeWidth={6} 
                            progress={getP(todayLog.macros.protein, target.targetP)} 
                            color="#8b5cf6" icon="restaurant" label="Protein" value={`${todayLog.macros.protein}g`} 
                        />
                        <CircularProgress 
                            size={70} strokeWidth={6} 
                            progress={getP(todayLog.macros.carb, target.targetC)} 
                            color="#ec4899" icon="leaf" label="Carbs" value={`${todayLog.macros.carb}g`} 
                        />
                        <CircularProgress 
                            size={70} strokeWidth={6} 
                            progress={getP(todayLog.exerciseMinutes, target.targetExercise)} 
                            color="#10b981" icon="bicycle" label="Exercise" value={`${todayLog.exerciseMinutes}m`} 
                        />
                        <CircularProgress 
                            size={70} strokeWidth={6} 
                            progress={getP(todayLog.macros.fiber, target.targetF)} 
                            color="#f59e0b" icon="nutrition" label="Fiber" value={`${todayLog.macros.fiber}g`} 
                        />
                    </View>
                </View>

                {/* Water Tracker */}
                <View style={styles.waterCard}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                        <View style={styles.waterIconBox}>
                            <Ionicons name="water" size={24} color="#0ea5e9" />
                        </View>
                        <View>
                            <Text style={styles.waterTitle}>Water Intake</Text>
                            <Text style={styles.waterSub}>{todayLog.water} / 8 Glasses</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.waterAddBtn} onPress={handleWaterAdd}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitleMain}>Log Intake</Text>
                <View style={styles.logCard}>
                    {['Breakfast', 'Lunch', 'Dinner'].map((mealTime, idx) => (
                        <View key={mealTime} style={idx !== 0 && {marginTop: 16}}>
                            <View style={styles.mealHeader}>
                                <Ionicons name={mealTime === 'Breakfast' ? 'sunny' : mealTime === 'Lunch' ? 'partly-sunny' : 'moon'} size={18} color="#0ea5e9" />
                                <Text style={styles.mealTitle}>{mealTime}</Text>
                            </View>
                            {foods[mealTime]?.map(f => (
                                <TouchableOpacity 
                                    key={f.id} 
                                    style={[styles.foodItem, selectedFoods.includes(f.id) && styles.foodActive]} 
                                    onPress={() => toggleFood(f.id)}
                                >
                                    <View style={[styles.checkbox, selectedFoods.includes(f.id) && styles.checkboxActive]}>
                                        {selectedFoods.includes(f.id) && <Ionicons name="checkmark" size={14} color="#fff" />}
                                    </View>
                                    <View style={{flex: 1}}>
                                        <Text style={styles.foodName}>{f.name}</Text>
                                        <View style={styles.macroPills}>
                                            <Text style={styles.macroPill}>P: {f.protein}g</Text>
                                            <Text style={styles.macroPill}>C: {f.carb}g</Text>
                                            <Text style={styles.macroPill}>F: {f.fiber}g</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}

                    <View style={styles.divider} />
                    
                    <Text style={styles.label}>Exercise/Walking (Minutes)</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="walk" size={20} color="#a1a1aa" style={styles.inputIcon} />
                        <TextInput 
                            style={styles.input} 
                            placeholder="e.g. 30" 
                            placeholderTextColor="#52525b"
                            keyboardType="numeric"
                            value={exercise}
                            onChangeText={setExercise}
                        />
                    </View>

                    <TouchableOpacity style={styles.primaryBtn} onPress={handleLog}>
                        <Ionicons name="save" size={20} color="#fff" />
                        <Text style={styles.primaryBtnText}>Save Log</Text>
                    </TouchableOpacity>
                </View>
                <View style={{height: 100}} /> {/* Spacer for floating tabs */}
            </ScrollView>
            {showConfetti && <ConfettiCannon count={200} origin={{x: width/2, y: 0}} fallSpeed={2500} fadeOut />}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#09090b' },
    scroll: { padding: 24 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(14, 165, 233, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.3)' },
    title: { fontSize: 24, fontWeight: '900', color: '#f8fafc', letterSpacing: 0.5 },
    subtitle: { fontSize: 13, color: '#a1a1aa', marginTop: 2, letterSpacing: 0.5 },
    streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(251, 146, 60, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(251, 146, 60, 0.3)', gap: 6 },
    streakText: { color: '#fb923c', fontWeight: 'bold', fontSize: 12 },
    progressCard: { backgroundColor: 'rgba(24, 24, 27, 0.6)', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc', marginBottom: 20 },
    ringsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
    waterCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(14, 165, 233, 0.1)', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.3)', marginBottom: 24 },
    waterIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(14, 165, 233, 0.2)', justifyContent: 'center', alignItems: 'center' },
    waterTitle: { color: '#f8fafc', fontWeight: 'bold', fontSize: 16 },
    waterSub: { color: '#0ea5e9', fontSize: 12, marginTop: 2 },
    waterAddBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0ea5e9', justifyContent: 'center', alignItems: 'center', shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
    sectionTitleMain: { fontSize: 20, fontWeight: '900', color: '#f8fafc', marginBottom: 16, letterSpacing: 0.5 },
    logCard: { backgroundColor: 'rgba(24, 24, 27, 0.6)', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    mealHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    mealTitle: { color: '#f8fafc', fontSize: 15, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    foodItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.02)' },
    foodActive: { backgroundColor: 'rgba(139, 92, 246, 0.15)', borderColor: '#8b5cf6' },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#52525b', marginRight: 14, justifyContent: 'center', alignItems: 'center' },
    checkboxActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
    foodName: { color: '#f8fafc', fontWeight: '600', fontSize: 14, marginBottom: 6 },
    macroPills: { flexDirection: 'row', gap: 6 },
    macroPill: { color: '#a1a1aa', fontSize: 11, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 24 },
    label: { color: '#a1a1aa', fontSize: 13, marginBottom: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, marginBottom: 24 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, paddingVertical: 14, color: '#f8fafc', fontSize: 16, outlineStyle: 'none' },
    primaryBtn: { flexDirection: 'row', backgroundColor: '#8b5cf6', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 }
});

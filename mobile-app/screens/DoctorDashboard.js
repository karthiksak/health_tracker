import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getPatients, getTarget, setDoctorTarget, logout, getPatientLogs } from '../utils/store';

export default function DoctorDashboard({ user, setUser }) {
    const [patients, setPatients] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [expanded, setExpanded] = useState({});
    const [forms, setForms] = useState({});
    const [scores, setScores] = useState({});
    const [patientLogs, setPatientLogs] = useState({});

    const loadData = async () => {
        const pts = await getPatients();
        setPatients(pts);
        
        let initForms = {};
        let calcScores = {};
        let allLogs = {};
        for (let p of pts) {
            const t = await getTarget(p.id);
            initForms[p.id] = {
                p: String(t.targetP),
                c: String(t.targetC),
                f: String(t.targetF),
                e: String(t.targetExercise)
            };
            
            // Adherence Scoring
            const logs = await getPatientLogs(p.id);
            allLogs[p.id] = logs;
            let score = 0;
            if(logs.length > 0) {
                let totalP = 0;
                let days = Math.min(logs.length, 7);
                for(let i=0; i<days; i++) {
                   const l = logs[logs.length - 1 - i];
                   const pPct = Math.min(100, (l.macros.protein / (t.targetP || 1)) * 100) || 0;
                   totalP += pPct;
                }
                score = Math.round(totalP / days);
            }
            calcScores[p.id] = score;
        }
        setForms(initForms);
        setScores(calcScores);
        setPatientLogs(allLogs);
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const togglePatient = (id) => {
        setExpanded({...expanded, [id]: !expanded[id]});
    };

    const handleFormChange = (id, field, value) => {
        setForms({ ...forms, [id]: { ...forms[id], [field]: value } });
    };

    const handleSave = async (id) => {
        const f = forms[id];
        await setDoctorTarget(id, parseInt(f.p), parseInt(f.c), parseInt(f.f), parseInt(f.e));
        Alert.alert('Success', 'Target saved and patient notified!');
        setExpanded({...expanded, [id]: false});
        await loadData();
    };

    const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const getScoreBadge = (score) => {
        if(score >= 80) return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', text: 'Excellent', icon: 'checkmark-circle' };
        if(score >= 50) return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', text: 'Fair', icon: 'warning' };
        return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', text: 'Needs Action', icon: 'alert-circle' };
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.profileRow}>
                    <View style={styles.avatar}>
                        <Ionicons name="medkit" size={24} color="#8b5cf6" />
                    </View>
                    <View>
                        <Text style={styles.title}>Dr. {user.name}</Text>
                        <Text style={styles.subtitle}>Patient CRM Dashboard</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await logout(); setUser(null); }}>
                    <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <TouchableOpacity style={styles.mailBtn} onPress={() => Alert.alert('Sent!', 'Weekly reports dispatched to all patients.')}>
                    <Ionicons name="paper-plane" size={20} color="#fff" style={{marginRight: 8}} />
                    <Text style={styles.mailBtnText}>Broadcast Weekly Reports</Text>
                </TouchableOpacity>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#a1a1aa" style={styles.searchIcon} />
                    <TextInput 
                        style={styles.searchInput} 
                        placeholder="Search patients..." 
                        placeholderTextColor="#52525b"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        outlineStyle="none"
                    />
                </View>

                <Text style={styles.sectionTitle}>Active Patients</Text>
                {filteredPatients.length === 0 && <Text style={{color: '#a1a1aa'}}>No patients found.</Text>}

                {filteredPatients.map(p => {
                    const badge = getScoreBadge(scores[p.id] || 0);
                    return (
                        <View key={p.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
                                    <View style={styles.patientAvatar}>
                                        <Text style={styles.patientInitials}>{p.name.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.patientName}>{p.name}</Text>
                                        <Text style={styles.patientCat}>{p.category} Plan</Text>
                                    </View>
                                </View>
                                
                                <TouchableOpacity style={styles.targetBtn} onPress={() => togglePatient(p.id)}>
                                    <Ionicons name={expanded[p.id] ? "chevron-up" : "chevron-down"} size={22} color="#8b5cf6" />
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.statusRow}>
                                <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.color }]}>
                                    <Ionicons name={badge.icon} size={14} color={badge.color} />
                                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text} ({scores[p.id] || 0}%)</Text>
                                </View>
                            </View>

                            {expanded[p.id] && forms[p.id] && (
                                <View style={styles.formContainer}>
                                    <Text style={styles.formTitle}>Adjust Nutritional Targets</Text>
                                    <View style={styles.row}>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Protein (g)</Text>
                                            <TextInput style={styles.input} keyboardType="numeric" value={forms[p.id].p} onChangeText={(v) => handleFormChange(p.id, 'p', v)} />
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Carb (g)</Text>
                                            <TextInput style={styles.input} keyboardType="numeric" value={forms[p.id].c} onChangeText={(v) => handleFormChange(p.id, 'c', v)} />
                                        </View>
                                    </View>
                                    <View style={styles.row}>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Fiber (g)</Text>
                                            <TextInput style={styles.input} keyboardType="numeric" value={forms[p.id].f} onChangeText={(v) => handleFormChange(p.id, 'f', v)} />
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Exercise (m)</Text>
                                            <TextInput style={styles.input} keyboardType="numeric" value={forms[p.id].e} onChangeText={(v) => handleFormChange(p.id, 'e', v)} />
                                        </View>
                                    </View>
                                    <TouchableOpacity style={styles.saveBtn} onPress={() => handleSave(p.id)}>
                                        <Ionicons name="checkmark-circle" size={18} color="#fff" style={{marginRight: 8}} />
                                        <Text style={styles.saveBtnText}>Save Targets</Text>
                                    </TouchableOpacity>
                                    
                                    <View style={{marginTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 16}}>
                                        <Text style={styles.formTitle}>Recent Logs (Last 3 Days)</Text>
                                        {patientLogs[p.id] && patientLogs[p.id].length > 0 ? (
                                            patientLogs[p.id].slice(-3).reverse().map((l, i) => (
                                                <View key={i} style={{marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12}}>
                                                    <Text style={{color: '#f8fafc', fontWeight: 'bold', marginBottom: 4}}>{l.date}</Text>
                                                    <Text style={{color: '#a1a1aa', fontSize: 13}}>P: {l.macros.protein}g | C: {l.macros.carb}g | F: {l.macros.fiber}g</Text>
                                                    <Text style={{color: '#a1a1aa', fontSize: 13}}>Exercise: {l.exerciseMinutes}m | Water: {l.water} glasses</Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={{color: '#a1a1aa'}}>No recent logs found.</Text>
                                        )}
                                    </View>
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#09090b' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16 },
    profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(139, 92, 246, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)' },
    title: { fontSize: 24, fontWeight: '900', color: '#f8fafc', letterSpacing: 0.5 },
    subtitle: { fontSize: 13, color: '#a1a1aa', marginTop: 2, letterSpacing: 0.5 },
    logoutBtn: { padding: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
    scroll: { paddingHorizontal: 24, paddingBottom: 40 },
    mailBtn: { flexDirection: 'row', backgroundColor: '#0ea5e9', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
    mailBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, marginBottom: 24 },
    searchIcon: { marginRight: 12 },
    searchInput: { flex: 1, paddingVertical: 14, color: '#f8fafc', fontSize: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
    card: { backgroundColor: 'rgba(24, 24, 27, 0.6)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    patientAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#27272a', justifyContent: 'center', alignItems: 'center' },
    patientInitials: { color: '#f8fafc', fontWeight: 'bold', fontSize: 16 },
    patientName: { color: '#f8fafc', fontWeight: 'bold', fontSize: 16 },
    patientCat: { color: '#a1a1aa', fontSize: 12, marginTop: 4 },
    targetBtn: { padding: 8, backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: 12 },
    statusRow: { marginTop: 16, flexDirection: 'row' },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, gap: 4 },
    badgeText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
    formContainer: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    formTitle: { color: '#f8fafc', fontSize: 14, fontWeight: 'bold', marginBottom: 16 },
    row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    inputGroup: { flex: 1 },
    label: { color: '#a1a1aa', fontSize: 12, marginBottom: 8, fontWeight: '600', textTransform: 'uppercase' },
    input: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14, color: '#f8fafc', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', outlineStyle: 'none' },
    saveBtn: { flexDirection: 'row', backgroundColor: '#8b5cf6', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { login } from '../utils/store';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ setUser }) {
    const [role, setRole] = useState('Patient');
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Weight Loss');

    const handleLogin = async () => {
        if (!name.trim()) return;
        const u = await login(role, name, role === 'Patient' ? category : null);
        setUser(u);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Background Orbs */}
            <View style={[styles.orb, styles.orb1]} />
            <View style={[styles.orb, styles.orb2]} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="pulse" size={48} color="#0ea5e9" />
                    </View>
                    <Text style={styles.title}>Vitality</Text>
                    <Text style={styles.subtitle}>Unlock your best self.</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Select Profile Type</Text>
                    <View style={styles.roleContainer}>
                        <TouchableOpacity 
                            style={[styles.roleBtn, role === 'Patient' && styles.roleBtnActive]} 
                            onPress={() => setRole('Patient')}
                        >
                            <Ionicons name="person" size={20} color={role === 'Patient' ? '#fff' : '#a1a1aa'} />
                            <Text style={[styles.roleBtnText, role === 'Patient' && styles.roleBtnTextActive]}>Patient</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.roleBtn, role === 'Doctor' && styles.roleBtnActive]} 
                            onPress={() => setRole('Doctor')}
                        >
                            <Ionicons name="medkit" size={20} color={role === 'Doctor' ? '#fff' : '#a1a1aa'} />
                            <Text style={[styles.roleBtnText, role === 'Doctor' && styles.roleBtnTextActive]}>Doctor</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Full Name</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-circle-outline" size={24} color="#a1a1aa" style={styles.inputIcon} />
                        <TextInput 
                            style={styles.input} 
                            placeholder="e.g. Karthik" 
                            placeholderTextColor="#52525b"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                        />
                    </View>

                    {role === 'Patient' && (
                        <>
                            <Text style={styles.label}>Primary Goal</Text>
                            <View style={styles.goalContainer}>
                                {['Weight Loss', 'Weight Gain', 'Diabetes'].map(cat => (
                                    <TouchableOpacity 
                                        key={cat}
                                        style={[styles.goalBtn, category === cat && styles.goalBtnActive]} 
                                        onPress={() => setCategory(cat)}
                                    >
                                        <Text style={[styles.goalBtnText, category === cat && styles.goalBtnTextActive]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}

                    <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
                        <Text style={styles.primaryBtnText}>Get Started</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#09090b', position: 'relative' },
    orb: { position: 'absolute', borderRadius: 9999, opacity: 0.15 },
    orb1: { width: width, height: width, backgroundColor: '#0ea5e9', top: -width/2, left: -width/4 },
    orb2: { width: width*0.8, height: width*0.8, backgroundColor: '#8b5cf6', bottom: -width/4, right: -width/3 },
    content: { flex: 1, justifyContent: 'center', padding: 24, zIndex: 10 },
    header: { alignItems: 'center', marginBottom: 48 },
    logoContainer: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(14, 165, 233, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.2)' },
    title: { fontSize: 42, fontWeight: '900', color: '#f8fafc', letterSpacing: 1 },
    subtitle: { fontSize: 16, color: '#a1a1aa', marginTop: 8, letterSpacing: 0.5 },
    card: { backgroundColor: 'rgba(24, 24, 27, 0.7)', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
    label: { color: '#a1a1aa', fontSize: 13, marginBottom: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    roleContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 8 },
    roleBtnActive: { backgroundColor: 'rgba(14, 165, 233, 0.1)', borderColor: '#0ea5e9' },
    roleBtnText: { color: '#a1a1aa', fontWeight: '600', fontSize: 15 },
    roleBtnTextActive: { color: '#fff' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, marginBottom: 24 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, paddingVertical: 16, color: '#f8fafc', fontSize: 16, outlineStyle: 'none' },
    goalContainer: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 32 },
    goalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    goalBtnActive: { backgroundColor: 'rgba(139, 92, 246, 0.15)', borderColor: '#8b5cf6' },
    goalBtnText: { color: '#a1a1aa', fontSize: 13, fontWeight: '600' },
    goalBtnTextActive: { color: '#8b5cf6' },
    primaryBtn: { flexDirection: 'row', backgroundColor: '#0ea5e9', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 }
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { saveDietScore } from '../utils/store';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width } = Dimensions.get('window');

const QUESTIONS = [
    {
        id: 'carbs',
        title: 'Carbohydrate Intake',
        subtitle: 'What was your main carbohydrate source today?',
        type: 'single',
        options: [
            { label: 'White rice', score: 1 },
            { label: 'Idli / Dosa', score: 1 },
            { label: 'Chapati', score: 1 },
            { label: 'Poori / Parotta', score: 0 },
            { label: 'Millets (Ragi, Thinai, Kambu)', score: 2 },
            { label: 'Brown rice', score: 2 },
            { label: 'Oats', score: 2 },
        ]
    },
    {
        id: 'protein',
        title: 'Protein Intake',
        subtitle: 'Check all protein foods consumed today',
        type: 'multiple',
        options: [
            { label: 'Dal / Sambar' },
            { label: 'Paneer' },
            { label: 'Curd / Yogurt' },
            { label: 'Sprouts' },
            { label: 'Groundnuts' },
            { label: 'Egg' },
            { label: 'Chicken' },
            { label: 'Fish' },
        ],
        calcScore: (selected) => {
            if (selected.length === 0) return 0;
            if (selected.length === 1) return 1;
            return 2;
        }
    },
    {
        id: 'fibre',
        title: 'Fibre Intake',
        subtitle: 'Select fruits/vegetables consumed (1 cup = 1 serving)',
        type: 'multiple',
        options: [
            { label: 'Greens' },
            { label: 'Mixed vegetables' },
            { label: 'Carrot / Beans / Cabbage' },
            { label: 'Banana' },
            { label: 'Apple' },
            { label: 'Guava' },
            { label: 'Papaya' },
        ],
        calcScore: (selected) => {
            if (selected.length === 0) return 0;
            if (selected.length === 1) return 1;
            return 2; // 2-3 servings or more
        }
    },
    {
        id: 'junk',
        title: 'Junk Food / Sugar',
        subtitle: 'Did you consume any fried snacks, bakery items, or soft drinks?',
        type: 'single',
        options: [
            { label: 'Yes', score: -1 },
            { label: 'No', score: 0 },
        ]
    },
    {
        id: 'mealPattern',
        title: 'Meal Pattern',
        subtitle: 'Did you skip any meal today?',
        type: 'single',
        options: [
            { label: 'Yes (skipped)', score: 0 },
            { label: 'No (regular)', score: 1 },
        ]
    },
    {
        id: 'water',
        title: 'Water Intake',
        subtitle: 'Approximate water consumption today',
        type: 'single',
        options: [
            { label: 'Less than 1 L', score: 0 },
            { label: '1–2 L', score: 1 },
            { label: '2+ L', score: 2 },
        ]
    },
    {
        id: 'hunger',
        title: 'Hunger Cues',
        subtitle: 'Did you feel hunger before eating your meals?',
        type: 'single',
        options: [
            { label: 'Yes', score: 0 },
            { label: 'No', score: 0 },
        ]
    }
];

export default function DietQuestionnaire({ user, navigation }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showResult, setShowResult] = useState(false);

    const question = QUESTIONS[currentStep];

    const handleSelect = (optionLabel, score) => {
        if (question.type === 'single') {
            setAnswers({ ...answers, [question.id]: { label: optionLabel, score } });
            if (currentStep < QUESTIONS.length - 1) {
                setTimeout(() => setCurrentStep(currentStep + 1), 300);
            } else {
                setShowResult(true);
            }
        } else {
            const currentSelected = answers[question.id]?.labels || [];
            let newSelected;
            if (currentSelected.includes(optionLabel)) {
                newSelected = currentSelected.filter(l => l !== optionLabel);
            } else {
                newSelected = [...currentSelected, optionLabel];
            }
            const newScore = question.calcScore(newSelected);
            setAnswers({ ...answers, [question.id]: { labels: newSelected, score: newScore } });
        }
    };

    const nextStep = () => {
        if (currentStep < QUESTIONS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setShowResult(true);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const calculateTotalScore = () => {
        return Object.values(answers).reduce((acc, curr) => acc + (curr.score || 0), 0);
    };

    const handleSave = async () => {
        const totalScore = calculateTotalScore();
        const today = new Date().toISOString().split('T')[0];
        await saveDietScore(user.id, today, {
            totalScore,
            answers
        });
        Alert.alert('Success', 'Daily diet assessment saved!');
        navigation.navigate('Home');
    };

    if (showResult) {
        const total = calculateTotalScore();
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.resultContent}>
                    <ConfettiCannon count={200} origin={{x: width/2, y: 0}} fallSpeed={2500} fadeOut />
                    <View style={styles.scoreCircle}>
                        <Text style={styles.scoreText}>{total}</Text>
                        <Text style={styles.scoreLabel}>Diet Score</Text>
                    </View>
                    <Text style={styles.resultTitle}>Great job, {user.name}!</Text>
                    <Text style={styles.resultSub}>Your eating habits for today have been scored. Consistent tracking helps build better habits.</Text>
                    
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Text style={styles.saveBtnText}>Save Assessment</Text>
                        <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#f8fafc" />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }]} />
                </View>
                <Text style={styles.stepText}>{currentStep + 1} / {QUESTIONS.length}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>{question.title}</Text>
                <Text style={styles.subtitle}>{question.subtitle}</Text>

                <View style={styles.optionsGrid}>
                    {question.options.map((opt) => {
                        const isSelected = question.type === 'single' 
                            ? answers[question.id]?.label === opt.label
                            : (answers[question.id]?.labels || []).includes(opt.label);

                        return (
                            <TouchableOpacity
                                key={opt.label}
                                style={[styles.optionCard, isSelected && styles.optionSelected]}
                                onPress={() => handleSelect(opt.label, opt.score)}
                            >
                                <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                                    {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                                </View>
                                <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>{opt.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.navBtn, currentStep === 0 && { opacity: 0 }]} 
                    onPress={prevStep}
                    disabled={currentStep === 0}
                >
                    <Ionicons name="chevron-back" size={24} color="#a1a1aa" />
                    <Text style={styles.navBtnText}>Back</Text>
                </TouchableOpacity>

                {question.type === 'multiple' && (
                    <TouchableOpacity style={styles.nextBtn} onPress={nextStep}>
                        <Text style={styles.nextBtnText}>Next</Text>
                        <Ionicons name="chevron-forward" size={24} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#09090b' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    progressContainer: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: '#0ea5e9' },
    stepText: { color: '#a1a1aa', fontSize: 12, fontWeight: 'bold' },
    scroll: { padding: 24 },
    title: { fontSize: 28, fontWeight: '900', color: '#f8fafc', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#a1a1aa', marginBottom: 32, lineHeight: 24 },
    optionsGrid: { gap: 12 },
    optionCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'rgba(255,255,255,0.03)', 
        padding: 20, 
        borderRadius: 20, 
        borderWidth: 1, 
        borderColor: 'rgba(255,255,255,0.05)' 
    },
    optionSelected: { backgroundColor: 'rgba(14, 165, 233, 0.1)', borderColor: '#0ea5e9' },
    checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: '#3f3f46', marginRight: 16, justifyContent: 'center', alignItems: 'center' },
    checkboxActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
    optionLabel: { color: '#f8fafc', fontSize: 16, fontWeight: '500' },
    optionLabelActive: { color: '#fff', fontWeight: 'bold' },
    footer: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    navBtnText: { color: '#a1a1aa', fontSize: 16, fontWeight: '600' },
    nextBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#0ea5e9', 
        paddingVertical: 12, 
        paddingHorizontal: 24, 
        borderRadius: 16, 
        gap: 8,
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10
    },
    nextBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    resultContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    scoreCircle: { 
        width: 150, 
        height: 150, 
        borderRadius: 75, 
        borderWidth: 8, 
        borderColor: '#0ea5e9', 
        justifyContent: 'center', 
        alignItems: 'center',
        marginBottom: 32,
        backgroundColor: 'rgba(14, 165, 233, 0.05)'
    },
    scoreText: { fontSize: 64, fontWeight: '900', color: '#f8fafc' },
    scoreLabel: { fontSize: 14, color: '#0ea5e9', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    resultTitle: { fontSize: 32, fontWeight: '900', color: '#f8fafc', marginBottom: 16, textAlign: 'center' },
    resultSub: { fontSize: 16, color: '#a1a1aa', textAlign: 'center', marginBottom: 40, lineHeight: 24 },
    saveBtn: { 
        flexDirection: 'row', 
        backgroundColor: '#10b981', 
        paddingVertical: 18, 
        paddingHorizontal: 32, 
        borderRadius: 20, 
        alignItems: 'center', 
        gap: 12,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12
    },
    saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

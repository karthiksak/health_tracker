import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { getPatientLogs, getTarget } from '../utils/store';

export default function PatientReport({ user }) {
    const [logs, setLogs] = useState([]);
    const [target, setTarget] = useState({ targetP: 100, targetC: 150, targetF: 25, targetExercise: 30 });

    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                const l = await getPatientLogs(user.id);
                setLogs(l);
                const t = await getTarget(user.id);
                setTarget(t);
            };
            load();
        }, [user.id])
    );

    // Calculate last 7 days data
    const last7Days = [];
    const chartData = [];
    let weekAvgP = 0;
    
    for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        last7Days.push(d.toLocaleDateString('en-US', {weekday: 'short'}));
        
        // Find log
        const log = logs.find(l => l.date === dateStr);
        if(log) {
            const pPct = Math.min(100, (log.macros.protein / (target.targetP || 1)) * 100) || 0;
            const ePct = Math.min(100, (log.exerciseMinutes / (target.targetExercise || 1)) * 100) || 0;
            chartData.push((pPct + ePct) / 2);
            weekAvgP += log.macros.protein;
        } else {
            chartData.push(0);
        }
    }

    weekAvgP = Math.round(weekAvgP / 7);

    const data = {
        labels: last7Days,
        datasets: [{
            data: chartData.length > 0 ? chartData : [0,0,0,0,0,0,0],
            color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
            strokeWidth: 3
        }],
    };

    // Today's specific data
    const todayProgress = Math.round(chartData[6] || 0);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <Text style={styles.title}>Weekly Analytics</Text>
                    <Text style={styles.subtitle}>Your real-time progress & insights</Text>
                </View>

                {/* Summary Cards */}
                <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryValue}>{todayProgress}%</Text>
                        <Text style={styles.summaryLabel}>Today's Score</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryValue}>{weekAvgP}g</Text>
                        <Text style={styles.summaryLabel}>Avg Protein/Day</Text>
                    </View>
                </View>

                {/* Chart Section */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>7-Day Goal Completion</Text>
                    <LineChart
                        data={data}
                        width={Dimensions.get("window").width - 88} // from padding
                        height={220}
                        yAxisSuffix="%"
                        chartConfig={{
                            backgroundColor: "#18181b",
                            backgroundGradientFrom: "#18181b",
                            backgroundGradientTo: "#18181b",
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(161, 161, 170, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(161, 161, 170, ${opacity})`,
                            style: { borderRadius: 16 },
                            propsForDots: { r: "5", strokeWidth: "2", stroke: "#8b5cf6" },
                            fillShadowGradientFrom: '#8b5cf6',
                            fillShadowGradientTo: '#18181b',
                            fillShadowGradientFromOpacity: 0.3,
                            fillShadowGradientToOpacity: 0.05
                        }}
                        bezier
                        style={{ marginVertical: 8, borderRadius: 16 }}
                    />
                </View>

                <View style={styles.feedbackCard}>
                    <Text style={styles.feedbackTitle}>{todayProgress >= 80 ? "Outstanding!" : "Keep Going!"}</Text>
                    <Text style={styles.feedbackDesc}>
                        {todayProgress >= 80 
                            ? "You are crushing your health goals. An automated report will highlight your great work." 
                            : "You're making progress. Log your meals and exercise to boost your daily score!"}
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#09090b' },
    scroll: { padding: 24 },
    header: { marginBottom: 24 },
    title: { fontSize: 28, fontWeight: '900', color: '#f8fafc', letterSpacing: 0.5 },
    subtitle: { fontSize: 15, color: '#a1a1aa', marginTop: 4 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    summaryCard: { flex: 1, backgroundColor: '#1e1b4b', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)', marginHorizontal: 4, alignItems: 'center' },
    summaryValue: { fontSize: 28, fontWeight: 'bold', color: '#f8fafc' },
    summaryLabel: { fontSize: 12, color: '#a1a1aa', marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    chartCard: { backgroundColor: '#18181b', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#27272a', alignItems: 'center', marginBottom: 24 },
    chartTitle: { color: '#f8fafc', fontWeight: '600', fontSize: 16, marginBottom: 16, alignSelf: 'flex-start' },
    feedbackCard: { backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
    feedbackTitle: { fontSize: 18, fontWeight: 'bold', color: '#10b981', marginBottom: 8 },
    feedbackDesc: { color: '#a1a1aa', lineHeight: 22 }
});

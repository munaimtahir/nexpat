import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useVisits } from '@/api/hooks/useVisits';
import { useAuth } from '@/features/auth/AuthContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { VisitStatusTag } from '@/components/VisitStatusTag';
import { TextureBackground } from '@/components/TextureBackground';
import type { AssistantTabParamList, DoctorTabParamList } from '@/navigation/types';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

type DashboardNavigation = BottomTabNavigationProp<AssistantTabParamList & DoctorTabParamList>;

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNavigation>();
  const { user } = useAuth();
  const waitingQuery = useVisits({ status: 'waiting' });
  const inProgressQuery = useVisits({ status: 'in_progress' });
  const completedQuery = useVisits({ status: 'completed' });
  const [refreshing, setRefreshing] = useState(false);

  const initials = useMemo(() => {
    if (!user?.username) return 'DR';
    const parts = user.username.split(/[._-]/);
    const first = parts[0]?.charAt(0) ?? 'D';
    const second = parts[1]?.charAt(0) ?? parts[0]?.charAt(1) ?? 'R';
    return `${first}${second}`.toUpperCase();
  }, [user?.username]);

  const roleLabel = user?.roles?.includes('doctor') ? 'Doctor' : 'Care team';

  const nextVisit = waitingQuery.data?.results?.[0];

  const stats: Array<{
    label: string;
    value: number;
    detail: string;
    colors: [string, string];
  }> = [
    {
      label: 'Waiting',
      value: waitingQuery.data?.count ?? 0,
      detail: 'in lobby',
      colors: ['#FDE68A', '#F97316']
    },
    {
      label: 'In progress',
      value: inProgressQuery.data?.count ?? 0,
      detail: 'active consultations',
      colors: ['#818CF8', '#6366F1']
    },
    {
      label: 'Completed',
      value: completedQuery.data?.count ?? 0,
      detail: 'signed off today',
      colors: ['#6EE7B7', '#10B981']
    }
  ];

  const actions = useMemo(() => {
    const base: Array<{
      title: string;
      description: string;
      route: 'Queue' | 'Patients' | 'Uploads';
      colors: [string, string];
      icon: string;
    }> = [
      {
        title: 'Manage queue',
        description: 'Track visits in real-time',
        route: 'Queue' as const,
        colors: ['#6366F1', '#8B5CF6'],
        icon: 'clipboard-text-outline'
      },
      {
        title: 'Patients',
        description: 'Review records and history',
        route: 'Patients' as const,
        colors: ['#22D3EE', '#3B82F6'],
        icon: 'account-heart-outline'
      }
    ];

    if (user?.roles?.includes('assistant')) {
      base.push({
        title: 'Uploads',
        description: 'Scan prescriptions & charts',
        route: 'Uploads' as const,
        colors: ['#F472B6', '#F97316'],
        icon: 'cloud-upload-outline'
      });
    }

    return base;
  }, [user?.roles]);

  const syncTarget = user?.roles?.includes('assistant') ? 'Uploads' : 'Queue';

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([waitingQuery.refetch(), inProgressQuery.refetch(), completedQuery.refetch()]);
    setRefreshing(false);
  };

  return (
    <TextureBackground variant="aurora">
      <AnimatedScrollView
        entering={FadeInUp.duration(420)}
        refreshControl={<RefreshControl tintColor="#fff" refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <LinearGradient colors={['rgba(99,102,241,0.28)', 'transparent']} style={styles.headerGlow} />
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.display}>{roleLabel}</Text>
            <Text style={styles.caption}>Stay ahead of the queue with live insights.</Text>
          </View>
          <View style={styles.avatar}>
            <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.avatarGradient}>
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.statRow}>
          {stats.map((stat) => (
            <Card key={stat.label} variant="gradient" accentColors={stat.colors} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statDetail}>{stat.detail}</Text>
            </Card>
          ))}
        </View>

        {nextVisit ? (
          <Card variant="glass" style={styles.nextCard}>
            <Text style={styles.cardTitle}>Next patient</Text>
            <Text style={styles.cardSubtitle}>Visit #{nextVisit.id}</Text>
            {nextVisit.status ? <VisitStatusTag status={nextVisit.status} variant="glass" /> : null}
            {nextVisit.reason ? <Text style={styles.cardBody}>{nextVisit.reason}</Text> : null}
            <Button label="Open visit" onPress={() => navigation.navigate('Queue')} />
          </Card>
        ) : null}

        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Primary actions</Text>
          {actions.map((action) => (
            <Card
              key={action.route}
              variant="gradient"
              accentColors={action.colors}
              onPress={() => navigation.navigate(action.route)}
            >
              <View style={styles.actionRow}>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </View>
                <View style={styles.actionIcon}>
                  <MaterialCommunityIcons name={action.icon as any} size={28} color="#F8FAFC" />
                </View>
              </View>
            </Card>
          ))}
        </View>

        <Card variant="elevated" style={styles.syncCard}>
          <Text style={styles.sectionTitle}>Offline ready</Text>
          <Text style={styles.cardBody}>
            Queue and patient records sync automatically. You&apos;ll get animated feedback when connectivity changes so nothing
            falls through the cracks.
          </Text>
         <Button
            label="View sync status"
            variant="glass"
            onPress={() => navigation.navigate(syncTarget)}
            icon={<MaterialCommunityIcons name="information-outline" color="#6366F1" size={18} />}
          />
        </Card>
      </AnimatedScrollView>
    </TextureBackground>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 48
  },
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  greeting: {
    color: '#CBD5F5',
    fontSize: 16,
    fontWeight: '500'
  },
  display: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '700',
    marginTop: 4
  },
  caption: {
    color: '#E2E8F0',
    marginTop: 6,
    fontSize: 14
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#312E81',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6
  },
  avatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700'
  },
  statRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 24
  },
  statCard: {
    flex: 1,
    marginHorizontal: 0,
    marginBottom: 0
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A'
  },
  statLabel: {
    color: '#0F172A',
    fontWeight: '600'
  },
  statDetail: {
    color: '#1F2937',
    opacity: 0.7
  },
  nextCard: {
    marginHorizontal: 16,
    marginTop: 24
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '600'
  },
  cardSubtitle: {
    color: '#E2E8F0',
    marginTop: 4,
    fontSize: 16
  },
  cardBody: {
    color: '#CBD5F5',
    marginTop: 12,
    fontSize: 14
  },
  actionSection: {
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 24
  },
  sectionTitle: {
    color: '#E0E7FF',
    fontSize: 20,
    fontWeight: '700'
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  actionText: {
    flex: 1,
    paddingRight: 24
  },
  actionTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700'
  },
  actionDescription: {
    color: '#E2E8F0',
    marginTop: 4,
    fontSize: 14
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(248,250,252,0.25)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  syncCard: {
    marginHorizontal: 16,
    marginTop: 24
  }
});

import { IconSymbol } from '@/components/IconSymbol';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/contexts/UserContext';
import React, { useState, useEffect, useCallback } from 'react';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { api, type Container } from '@/utils/api';
import { designColors } from '@/styles/designSystem';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  try {
    const d     = new Date(dateString);
    const day   = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year  = d.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return '';
  }
}

interface StepInfo {
  label:     string;
  sublabel:  string;
  date:      string | null;
  completed: boolean;
}

function buildSteps(c: Container): StepInfo[] {
  return [
    { label: 'פריטים מוכנים', sublabel: 'אישור מוכנות',      date: c.itemsReady,       completed: !!c.itemsReady       },
    { label: 'תשלום אושר',    sublabel: 'אישור כספי',         date: c.itemsPaid,        completed: !!c.itemsPaid        },
    { label: 'קבלה למחסן',    sublabel: 'לוגיסטיקה מקומית',  date: c.itemsInGarage,    completed: !!c.itemsInGarage    },
    { label: 'טעינה למכולה',  sublabel: 'שלב אריזה',          date: c.itemsOnContainer, completed: !!c.itemsOnContainer },
    { label: 'יציאה לים',     sublabel: 'משלוח ימי',          date: c.containerSent,    completed: !!c.containerSent    },
    { label: 'הגעה ליעד',     sublabel: 'אישור קבלה',         date: c.containerArrive,  completed: !!c.containerArrive  },
  ];
}

function getStatus(c: Container) {
  if (c.containerArrive)   return { label: 'הגיעה',  color: '#059669', bg: '#ecfdf5', dot: '#10b981' };
  if (c.containerSent)     return { label: 'בדרך',   color: '#b45309', bg: '#fffbeb', dot: '#f59e0b' };
  if (c.itemsOnContainer)  return { label: 'נטענה',  color: '#1d4ed8', bg: '#eff6ff', dot: '#3b82f6' };
  if (c.itemsReady)        return { label: 'בהכנה',  color: '#6d28d9', bg: '#f5f3ff', dot: '#8b5cf6' };
  return                          { label: 'ממתינה', color: '#64748b', bg: '#f8fafc', dot: '#94a3b8' };
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function ContainerCard({ container, index }: { container: Container; index: number }) {
  const [open, setOpen] = useState(false);
  const steps           = buildSteps(container);
  const status          = getStatus(container);
  const done            = steps.filter(s => s.completed).length;
  const pct             = Math.round((done / steps.length) * 100);
  const rotation        = useSharedValue(0);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, 180])}deg` }],
  }));

  function toggle() {
    rotation.value = withTiming(open ? 0 : 1, { duration: 260 });
    setOpen(o => !o);
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify().damping(16).stiffness(120)}
      style={s.card}
    >
      {/* Accent bar */}
      <View style={[s.accentBar, { backgroundColor: status.dot }]} />

      <Pressable onPress={toggle} style={s.cardHeader}>

        {/* ── Row 1: ID right, badge left ────────────────────────────────
            justifyContent: space-between puts:
              first child  → LEFT  edge
              second child → RIGHT edge
            So to get ID on RIGHT and badge on LEFT we put ID second. */}
        <View style={s.row}>
          {/* LEFT */ }
          <View style={[s.badge, { backgroundColor: status.bg }]}>
            <View style={[s.badgeDot, { backgroundColor: status.dot }]} />
            <Text style={[s.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
          {/* RIGHT */}
          <Text style={s.cardId}>{container.containerIdPerUser}</Text>
        </View>

        {/* ── Row 2: progress right, chevron left ──────────────────────── */}
        <View style={s.row}>
          {/* LEFT */}
          <Animated.View style={chevronStyle}>
            <IconSymbol
              ios_icon_name="chevron.down"
              android_material_icon_name="expand-more"
              size={18}
              color="#94a3b8"
            />
          </Animated.View>
          {/* RIGHT: % + bar */}
          <View style={s.progressRow}>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: status.dot }]} />
            </View>
            <Text style={[s.progressPct, { color: status.color }]}>{pct}%</Text>
          </View>
        </View>

      </Pressable>

      {/* Divider + timeline */}
      {open && (
        <>
          <View style={s.divider} />
          <View style={s.timeline}>
            {steps.map((step, i) => {
              const isLast   = i === steps.length - 1;
              const nextDone = steps[i + 1]?.completed;

              return (
                <View key={i} style={s.timelineRow}>

                  {/* ── RIGHT: node column ── */}
                  <View style={s.nodeCol}>
                    <View style={[
                      s.node,
                      step.completed
                        ? { backgroundColor: status.dot, borderColor: status.dot }
                        : { backgroundColor: 'white',    borderColor: '#e2e8f0'  },
                    ]}>
                      {step.completed && (
                        <IconSymbol
                          ios_icon_name="checkmark"
                          android_material_icon_name="check"
                          size={10}
                          color="white"
                        />
                      )}
                    </View>
                    {!isLast && (
                      <View style={[
                        s.connector,
                        { backgroundColor: step.completed && nextDone ? status.dot + '50' : '#f1f5f9' },
                      ]} />
                    )}
                  </View>

                  {/* ── LEFT: text block ── */}
                  <View style={s.stepContent}>
                    {/* Step name RIGHT, date LEFT */}
                    <View style={s.stepTopRow}>
                      {/* LEFT: date */}
                      {step.completed && step.date
                        ? <Text style={[s.stepDate, { color: status.color }]}>{formatDate(step.date)}</Text>
                        : <Text style={s.stepPending}>ממתין</Text>
                      }
                      {/* RIGHT: label */}
                      <Text style={[s.stepLabel, { color: step.completed ? '#0f172a' : '#cbd5e1' }]}>
                        {step.label}
                      </Text>
                    </View>
                    <Text style={[s.stepSub, { color: step.completed ? '#94a3b8' : '#e2e8f0' }]}>
                      {step.sublabel}
                    </Text>
                  </View>

                </View>
              );
            })}
          </View>
        </>
      )}
    </Animated.View>
  );
}

// ─── Summary Tile ─────────────────────────────────────────────────────────────

function SummaryTile({ num, label, color, bg }: {
  num: number; label: string; color: string; bg: string;
}) {
  return (
    <View style={[s.summaryTile, { backgroundColor: bg }]}>
      <Text style={[s.summaryNum, { color }]}>{num}</Text>
      <Text style={[s.summaryLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ContainersScreen() {
  const { user }                    = useUser();
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadContainers = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const data = await api.getContainers(user.id);
      setContainers(data);
    } catch (error: any) {
      console.error('ContainersScreen: Failed to load', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { loadContainers(); }, [loadContainers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadContainers();
  }, [loadContainers]);

  const arrived   = containers.filter(c => c.containerArrive).length;
  const inTransit = containers.filter(c => c.containerSent && !c.containerArrive).length;
  const preparing = containers.filter(c => !c.containerSent).length;

  if (loading) {
    return (
      <View style={s.loadingScreen}>
        <ActivityIndicator size="large" color={designColors.primary} />
        <Text style={s.loadingText}>טוען מכולות...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={designColors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Title — right aligned */}
        <Text style={s.pageTitle}>מכולות</Text>

        {/* Summary row */}
        {containers.length > 0 && (
          <View style={s.summaryRow}>
            <SummaryTile num={arrived}   label="הגיעו"  color="#059669" bg="#ecfdf5" />
            <SummaryTile num={inTransit} label="בדרך"   color="#b45309" bg="#fffbeb" />
            <SummaryTile num={preparing} label="בהכנה"  color="#6d28d9" bg="#f5f3ff" />
          </View>
        )}

        {/* Section header — label RIGHT, line LEFT */}
        {containers.length > 0 && (
          <View style={s.sectionHeader}>
            {/* Label on the RIGHT — put it first in JSX so space-between pushes it right */}
            <Text style={s.sectionLabel}>כל המכולות · {containers.length}</Text>
            {/* Line on the LEFT */}
            <View style={s.sectionLine} />
          </View>
        )}

        {/* Cards */}
        {containers.length === 0 ? (
          <View style={s.emptyContainer}>
            <View style={s.emptyIconWrap}>
              <IconSymbol ios_icon_name="shippingbox" android_material_icon_name="inventory" size={40} color="#94a3b8" />
            </View>
            <Text style={s.emptyTitle}>אין מכולות עדיין</Text>
            <Text style={s.emptySubtitle}>המכולות שלך יופיעו כאן</Text>
          </View>
        ) : (
          containers.map((container, i) => (
            <ContainerCard key={container.id} container={container} index={i} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({

  screen:      { flex: 1, backgroundColor: '#f8fafc' },
  scroll:      { paddingHorizontal: 20, paddingTop: 48, paddingBottom: 110 },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', gap: 12 },
  loadingText: { fontSize: 14, color: '#94a3b8', fontWeight: '500', textAlign: 'right' },

  // ── Title
  pageTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -1,
    textAlign: 'right',       // text glyphs right-aligned
    marginBottom: 24,
  },

  // ── Summary — flexDirection row puts tiles left-to-right
  //    Order in JSX: הגיעו | בדרך | בהכנה (right to left visually needs row-reverse)
  summaryRow: {
    flexDirection: 'row-reverse',  // first tile in JSX = rightmost on screen
    gap: 10,
    marginBottom: 28,
  },
  summaryTile: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryNum:   { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  summaryLabel: { fontSize: 11, fontWeight: '700', marginTop: 4 },

  // ── Section header
  //    We want: [label ............. line]
  //    label on RIGHT, line extends to LEFT
  //    Put label FIRST and line LAST in JSX, use row + space-between
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textAlign: 'right',
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },

  // ── Card
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  accentBar: { height: 3, width: '100%' },
  cardHeader: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 14, gap: 12 },

  // ── Generic row
  //    space-between: first child LEFT, last child RIGHT
  //    So put the element you want on LEFT first, RIGHT second
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Card ID — appears on the RIGHT (put it last in JSX)
  cardId: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.4,
    textAlign: 'right',
  },

  // Badge — appears on the LEFT (put it first in JSX)
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: '700', textAlign: 'right' },

  // Progress — appears on the RIGHT (put it last in JSX)
  //   Inside: % label on RIGHT, bar on LEFT
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 10,      // gap from chevron
  },
  progressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 10 },
  progressPct: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 34,
    textAlign: 'right',
  },

  divider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 18 },

  // ── Timeline
  timeline: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8 },

  // Each step row:
  //   first child  → LEFT  (in standard row)
  //   last child   → RIGHT
  //   We want node on RIGHT, text on LEFT
  //   → put nodeCol LAST, stepContent FIRST
  timelineRow: {
    flexDirection: 'row-reverse',   // reverses child order: last in JSX = leftmost on screen
    alignItems: 'flex-start',
    gap: 12,
  },

  // Node column — will appear on the RIGHT because it's FIRST in JSX with row-reverse
  nodeCol: {
    alignItems: 'center',
    width: 28,
  },
  node: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 16,
    borderRadius: 2,
    marginTop: 3,
    marginBottom: -8,
  },

  // Text block — will appear on the LEFT
  stepContent: {
    flex: 1,
    paddingBottom: 20,
    gap: 3,
  },
  // Inside text: label on RIGHT, date on LEFT
  // use row + space-between, label last (RIGHT), date first (LEFT)
  stepTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  stepDate: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'left',
  },
  stepPending: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  stepSub: {
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'right',
  },

  // ── Empty
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 8 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: '#64748b', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#94a3b8',  fontWeight: '400', textAlign: 'center' },
});
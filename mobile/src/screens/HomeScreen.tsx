import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/ScreenHeader';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import { spacing, typography } from '../theme/typography';
import * as tasksApi from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errorMessage';
import { groupByCategory } from '../utils/groupByCategory';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { session, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const query = useQuery({ queryKey: ['tasks', 'selection'], queryFn: tasksApi.getSelection });

  const sections = groupByCategory(query.data ?? []);
  const taskCount = query.data?.length ?? 0;

  async function handleLogout() {
    try {
      await logout();
      showSuccess('Logged out successfully');
    } catch (error) {
      showError(getErrorMessage(error));
    }
  }

  return (
    <View style={styles.flex}>
      <ScreenHeader
        eyebrow={session?.user.email}
        title="Your tasks"
        subtitle={taskCount > 0 ? `${taskCount} task${taskCount === 1 ? '' : 's'} being handled` : undefined}
        rightAction={{ label: 'Log out', onPress: handleLogout }}
      />

      {query.isLoading ? (
        <LoadingState message="Loading your tasks…" />
      ) : query.isError ? (
        <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(section) => section.title}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No tasks selected yet</Text>
              <Text style={styles.emptyMessage}>Choose what you&apos;d like your Lifestyle Manager to handle.</Text>
              <View style={styles.emptyAction}>
                <PrimaryButton title="Choose tasks" onPress={() => navigation.navigate('TaskSelection')} />
              </View>
            </View>
          }
          renderItem={({ item: section }) => (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionDot} />
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              {section.data.map((task) => (
                <View key={task.id} style={styles.taskCard}>
                  <Text style={styles.taskName}>{task.name}</Text>
                  <Text style={styles.taskDescription}>{task.description}</Text>
                </View>
              ))}
            </View>
          )}
        />
      )}

      {!query.isLoading && !query.isError && sections.length > 0 ? (
        <View style={styles.footer}>
          <PrimaryButton
            title="Edit tasks"
            variant="secondary"
            onPress={() => navigation.navigate('TaskSelection')}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.lg, flexGrow: 1 },
  section: { marginBottom: spacing.lg },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  sectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.teal, marginRight: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  taskName: { ...typography.bodyStrong, color: colors.textPrimary },
  taskDescription: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxl },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs, textAlign: 'center' },
  emptyMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  emptyAction: { minWidth: 200 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
});

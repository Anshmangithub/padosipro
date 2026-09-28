import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/ScreenHeader';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/fonts';
import { radius, spacing, typography } from '../theme/typography';
import * as tasksApi from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errorMessage';
import { groupByCategory } from '../utils/groupByCategory';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskSelection'>;

// Doubles as the first-time onboarding step and the "edit tasks" screen
// reached from Home — same fetch/select/save behaviour either way, just
// pre-seeded with the user's existing picks when there are any.
export function TaskSelectionScreen({ navigation }: Props) {
  const { markTasksSelected } = useAuth();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const isEditMode = navigation.canGoBack();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const seededFromExisting = useRef(false);

  const query = useQuery({ queryKey: ['tasks', 'catalogue'], queryFn: tasksApi.listCatalogue });
  const selectionQuery = useQuery({ queryKey: ['tasks', 'selection'], queryFn: tasksApi.getSelection });

  useEffect(() => {
    if (!seededFromExisting.current && selectionQuery.data) {
      setSelectedIds(new Set(selectionQuery.data.map((t) => t.id)));
      seededFromExisting.current = true;
    }
  }, [selectionQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => tasksApi.saveSelection(Array.from(selectedIds)),
    onSuccess: () => {
      markTasksSelected();
      queryClient.invalidateQueries({ queryKey: ['tasks', 'selection'] });
      showSuccess('Tasks confirmed successfully');
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      setSaveError(message);
      showError(message);
    },
  });

  const sections = useMemo(() => {
    const tasks = query.data ?? [];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? tasks.filter((t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
      : tasks;

    return groupByCategory(filtered);
  }, [query.data, search]);

  function toggle(taskId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  const header = (
    <ScreenHeader
      eyebrow={isEditMode ? 'Your tasks' : 'Last step'}
      title={isEditMode ? 'Edit your tasks' : 'What should we handle?'}
      subtitle="Pick as many as you like — you can always change this later."
      onBack={isEditMode ? navigation.goBack : undefined}
    />
  );

  if (query.isLoading) {
    return (
      <View style={styles.flex}>
        {header}
        <LoadingState message="Loading tasks…" />
      </View>
    );
  }

  if (query.isError) {
    return (
      <View style={styles.flex}>
        {header}
        <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
      </View>
    );
  }

  if ((query.data ?? []).length === 0) {
    return (
      <View style={styles.flex}>
        {header}
        <EmptyState title="No tasks available" message="Please check back later." />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {header}

      <View style={styles.searchWrap}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search tasks or categories"
          placeholderTextColor={colors.placeholder}
          style={styles.search}
          testID="task-search"
        />
      </View>

      {saveError ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{saveError}</Text>
        </View>
      ) : null}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionHeader}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const selected = selectedIds.has(item.id);
          return (
            <Pressable
              onPress={() => toggle(item.id)}
              style={[styles.taskRow, selected && styles.taskRowSelected]}
              testID={`task-${item.id}`}
            >
              <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
                {selected ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <View style={styles.taskTextContainer}>
                <Text style={styles.taskName}>{item.name}</Text>
                <Text style={styles.taskDescription}>{item.description}</Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.noResults}>No tasks match &quot;{search}&quot;.</Text>
        }
      />

      <View style={styles.footer}>
        <PrimaryButton
          title={`Confirm (${selectedIds.size} selected)`}
          onPress={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  searchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  search: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    ...typography.body,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  banner: {
    backgroundColor: colors.errorLight,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  bannerText: { ...typography.body, color: colors.error },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.teal,
    marginRight: spacing.sm,
  },
  sectionHeader: { ...typography.h3, color: colors.textPrimary },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  taskRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: colors.textInverse, fontSize: 14, fontFamily: fontFamilies.bodySemiBold },
  taskTextContainer: { flex: 1 },
  taskName: { ...typography.bodyStrong, color: colors.textPrimary },
  taskDescription: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  noResults: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});

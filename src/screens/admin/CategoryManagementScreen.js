import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Text, TextInput, Button, Chip, IconButton } from 'react-native-paper';
import { categoryService } from '../../services/category';
import AdminBottomNav from '../../components/AdminBottomNav';

const CategoryManagementScreen = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const result = await categoryService.getCategories();
    if (result.success) {
      setCategories(result.categories);
      setErrorMessage('');
    } else {
      setCategories([]);
      setErrorMessage(result.error || 'Failed to load categories');
    }
    setLoading(false);
  };

  const handleAddCategory = async () => {
    setSubmitting(true);
    const result = await categoryService.addCategory(name);

    if (result.success) {
      setName('');
      await loadCategories();
    } else {
      setErrorMessage(result.error || 'Failed to add category');
    }

    setSubmitting(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const startEdit = (item) => {
    setEditingId(item.$id);
    setEditName(item.name || '');
    setErrorMessage('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setErrorMessage('');
  };

  const handleUpdateCategory = async () => {
    if (!editingId) return;

    setSubmitting(true);
    const result = await categoryService.updateCategory(editingId, editName);

    if (result.success) {
      cancelEdit();
      await loadCategories();
    } else {
      setErrorMessage(result.error || 'Failed to update category');
    }

    setSubmitting(false);
  };

  const handleDeleteCategory = (item) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await categoryService.deleteCategory(item.$id);
            if (result.success) {
              if (editingId === item.$id) {
                cancelEdit();
              }
              await loadCategories();
              return;
            }
            setErrorMessage(result.error || 'Failed to delete category');
          },
        },
      ]
    );
  };

  const renderCategory = ({ item }) => (
    <Card style={styles.categoryCard}>
      <Card.Content style={styles.categoryCardContent}>
        {editingId === item.$id ? (
          <View style={styles.editWrap}>
            <TextInput
              mode="outlined"
              value={editName}
              onChangeText={setEditName}
              style={styles.editInput}
              dense
            />
            <View style={styles.actionIcons}>
              <IconButton
                icon="content-save-outline"
                onPress={handleUpdateCategory}
                disabled={submitting}
              />
              <IconButton icon="close" onPress={cancelEdit} disabled={submitting} />
            </View>
          </View>
        ) : (
          <>
            <Text variant="titleSmall" style={styles.categoryName}>
              {item.name || 'Untitled'}
            </Text>
            <View style={styles.actionIcons}>
              <Chip compact icon="tag-outline" style={styles.categoryChip}>
                Active
              </Chip>
              <IconButton
                icon="pencil-outline"
                size={20}
                onPress={() => startEdit(item)}
              />
              <IconButton
                icon="delete-outline"
                size={20}
                iconColor="#d32f2f"
                onPress={() => handleDeleteCategory(item)}
              />
            </View>
          </>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Card style={styles.formCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.heading}>
            Add Category
          </Text>
          <TextInput
            mode="outlined"
            label="Category Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Cars, Fashion, Electronics"
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleAddCategory}
            loading={submitting}
            disabled={submitting}
          >
            Add Category
          </Button>
          {!!errorMessage && (
            <Text variant="bodySmall" style={styles.errorText}>
              {errorMessage}
            </Text>
          )}
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={styles.listHeading}>
        Existing Categories ({categories.length})
      </Text>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.$id}
        renderItem={renderCategory}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>{loading ? 'Loading categories...' : 'No categories found.'}</Text>
          </View>
        }
        contentContainerStyle={
          categories.length === 0 ? styles.emptyListContent : styles.listContent
        }
      />
      <AdminBottomNav activeTab="main" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
  },
  formCard: {
    borderRadius: 10,
    marginBottom: 12,
  },
  heading: {
    marginBottom: 10,
    fontWeight: '700',
  },
  input: {
    marginBottom: 10,
  },
  errorText: {
    marginTop: 8,
    color: '#d32f2f',
  },
  listHeading: {
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
  },
  listContent: {
    paddingBottom: 96,
  },
  emptyListContent: {
    flexGrow: 1,
    paddingBottom: 96,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  categoryCard: {
    marginBottom: 8,
    borderRadius: 8,
  },
  categoryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  categoryName: {
    fontWeight: '600',
    color: '#222',
    flex: 1,
    marginRight: 8,
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChip: {
    backgroundColor: '#e8f5e9',
  },
});

export default CategoryManagementScreen;

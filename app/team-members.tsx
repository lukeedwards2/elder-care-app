 import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useUser } from '@supabase/auth-helpers-react';

export default function TeamMembers() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
  });

  const user = useUser();

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('main_user_id', user?.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setTeamMembers(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      Alert.alert('Please fill out both fields.');
      return;
    }

    const payload = {
      name: form.name,
      email: form.email,
      main_user_id: user.id,
      profile_image_url: user.user_metadata?.profile_image_url || null, // use main user pic
      role: 'Team Member',
    };

    if (editingMember) {
      // Update
      const { error } = await supabase
        .from('team_members')
        .update(payload)
        .eq('id', editingMember.id);

      if (error) {
        Alert.alert('Error updating team member', error.message);
        return;
      }
    } else {
      // Insert
      const { error } = await supabase.from('team_members').insert([payload]);
      if (error) {
        Alert.alert('Error adding team member', error.message);
        return;
      }
    }

    setModalVisible(false);
    setEditingMember(null);
    setForm({ name: '', email: '' });
    fetchTeamMembers();
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setForm({ name: member.name, email: member.email });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    Alert.alert('Confirm Delete', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('team_members').delete().eq('id', id);
          if (error) {
            Alert.alert('Error deleting', error.message);
          } else {
            fetchTeamMembers();
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.memberBox}>
      <Text style={styles.memberText}>{item.name} — {item.email}</Text>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleEdit(item)}>
          <Text style={styles.edit}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Text style={styles.delete}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Team Members</Text>

      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={teamMembers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text>No team members added yet.</Text>}
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>Add Team Member</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>
            {editingMember ? 'Edit Team Member' : 'Add Team Member'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Name"
            value={form.name}
            onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={form.email}
            onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setModalVisible(false);
                setEditingMember(null);
                setForm({ name: '', email: '' });
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  memberBox: {
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  memberText: {
    fontSize: 16,
    marginBottom: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  edit: { color: '#1976D2', marginRight: 20 },
  delete: { color: 'red' },
  addButton: {
    backgroundColor: '#1976D2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    padding: 22,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    top: '30%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    alignSelf: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 14,
    borderRadius: 8,
    marginBottom: 14,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#1976D2',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: '#888',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginLeft: 10,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});


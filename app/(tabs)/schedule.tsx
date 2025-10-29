import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  TextInput, Pressable, Platform
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import NavHeader from '../../components/NavHeader';

const EVENT_TYPES = [
  { label: 'Doctor', color: '#e74c3c' },
  { label: 'Family Visit', color: '#3498db' },
  { label: 'Guest/Friend', color: '#2ecc71' },
  { label: 'Social Event', color: '#f1c40f' },
  { label: 'Therapy', color: '#9b59b6' },
];

export default function ScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [events, setEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [reminderTime, setReminderTime] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);

  const STORAGE_KEY = 'schedule_events';

  useEffect(() => {
    loadEvents();
    Notifications.requestPermissionsAsync();
  }, []);

  const loadEvents = async () => {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) setEvents(JSON.parse(saved));
  };

  const saveEvents = async (updated) => {
    setEvents(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleAddEvent = async () => {
    const newEvent = {
      title: newEventTitle,
      time: newEventTime,
      date: selectedDate,
      reminderTime: reminderTime ? reminderTime.toISOString() : null,
      type: eventType.label,
      color: eventType.color,
    };

    const updated = [...events, newEvent];
    await saveEvents(updated);

    if (reminderTime) {
      const trigger = new Date(reminderTime);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Upcoming Schedule Event',
          body: newEventTitle,
        },
        trigger,
      });
    }

    setNewEventTitle('');
    setNewEventTime('');
    setReminderTime(null);
    setEventType(EVENT_TYPES[0]);
    setModalVisible(false);
  };

  const filteredEvents = events.filter((e) => e.date === selectedDate);

  const markedDates = events.reduce((acc, event) => {
    if (!acc[event.date]) acc[event.date] = { dots: [], marked: true };
    acc[event.date].dots.push({ color: event.color });
    if (event.date === selectedDate) {
      acc[event.date].selected = true;
      acc[event.date].selectedColor = '#1976D2';
    }
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <NavHeader
        title="Schedule Page"
        helpText="Use this page to view, add, and manage scheduled events. Tap on a date in the calendar to see scheduled items, and use the + button to create a new event with optional reminders."
      />

      <Calendar
        markedDates={markedDates}
        markingType="multi-dot"
        onDayPress={(day) => setSelectedDate(day.dateString)}
        style={styles.calendar}
      />

      <Text style={styles.dateHeader}>
        {new Date(selectedDate).toDateString()}
      </Text>

      {filteredEvents.length === 0 ? (
        <Text style={styles.emptyText}>No events scheduled.</Text>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => {
            const textColor = ['#f1c40f', '#eee', '#fff'].includes(item.color)
              ? '#000'
              : '#fff';
            return (
              <View style={[styles.eventItem, { backgroundColor: item.color }]}>
                <Text style={[styles.eventTitle, { color: textColor }]}>{item.title}</Text>
                {item.time && (
                  <Text style={[styles.eventTime, { color: textColor }]}>{item.time}</Text>
                )}
                <Text style={[styles.eventTag, { color: textColor }]}>{item.type}</Text>
              </View>
            );
          }}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <AntDesign name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Event</Text>
            <TextInput
              placeholder="Event Title"
              style={styles.input}
              value={newEventTitle}
              onChangeText={setNewEventTitle}
            />
            <TextInput
              placeholder="Time (e.g., 3:00 PM)"
              style={styles.input}
              value={newEventTime}
              onChangeText={setNewEventTime}
            />

            <TouchableOpacity
              style={styles.reminderButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.reminderButtonText}>
                {reminderTime
                  ? `Reminder: ${reminderTime.toLocaleTimeString()}`
                  : 'Set Reminder Time'}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={reminderTime || new Date()}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false);
                  if (selectedTime) {
                    const dateWithTime = new Date(selectedDate);
                    dateWithTime.setHours(selectedTime.getHours());
                    dateWithTime.setMinutes(selectedTime.getMinutes());
                    dateWithTime.setSeconds(0);
                    setReminderTime(dateWithTime);
                  }
                }}
              />
            )}

            <Text style={styles.label}>Event Type</Text>
            <View style={styles.tagContainer}>
              {EVENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.label}
                  style={[
                    styles.tagOption,
                    eventType.label === type.label && {
                      backgroundColor: type.color,
                    },
                  ]}
                  onPress={() => setEventType(type)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      eventType.label === type.label && { color: '#fff' },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Pressable style={styles.saveButton} onPress={handleAddEvent}>
              <Text style={styles.saveButtonText}>Save Event</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: 16,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 20,
    fontSize: 16,
  },
  eventItem: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 10,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventTime: {
    fontSize: 14,
  },
  eventTag: {
    marginTop: 6,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#1976D2',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5 },
      android: { elevation: 5 },
    }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#1976D2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  reminderButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  reminderButtonText: {
    fontWeight: 'bold',
    color: '#333',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#eee',
    borderRadius: 6,
  },
  tagText: {
    color: '#333',
  },
});

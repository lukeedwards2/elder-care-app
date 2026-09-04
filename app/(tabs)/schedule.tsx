import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import NavHeader from '../../components/NavHeader';

type EventType = {
  label: string;
  color: string;
  softColor: string;
};

type ScheduleEvent = {
  id: string;
  title: string;
  time: string;
  date: string;
  reminderTime: string | null;
  type: string;
  color: string;
};

const EVENT_TYPES: EventType[] = [
  {
    label: 'Doctor',
    color: '#E5534B',
    softColor: '#FDECEC',
  },
  {
    label: 'Family Visit',
    color: '#1976D2',
    softColor: '#EAF4FF',
  },
  {
    label: 'Guest/Friend',
    color: '#43A66B',
    softColor: '#ECF8F0',
  },
  {
    label: 'Social Event',
    color: '#D99B23',
    softColor: '#FFF7E6',
  },
  {
    label: 'Therapy',
    color: '#8A63D2',
    softColor: '#F3EDFF',
  },
];

const STORAGE_KEY = 'schedule_events';
const APP_BLUE = '#1976D2';

export default function ScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState(
    getTodayDateString()
  );

  const [events, setEvents] = useState<ScheduleEvent[]>([]);

  const [modalVisible, setModalVisible] = useState(false);

  const [newEventTitle, setNewEventTitle] = useState('');
  const [eventTime, setEventTime] = useState<Date | null>(null);
  const [reminderTime, setReminderTime] = useState<Date | null>(null);

  const [showEventTimePicker, setShowEventTimePicker] =
    useState(false);

  const [showReminderPicker, setShowReminderPicker] =
    useState(false);

  const [eventType, setEventType] = useState<EventType>(
    EVENT_TYPES[0]
  );

  useEffect(() => {
    loadEvents();
    requestNotificationPermission();
  }, []);

  const requestNotificationPermission = async () => {
    try {
      await Notifications.requestPermissionsAsync();
    } catch (error) {
      console.log(
        'Unable to request notification permissions:',
        error
      );
    }
  };

  const loadEvents = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed: ScheduleEvent[] = JSON.parse(saved);
        setEvents(parsed);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.log('Failed to load schedule events:', error);
    }
  };

  const saveEvents = async (
    updatedEvents: ScheduleEvent[]
  ) => {
    try {
      setEvents(updatedEvents);

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedEvents)
      );
    } catch (error) {
      console.log('Failed to save schedule events:', error);

      Alert.alert(
        'Unable to Save',
        'The event could not be saved. Please try again.'
      );
    }
  };

  const resetEventForm = () => {
    setNewEventTitle('');
    setEventTime(null);
    setReminderTime(null);

    setShowEventTimePicker(false);
    setShowReminderPicker(false);

    setEventType(EVENT_TYPES[0]);
  };

  const openAddEvent = () => {
    resetEventForm();
    setModalVisible(true);
  };

  const closeAddEvent = () => {
    resetEventForm();
    setModalVisible(false);
  };

  const handleAddEvent = async () => {
    const trimmedTitle = newEventTitle.trim();

    if (!trimmedTitle) {
      Alert.alert(
        'Event Title Needed',
        'Please enter a title for this event.'
      );
      return;
    }

    const newEvent: ScheduleEvent = {
      id: `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

      title: trimmedTitle,

      time: eventTime
        ? formatClockTime(eventTime)
        : '',

      // This guarantees the event stays attached
      // to the exact calendar day the user selected.
      date: selectedDate,

      reminderTime: reminderTime
        ? reminderTime.toISOString()
        : null,

      type: eventType.label,
      color: eventType.color,
    };

    const updatedEvents = [...events, newEvent];

    await saveEvents(updatedEvents);

    if (reminderTime) {
      try {
        if (reminderTime.getTime() > Date.now()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Upcoming Schedule Event',
              body: trimmedTitle,
              sound: true,
            },
            trigger: reminderTime,
          });
        }
      } catch (error) {
        console.log(
          'Unable to schedule reminder:',
          error
        );

        Alert.alert(
          'Event Saved',
          'Your event was saved, but the reminder could not be scheduled.'
        );
      }
    }

    closeAddEvent();
  };

  const confirmDeleteEvent = (event: ScheduleEvent) => {
    Alert.alert(
      'Delete Event?',
      `Remove "${event.title}" from your schedule?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteEvent(event.id),
        },
      ]
    );
  };

  const deleteEvent = async (eventId: string) => {
    const updatedEvents = events.filter(
      (event) => event.id !== eventId
    );

    await saveEvents(updatedEvents);
  };

  const filteredEvents = useMemo(() => {
    return events.filter(
      (event) => event.date === selectedDate
    );
  }, [events, selectedDate]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    events.forEach((event) => {
      if (!marks[event.date]) {
        marks[event.date] = {
          dots: [],
        };
      }

      const existingColors = marks[event.date].dots.map(
        (dot: { color: string }) => dot.color
      );

      if (!existingColors.includes(event.color)) {
        marks[event.date].dots.push({
          color: event.color,
        });
      }
    });

    // Always highlight the selected day,
    // even when it has no events.
    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: APP_BLUE,
      selectedTextColor: '#fff',
      dots: marks[selectedDate]?.dots || [],
    };

    return marks;
  }, [events, selectedDate]);

  const selectedDateLabel =
    formatDisplayDate(selectedDate);

  const selectedDateShortLabel =
    formatShortDate(selectedDate);

  const makeDateWithSelectedDay = (time: Date) => {
    const [year, month, day] = selectedDate
      .split('-')
      .map(Number);

    const combined = new Date(
      year,
      month - 1,
      day,
      time.getHours(),
      time.getMinutes(),
      0,
      0
    );

    return combined;
  };

  return (
    <View style={styles.container}>
      {/* NEW GLOBAL TOP NAV */}
      <NavHeader />

      <View style={styles.calendarCard}>
        <Calendar
          current={selectedDate}
          markedDates={markedDates}
          markingType="multi-dot"
          onDayPress={(day) => {
            setSelectedDate(day.dateString);
          }}
          enableSwipeMonths
          theme={{
            backgroundColor: '#fff',
            calendarBackground: '#fff',

            textSectionTitleColor: '#8A97A8',

            selectedDayBackgroundColor: APP_BLUE,
            selectedDayTextColor: '#fff',

            todayTextColor: APP_BLUE,

            dayTextColor: '#243548',

            textDisabledColor: '#D5DDE5',

            arrowColor: APP_BLUE,

            monthTextColor: '#192330',

            textMonthFontWeight: '700',
            textMonthFontSize: 18,

            textDayHeaderFontWeight: '600',
            textDayHeaderFontSize: 13,

            textDayFontSize: 16,
          }}
        />
      </View>

      <View style={styles.selectedDayHeader}>
        <View>
          <Text style={styles.selectedLabel}>
            Selected day
          </Text>

          <Text style={styles.dateHeader}>
            {selectedDateLabel}
          </Text>
        </View>

        <View style={styles.eventCountBadge}>
          <Text style={styles.eventCountText}>
            {filteredEvents.length}{' '}
            {filteredEvents.length === 1
              ? 'event'
              : 'events'}
          </Text>
        </View>
      </View>

      {filteredEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="calendar-clear-outline"
              size={38}
              color={APP_BLUE}
            />
          </View>

          <Text style={styles.emptyTitle}>
            Nothing scheduled
          </Text>

          <Text style={styles.emptyText}>
            Tap the + button to add an event for{' '}
            {selectedDateShortLabel}.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.eventsList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.eventCard}
              onLongPress={() =>
                confirmDeleteEvent(item)
              }
            >
              <View
                style={[
                  styles.eventColorBar,
                  {
                    backgroundColor: item.color,
                  },
                ]}
              />

              <View style={styles.eventContent}>
                <View style={styles.eventTopRow}>
                  <Text
                    style={styles.eventTitle}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>

                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor:
                          getEventSoftColor(item.type),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        {
                          color: item.color,
                        },
                      ]}
                    >
                      {item.type}
                    </Text>
                  </View>
                </View>

                {item.time ? (
                  <View style={styles.eventDetailRow}>
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color="#728095"
                    />

                    <Text style={styles.eventTime}>
                      {item.time}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.eventDetailRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#728095"
                    />

                    <Text style={styles.eventTime}>
                      Time not specified
                    </Text>
                  </View>
                )}

                {item.reminderTime && (
                  <View style={styles.eventDetailRow}>
                    <Ionicons
                      name="notifications-outline"
                      size={18}
                      color="#728095"
                    />

                    <Text style={styles.eventTime}>
                      Reminder set
                    </Text>
                  </View>
                )}

                <Text style={styles.longPressHint}>
                  Press and hold to delete
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* KEEPING THE BLUE + BUTTON */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={openAddEvent}
      >
        <AntDesign
          name="plus"
          size={34}
          color="#fff"
        />
      </TouchableOpacity>

      {/* ADD EVENT MODAL */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeAddEvent}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalTopRow}>
                <View style={styles.modalHeadingGroup}>
                  <View style={styles.modalIcon}>
                    <Ionicons
                      name="calendar-outline"
                      size={27}
                      color={APP_BLUE}
                    />
                  </View>

                  <View style={styles.modalHeadingText}>
                    <Text style={styles.modalTitle}>
                      Add Event
                    </Text>

                    <Text style={styles.modalSubtitle}>
                      {selectedDateLabel}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeAddEvent}
                >
                  <Ionicons
                    name="close"
                    size={26}
                    color="#5D6877"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.formCard}>
                <Text style={styles.fieldLabel}>
                  Event title
                </Text>

                <TextInput
                  placeholder="Example: Doctor appointment"
                  placeholderTextColor="#AEB7C3"
                  style={styles.input}
                  value={newEventTitle}
                  onChangeText={setNewEventTitle}
                  autoCapitalize="sentences"
                />

                <Text style={styles.fieldLabel}>
                  Event time
                </Text>

                <TouchableOpacity
                  style={styles.selectionButton}
                  onPress={() =>
                    setShowEventTimePicker(true)
                  }
                >
                  <View style={styles.selectionLeft}>
                    <View style={styles.selectionIcon}>
                      <Ionicons
                        name="time-outline"
                        size={22}
                        color={APP_BLUE}
                      />
                    </View>

                    <View>
                      <Text
                        style={
                          eventTime
                            ? styles.selectionValue
                            : styles.selectionPlaceholder
                        }
                      >
                        {eventTime
                          ? formatClockTime(eventTime)
                          : 'Choose event time'}
                      </Text>

                      <Text style={styles.selectionHint}>
                        Optional
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color="#A4AFBC"
                  />
                </TouchableOpacity>

                {showEventTimePicker && (
                  <DateTimePicker
                    value={eventTime || new Date()}
                    mode="time"
                    is24Hour={false}
                    display={
                      Platform.OS === 'ios'
                        ? 'spinner'
                        : 'default'
                    }
                    onChange={(
                      _event,
                      selectedTime
                    ) => {
                      if (Platform.OS !== 'ios') {
                        setShowEventTimePicker(false);
                      }

                      if (selectedTime) {
                        setEventTime(selectedTime);
                      }
                    }}
                  />
                )}

                {Platform.OS === 'ios' &&
                  showEventTimePicker && (
                    <TouchableOpacity
                      style={styles.pickerDoneButton}
                      onPress={() =>
                        setShowEventTimePicker(false)
                      }
                    >
                      <Text
                        style={styles.pickerDoneText}
                      >
                        Done
                      </Text>
                    </TouchableOpacity>
                  )}

                <Text style={styles.fieldLabel}>
                  Reminder
                </Text>

                <TouchableOpacity
                  style={styles.selectionButton}
                  onPress={() =>
                    setShowReminderPicker(true)
                  }
                >
                  <View style={styles.selectionLeft}>
                    <View style={styles.selectionIcon}>
                      <Ionicons
                        name="notifications-outline"
                        size={22}
                        color={APP_BLUE}
                      />
                    </View>

                    <View>
                      <Text
                        style={
                          reminderTime
                            ? styles.selectionValue
                            : styles.selectionPlaceholder
                        }
                      >
                        {reminderTime
                          ? formatClockTime(
                              reminderTime
                            )
                          : 'Set reminder time'}
                      </Text>

                      <Text style={styles.selectionHint}>
                        Optional
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color="#A4AFBC"
                  />
                </TouchableOpacity>

                {showReminderPicker && (
                  <DateTimePicker
                    value={
                      reminderTime || new Date()
                    }
                    mode="time"
                    is24Hour={false}
                    display={
                      Platform.OS === 'ios'
                        ? 'spinner'
                        : 'default'
                    }
                    onChange={(
                      _event,
                      selectedTime
                    ) => {
                      if (Platform.OS !== 'ios') {
                        setShowReminderPicker(false);
                      }

                      if (selectedTime) {
                        const combined =
                          makeDateWithSelectedDay(
                            selectedTime
                          );

                        setReminderTime(combined);
                      }
                    }}
                  />
                )}

                {Platform.OS === 'ios' &&
                  showReminderPicker && (
                    <TouchableOpacity
                      style={styles.pickerDoneButton}
                      onPress={() =>
                        setShowReminderPicker(false)
                      }
                    >
                      <Text
                        style={styles.pickerDoneText}
                      >
                        Done
                      </Text>
                    </TouchableOpacity>
                  )}

                {reminderTime && (
                  <TouchableOpacity
                    onPress={() =>
                      setReminderTime(null)
                    }
                  >
                    <Text
                      style={styles.removeReminder}
                    >
                      Remove reminder
                    </Text>
                  </TouchableOpacity>
                )}

                <Text style={styles.fieldLabel}>
                  Event type
                </Text>

                <View style={styles.tagContainer}>
                  {EVENT_TYPES.map((type) => {
                    const selected =
                      eventType.label === type.label;

                    return (
                      <TouchableOpacity
                        key={type.label}
                        style={[
                          styles.tagOption,
                          {
                            backgroundColor:
                              selected
                                ? type.color
                                : type.softColor,

                            borderColor: selected
                              ? type.color
                              : 'transparent',
                          },
                        ]}
                        onPress={() =>
                          setEventType(type)
                        }
                      >
                        <View
                          style={[
                            styles.tagDot,
                            {
                              backgroundColor:
                                selected
                                  ? '#fff'
                                  : type.color,
                            },
                          ]}
                        />

                        <Text
                          style={[
                            styles.tagText,
                            {
                              color: selected
                                ? '#fff'
                                : type.color,
                            },
                          ]}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Pressable
                  style={styles.saveButton}
                  onPress={handleAddEvent}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={23}
                    color="#fff"
                  />

                  <Text
                    style={styles.saveButtonText}
                  >
                    Save Event
                  </Text>
                </Pressable>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeAddEvent}
                >
                  <Text
                    style={styles.cancelButtonText}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getTodayDateString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    today.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function dateFromDateString(dateString: string) {
  const [year, month, day] = dateString
    .split('-')
    .map(Number);

  return new Date(year, month - 1, day);
}

function formatDisplayDate(dateString: string) {
  return dateFromDateString(
    dateString
  ).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatShortDate(dateString: string) {
  return dateFromDateString(
    dateString
  ).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
  });
}

function formatClockTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getEventSoftColor(typeLabel: string) {
  const type = EVENT_TYPES.find(
    (eventType) =>
      eventType.label === typeLabel
  );

  return type?.softColor || '#EEF3F8';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },

  calendarCard: {
    marginHorizontal: 16,
    marginTop: 18,
    borderRadius: 22,
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E1E7EE',

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        shadowOffset: {
          width: 0,
          height: 3,
        },
      },

      android: {
        elevation: 2,
      },
    }),
  },

  selectedDayHeader: {
    marginHorizontal: 18,
    marginTop: 17,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectedLabel: {
    color: '#8895A5',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },

  dateHeader: {
    color: '#18212D',
    fontSize: 19,
    fontWeight: '750',
  },

  eventCountBadge: {
    backgroundColor: '#EAF4FF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },

  eventCountText: {
    color: APP_BLUE,
    fontWeight: '700',
    fontSize: 13,
  },

  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 35,
    paddingTop: 35,
  },

  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 25,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  emptyTitle: {
    color: '#18212D',
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 7,
  },

  emptyText: {
    color: '#8995A5',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },

  eventsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
  },

  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DEE5EC',
    overflow: 'hidden',
    marginBottom: 12,

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: {
          width: 0,
          height: 3,
        },
      },

      android: {
        elevation: 1,
      },
    }),
  },

  eventColorBar: {
    width: 7,
  },

  eventContent: {
    flex: 1,
    padding: 15,
  },

  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },

  eventTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#18212D',
  },

  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 5,
  },

  eventTime: {
    color: '#69778A',
    fontSize: 14,
  },

  longPressHint: {
    fontSize: 11,
    color: '#A5AFBB',
    marginTop: 10,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,

    backgroundColor: APP_BLUE,

    width: 64,
    height: 64,
    borderRadius: 32,

    justifyContent: 'center',
    alignItems: 'center',

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.22,
        shadowRadius: 10,
        shadowOffset: {
          width: 0,
          height: 5,
        },
      },

      android: {
        elevation: 7,
      },
    }),
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 24, 34, 0.48)',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 40,
  },

  modalContent: {
    backgroundColor: '#F7F9FC',
    borderRadius: 26,
    padding: 18,
    maxHeight: '90%',
  },

  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  modalHeadingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  modalIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  modalHeadingText: {
    flex: 1,
  },

  modalTitle: {
    fontSize: 23,
    color: '#18212D',
    fontWeight: '800',
  },

  modalSubtitle: {
    fontSize: 14,
    color: '#8693A4',
    marginTop: 2,
  },

  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EDF1F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  formCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DFE6ED',
    padding: 16,
  },

  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#455466',
    marginBottom: 8,
    marginTop: 3,
  },

  input: {
    borderWidth: 1,
    borderColor: '#D4DDE7',
    backgroundColor: '#FAFBFD',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    color: '#18212D',
    marginBottom: 17,
  },

  selectionButton: {
    borderWidth: 1,
    borderColor: '#D4DDE7',
    backgroundColor: '#FAFBFD',
    borderRadius: 15,
    minHeight: 68,
    paddingHorizontal: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  selectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  selectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  selectionValue: {
    color: '#273342',
    fontSize: 16,
    fontWeight: '650',
  },

  selectionPlaceholder: {
    color: '#8E9BAB',
    fontSize: 16,
  },

  selectionHint: {
    color: '#A3ADBA',
    fontSize: 12,
    marginTop: 2,
  },

  pickerDoneButton: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  pickerDoneText: {
    color: APP_BLUE,
    fontSize: 16,
    fontWeight: '700',
  },

  removeReminder: {
    alignSelf: 'flex-end',
    color: '#C8453D',
    fontSize: 13,
    fontWeight: '600',
    marginTop: -8,
    marginBottom: 15,
  },

  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 19,
  },

  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },

  tagText: {
    fontSize: 13,
    fontWeight: '700',
  },

  saveButton: {
    backgroundColor: APP_BLUE,
    minHeight: 55,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },

  cancelButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },

  cancelButtonText: {
    color: '#6E7B8B',
    fontSize: 15,
    fontWeight: '650',
  },
});

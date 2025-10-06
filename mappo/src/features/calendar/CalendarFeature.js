import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Calendar from 'expo-calendar';
import FeatureActionButton from '../../components/FeatureActionButton';

export default function CalendarFeature() {
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [calendarId, setCalendarId] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [selectedEventId, setSelectedEventId] = useState(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = useCallback(async () => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    setPermissionStatus(status);
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Activa el acceso al calendario para continuar.');
      return;
    }

    const targetCalendar = await findDefaultCalendar();
    if (!targetCalendar) {
      Alert.alert('Calendario no encontrado', 'Crea un calendario en tu dispositivo.');
      return;
    }

    setCalendarId(targetCalendar.id);
    loadEvents(targetCalendar.id);
  }, []);

  const findDefaultCalendar = async () => {
    if (Platform.OS === 'ios' && Calendar.getDefaultCalendarAsync) {
      try {
        return await Calendar.getDefaultCalendarAsync();
      } catch (error) {
        console.error(error);
      }
    }

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    return calendars.find((cal) => cal.isPrimary) ?? calendars[0] ?? null;
  };

  const loadEvents = useCallback(
    async (id = calendarId) => {
      if (!id) {
        return;
      }
      setLoading(true);
      try {
        const start = new Date();
        start.setDate(start.getDate() - 15);
        const end = new Date();
        end.setDate(end.getDate() + 60);
        const fetchedEvents = await Calendar.getEventsAsync([id], start, end);
        const sorted = fetchedEvents.sort(
          (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
        setEvents(sorted);
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'No fue posible cargar los eventos.');
      } finally {
        setLoading(false);
      }
    },
    [calendarId]
  );

  const handleCreateEvent = async () => {
    if (!calendarId) {
      return;
    }

    try {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() + 2);
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 1);

      const eventId = await Calendar.createEventAsync(calendarId, {
        title: 'Reunión de planificación',
        startDate,
        endDate,
        timeZone: undefined,
        notes: 'Ejemplo creado desde la app Mappo.',
        location: 'Oficina principal',
      });

      Alert.alert('Evento creado', 'Se agregó un nuevo evento al calendario.');
      setSelectedEventId(eventId);
      setEditingTitle('Reunión de planificación');
      loadEvents();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo crear el evento.');
    }
  };

  const handleUpdateEvent = async () => {
    if (!selectedEventId || !editingTitle.trim()) {
      Alert.alert('Selecciona un evento', 'Toca un evento y escribe un nuevo título.');
      return;
    }

    try {
      const event = events.find((item) => item.id === selectedEventId);
      if (!event) {
        Alert.alert('Evento no encontrado', 'Actualiza la lista y vuelve a intentarlo.');
        return;
      }

      const updatedEndDate = new Date(event.endDate);
      updatedEndDate.setMinutes(updatedEndDate.getMinutes() + 30);

      await Calendar.updateEventAsync(selectedEventId, {
        title: editingTitle.trim(),
        notes: `${event.notes ?? ''}\nActualizado desde la app.`.trim(),
        endDate: updatedEndDate,
      });

      Alert.alert('Evento actualizado', 'Los cambios se guardaron correctamente.');
      loadEvents();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No pudimos actualizar el evento.');
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEventId) {
      Alert.alert('Selecciona un evento', 'Elige un evento para eliminar.');
      return;
    }

    try {
      await Calendar.deleteEventAsync(selectedEventId);
      Alert.alert('Evento eliminado', 'Se eliminó el evento seleccionado.');
      setSelectedEventId(null);
      setEditingTitle('');
      loadEvents();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No pudimos eliminar el evento.');
    }
  };

  const renderEvent = useCallback(
    ({ item }) => {
      const isSelected = item.id === selectedEventId;
      const start = new Date(item.startDate);
      const end = new Date(item.endDate);

      return (
        <Pressable
          onPress={() => {
            setSelectedEventId(item.id);
            setEditingTitle(item.title);
          }}
          style={[styles.eventCard, isSelected && styles.eventCardSelected]}
        >
          <Text style={styles.eventTitle}>{item.title || 'Sin título'}</Text>
          <Text style={styles.eventTime}>
            {start.toLocaleString()} - {end.toLocaleTimeString()}
          </Text>
          {item.location ? <Text style={styles.eventLocation}>{item.location}</Text> : null}
        </Pressable>
      );
    },
    [selectedEventId]
  );

  const headerDescription = useMemo(() => {
    if (permissionStatus === 'granted' && calendarId) {
      return 'Consulta, crea, edita y elimina eventos directamente en tu calendario local.';
    }
    if (permissionStatus === 'granted') {
      return 'Selecciona un calendario disponible para comenzar a trabajar con eventos.';
    }
    return 'Necesitamos permiso para acceder al calendario del dispositivo.';
  }, [calendarId, permissionStatus]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestor de calendario</Text>
      <Text style={styles.description}>{headerDescription}</Text>

      <View style={styles.actions}>
        <FeatureActionButton label="Recargar" onPress={() => loadEvents()} color="#38bdf8" />
        <FeatureActionButton label="Crear evento" onPress={handleCreateEvent} color="#22c55e" />
        <FeatureActionButton label="Actualizar evento" onPress={handleUpdateEvent} color="#facc15" />
        <FeatureActionButton label="Eliminar" onPress={handleDeleteEvent} color="#f87171" />
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Título para actualizar</Text>
        <TextInput
          value={editingTitle}
          onChangeText={setEditingTitle}
          placeholder="Nuevo título"
          placeholderTextColor="#64748b"
          style={styles.input}
        />
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        refreshing={loading}
        onRefresh={() => loadEvents()}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No hay eventos disponibles en este rango de fechas.</Text>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  title: {
    color: '#e2e8f0',
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    color: '#cbd5f5',
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  inputWrapper: {
    gap: 8,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#111827',
    color: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  listContent: {
    paddingBottom: 24,
    gap: 12,
  },
  eventCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  eventCardSelected: {
    borderColor: '#38bdf8',
  },
  eventTitle: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '600',
  },
  eventTime: {
    color: '#cbd5f5',
    marginTop: 6,
  },
  eventLocation: {
    color: '#94a3b8',
    marginTop: 4,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 20,
  },
});

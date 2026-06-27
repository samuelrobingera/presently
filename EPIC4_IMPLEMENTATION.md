# Epic 4 Implementation Guide: Tabular Live Cockpit & Cascading Scheduler

## Overview

This document provides a comprehensive guide to the implementation of **Epic 4: Tabular Live Cockpit & Cascading Scheduler** for the Presently application. This epic transforms Presently into a professional multi-room event management platform with real-time monitoring and intelligent schedule management.

---

## Requirements Delivered

### R4.1 - Tabular Room Dashboard ✅
**Requirement**: Provide event admins with a centralized, tabular overview of all rooms, displaying active speakers, current phases, and color-coded telemetry statuses.

**Implementation**:
- Created `RoomDashboard` component with grid-based room overview
- Real-time status indicators for each room (Available, Active, Delayed)
- Live event displays showing current speaker and phase
- Color-coded visual signaling matching the timer phase matrix
- Capacity and event count metrics per room
- Click-through navigation to detailed room timelines

### R4.2 - Drag-and-Drop Event Reordering ✅
**Requirement**: Allow admins to interactively reorder planned timeline events directly within the dashboard using standard drag-and-drop gestures.

**Implementation**:
- Implemented native HTML5 drag-and-drop API in `EventTimeline` component
- Visual feedback during drag operations (opacity, scale, highlighting)
- Automatic time recalculation for reordered events
- Batch Firebase writes for atomic schedule updates
- Instant local state updates with backend sync

### R4.3 - Cascading Schedule Adjustments ✅
**Requirement**: If an event runs overtime, the system must automatically adjust the scheduled start and end times for all subsequent events in that room by the corresponding delay duration.

**Implementation**:
- Created `eventScheduler` service with `applyCascadingDelay()` method
- Automatic detection of subsequent events after overtime event
- Batch updates to maintain data consistency
- Visual indicators for delayed events (amber badges, warning banners)
- Admin notifications showing affected event count
- Preserved event duration while shifting start/end times

---

## Architecture

### Component Hierarchy

```
OrgDashboard
└── RoomDashboard (Epic 4 Entry Point)
    ├── Room Grid View (Overview)
    │   ├── Room Cards
    │   │   ├── Status Indicators
    │   │   ├── Current Event Display
    │   │   └── Next Event Preview
    │   └── Live Sync Status Badge
    │
    └── EventTimeline (Detail View)
        ├── Draggable Event Cards
        │   ├── Drag Handle
        │   ├── Event Info
        │   ├── Time Details
        │   ├── Action Buttons
        │   └── Delay Warnings
        └── Status Legend
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      RoomDashboard                          │
│  • Loads all rooms via roomService                          │
│  • Fetches events via eventScheduler                        │
│  • Subscribes to real-time updates                          │
└────────────┬────────────────────────────────────────────────┘
             │
             ├── Room Overview Mode
             │   • Grid of room cards
             │   • Current/next event summaries
             │   • Click to drill down
             │
             └── Timeline Detail Mode (EventTimeline)
                 │
                 ├── Drag-and-Drop Operations
                 │   1. User drags event
                 │   2. Local reorder (instant UI update)
                 │   3. eventScheduler.reorderEvents()
                 │   4. Batch write to Firestore
                 │
                 └── Overtime Handling
                     1. Admin marks event complete with overtime
                     2. eventScheduler.completeEvent()
                     3. eventScheduler.applyCascadingDelay()
                     4. Batch update all subsequent events
                     5. UI shows notification + refreshes
```

### Firebase Data Model

#### Events Collection (`/events/{eventId}`)

```javascript
{
  id: "event_abc123",
  roomId: "room1",
  title: "Keynote: Future of AI",
  speaker: "Dr. Jane Smith",
  
  // Scheduling
  scheduledStartTime: Timestamp,
  scheduledEndTime: Timestamp,
  orderIndex: 0,
  
  // Actual timing
  actualStartTime: Timestamp | null,
  actualEndTime: Timestamp | null,
  
  // Status tracking
  status: "scheduled" | "active" | "delayed" | "completed-ontime" | "completed-overtime",
  delayMinutes: 0,
  overtimeMinutes: 0,
  
  // Phase configuration
  phaseConfig: {
    preparationTime: 5,
    presentationTime: 20,
    qaTime: 5
  },
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Event Status States

| Status | Description | Color |
|--------|-------------|-------|
| `scheduled` | Event is scheduled but not yet started | Blue |
| `active` | Event is currently in progress | Green |
| `delayed` | Event has been pushed back due to cascading delay | Amber |
| `completed-ontime` | Event finished within scheduled time | Gray |
| `completed-overtime` | Event ran over allocated time | Red |

---

## File Structure

### New Files Created

```
src/
├── services/
│   └── eventScheduler.js          # Core scheduling logic & cascade engine
│
└── components/
    └── cockpit/
        ├── RoomDashboard.jsx       # Multi-room overview grid
        └── EventTimeline.jsx       # Drag-and-drop timeline interface
```

### Modified Files

```
src/
└── components/
    └── org/
        └── OrgDashboard.jsx        # Added "Live Cockpit" tab
```

---

## Key Features

### 1. Real-Time Room Monitoring

**RoomDashboard Grid View**:
- Live status for each room (Available, Active, Delayed)
- Current event display with speaker name and phase
- Next event preview for planning
- Event count and capacity metrics
- Visual status badges (Green=Active, Amber=Delayed, Gray=Available)

**Implementation**:
```javascript
// Subscribe to real-time updates
useEffect(() => {
  const unsubscribers = rooms.map(room =>
    eventScheduler.subscribeToRoomEvents(room.id, (events) => {
      setEventsMap(prev => ({ ...prev, [room.id]: events }));
    })
  );
  return () => unsubscribers.forEach(unsub => unsub());
}, [rooms]);
```

### 2. Drag-and-Drop Event Reordering

**EventTimeline Component**:
- Native HTML5 drag-and-drop
- Visual feedback: opacity, scale, border highlight
- Grip handle icon for intuitive interaction
- Automatic time recalculation after reorder
- Optimistic UI updates with backend sync

**Implementation**:
```javascript
const handleDrop = async (e, dropIndex) => {
  // Reorder local array
  const newEvents = [...events];
  const [draggedEvent] = newEvents.splice(draggedItem, 1);
  newEvents.splice(dropIndex, 0, draggedEvent);
  setEvents(newEvents); // Instant UI update

  // Sync to backend
  await eventScheduler.reorderEvents(room.id, newEvents, isDemo);
};
```

### 3. Cascading Schedule Adjustments

**Automatic Delay Propagation**:
- When an event runs overtime, all subsequent events are delayed
- Preserves event duration while shifting times
- Batch Firestore writes for atomic updates
- Visual indicators on affected events
- Admin notifications with affected event count

**Implementation**:
```javascript
applyCascadingDelay: async (roomId, eventId, delayMinutes) => {
  const events = await getEventsByRoom(roomId);
  const delayedIndex = events.findIndex(e => e.id === eventId);
  const subsequentEvents = events.slice(delayedIndex + 1);

  const batch = writeBatch(db);
  const delayMs = delayMinutes * 60 * 1000;

  subsequentEvents.forEach(event => {
    const newStart = new Date(event.scheduledStartTime.getTime() + delayMs);
    const newEnd = new Date(event.scheduledEndTime.getTime() + delayMs);
    
    batch.update(doc(db, 'events', event.id), {
      scheduledStartTime: Timestamp.fromDate(newStart),
      scheduledEndTime: Timestamp.fromDate(newEnd),
      delayMinutes: (event.delayMinutes || 0) + delayMinutes,
      status: 'delayed'
    });
  });

  await batch.commit();
  return { success: true, affectedCount: subsequentEvents.length };
}
```

### 4. Event Lifecycle Management

**Event Actions**:
- **Start Event**: Marks event as active, records actual start time
- **Complete On Time**: Marks event complete with no cascading effect
- **Complete with Overtime**: Triggers cascading delay for subsequent events
- **Drag to Reorder**: Automatically recalculates all times

**Status Workflow**:
```
scheduled → active → completed-ontime
                  → completed-overtime → [triggers cascade]
                  
delayed (cascading from earlier overtime)
```

---

## API Reference

### EventScheduler Service

#### `getEventsByRoom(roomId, isDemo)`
Fetches all events for a specific room, sorted by scheduled start time.

**Returns**: `Promise<Array<Event>>`

#### `getAllEvents(roomIds, isDemo)`
Fetches events for multiple rooms.

**Returns**: `Promise<Object>` - Map of `{ roomId: events[] }`

#### `subscribeToRoomEvents(roomId, callback)`
Real-time subscription to event updates.

**Returns**: `Function` - Unsubscribe function

#### `createEvent(eventData, isDemo)`
Creates a new scheduled event.

**Returns**: `Promise<Event>`

#### `reorderEvents(roomId, reorderedEvents, isDemo)`
Updates event order and recalculates times.

**Returns**: `Promise<void>`

#### `applyCascadingDelay(roomId, eventId, delayMinutes, isDemo)`
Applies overtime delay to all subsequent events.

**Returns**: `Promise<{ success, affectedCount, delayMinutes }>`

#### `startEvent(eventId, isDemo)`
Marks event as active.

**Returns**: `Promise<void>`

#### `completeEvent(eventId, overtimeMinutes, isDemo)`
Completes event and triggers cascade if overtime occurred.

**Returns**: `Promise<{ success, overtimeMinutes, cascade }>`

#### `updateEvent(eventId, updates, isDemo)`
Updates event fields.

**Returns**: `Promise<void>`

#### `deleteEvent(eventId, isDemo)`
Deletes an event.

**Returns**: `Promise<void>`

---

## UI/UX Design Patterns

### Color System

**Status Colors**:
- 🟢 **Green** (`bg-green-50`, `border-green-500`): Active events
- 🔵 **Blue** (`bg-blue-50`, `border-blue-400`): Scheduled events
- 🟡 **Amber** (`bg-amber-50`, `border-amber-500`): Delayed events
- ⚫ **Slate** (`bg-slate-50`, `border-slate-300`): Completed events
- 🔴 **Red** (`bg-red-50`, `border-red-400`): Overtime events

**Phase Colors** (Timer Context):
- **Preparation**: Blue (`bg-blue-500`)
- **Presentation**: Green (`bg-green-500`)
- **Q&A**: Purple (`bg-purple-500`)
- **Overtime**: Red (`bg-red-600`)

### Visual Hierarchy

1. **Room Cards**: Bold title, capacity metrics, current event highlight
2. **Event Cards**: Drag handle, status badge, time grid, action buttons
3. **Notifications**: Toast messages with icons (success, warning, error)
4. **Delay Warnings**: Amber alert boxes on delayed events

### Responsive Design

- **Desktop**: Full grid layout with 3-column time display
- **Tablet**: Stacked cards with preserved functionality
- **Mobile**: Single-column view, simplified metrics

---

## Testing Guide

### Manual Testing Scenarios

#### Scenario 1: Room Overview
1. Navigate to Admin Terminal → Live Cockpit
2. Verify all rooms display with correct status
3. Check current event shows speaker name and phase
4. Verify next event preview appears when available
5. Confirm click-through to timeline detail

#### Scenario 2: Drag-and-Drop Reordering
1. Select a room with multiple events
2. Drag an event to a new position
3. Verify visual feedback (opacity, highlight)
4. Confirm times recalculate automatically
5. Check "Saving..." indicator appears
6. Verify persistence across page refresh

#### Scenario 3: Cascading Delay
1. Start the first event in a room
2. Complete it with +5 minutes overtime
3. Verify notification shows affected events count
4. Confirm all subsequent events show amber "Delayed" badge
5. Check each delayed event has +5 minutes added to times
6. Verify delay warning banner appears on events

#### Scenario 4: Real-Time Sync
1. Open Live Cockpit in two browser windows
2. Start an event in window 1
3. Verify window 2 updates immediately
4. Complete event with overtime in window 1
5. Confirm cascade updates in window 2 in real-time

#### Scenario 5: Event Lifecycle
1. Create a scheduled event
2. Click "Start Event" → verify status = active
3. Click "Complete On Time" → verify status = completed-ontime
4. Create another event
5. Click "Start Event" then "+10 Min Overtime"
6. Verify subsequent events delayed by 10 minutes

### Demo Mode Testing

Demo mode generates 5 sample events per room for testing without Firebase:

```javascript
// Enable demo mode
const { isDemo } = useAuth(); // true when not logged in
```

**Demo Events**:
- Event 0: Active (Keynote)
- Events 1-4: Scheduled (Workshop, Panel, Q&A, Networking)
- 45-minute spacing
- 30-minute durations

---

## Performance Considerations

### Optimization Strategies

1. **Batch Writes**: All cascading updates use Firestore `writeBatch()` for atomic operations
2. **Optimistic UI**: Local state updates before backend confirmation
3. **Selective Subscriptions**: Only subscribe to visible room events
4. **Lazy Loading**: Timeline detail only loads on room selection
5. **Debounced Drag**: Drag state updates throttled for smooth performance

### Firestore Query Limits

- `getEventsByRoom()`: Single room query (no limit)
- `getAllEvents()`: Iterates rooms individually (avoids 10-item `in` limit)
- Real-time listeners: One per room (unsubscribed on unmount)

### Scalability Notes

- **10-30 rooms**: Excellent performance, real-time updates
- **30-50 rooms**: Consider pagination or virtualization
- **50+ rooms**: Implement lazy loading and windowing

---

## Security Considerations

### Firestore Security Rules

```javascript
// events collection rules
match /events/{eventId} {
  // Read: Authenticated users in the same org
  allow read: if request.auth != null && 
    resource.data.orgId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.orgId;
  
  // Write: Admins and owners only
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'owner'];
}
```

### Data Validation

- Event times validated on creation (end > start)
- Room existence checked before event creation
- Status transitions validated (can't go from completed → active)
- Batch operations wrapped in try-catch with rollback

---

## Integration with Existing Features

### Timer Context Integration

The cockpit can monitor live timer states by subscribing to room status:

```javascript
// Future enhancement: Link events to active timer sessions
const currentSession = await timerService.getActiveSession(roomId);
if (currentSession) {
  // Display live timer phase in event card
  event.livePhase = currentSession.phase;
  event.liveTimeRemaining = currentSession.timeRemaining;
}
```

### Offline Support (Epic 3)

Events are cached in IndexedDB for offline viewing:

```javascript
// In eventScheduler.js
await offlineStorage.saveEvents(roomId, events);
```

When offline:
- View cached events (read-only)
- Queue drag operations for sync on reconnection
- Show offline indicator in cockpit header

---

## Known Limitations

1. **Firestore `in` Query Limit**: Can only fetch 10 rooms at once with `in` operator. Solution: iterate rooms individually.
2. **Real-Time Listener Count**: Each room requires one listener. For 50+ rooms, consider pagination.
3. **Drag-and-Drop on Mobile**: Works but requires long-press. Consider adding touch-specific gestures.
4. **Timezone Handling**: All times stored in UTC, displayed in browser local time. Future: add org-level timezone setting.

---

## Troubleshooting

### Events Not Displaying

**Check**:
1. Firestore security rules allow read access
2. Events have `status` in `['scheduled', 'active', 'delayed']`
3. Room ID matches exactly (case-sensitive)
4. User authenticated and in same org

**Debug**:
```javascript
console.log('Events:', await eventScheduler.getEventsByRoom('room1', false));
```

### Drag-and-Drop Not Working

**Check**:
1. `draggable` attribute set on event cards
2. Browser supports HTML5 drag-and-drop (all modern browsers)
3. No CSS `pointer-events: none` blocking interaction

**Debug**:
```javascript
// Add to EventTimeline
console.log('Drag started:', draggedItem);
console.log('Drop target:', dropIndex);
```

### Cascading Delay Not Applying

**Check**:
1. User has write permissions (admin/owner role)
2. Subsequent events exist after the overtime event
3. Firestore batch write succeeded

**Debug**:
```javascript
const result = await eventScheduler.applyCascadingDelay('room1', 'event1', 5, false);
console.log('Cascade result:', result); // { success, affectedCount }
```

### Real-Time Updates Not Syncing

**Check**:
1. Firebase RTDB or Firestore real-time enabled
2. Network connectivity (check offline indicator)
3. Subscription not unsubscribed prematurely

**Debug**:
```javascript
const unsub = eventScheduler.subscribeToRoomEvents('room1', (events) => {
  console.log('Real-time update:', events);
});
// Don't forget to unsub on unmount
```

---

## Future Enhancements

### Phase 1: Advanced Scheduling
- **Conflict Detection**: Warn when events overlap
- **Resource Assignment**: Assign AV equipment, staff to events
- **Recurring Events**: Weekly/monthly event templates
- **Bulk Import**: CSV upload for conference schedules

### Phase 2: Analytics Integration
- **Overtime Trends**: Track which events/speakers run overtime
- **Room Utilization**: Heatmaps of busy/idle times
- **Punctuality Scoring**: Speaker performance metrics
- **Delay Impact**: Cascade effect visualization

### Phase 3: Automation
- **Auto-Start Events**: Begin timer when scheduled time arrives
- **Buffer Time**: Automatic padding between events
- **Smart Rebalancing**: Suggest reorder to minimize delays
- **Notification System**: Email/SMS alerts for delays

### Phase 4: Advanced UI
- **Timeline Visualization**: Gantt chart view of room schedules
- **Capacity Planning**: Suggest room assignments based on attendee count
- **Multi-Room Drag**: Move events between rooms
- **Undo/Redo**: History stack for schedule changes

---

## Conclusion

Epic 4 successfully transforms Presently from a single-room timer into a **professional multi-room event management platform**. The Live Cockpit provides event coordinators with unprecedented visibility and control over complex schedules, while the intelligent cascading delay system ensures realistic scheduling in the face of inevitable overruns.

**Key Achievements**:
✅ Real-time multi-room monitoring
✅ Intuitive drag-and-drop scheduling
✅ Intelligent cascading delay system
✅ Professional-grade admin interface
✅ Demo mode for testing without Firebase

**Business Impact**:
- **Hotels & Venues**: Manage multi-track conferences with ease
- **Event Coordinators**: Respond dynamically to schedule changes
- **Presenters**: Clear visibility into when they're actually going on stage
- **Platform Growth**: Enterprise-grade feature parity with competitors

---

## References

- **Requirements Document**: `/presently/Requirements.md` (Epic 4, Lines 136-143)
- **Epic 3 Implementation**: `/presently/EPIC3_IMPLEMENTATION.md` (Offline sync patterns)
- **Firebase Docs**: https://firebase.google.com/docs/firestore
- **HTML5 Drag-and-Drop**: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API

---

**Implementation Date**: June 27, 2026  
**Status**: ✅ **PRODUCTION READY**  
**Test Coverage**: Manual testing complete, automated tests recommended  
**Browser Support**: Chrome, Firefox, Safari, Edge (modern versions)

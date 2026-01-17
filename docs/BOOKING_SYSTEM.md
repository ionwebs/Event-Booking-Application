# Booking System

## Overview
The core functionality of the application, allowing users to schedule events for specific teams.

## Features
- **Calendar View**: Built with `react-big-calendar`, displaying events in Month/Week/Day/Agenda views.
- **List View**: A custom cursor-based paginated list for browsing large datasets efficiently.
- **Conflict Detection**: Prevents double-booking. Checks for overlapping start/end times within the same team before submission.
- **Filtering**:
    - **Team**: Filter by specific team or "All Teams".
    - **Custom Fields**: Client-side filtering for dynamic fields (e.g., Room Number, Requester).

## Key Components
- `BookingCalendar.jsx`: The main container managing view state (Calendar vs List) and data fetching.
- `BookingForm.jsx`: The creation/edit modal. Handles validation and Firestore writes.

## Data Structure
```json
{
  "eventName": "Team Meeting",
  "teamId": "team_123",
  "start": "2023-10-27T10:00:00.000Z",
  "end": "2023-10-27T11:00:00.000Z",
  "createdBy": "user_456",
  "customFields": {
    "room": "Conference A"
  }
}
```

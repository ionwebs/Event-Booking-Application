# Team Management

## Overview
Teams act as the primary resource for bookings. Events are assigned to a Team.

## Access Model
- **Global Visibility**: As of the latest update, **ALL Approved Users** can see and book for **ALL Teams**.
- **Membership**: While users are technically "members" of the team they create, this does not restrict read access for others.

## Features
- **Create Team**: Any approved user can create a new team.
- **Delete Team**: Currently allowed for team owners.
- **Team Selector**: A dropdown component used throughout the app to filter views or assign bookings.

## Firestore Structure
Collection: `teams`
```json
{
  "name": "Marketing",
  "members": ["user_1", "user_2"],
  "createdBy": "user_1",
  "createdAt": "timestamp"
}
```

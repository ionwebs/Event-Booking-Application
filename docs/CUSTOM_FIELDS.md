# Custom Fields

## Overview
Allows admins/users to define additional data points to capture for every booking, such as "Room Number", "Catering Required", etc.

## Setup
- Navigate to **"Manage Fields"** in the sidebar.
- Create fields with types: Text, Number, Select (Dropdown), or Checkbox.
- Toggle **"Show in List"** to make this field visible on the booking cards.

## Implementation
- **Definition**: Stored in `customFields` collection.
- **Values**: Stored inside the `customFields` map on the `booking` document.
- **Filtering**: Currently implemented client-side for flexibility.

## Usage
When creating a booking, these fields appear dynamically below the standard Date/Time inputs.

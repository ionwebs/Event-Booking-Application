# Event Booking Application

A modern, full-stack event management and booking system built with **React**, **Vite**, and **Firebase**.

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🌟 Features

*   **📅 Interactive Calendar**: Drag-and-drop capability, Month/Week/Day views, and glassmorphism UI.
*   **🔔 Real-Time Notifications**: Instant in-app alerts and browser push notifications for booking updates.
*   **👥 Global Team Management**: Create teams and manage bookings across the entire organization.
*   **📝 Custom Fields API**: defining dynamic fields (Text, Number, Dropdown) for booking forms.
*   **🔐 Role-Based Access**: Secure approval system with Admin and User roles.
*   **⚡ Modern UI**: Responsive Glassmorphism design system using pure CSS variables.

## 📚 Documentation

Detailed documentation for each module can be found in the `docs/` folder:

- [🔐 Authentication & User Roles](docs/AUTHENTICATION.md)
- [📅 Booking System & Calendar](docs/BOOKING_SYSTEM.md)
- [👥 Team Management](docs/TEAM_MANAGEMENT.md)
- [🔔 Push Notifications](docs/NOTIFICATIONS.md)
- [📝 Custom Fields](docs/CUSTOM_FIELDS.md)

## 🌍 Real-World Scenarios

This system is designed to be adaptable for various industries. Here is how it's being used today:

### 🏢 Corporate & Coworking
**Problem**: "Who is currently in Conference Room B?"
**Solution**: Employees can view the calendar, see that "Marketing" has the room until 2 PM, and book their slot for 2:30 PM instantly. Custom fields capture "Projector Needed" or "Catering" requests.

### 🏥 Healthcare & Clinics
**Problem**: Managing shared specialized equipment (e.g., MRI machines, Dental Chairs).
**Solution**: Teams are set up as departments (Radiology, Orthopedics). Doctors view the "MRI 1" schedule and book time slots without conflict, ensuring patient flow is seamless.

### 🎓 Education & Universities
**Problem**: Students booking lab time or counselor appointments.
**Solution**: Professors set up "Office Hours" as a team. Students login, see available slots, and book their sessions. Push notifications remind them 10 minutes before their slot starts.

---

## 💼 Professional Setup Services

**Need help deploying this for your organization?**
We offer professional installation and configuration services to get this system protecting your resources in days, not months.

*   **Cloud Deployment**: Secure setup on your Firebase environment.
*   **Configuration**: Proper setup of teams, users, and security rules.
*   **Training**: Walkthrough for your admin team.


[**Contact Us for Setup**](mailto:contact@ionwebs.com)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- A Firebase Project (Free Tier is fine)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/booking-app.git
    cd booking-app
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Copy the example environment file and fill in your Firebase credentials:
    ```bash
    # Create a new .env file
    cp .env.example .env
    ```
    > **Note:** See `docs/AUTHENTICATION.md` for details on obtaining Firebase keys.

4.  **Database Rules**
    Deploy the security rules found in `firestore.rules` to your Firebase Console > Firestore > Rules.

5.  **Run Locally**
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:5173`.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Standard CSS (Glassmorphism), CSS Variables
- **Database**: Firebase Firestore (NoSQL)
- **Auth**: Firebase Authentication
- **Calendar**: `react-big-calendar`, `date-fns`
- **Pickers**: `react-datepicker`

## 🤝 Contributing

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

# Event Booking Application

A modern, full-stack event management and booking system built with **React**, **Vite**, and **Firebase**.

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🌟 Features

*   **📅 Interactive Calendar**: Drag-and-drop capability, Month/Week/Day views, and glassmorphism UI.
*   **🔔 Real-Time Notifications**: Instant in-app alerts and browser push notifications for booking updates.
*   **📦 Event Archiving**: Keep your calendar clean by archiving past events, with a dedicated view to access history.
*   **📊 Enhanced Dashboard**: Quick access to recent bookings with detailed views and upcoming event stats.
*   **👥 Global Team Management**: Create teams and manage bookings across the entire organization.
*   **📝 Custom Fields API**: defining dynamic fields (Text, Number, Dropdown) for booking forms.
*   **⚠️ Visual Conflict Resolver**: Proactively detects overlaps and shows detailed conflict schedules directly in the form.
*   **✅ Smart Confirmation**: Beautiful, non-intrusive modal dialogs for critical actions like overriding conflicts.
*   **🔐 Role-Based Access**: Secure approval system with Admin and User roles.
*   **⚡ Modern UI**: Responsive Glassmorphism design system using pure CSS variables.
*   **📱 Progressive Web App**: Install on any device - works like a native app, no app store required.

## 📱 Install Like a Native App

**Why download from an app store when you can install directly?**

This is a **Progressive Web App (PWA)**, meaning it works seamlessly across all devices without the friction of traditional app stores.

### ✨ Native App Experience
- **One-Tap Install**: Add to home screen on iOS, Android, or Desktop
- **Offline Ready**: Access your bookings even without internet
- **Push Notifications**: Real-time alerts on iOS 16.4+ and all Android devices
- **Fast & Lightweight**: No 50MB download - instant access
- **Auto-Updates**: Always get the latest features without manual updates

### 🚀 Cross-Platform Perfection
| Platform | Installation | Notifications | Offline Mode |
|----------|-------------|---------------|--------------|
| **Android** | ✅ Chrome, Edge, Firefox | ✅ Full Support | ✅ Yes |
| **iOS 16.4+** | ✅ Safari, Chrome | ✅ Full Support | ✅ Yes |
| **Desktop** | ✅ Chrome, Edge | ✅ Full Support | ✅ Yes |

**No App Store. No Waiting. Just Install.**

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


[**Contact Us for Setup**](#-contact)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- A Firebase Project (Free Tier is fine)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/ionwebs/Event-Booking-Application.git
    cd Event-Booking-Application
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
    Access the app at `http://localhost:3000`.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Standard CSS (Glassmorphism), CSS Variables
- **Database**: Firebase Firestore (NoSQL)
- **Auth**: Firebase Authentication
- **Calendar**: `react-big-calendar`, `date-fns`
- **Pickers**: `react-datepicker`
- **PWA**: `vite-plugin-pwa` (Service Worker, Offline Support)

## 🤝 Contributing

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📧 Contact

Have questions? Reach out to us directly:

*   **Email**: [contact@ionwebs.com](mailto:contact@ionwebs.com)
*   **Project Link**: [https://github.com/ionwebs/Event-Booking-Application](https://github.com/ionwebs/Event-Booking-Application)

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

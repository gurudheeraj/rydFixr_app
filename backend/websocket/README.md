# 🔌 WebSockets Module – RydFixr

The **WebSockets** module enables **real-time communication** between customers and Fixperts in the RydFixr platform. It ensures instant updates for service requests, booking statuses, and location sharing — creating a smooth, responsive experience for both parties without requiring constant page reloads.

---

## 🚀 Overview

RydFixr uses WebSockets to provide **bi-directional, event-driven communication** between the frontend and backend. When a customer books a Fixpert, the request is broadcast instantly to all Fixperts within a defined radius (e.g., 10 km). Likewise, when a Fixpert accepts or declines a booking, the customer receives live status updates immediately.

This module powers:
- Live customer request notifications to Fixperts.
- Real-time status updates (Accepted / Declined / Completed).
- Instant booking confirmations.
- Active user tracking and online/offline status.
- Future support for live chat and service progress tracking.

---

## 🧩 Key Features

- ⚡ **Real-Time Data Updates** – No need for manual refreshes.
- 🔁 **Two-Way Communication** between customers and Fixperts.
- 📍 **Location Broadcasting** for dynamic map updates.
- 💬 **Event-Based Architecture** for smooth integration with existing backend APIs.
- 🧠 **Scalable Design** – Easily extendable to future chat, notifications, or tracking features.

---

## 🛠️ Tech Stack

- **Node.js**
- **Socket.io** (WebSocket library)
- **Express.js**
- **MongoDB** (for storing booking and user details)

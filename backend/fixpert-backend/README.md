# 🧰 Fixpert Backend – RydFixr

The **Fixpert Backend** module handles all server-side operations related to bike mechanics (**Fixperts**) in the RydFixr platform. It manages Fixpert registration, OTP verification, credential generation, authentication, and service request management. This backend ensures secure and real-time interaction between Fixperts and customers.

---

## 🚀 Overview

The Fixpert backend provides APIs and real-time communication support that allow mechanics (Fixperts) to:

- Register with essential details and verify using OTP sent via email.
- Receive unique Fixpert ID and password upon successful verification.
- Log in securely with credentials.
- Access live customer repair requests within a 10 km radius.
- Accept or decline service requests dynamically.
- Update booking status, manage schedules, and track earnings.

It integrates with the **customersdb** and **websocket module** to facilitate real-time updates for new repair requests and service confirmations.

---

## 🧩 Key Features

- 🔐 **Secure OTP Verification** and email-based credential sharing.  
- 🧭 **Dynamic Request Handling** – Fetches real-time customer requests.  
- 💬 **Real-Time Communication** through WebSockets (Socket.io).  
- 💰 **Earnings and Schedule Management** APIs.  
- 🧠 **MongoDB Integration** for scalable data storage.  
- 📡 **Modular Architecture** with controllers, routes, and models.

---

## 🛠️ Tech Stack

- **Node.js**, **Express.js**
- **MongoDB** (Fixpert-related collections)
- **Mongoose**
- **Socket.io**
- **Nodemailer**
- **JWT** for authentication
- **Bcrypt.js** for password encryption
---

# ⚙️ RydFixr Backend

The **RydFixr Backend** powers all the core functionalities of the RydFixr platform — handling authentication, OTP verification, customer and Fixpert management, booking coordination, and real-time communication through WebSockets. It connects the frontend portals with the MongoDB database, enabling a seamless bike repair experience for both customers and Fixperts.

---

## 🚀 Overview

This backend is built using **Node.js** and **Express.js**, designed for scalability, modularity, and security.  
It manages:

- Customer and Fixpert registration, login, and OTP verification  
- Email-based credential sharing for Fixperts  
- Booking logic and live request broadcasting  
- Real-time communication (via WebSockets)  
- Secure storage and data validation in MongoDB  

---

## 🧩 Key Features

- 🔐 **Secure Authentication** using JWT and Bcrypt  
- ✉️ **Email & OTP Verification** with Nodemailer  
- 🧭 **Live Booking Updates** using WebSockets (Socket.io)  
- 🧠 **Modular Architecture** – Separate controllers, routes, and models  
- 🧾 **MongoDB Integration** with dynamic schema handling  
- 📡 **API Endpoints** for both Customer and Fixpert portals  

---

## 🛠️ Tech Stack

- **Node.js** – Runtime environment  
- **Express.js** – Web framework  
- **MongoDB (rydfixrdb)** – Database  
- **Mongoose** – ODM for MongoDB  
- **Nodemailer** – Email sending  
- **Socket.io** – WebSockets for real-time events  
- **Bcrypt.js** – Password hashing  
- **JWT** – Authentication tokens  

---

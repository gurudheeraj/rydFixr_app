# 👤 Customer Backend – RydFixr

The **Customer Backend** module in the RydFixr application manages all operations related to customers — from registration and OTP verification to login, booking requests, and service history management.  
It powers the **Customer Portal** and ensures secure communication between customers, Fixperts, and the database.

---

## 🚀 Overview

The RydFixr Customer Backend is built using **Node.js**, **Express**, and **MongoDB (Mongoose)**.  
It provides RESTful APIs that allow customers to register, authenticate, book Fixperts, and track their service requests.  
This module also integrates with **email-based OTP verification** and ensures real-time updates via WebSockets.

---

## 🧩 Key Features

- 🧾 **Customer Registration & OTP Verification** – Handles new user sign-up with OTP sent to email.  
- 🔐 **Secure Login System** – Authenticates users using JWT tokens.  
- 🧭 **Booking Requests** – Allows customers to send repair requests to nearby Fixperts.  
- 📍 **Location Tracking** – Stores and shares customer location for service dispatch.  
- 🗂️ **Service History** – Tracks past and active service bookings.  
- ⚡ **WebSocket Integration** – Enables real-time updates and Fixpert responses.  

---

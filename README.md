# 🎓 Campus Vault
> **Centralised Digital Platform for Secure and Collaborative Academic Resource Sharing**

[![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=nodedotjs)](https://nodejs.org/)
[![Firebase](https://img.shields.io/badge/Auth-Firebase-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)](https://supabase.com/)

---

## 📌 Project Overview

**Campus Vault** is a centralized, web-based platform designed to simplify academic resource management across higher education institutions. It replaces fragmented sharing methods (like instant messaging apps and emails) with a secure, organized ecosystem. 

Students and faculty can easily upload, store, and access verified educational materials—including lecture notes, lab manuals, presentations, and previous exam question papers—categorized by department, course, subject, and semester.

---

## ✨ Key Features

* 🔐 **Secure Authentication & Role-Based Access Control (RBAC):** Firebase Authentication with separate permission tiers for Students, Faculty, and Administrators to maintain content integrity.
* 📁 **Structured Resource Categorization:** Seamlessly filter materials by branch, year, subject, and resource type.
* 🔍 **Smart Search & AI/ML Recommendations:** Intelligent query matching and AI-assisted recommendations to quickly surface relevant study materials.
* 💬 **Live Community Channels:** Real-time subject discussion spaces powered by Supabase for collaborative learning.
* 🛠️ **Faculty Verification:** Dedicated approval workflow enabling faculty to verify and guarantee content quality.
* 👁️ **In-App Document Previews:** View materials directly within the platform prior to downloading.

---

## 🛠️ Tech Stack

### **Frontend**
* **Framework:** React.js
* **Styling:** CSS3 / Modern Responsive Design

### **Backend & Storage**
* **Runtime:** Node.js
* **Database & Storage:** Supabase (File Storage & Realtime Channels)
* **Authentication:** Firebase Auth (Google Sign-In & Email/Password)

---

## 🏗️ System Architecture

```text
[ Users (Guests / Members / Faculty) ]
                  │
                  ▼
   [ Authentication & Security Module ]  ───► (Firebase Auth)
                  │
                  ▼
   [ Application Server & Dashboard UI ] ───► (React.js + Node.js)
                  │
                  ▼
   [ Data & Content Engine ] ────────────► (Supabase Storage & Live Channels)

🚀 Getting Started
Prerequisites
Node.js installed

Firebase Project credentials

Supabase Account & Database setup

Installation
Clone the repository

Bash
git clone [https://github.com/your-username/campus-vault.git](https://github.com/your-username/campus-vault.git)
cd campus-vault
Install Frontend Dependencies

Bash
cd client
npm install
Install Backend Dependencies

Bash
cd ../server
npm install
Environment Configuration

Create a .env file in both client and server root directories and add your Firebase and Supabase keys:

Code snippet
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
Run the Application

Bash
# Start backend
npm run dev

# Start frontend (in a separate terminal)
cd client
npm start
👥 Authors & Acknowledgments
Authors:

Sriramoju Vyshnavi

Kuppa Srikari

Akkinapalli Rusheeka

Department of Information Technology, Gokaraju Rangaraju Institute of Engineering and Technology (GRIET), Hyderabad, India.

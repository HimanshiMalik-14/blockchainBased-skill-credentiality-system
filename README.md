# 🚀 Blockchain-Based Skill Credentialing System

A backend-driven **Blockchain-based certificate verification system** built using Node.js, MongoDB, and Web3 technologies to ensure **secure, tamper-proof, and verifiable digital credentials**.

---

## 📌 Overview

This project addresses major issues in traditional certificate systems such as:
- ❌ Fake and forged certificates  
- ❌ Time-consuming manual verification  
- ❌ Lack of trust and transparency  

By leveraging **blockchain technology**, this system provides:
- 🔐 Immutable certificate records  
- ⚡ Instant verification  
- 📜 Secure and reliable credential storage  

---

## 🎯 Objective

- Eliminate fraudulent certificates  
- Enable quick and reliable verification  
- Ensure data integrity using blockchain  
- Provide a scalable backend system for credential management  

---

## 🏗️ Project Structure
/backend
├── package.json → Project dependencies
├── .env → Environment configuration
├── node_modules → Installed dependencies (ignored in GitHub)
└── (backend source code files)

## ⚙️ Tech Stack

### 🖥️ Backend
- Node.js  
- Express.js  

### 🗄️ Database
- MongoDB  

### ⛓️ Blockchain
- Ethereum / Polygon  
- Web3.js / Ethers.js  

### 🛠️ Tools
- Nodemon  
- Git & GitHub  

---

## 🔐 Features

- 📜 Certificate generation and storage  
- 🔍 Certificate verification system  
- ⛓️ Blockchain-based hash storage  
- 🔐 Secure environment configuration  
- 📡 REST API backend  

---

## 🔄 Workflow

1. Certificate data is created  
2. A unique hash is generated  
3. Hash is stored on blockchain  
4. Certificate data is stored in MongoDB  
5. During verification:
   - Input data is hashed again  
   - Compared with blockchain hash  
6. Result is returned (Valid / Invalid)  

---

## 🚀 Getting Started

### 1️⃣ Clone Repository

git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name/backend
2️⃣ Install Dependencies
npm install
3️⃣ Setup Environment Variables
Create a .env file inside /backend:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
BLOCKCHAIN_RPC=your_blockchain_rpc_url
PRIVATE_KEY=your_wallet_private_key
4️⃣ Run the Server
npm start
OR (for development):

npx nodemon
📡 API Overview
Method	Endpoint	Description
POST	/certificate	Create certificate
GET	/verify/:id	Verify certificate
GET	/certificate/:id	Fetch certificate details

### 📊 Key Highlights
🔐 Blockchain ensures immutability

⚡ Fast and reliable verification

📦 MongoDB provides scalable storage

🔒 Environment variables secure sensitive data

### 👩‍💻 Author
Himanshi Malik
Backend + Blockchain Developer

🚀 Future Enhancements
Frontend integration (React)

QR code-based verification

Admin dashboard

Multi-chain support

AI-based fraud detection

📄 License
This project is developed for educational purposes.

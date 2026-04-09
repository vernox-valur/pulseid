# PulseID MVP - Emergency Medical ID System

PulseID is a frontend-only web application designed for emergency medical data access. It allows users to create a medical profile, generate a unique Health ID (PID) and QR code, and simulate an emergency scan that provides instant access to critical health information for first responders.

## 🚀 Key Features
- **Landing Page:** Professional medical-style landing page with hero, problem/solution, and how-it-works sections.
- **User Profile System:** Create and edit medical profiles (Name, Blood Group, Allergies, Conditions, Medications, Emergency Contact).
- **Unique Health ID:** Automatic generation of a unique PID (e.g., PID-XXXXXX).
- **QR Code Generation:** Dynamic QR code generation linked to the user's PID.
- **Emergency Scan Simulation:** A "Simulate Emergency Scan" feature that demonstrates the "Provider View" used by first responders.
- **Provider View:** A clean, high-contrast UI designed for rapid reading of critical info (Allergies and Blood Group highlighted).
- **Security & Access:** Simulated "Allow Emergency Access" toggle and mock access logs.
- **Plan/Tier UI:** Demonstration of Free and Premium plan options.

## 🛠 Tech Stack
- **HTML5 / CSS3 / JavaScript (ES6+)**
- **Tailwind CSS** (via CDN) for styling
- **Font Awesome** (via CDN) for icons
- **QRCode.js** (via CDN) for QR generation
- **localStorage** for data persistence (no backend required)

## 📂 Deployment Instructions

### Option 1: Local Execution
1. Download the files: `index.html`, `style.css`, and `script.js`.
2. Open `index.html` in any modern web browser.

### Option 2: GitHub Pages (Recommended)
1. Create a new repository on GitHub.
2. Upload the three files (`index.html`, `style.css`, `script.js`) to the repository.
3. Go to **Settings > Pages**.
4. Select the `main` branch as the source and click **Save**.
5. Your PulseID MVP will be live at `https://<your-username>.github.io/<repo-name>/`.

## 🛡 Security Note
This is an MVP prototype. In a production environment, medical data should be encrypted and stored in a HIPAA-compliant backend. This version uses `localStorage` for demonstration purposes only.

---
Built with PulseID - Every second matters. Every record counts.

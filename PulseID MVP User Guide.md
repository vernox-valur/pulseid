# PulseID MVP User Guide

## 1. Introduction

Welcome to the **PulseID Minimum Viable Product (MVP) User Guide**. PulseID is a frontend-only web application designed to demonstrate a critical concept: **instant access to vital medical information during emergencies**. This MVP showcases how a user's medical data can be stored, linked to a unique ID, and accessed via a simulated scan, all without a backend system.

> **Core Idea:** Every second matters in an emergency. PulseID aims to provide first responders with immediate access to critical patient information when the patient cannot communicate, potentially saving lives by preventing medical errors due to lack of information.

## 2. Getting Started

The PulseID MVP is a static web application, meaning it runs entirely in your browser. There are two primary ways to access it:

*   **Local Execution:** Simply open the `index.html` file in any modern web browser.
*   **GitHub Pages:** If deployed on GitHub Pages, navigate to the provided URL (e.g., `https://<your-username>.github.io/<repo-name>/`).

## 3. User Profile System

The heart of PulseID is your medical profile. This section explains how to manage your personal health data.

### 3.1. Creating Your Profile

Upon first accessing the application (or if no profile is saved), you will be presented with a **"Create Your Medical Profile"** form. Fill in the following details:

| Field | Description |
| :--- | :--- |
| **Full Name** | Your full name. |
| **Blood Group** | Select your blood type from the dropdown. |
| **Allergies (Critical)** | List any known allergies (e.g., Penicillin, Peanuts). This information is highlighted in the Provider View. |
| **Medical Conditions** | List any significant medical conditions (e.g., Asthma, Diabetes). |
| **Current Medications** | List any medications you are currently taking. |
| **Emergency Contact** | Provide the name and phone number of your emergency contact (e.g., Jane Doe: +1 234 567 890). |

After filling out the form, click the **"Save & Generate PulseID"** button. Your data will be securely stored in your browser's `localStorage`.

### 3.2. Editing Your Profile

Once a profile is created, you will see your dashboard. To edit your profile, click the **edit icon** (a small pencil) next to your name. A confirmation prompt will appear. Confirming will clear the current profile and allow you to re-enter your details. Your PID will remain the same.

## 4. Unique Health ID (PID)

Upon saving your profile, PulseID automatically generates a **Unique Health ID** in the format `PID-XXXXXX` (e.g., `PID-RY2YT5`). This ID is displayed prominently on your dashboard and is linked to your stored medical data. It serves as the primary identifier for quick access to your profile.

## 5. QR Code

Your dashboard features a dynamically generated **QR Code** that encodes your unique PulseID. This QR code is crucial for the emergency access simulation.

*   **Purpose:** In a real-world scenario, this QR code would be placed on a physical item (e.g., wallet card, medical bracelet). First responders could scan it to instantly access your critical information.
*   **"Copy Scan URL" Feature:** For demonstration purposes, a **"Copy Scan URL"** link is provided below the QR code. Clicking this will copy a direct URL (e.g., `https://<your-app-url>/?id=PID-XXXXXX`) to your clipboard. This URL, when opened in a browser, will immediately display the Provider View for your profile.

## 6. Simulate Emergency Scan (Core Feature)

To experience the core functionality of PulseID, click the prominent **"Simulate Emergency Scan"** button on your dashboard (or click the QR code itself). This action will transition you to the **Provider View**.

## 7. Provider View

The Provider View is designed for first responders and medical personnel. It prioritizes clarity, speed, and critical information.

*   **Minimal UI & Fast Loading:** The interface is clean, high-contrast, and loads instantly, ensuring that vital information is immediately available.
*   **Critical Information FIRST:** The top section prominently displays **Allergies** (highlighted in red for immediate attention), **Blood Group**, and your **Patient ID (PID)**.
*   **Secondary Information:** Below the critical section, you'll find **Medical Conditions** and **Current Medications**.
*   **Emergency Contact:** A dedicated section for your emergency contact, including a simulated call button.
*   **Full Profile (Expand):** A collapsible section allows access to your full patient profile details.
*   **No Login Required:** This view is accessible without any login, simulating emergency access.
*   **Access via URL:** As mentioned in the QR Code section, this view can also be directly accessed using a URL with your PID as a parameter (e.g., `?id=PID-XXXXXX`).

To exit the Provider View, click the **"CLOSE"** button in the top right corner.

## 8. Access Control (Simulated)

On your dashboard, under "Security & Access," you'll find an **"Allow Emergency Access"** toggle.

*   **If ON (default):** The Provider View will display your full medical information.
*   **If OFF:** If you disable this toggle and then attempt to simulate a scan, the Provider View will display an **"Access Restricted"** message, indicating that the user has chosen to restrict access to their profile.

## 9. Access Log (Mock)

Below the access control toggle, a **"Access Log (Mock)"** section provides a simulated history of profile access. This is a UI-only feature and does not track real access events.

## 10. Plan / Tier UI

The dashboard also includes a simulated **Plan / Tier UI** showcasing two options:

| Plan | Features |
| :--- | :--- |
| **Free** | Basic profile, emergency access, and QR code generation. |
| **Premium** | (Simulated) Family profiles, alerts, and extra features. |

Click the **"Upgrade to Premium"** (or "Manage Subscription") button to toggle between these plans. This is a UI demonstration only; no actual payment or feature changes occur.

## 11. Technical Details

The PulseID MVP is built using pure HTML, CSS (with Tailwind CSS for utility-first styling), and JavaScript. All user data is stored locally in your browser's `localStorage`, meaning it persists across sessions but is not sent to any server. The QR code generation uses the `qrcode.js` library.

## 12. Conclusion

This PulseID MVP effectively demonstrates the core concept of an emergency medical ID system. It highlights the potential for rapid, secure access to critical health data, which can be invaluable in life-threatening situations. While a prototype, it provides a clear vision of how such a system could function in a real-world scenario.

---
**Author:** Manus AI
**Date:** April 9, 2026
**Version:** 1.0 (MVP)

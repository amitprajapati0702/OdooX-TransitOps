


🚛** TransitOps**
Smart Transport Operations Platform

A modern fleet management and transport operations platform built for the Odoo Hackathon to digitize vehicle operations, dispatch management, driver management, maintenance tracking, fuel monitoring, and operational analytics.

**Team Members**
👨‍💻 Amit Prajapati

Role: Full Stack Developer (Authentication, JWT, API Development, Database Design,Frontend)

GitHub: https://github.com/amitprajapati0702


**Project Overview**

TransitOps is a centralized fleet management platform designed to help logistics companies replace spreadsheets and manual workflows with a secure, scalable, and intelligent transport management system.

The platform enables organizations to efficiently manage the complete lifecycle of transportation operations—from vehicle registration and driver management to dispatch planning, maintenance scheduling, expense tracking, and business analytics.

Built during the Odoo Hackathon, the application demonstrates enterprise-level software architecture, secure authentication, business rule enforcement, and real-time operational insights.




**Business Problem
**
Many transportation companies still rely on spreadsheets and manual processes to manage daily fleet operations.

This often leads to:

Vehicle scheduling conflicts
Driver allocation issues
Missed maintenance
License expiration
Poor expense tracking
Lack of operational visibility
Manual reporting

TransitOps solves these challenges by providing a centralized, role-based web application that automates transport operations and improves fleet utilization.


**Key Features**

1) Authentication
- JWT Authentication
- Refresh Token
- Role-Based Access Control (RBAC)
- Password Hashing using bcrypt
- Secure API Authorization

2) Fleet Management
- Register Vehicles
- Vehicle Status Management
- Vehicle Availability Tracking
- Vehicle Capacity Validation
- Vehicle Maintenance Status

3) Driver Management
- Driver Registration
- License Verification
- License Expiry Tracking
- Driver Availability
- Driver Safety Information

4) Trip Management
- Create Trips
- Assign Driver
- Assign Vehicle
- Cargo Validation
- Automatic Status Updates
- Trip Lifecycle Management

5) Maintenance Management
- Maintenance Records
- Automatic Vehicle Status Updates
- Maintenance History

6) Expense Management
- Fuel Logs
- Maintenance Cost
- Operational Expenses
- Cost Analytics

7) Dashboard
- Active Vehicles
- Vehicles on Trip
- Vehicles in Maintenance
- Fleet Utilization
- Active Drivers
- Pending Trips
- Operational KPIs

8) Analytics
- Fuel Efficiency
- Vehicle ROI
- Fleet Utilization
- Operational Cost Reports
  
   
**Tech Stack**
 1) Frontend
- React.js
- React Router
- Tailwind CSS
- JavaScript
- Axios / Fetch API

2) ⚙️ Backend
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- bcrypt
- Cookie Parser
- CORS
- dotenv

3) Database
- PostgreSQL

4) Tools
- Git
- GitHub
- Postman
- pgAdmin
- VS Code



**System Architecture**
Frontend (React)

        │

 REST API

        │

Backend (Express)

        │

Business Logic

        │

Repository Layer

        │

PostgreSQL


**User Roles**

1)Fleet Manager
- Manage Vehicles
- Maintenance
- Fleet Status

2) Driver
- View Assigned Trips
- Trip Updates

3) Safety Officer
- Driver License Monitoring
- Compliance Checks

4) Financial Analyst
- Fuel Reports
- Expense Reports
- ROI Analytics

---

 **Business Rules**

- Vehicle Registration Number must be unique.
- Drivers with expired licenses cannot be assigned.
- Cargo weight cannot exceed vehicle capacity.
- Vehicles under maintenance cannot be dispatched.
- Vehicle and Driver statuses update automatically during the trip lifecycle.
- Completing a trip restores vehicle and driver availability.
- Maintenance automatically marks a vehicle as **In Shop**.


**Authentication Flow**
Login

↓

Validate Credentials

↓

Generate Access Token

↓

Generate Refresh Token

↓

Store Refresh Token

↓

Access Protected APIs



**Folder Structure**
TransitOps

├── Backend
│   ├── src
│   │   ├── config
│   │   ├── middleware
│   │   ├── modules
│   │   ├── routes
│   │   ├── services
│   │   ├── repository
│   │   └── utils
│
├── Frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── routes
│   │   ├── context
│   │   └── assets
│
└── README.md



**Installation**
git clone https://github.com/amitprajapati0702/OdooX-TransitOps.git

cd OdooX-TransitOps

cd Backend

npm install

npm run dev

cd Frontend

npm install

npm run dev



**Environment Variables**
PORT=

DATABASE_URL=

JWT_ACCESS_SECRET=

JWT_REFRESH_SECRET=

EMAIL_USER=

EMAIL_PASS=


**Screenshots**

- **Login Page:** [View Screenshot](https://drive.google.com/file/d/1LBpgi-0W3uM16A-LY1_rK9KUcuniQwp4/view?usp=drive_link)
- **Maintenance Page:** [View Screenshot](https://drive.google.com/file/d/1FNLhVHtRPd6fP1yGdYHmWR_hzqlH5pI3/view?usp=drive_link)
- **Trips Page:** [View Screenshot](https://drive.google.com/file/d/1SlHYFOCkolbjKduxirMO2EUNMrQqsd-V/view?usp=drive_link)
- **Analytics Page:** [View Screenshot](https://drive.google.com/file/d/114OXvzUSptARZHAha12Y3k-pYzDMK5bP/view?usp=drive_link)
- **Fuel & Expenses Page:** [View Screenshot](https://drive.google.com/file/d/1y2lSHHIMOulls85uYvBrsigFbRMg__3L/view?usp=drive_link)
- **Document Page:** [View Screenshot](https://drive.google.com/file/d/1vJQXCJ1fEBL_2enJ90q6hgzEB_FBVhOZ/view?usp=drive_link)
- **Drivers Page:** [View Screenshot](https://drive.google.com/file/d/1vD35MPk9HfE9upEwxgw_QP15TBGswzF1/view?usp=drive_link)
- **Dashboard Page:** [View Screenshot](https://drive.google.com/file/d/1SNqvLCSsJWrj-lQr9D0Zq3Hs5TVWeZ3-/view?usp=drive_link)
- **Fleet Page:** [View Screenshot](https://drive.google.com/file/d/12Qo9zKCz9IqWljSg4suM-TqCjU3LnMwZ/view?usp=drive_link)

**Future Enhancements**

-Live GPS Tracking
-Google Maps Integration
-Email Notifications
-SMS Alerts
-Predictive Maintenance using AI
-Mobile Application
-PDF Reports
-Multi-Organization Support
-Docker Deployment
-CI/CD Pipeline

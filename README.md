# J and J Kitchen - Restaurant Ordering Website

A modern, full-stack restaurant ordering website built with React and Firebase, featuring real-time order management, secure payment processing, and SMS notifications.

## Live Website
**Visit:** https://j-and-j-f8f66.web.app

## Features

### Customer Experience
- **Browse Menu** - View all available items with descriptions and prices
- **Interactive Ordering** - Add items to cart with customizations
- **Secure Payments** - Process payments through Square (production)
- **Order Confirmation** - Instant confirmation with payment details

### Admin Management
- **Secure Login** - Protected admin panel with Firebase Authentication
- **Real-time Orders** - View incoming orders instantly
- **Order Status** - Mark orders as ready
- **SMS Notifications** - Send prep time updates to customers via Twilio
- **Menu Control** - Pause orders and mark items unavailable

## Technology Stack

### Frontend
- **React 19** - Modern UI framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Firebase SDK** - Real-time database and authentication

### Backend
- **Firebase Functions** - Serverless backend (Node.js)
- **Firestore** - NoSQL database with real-time updates
- **Firebase Hosting** - Static site hosting with global CDN
- **Firebase Authentication** - Secure user management

### Payment & Communication
- **Square API** - Production payment processing
- **Twilio API** - SMS notifications to customers
- **Firebase Secret Manager** - Secure credential storage

### Security
- **Protected Routes** - Admin panel requires authentication
- **Firestore Security Rules** - Database access control
- **Environment Variables** - No hardcoded credentials
- **HTTPS Everywhere** - End-to-end encryption

## Architecture

```
Frontend (React)          Backend (Firebase)
├── Public Pages          ├── Cloud Functions
│   ├── Homepage          │   ├── chargeCard (Square)
│   ├── Menu              │   └── sendPrepTimeText (Twilio)
│   └── Ordering          ├── Firestore Database
├── Admin Panel           │   ├── orders collection
│   ├── Login             │   └── admin/settings
│   ├── Order Management  ├── Authentication
│   └── SMS Control       └── Security Rules
```

## User Flow

### Customer Journey
1. Visit website → Browse menu
2. Add items to cart → Enter details
3. Secure checkout → Square payment
4. Order confirmation → SMS updates

### Admin Workflow
1. Login to admin panel
2. View real-time orders
3. Set preparation times
4. Send SMS notifications
5. Mark orders complete

## Local Development

### Prerequisites
- Node.js 18+
- Firebase CLI
- Git

### Setup
```bash
# Clone repository
git clone https://github.com/MatthewBarghout/J-and-J-Kitchen-and-Uhaul-Website.git
cd J-and-J-Kitchen-and-Uhaul-Website

# Install dependencies
npm install
cd functions && npm install && cd ..

# Create environment file
cp .env.example .env
# Add your Firebase config to .env

# Start development server
npm start
```

### Firebase Setup
```bash
# Login to Firebase
firebase login

# Initialize project
firebase use j-and-j-f8f66

# Start local emulators (optional)
firebase emulators:start
```

## Deployment

The website automatically deploys when changes are pushed to the main branch via GitHub Actions.

### Manual Deployment
```bash
# Build and deploy everything
npm run build
firebase deploy

# Deploy only specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

## Environment Variables

### Required Secrets (Firebase Secret Manager)
- `SQUARE_ACCESS_TOKEN` - Square production API key
- `TWILIO_ACCOUNT_SID` - Twilio account identifier  
- `TWILIO_AUTH_TOKEN` - Twilio authentication token
- `TWILIO_PHONE_NUMBER` - Twilio phone number for SMS

### Frontend Environment (.env)
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── AdminPanel.js      # Order management
│   │   ├── Homepage.js        # Landing page
│   │   ├── MenuPage.js        # Menu display
│   │   ├── OrderForm.js       # Cart and checkout
│   │   ├── SquareCheckout.js  # Payment processing
│   │   ├── Login.js           # Admin authentication
│   │   └── AuthContext.js     # Authentication state
│   ├── firebase.js            # Firebase configuration
│   └── menuData.js           # Restaurant menu items
├── functions/
│   ├── index.js              # Cloud Functions
│   └── package.json          # Function dependencies
├── public/                   # Static assets
├── firestore.rules          # Database security
└── firebase.json            # Firebase configuration
```

## Key Features Explained

### Real-time Order Management
Orders appear instantly in the admin panel using Firestore real-time listeners. No page refresh needed.

### Secure Payment Processing
Square's production API handles all payment processing with PCI compliance and fraud protection.

### SMS Notifications
Twilio integration sends customers updates about their order preparation time.

### Responsive Design
Works perfectly on desktop, tablet, and mobile devices with Tailwind CSS.

### Admin Authentication
Firebase Authentication secures the admin panel with email/password login.

## Performance

- **Lighthouse Score:** 95+ performance
- **Global CDN:** Firebase Hosting worldwide
- **Serverless Functions:** Auto-scaling backend
- **Real-time Updates:** Instant order notifications
- **Optimized Build:** Code splitting and minification

## Security Features

- HTTPS everywhere with Firebase hosting
- Firestore security rules prevent unauthorized access
- Admin panel requires authentication
- API credentials stored in Firebase Secret Manager
- No sensitive data in source code
- Protected routes and private functions

## License

Private project - All rights reserved

## Support

For technical support or questions about this restaurant ordering system, please contact the development team.

---

**Built for J and J Kitchen**
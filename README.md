# JorhatX - OLX-like App

A React Native application built with Expo and Appwrite backend, featuring user authentication, role-based access control (User/Admin), and a complete admin dashboard.

## Features

### Authentication System
- ✅ User Registration with email verification
- ✅ User Login with session management
- ✅ Password reset functionality
- ✅ Role-based navigation (User/Admin)
- ✅ User ban system for admins

### User Dashboard
- ✅ Welcome section with user info
- ✅ Quick actions (My Listings, Browse Categories, Profile)
- ✅ User statistics (Active Listings, Messages, Favorites)
- ✅ Account management (Profile, Security, Help & Support)
- ✅ Logout functionality

### Admin Dashboard
- ✅ Admin-specific welcome section
- ✅ User Management (View, ban, delete users)
- ✅ Content Moderation (Review and manage listings)
- ✅ Category Management (Add, edit, delete categories)
- ✅ Analytics (Platform statistics and insights)
- ✅ Reports management (View user reports)
- ✅ System administration tools

## Tech Stack

### Frontend
- **React Native** with **Expo**
- **React Navigation** (Stack and Drawer navigation)
- **React Native Paper** (UI components)
- **React Hook Form** + **Yup** (Form validation)
- **Async Storage** (Local data storage)

### Backend
- **Appwrite Cloud** (Backend as a Service)
- **Database**: Appwrite Database with custom collections
- **Authentication**: Appwrite Email/Password auth
- **Storage**: Appwrite Storage (for future file uploads)

## Project Structure

```
jorhatx-app/
├── src/
│   ├── components/          # Reusable components
│   ├── screens/            # Screen components
│   │   ├── auth/           # Authentication screens
│   │   ├── user/           # User dashboard screens
│   │   └── admin/          # Admin dashboard screens
│   ├── navigation/         # Navigation configuration
│   ├── services/           # API services and utilities
│   │   ├── appwrite.js     # Appwrite client configuration
│   │   └── auth.js         # Authentication service
│   ├── utils/              # Utility functions
│   ├── hooks/              # Custom hooks
│   └── constants/          # App constants
├── App.js                  # Main app component
└── package.json            # Project dependencies
```

## Appwrite Configuration

### Database Collections
1. **Users Collection** (`users`)
   - `role`: String (default: "user")
   - `banned`: Boolean (default: false)
   - `$createdAt`, `$updatedAt`: Auto-generated

2. **Categories Collection** (`categories`)
   - `name`: String (required)
   - `description`: String (optional)
   - `$createdAt`, `$updatedAt`: Auto-generated

### Appwrite Setup
1. Create database: `jorhatx_database`
2. Create collections: `users`, `categories`
3. Enable Email Password authentication
4. Configure email verification
5. Set up permissions for role-based access

### Appwrite Configuration Values
```javascript
const APPWRITE_CONFIG = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  projectId: '699e968e00249d5c12a3',
  databaseId: '699e9bed001dc2b93814',
  usersCollectionId: '699e9d2800183d9bf985',
  apiKey: 'standard_2a47dc708d1e5515942cbd935c008a352ae6799b96c00675e4035412174f7919d004ae5eecd9a228c5af69c43ea0ddc1553b907e005b7dc970487966953d2c5a9eb362e9570e8699912cf9c5db9e8f4f48be8d3364cdb51bed737e66189585e763ea1bb2c548b7e736c62b6def93e42d61fd8973247e1058eb37f23644925852',
};
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI installed globally
- Appwrite Cloud account

### Setup Instructions

1. **Clone the project**
   ```bash
   git clone <repository-url>
   cd jorhatx-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Appwrite**
   - Update the Appwrite configuration in `src/services/appwrite.js`
   - Set up your Appwrite Cloud project
   - Create the required database and collections
   - Enable authentication settings

4. **Run the app**
   ```bash
   npm start
   # or
   expo start
   ```

## Usage

### User Registration
1. Open the app
2. Navigate to Register screen
3. Fill in name, email, and password
4. Check email for verification link
5. Complete verification to activate account

### User Login
1. Navigate to Login screen
2. Enter registered email and password
3. App automatically detects user role
4. Redirects to appropriate dashboard

### Admin Features
Admin users have access to:
- User Management: View, ban, and delete users
- Content Moderation: Review and manage listings
- Category Management: Add, edit, delete categories
- Analytics: View platform statistics
- Reports: Handle user reports

## Security Features

- **Role-based access control**: Users and admins have different permissions
- **Session management**: Automatic session validation and logout
- **User banning**: Admins can ban problematic users
- **Email verification**: Required for account activation
- **Secure authentication**: Uses Appwrite's secure auth system

## Future Enhancements

- [ ] Product listing creation and management
- [ ] Image upload functionality
- [ ] Messaging system between users
- [ ] Search and filtering for listings
- [ ] Push notifications
- [ ] Social media login integration
- [ ] Advanced analytics and reporting
- [ ] Mobile-responsive web version

## Troubleshooting

### Common Issues

1. **Appwrite Connection Errors**
   - Check Appwrite endpoint URL
   - Verify project ID and API key
   - Ensure Appwrite project is active

2. **Authentication Issues**
   - Verify email verification is enabled
   - Check user collection has proper permissions
   - Ensure role field is set correctly

3. **Navigation Issues**
   - Check navigation dependencies are installed
   - Verify navigation structure in AppNavigator.js

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the Appwrite documentation
- Review React Native and Expo documentation
- Create an issue in the repository
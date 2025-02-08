# Student Management System - Frontend

A modern React-based student management system with analytics, data visualization, and CRUD operations.

## 📁 Project Structure

```
redis-frontend/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── App.js              # Main application component
│   ├── App.css             # Main styles
│   ├── index.js            # Application entry point
│   ├── index.css           # Global styles
│   └── reportWebVitals.js  # Performance monitoring
└── package.json            # Project dependencies and scripts
```

<br>

## 🚀 Features

### 1. Authentication
- Admin login/logout functionality
- Protected routes for admin actions
- Secure token-based authentication

### 2. Student Management
- Create new student records
- View student details in a paginated table
- Update existing student information
- Delete student records
- Bulk delete functionality
- Search functionality across all fields
- Adjustable entries per page

### 3. Data Visualization
- Interactive analytics dashboard
- Year Level Distribution (Bar Chart)
- Course Distribution (Donut Chart)
- Real-time data updates

### 4. Data Import/Export
- CSV file import
- CSV file export
- PDF generation and printing
- Bulk data operations

### 5. User Interface
- Responsive design for all devices
- Modern and clean interface
- Toast notifications for user feedback
- Modal dialogs for forms
- Loading states and error handling

## 🛠️ Technologies Used

- React.js
- Axios for API calls
- Recharts for data visualization
- jsPDF for PDF generation
- React-Toastify for notifications

## 📋 Prerequisites

Before running this project, make sure you have:
- Node.js (v14 or higher)
- npm or yarn package manager
- Redis server running locally
- Backend server running on port 5000

<br>

## 🚀 Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd redis-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a .env file in the root directory:
```env
REACT_APP_API_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| REACT_APP_API_URL | Backend API URL | http://localhost:5000 |

## 🔑 Default Admin Credentials

```
Username: admin
Password: admin123
```

## 📊 Available Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject from Create React App
npm run eject
```

## 🔒 Security Features

- JWT token authentication
- Protected admin routes
- Input validation
- XSS protection
- CORS configuration

## 💡 Usage Tips

1. **Authentication**
   - Login as admin to access all features
   - Session persists through page reloads

2. **Student Management**
   - Use the search bar for quick lookups
   - Adjust entries per page for better navigation
   - Sort columns by clicking headers

3. **Data Import/Export**
   - Use the provided CSV template for imports
   - Export data regularly for backups
   - Print PDF reports as needed

4. **Analytics**
   - Charts update automatically with data changes
   - Hover over charts for detailed information

## 🐛 Troubleshooting

1. If the app fails to connect to the backend:
   - Verify the backend server is running
   - Check the API_URL in environment variables
   - Ensure Redis server is running

2. For login issues:
   - Clear browser cache and cookies
   - Verify admin credentials
   - Check backend logs for auth errors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

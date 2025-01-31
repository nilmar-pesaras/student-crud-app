import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Replace the hardcoded API_URL with environment variable
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function App() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState('10');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    username: '', 
    password: '', 
    confirmPassword: '',
    adminCode: '' 
  });
  const [analytics, setAnalytics] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    firstName: '',
    lastName: '',
    age: '',
    address: '',
    studentId: '',
    course: '',
    yearLevel: '',
    section: '',
    major: ''
  });
  const fileInputRef = useRef(null);

  // Authentication
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/auth/login`, loginData);
      localStorage.setItem('token', response.data.token);
      setIsAuthenticated(true);
      setIsAdmin(true); // Since we only allow admin login
      setShowLoginModal(false);
      setLoginData({ username: '', password: '' });
      toast.success('Logged in successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid credentials!');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        style: {
          background: '#e74c3c',
          color: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }
      });
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/register-admin`, {
        username: registerData.username,
        password: registerData.password,
        adminCode: registerData.adminCode
      });
      
      if (response.data) {
        setShowRegisterModal(false);
        setRegisterData({ 
          username: '', 
          password: '', 
          confirmPassword: '',
          adminCode: '' 
        });
        toast.success('Admin registered successfully! You can now login.', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          style: {
            background: '#2ecc71',
            color: 'white',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please check your details and try again.';
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        style: {
          background: '#e74c3c',
          color: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setIsAdmin(false);
    toast.info('Logged out successfully');
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics/student-stats`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and set admin status
      const verifyToken = async () => {
        try {
          const response = await axios.get(`${API_URL}/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setIsAuthenticated(true);
          setIsAdmin(response.data.role === 'admin');
        } catch (error) {
          // If token is invalid, clear it
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      };
      verifyToken();
    } else {
      setIsAuthenticated(false);
      setIsAdmin(false);
    }
    fetchStudents();
    fetchAnalytics();
  }, []);

  // Fetch students with auth header
  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API_URL}/students`);
      setStudents(response.data);
    } catch (error) {
      toast.error('Error fetching students!');
    }
  };

  // Add auth header to protected requests
  const authAxios = axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Handle form change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Form validation
  const validateForm = () => {
    const errors = [];
    
    if (!formData.firstName.trim()) errors.push('First Name is required');
    if (!formData.lastName.trim()) errors.push('Last Name is required');
    
    const age = parseInt(formData.age);
    if (!age || age < 16 || age > 100) errors.push('Age must be between 16 and 100');
    
    if (!formData.address.trim()) errors.push('Address is required');
    if (!formData.studentId.trim()) errors.push('Student ID is required');
    if (!/^\d+$/.test(formData.studentId)) errors.push('Student ID must contain only numbers');
    
    if (!formData.course.trim()) errors.push('Course is required');
    if (!formData.yearLevel) errors.push('Year Level is required');
    if (!formData.section.trim()) errors.push('Section is required');
    if (!formData.major.trim()) errors.push('Major is required');

    return errors;
  };

  // Modified handleSubmit with validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    try {
      await authAxios.post('/students', formData);
      toast.success('Student added successfully!');
      await fetchStudents();
      await fetchAnalytics();
      setFormData({
        id: '',
        firstName: '',
        lastName: '',
        age: '',
        address: '',
        studentId: '',
        course: '',
        yearLevel: '',
        section: '',
        major: ''
      });
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding student!');
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      toast.error('Admin access required!');
      return;
    }
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await authAxios.delete(`/students/${id}`);
        toast.success('Student deleted successfully!');
        await fetchStudents();
        await fetchAnalytics();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error deleting student!');
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await authAxios.put(`/students/${formData.id}`, formData);
      toast.success('Student updated successfully!');
      await fetchStudents();
      await fetchAnalytics();
      setFormData({ id: '', firstName: '', lastName: '', age: '', address: '', studentId: '', course: '', yearLevel: '', section: '', major: '' });
      setShowModal(false);
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating student!');
    }
  };

  // Filter students based on search
  const filteredStudents = students.filter(student => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      student.firstName?.toLowerCase().includes(searchTermLower) ||
      student.lastName?.toLowerCase().includes(searchTermLower) ||
      student.studentId?.toLowerCase().includes(searchTermLower) ||
      student.course?.toLowerCase().includes(searchTermLower) ||
      student.yearLevel?.toLowerCase().includes(searchTermLower)
    );
  });

  // Handle edit click
  const handleEdit = (student) => {
    if (!isAdmin) {
      toast.error('Admin access required to edit students!');
      return;
    }
    setFormData(student);
    setIsEditing(true);
    setShowModal(true);
  };

  // Export to PDF
  const handlePrintPDF = () => {
    const doc = new jsPDF();
    
    // Add title to the PDF
    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80); // #2c3e50
    doc.setFont("helvetica", "bold");
    doc.text('Student Record Details', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    
    // Create the table
    doc.autoTable({
      startY: 30,
      head: [['S.L', 'First Name', 'Last Name', 'Student Id.', 'Course', 'Year Level']],
      body: filteredStudents.map((student, index) => [
        index + 1,
        student.firstName,
        student.lastName,
        student.studentId,
        student.course,
        student.yearLevel
      ]),
      styles: {
        fontSize: 10,
        cellPadding: 5,
        lineColor: [221, 221, 221], // #ddd
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [52, 73, 94], // #34495e
        textColor: 255,
        fontSize: 11,
        fontStyle: 'bold',
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: [249, 249, 249] // #f9f9f9
      },
      bodyStyles: {
        textColor: 44, // #2c3e50
      },
      margin: { top: 30, left: 10, right: 10 },
      didDrawPage: function (data) {
        // Add page number at the bottom
        doc.setFontSize(10);
        doc.setTextColor(108, 117, 125);
        doc.text(
          'Page ' + doc.internal.getCurrentPageInfo().pageNumber + ' of ' + doc.internal.getNumberOfPages(),
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
        
        // Add timestamp
        const timestamp = new Date().toLocaleString();
        doc.setFontSize(8);
        doc.text(
          `Generated on: ${timestamp}`,
          10,
          doc.internal.pageSize.getHeight() - 10
        );
      },
      columnStyles: {
        0: { cellWidth: 20 }, // S.L
        1: { cellWidth: 35 }, // First Name
        2: { cellWidth: 35 }, // Last Name
        3: { cellWidth: 30 }, // Student Id
        4: { cellWidth: 40 }, // Course
        5: { cellWidth: 30 }  // Year Level
      },
      theme: 'grid'
    });
    
    // Save the PDF
    doc.save('student_records.pdf');
  };

  // Export to CSV
  const exportToCSV = () => {
    // Create CSV headers
    const headers = ['S.L', 'First Name', 'Last Name', 'Student Id.', 'Course', 'Year Level'];
    
    // Convert data to CSV format
    const csvData = filteredStudents.map((student, index) => [
      index + 1,
      student.firstName,
      student.lastName,
      student.studentId,
      student.course,
      student.yearLevel
    ]);
    
    // Combine headers and data
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'student_records.csv';
    link.click();
  };

  // Import from CSV
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        const rows = text.split('\n');
        
        // Skip header row and process data
        const students = rows.slice(1).map(row => {
          const [, firstName, lastName, studentId, course, yearLevel] = row.split(',');
          return { firstName, lastName, studentId, course, yearLevel };
        }).filter(student => student.firstName && student.studentId); // Filter out empty rows

        // Upload each student
        for (const student of students) {
          try {
            await axios.post(API_URL + '/students', {
              ...student,
              id: Date.now().toString() // Generate unique ID
            });
          } catch (error) {
            toast.error(`Error importing student ${student.firstName} ${student.lastName}`);
          }
        }

        toast.success('CSV import completed');
        fetchStudents(); // Refresh the list
        event.target.value = ''; // Reset file input
      };
      reader.readAsText(file);
    } catch (error) {
      toast.error('Error processing CSV file');
    }
  };

  // Add deleteAllStudents function
  const deleteAllStudents = async () => {
    if (!isAdmin) {
      toast.error('Admin access required!', {
        style: {
          background: '#e74c3c',
          color: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }
      });
      return;
    }
    try {
      await authAxios.delete('/students/all');
      toast.success('All student records deleted successfully!', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          background: '#e67e22',
          color: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }
      });
      await fetchStudents();
      await fetchAnalytics();
      setShowDeleteAllModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting all records!', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          background: '#e74c3c',
          color: 'white',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }
      });
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Student Record Details</h1>
        <div className="auth-buttons">
          {isAuthenticated ? (
            <>
              <span className="user-role">Admin</span>
              <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={() => setShowLoginModal(true)}>Login</button>
              <button className="btn btn-secondary" onClick={() => setShowRegisterModal(true)}>Register Admin</button>
            </>
          )}
        </div>
      </div>

      {analytics && (
        <div className="analytics-container">
          <h2>Student Analytics</h2>
          <div className="charts-container">
            <div className="chart">
              <h3>Year Level Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(analytics.yearLevelDistribution).map(([name, value]) => ({ name, value }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart">
              <h3>Course Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(analytics.courseDistribution).map(([name, value]) => ({ name, value }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      
      <div className="actions-row">
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <span className="icon">+</span> Add New Student
          </button>
        )}
        <button className="btn btn-success" onClick={handlePrintPDF}>
          <span className="icon">🖨️</span> Print PDF
        </button>
      </div>

      <div className="filters-row">
        <div className="entries-selector">
          <span>Show</span>
          <select value={entriesPerPage} onChange={(e) => setEntriesPerPage(e.target.value)}>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span>entries</span>
        </div>
        <div className="search-box">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search in all fields..."
          />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>S.L</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Age</th>
              <th>Address</th>
              <th>Student Id.</th>
              <th>Course</th>
              <th>Year Level</th>
              <th>Section</th>
              <th>Major</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents
              .slice(0, parseInt(entriesPerPage))
              .map((student, index) => (
              <tr key={student.id}>
                <td>{index + 1}</td>
                <td>{student.firstName}</td>
                <td>{student.lastName}</td>
                <td>{student.age}</td>
                <td>{student.address}</td>
                <td>{student.studentId}</td>
                <td>{student.course}</td>
                <td>{student.yearLevel}</td>
                <td>{student.section}</td>
                <td>{student.major}</td>
                <td>
                  {isAdmin ? (
                    <button className="btn-icon btn-edit" onClick={() => handleEdit(student)}>✏️</button>
                  ) : (
                    <span title="Admin access required">🔒</span>
                  )}
                </td>
                <td>
                  {isAdmin ? (
                    <button className="btn-icon btn-delete" onClick={() => handleDelete(student.id)}>🗑️</button>
                  ) : (
                    <span title="Admin access required">🔒</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                  No matching records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bottom-actions">
        <button className="btn btn-success" onClick={exportToCSV}>
          <span className="icon">⬇️</span> Export Data
        </button>
        {isAdmin && (
          <>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            <button 
              className="btn btn-success" 
              onClick={() => fileInputRef.current.click()}
            >
              <span className="icon">⬆️</span> Import Data
            </button>
            <button 
              className="btn btn-warning" 
              onClick={() => setShowDeleteAllModal(true)}
            >
              <span className="icon">⚠️</span> Delete All Data
            </button>
          </>
        )}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{isEditing ? 'Edit Student' : 'Add New Student'}</h2>
            <form onSubmit={isEditing ? handleUpdate : handleSubmit}>
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="Enter first name"
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Enter last name"
                />
              </div>
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  min="16"
                  max="100"
                  placeholder="Enter age (16-100)"
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="Enter complete address"
                />
              </div>
              <div className="form-group">
                <label>Student ID</label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  pattern="[0-9]*"
                  title="Please enter numbers only"
                  required
                  placeholder="Enter student ID (numbers only)"
                />
              </div>
              <div className="form-group">
                <label>Course</label>
                <input
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  required
                  placeholder="Enter course"
                />
              </div>
              <div className="form-group">
                <label>Year Level</label>
                <select
                  name="yearLevel"
                  value={formData.yearLevel}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Year Level</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
              <div className="form-group">
                <label>Section</label>
                <input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  required
                  placeholder="Enter section"
                />
              </div>
              <div className="form-group">
                <label>Major</label>
                <input
                  type="text"
                  name="major"
                  value={formData.major}
                  onChange={handleChange}
                  required
                  placeholder="Enter major"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Update' : 'Submit'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowModal(false);
                    setIsEditing(false);
                    setFormData({ 
                      id: '', 
                      firstName: '', 
                      lastName: '', 
                      age: '', 
                      address: '', 
                      studentId: '', 
                      course: '', 
                      yearLevel: '', 
                      section: '', 
                      major: '' 
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Admin Login</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Login</button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowLoginModal(false);
                    setLoginData({ username: '', password: '' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRegisterModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Register Admin Account</h2>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={registerData.username}
                  onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  minLength="6"
                  required
                />
                <small>Password must be at least 6 characters long</small>
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Admin Registration Code</label>
                <input
                  type="password"
                  value={registerData.adminCode}
                  onChange={(e) => setRegisterData({ ...registerData, adminCode: e.target.value })}
                  required
                />
                <small>Contact system administrator for the registration code</small>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Register</button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowRegisterModal(false);
                    setRegisterData({ 
                      username: '', 
                      password: '', 
                      confirmPassword: '',
                      adminCode: '' 
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Warning Modal for Delete All */}
      {showDeleteAllModal && (
        <div className="modal warning-modal">
          <div className="modal-content">
            <div className="warning-icon">⚠️</div>
            <h2>Warning: Delete All Data</h2>
            <p>Are you sure you want to delete all student records? This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="btn btn-danger"
                onClick={deleteAllStudents}
              >
                Yes, Delete All
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteAllModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

export default App;
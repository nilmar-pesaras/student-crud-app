const express = require('express');
const redis = require('redis');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to Redis
const client = redis.createClient({
  url: 'redis://@127.0.0.1:6379'  // Default Redis connection
});

client.connect()
  .then(() => console.log('Connected to Redis'))
  .catch(err => console.error('Redis connection error:', err));

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

// Auth Routes
app.post('/auth/register-admin', async (req, res) => {
  const { username, password, adminCode } = req.body;
  
  // Verify admin registration code
  const ADMIN_REGISTRATION_CODE = 'ADMIN123'; // In production, this should be in environment variables
  if (adminCode !== ADMIN_REGISTRATION_CODE) {
    return res.status(403).json({ message: 'Invalid admin registration code' });
  }
  
  try {
    // Check if user exists
    const existingUser = await client.hGet(`user:${username}`, 'password');
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Save admin user
    await client.hSet(`user:${username}`, 'password', hashedPassword);
    await client.hSet(`user:${username}`, 'role', 'admin');
    await client.hSet(`user:${username}`, 'createdAt', new Date().toISOString());

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering admin' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Get user
    const hashedPassword = await client.hGet(`user:${username}`, 'password');
    const role = await client.hGet(`user:${username}`, 'role');

    if (!hashedPassword || role !== 'admin') {
      return res.status(401).json({ message: 'Invalid credentials or not an admin account' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, hashedPassword);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token with extended expiration for admin
    const token = jwt.sign(
      { username, role, isAdmin: true },
      JWT_SECRET,
      { expiresIn: '7d' } // 7 days expiration for admin
    );

    // Get additional user info
    const createdAt = await client.hGet(`user:${username}`, 'createdAt');

    res.json({
      token,
      user: {
        username,
        role,
        createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

app.get('/auth/verify', authenticateToken, async (req, res) => {
  try {
    // Token is already verified by authenticateToken middleware
    // Just return the user's role
    const role = await client.hGet(`user:${req.user.username}`, 'role');
    res.json({ role });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying token' });
  }
});

// Analytics Routes
app.get('/analytics/student-stats', async (req, res) => {
  try {
    const keys = await client.keys('student:*');
    const students = await Promise.all(keys.map(async (key) => {
      return await client.hGetAll(key);
    }));

    // Calculate statistics
    const yearLevelStats = students.reduce((acc, student) => {
      acc[student.yearLevel] = (acc[student.yearLevel] || 0) + 1;
      return acc;
    }, {});

    const courseStats = students.reduce((acc, student) => {
      acc[student.course] = (acc[student.course] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalStudents: students.length,
      yearLevelDistribution: yearLevelStats,
      courseDistribution: courseStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics' });
  }
});

// CRUD Operations

// Delete all students (Move this route before individual routes)
app.delete('/students/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Get all student keys
    const keys = await client.keys('student:*');
    
    if (keys.length === 0) {
      return res.status(404).json({ message: 'No student records found' });
    }
    
    // Delete all student records
    await Promise.all(keys.map(key => client.del(key)));
    
    res.json({ 
      message: 'All student records deleted successfully',
      deletedCount: keys.length 
    });
  } catch (error) {
    console.error('Error deleting all students:', error);
    res.status(500).json({ message: 'Failed to delete all student records' });
  }
});

// Route to save student data
app.post('/students', authenticateToken, isAdmin, async (req, res) => {
  const { firstName, lastName, age, address, studentId, course, yearLevel, section, major } = req.body;
  const id = Date.now().toString();

  // Validate input fields
  if (!firstName || !lastName || !age || !address || !studentId || !course || !yearLevel || !section || !major) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Validate studentId (numbers only)
  if (!/^\d+$/.test(studentId)) {
    return res.status(400).json({ message: 'Student ID must contain only numbers' });
  }

  // Validate age (must be a number between 16 and 100)
  const ageNum = parseInt(age);
  if (isNaN(ageNum) || ageNum < 16 || ageNum > 100) {
    return res.status(400).json({ message: 'Age must be between 16 and 100' });
  }

  try {
    // Save student data in Redis hash
    await client.hSet(`student:${id}`, 'firstName', firstName);
    await client.hSet(`student:${id}`, 'lastName', lastName);
    await client.hSet(`student:${id}`, 'age', age.toString());
    await client.hSet(`student:${id}`, 'address', address);
    await client.hSet(`student:${id}`, 'studentId', studentId);
    await client.hSet(`student:${id}`, 'course', course);
    await client.hSet(`student:${id}`, 'yearLevel', yearLevel);
    await client.hSet(`student:${id}`, 'section', section);
    await client.hSet(`student:${id}`, 'major', major);

    // Respond with success message and the created student data
    res.status(201).json({ 
      message: 'Student saved successfully',
      student: { id, firstName, lastName, age, address, studentId, course, yearLevel, section, major }
    });
  } catch (error) {
    console.error('Error saving student:', error);
    res.status(500).json({ message: 'Failed to save student' });
  }
});

// Read (R)
app.get('/students/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const student = await client.hGetAll(`student:${id}`);
    if (Object.keys(student).length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ id, ...student });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student' });
  }
});

// Read all students
app.get('/students', async (req, res) => {
  try {
    const keys = await client.keys('student:*');
    const students = await Promise.all(keys.map(async (key) => {
      const id = key.split(':')[1];
      const data = await client.hGetAll(key);
      return { id, ...data };
    }));
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students' });
  }
});

// Update (U)
app.put('/students/:id', authenticateToken, isAdmin, async (req, res) => {
  const id = req.params.id;
  const { firstName, lastName, age, address, studentId, course, yearLevel, section, major } = req.body;

  if (!firstName && !lastName && !age && !address && !studentId && !course && !yearLevel && !section && !major) {
    return res.status(400).json({ message: 'At least one field is required to update' });
  }

  // Validate studentId if provided (numbers only)
  if (studentId && !/^\d+$/.test(studentId)) {
    return res.status(400).json({ message: 'Student ID must contain only numbers' });
  }

  // Validate age if provided
  if (age) {
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 16 || ageNum > 100) {
      return res.status(400).json({ message: 'Age must be between 16 and 100' });
    }
  }

  try {
    const key = `student:${id}`;
    const existingStudent = await client.hGetAll(key);
    
    if (Object.keys(existingStudent).length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update student data in Redis
    if (firstName) await client.hSet(key, 'firstName', firstName);
    if (lastName) await client.hSet(key, 'lastName', lastName);
    if (age) await client.hSet(key, 'age', age.toString());
    if (address) await client.hSet(key, 'address', address);
    if (studentId) await client.hSet(key, 'studentId', studentId);
    if (course) await client.hSet(key, 'course', course);
    if (yearLevel) await client.hSet(key, 'yearLevel', yearLevel);
    if (section) await client.hSet(key, 'section', section);
    if (major) await client.hSet(key, 'major', major);

    const updatedStudent = await client.hGetAll(key);
    res.json({ 
      message: 'Student updated successfully',
      student: { id, ...updatedStudent }
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Failed to update student' });
  }
});

// Delete (D)
app.delete('/students/:id', authenticateToken, isAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const key = `student:${id}`;
    const exists = await client.exists(key);
    
    if (!exists) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    await client.del(key);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Failed to delete student' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import AshaWorkerDashboard from './pages/AshaWorkerDashboard';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import LanguageToggle from './components/LanguageToggle';
import HealthcareSchemes from './components/HealthcareSchemes';
import HealthNews from './components/HealthNews';
import HospitalFinder from './components/HospitalFinder';
import ChatInterface from './components/ChatInterface';
import Navbar from './components/Navbar';
import HotzonesPage from './pages/HotzonesPage';
import FakeRemedyAlert from './components/FakeRemedyAlert';
import LoginModal from './components/LoginModal';
import ProfilePage from './pages/ProfilePage';

const Footer = () => (
  <footer className="bg-gray-900 text-white py-10">
    <div className="container mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <h3 className="text-xl font-bold mb-4 text-blue-300">SwasthAI</h3>
          <p className="text-gray-300 leading-relaxed">Healthcare at your fingertips, powered by artificial intelligence. We're committed to making healthcare accessible to everyone.</p>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-4 text-blue-300">Quick Links</h3>
          <ul className="space-y-3">
            <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link></li>
            <li><Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">Dashboard</Link></li>
            <li><Link to="/booking" className="text-gray-300 hover:text-white transition-colors">Book Consultation</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-4 text-blue-300">Contact</h3>
          <p className="text-gray-300 mb-2">Email: info@swasthai.com</p>
          <p className="text-gray-300 mb-2">Phone: +91 123-456-7890</p>
          <div className="flex space-x-4 mt-4">
            <a href="#" className="text-gray-300 hover:text-white">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="text-gray-300 hover:text-white">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-400">
        <p>© 2023 SwasthAI - All rights reserved</p>
      </div>
    </div>
  </footer>
);

// Pages
// Home Page Component
const Home = () => {
  const { t } = useLanguage();
  const [showSchemes, setShowSchemes] = useState(false);
  const [showNews, setShowNews] = useState(false);
  const [showHospitals, setShowHospitals] = useState(false);

  return (
    <div className="w-full mx-auto px-4">
      {/* Hero Section */}
      <div className="py-4 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-gray-800 mb-2"
        >
          {t('welcome')}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-gray-600 max-w-3xl mx-auto mb-4"
        >
          {t('description')}
        </motion.p>
        
        {/* Quick Access Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-2"
        >
          <button
            onClick={() => setShowSchemes(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            {t('healthcareSchemes')}
          </button>
          <button
            onClick={() => setShowNews(true)}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            {t('healthNews')}
          </button>
          <button
            onClick={() => setShowHospitals(true)}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            {t('nearbyHospitals')}
          </button>
        </motion.div>
      </div>
      
      {/* Chat Interface */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mx-auto my-2"
        style={{ height: 'calc(100vh - 180px)', width: '100%' }}
      >
        <div className="p-4 h-full">
          <ChatInterface />
        </div>
      </motion.div>

      {/* Popup Components */}
      <HealthcareSchemes isOpen={showSchemes} onClose={() => setShowSchemes(false)} />
      <HealthNews isOpen={showNews} onClose={() => setShowNews(false)} />
      <HospitalFinder isOpen={showHospitals} onClose={() => setShowHospitals(false)} />
    </div>
  );
};

// Teleconsult Booking Component
const TeleconsultBooking = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    symptoms: '',
    doctorType: '',
    preferredDate: '',
    preferredTime: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    alert(t('bookingConfirmation'));
  };
  
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 border border-gray-100">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('bookConsultation')}</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 mb-2">{t('fullName')}</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">{t('age')}</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Symptoms</label>
            <textarea
              name="symptoms"
              value={formData.symptoms}
              onChange={handleChange}
              required
              rows="3"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Doctor Type</label>
            <select
              name="doctorType"
              value={formData.doctorType}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Specialist</option>
              <option value="general">General Physician</option>
              <option value="pediatric">Pediatrician</option>
              <option value="gynecologist">Gynecologist</option>
              <option value="dermatologist">Dermatologist</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Preferred Date</label>
            <input
              type="date"
              name="preferredDate"
              value={formData.preferredDate}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Preferred Time</label>
            <select
              name="preferredTime"
              value={formData.preferredTime}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Time</option>
              <option value="morning">Morning (9 AM - 12 PM)</option>
              <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
              <option value="evening">Evening (4 PM - 8 PM)</option>
            </select>
          </div>
        </div>
        
        <div className="mt-8">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Book Consultation
          </button>
        </div>
      </form>
    </div>
  );
};

// Prescription QR Component
const PrescriptionQR = () => {
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Prescription QR Code</h2>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <svg className="w-48 h-48 mx-auto" viewBox="0 0 100 100">
          {/* Simple QR code representation */}
          <rect x="0" y="0" width="100" height="100" fill="white" />
          <rect x="10" y="10" width="80" height="80" fill="black" />
          <rect x="20" y="20" width="60" height="60" fill="white" />
          <rect x="30" y="30" width="40" height="40" fill="black" />
          <rect x="40" y="40" width="20" height="20" fill="white" />
        </svg>
      </div>
      
      <p className="text-gray-600 mb-6">
        Scan this QR code to view your prescription details. You can also show this to your pharmacist to get your medications.
      </p>
      
      <div className="flex justify-center space-x-4">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Download
        </button>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
          Share
        </button>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [online, setOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Prevent automatic scrolling on page load
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            <Navbar online={online} />
            <LoginModal />
            <main className="flex-grow w-full px-0 py-0">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<AshaWorkerDashboard />} />
                <Route path="/booking" element={<TeleconsultBooking />} />
                <Route path="/prescription/:id" element={<PrescriptionQR />} />
                <Route path="/hotzones" element={<HotzonesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            <FakeRemedyAlert />
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

import React, { createContext, useState, useContext, useEffect } from 'react';

// Mock user data
const mockUsers = [
  {
    id: "GRAM-2023-1001",
    username: "rajesh.kumar",
    password: "password123",
    name: "Rajesh Kumar",
    age: 42,
    gender: "Male",
    village: "Chandpur",
    district: "Varanasi",
    state: "Uttar Pradesh",
    ayushmanCard: {
      isActive: true,
      cardNumber: "AYUSH-UP-2022-45678",
      expiryDate: "2025-06-30",
      benefits: [
        "Free consultation at government hospitals",
        "Cashless treatment up to ₹5,00,000",
        "Coverage for pre and post hospitalization expenses",
        "Access to telemedicine services"
      ]
    },
    medicalHistory: [
      {
        date: "2023-03-15",
        diagnosis: "Type 2 Diabetes",
        doctor: "Dr. Sharma",
        hospital: "District Hospital, Varanasi",
        medications: ["Metformin 500mg", "Glimepiride 1mg"],
        followUpDate: "2023-06-15"
      },
      {
        date: "2023-01-10",
        diagnosis: "Hypertension",
        doctor: "Dr. Patel",
        hospital: "Community Health Center, Chandpur",
        medications: ["Amlodipine 5mg"],
        followUpDate: "2023-04-10"
      }
    ],
    vaccinations: [
      {
        name: "COVID-19 Vaccine (Covishield)",
        date: "2022-05-20",
        dose: "2nd Dose",
        center: "PHC Chandpur"
      },
      {
        name: "Influenza Vaccine",
        date: "2022-11-05",
        dose: "Annual",
        center: "District Hospital, Varanasi"
      }
    ],
    prescriptions: [
      {
        id: "PRX-2023-11-25",
        date: "2023-11-25",
        doctor: "Dr. Mehra",
        facility: "AIIMS Outreach Clinic, Varanasi",
        diagnosis: "Seasonal Allergic Rhinitis",
        medications: [
          { name: "Cetirizine", dosage: "10mg", frequency: "Once daily at night", duration: "14 days" },
          { name: "Fluticasone Nasal Spray", dosage: "50mcg", frequency: "2 sprays in each nostril daily", duration: "30 days" },
          { name: "Montelukast", dosage: "10mg", frequency: "Once daily at bedtime", duration: "30 days" }
        ],
        instructions: "Avoid known allergens. Use air purifier if available. Stay hydrated. Return if symptoms worsen or don't improve within 7 days."
      },
      {
        id: "PRX-2023-03-15",
        date: "2023-03-15",
        doctor: "Dr. Sharma",
        facility: "District Hospital, Varanasi",
        diagnosis: "Type 2 Diabetes",
        medications: [
          { name: "Metformin", dosage: "500mg", frequency: "Twice daily", duration: "90 days" },
          { name: "Glimepiride", dosage: "1mg", frequency: "Once daily before breakfast", duration: "90 days" }
        ],
        instructions: "Monitor blood sugar regularly. Follow diabetic diet. Exercise 30 minutes daily."
      },
      {
        id: "PRX-2023-01-10",
        date: "2023-01-10",
        doctor: "Dr. Patel",
        facility: "Community Health Center, Chandpur",
        diagnosis: "Hypertension",
        medications: [
          { name: "Amlodipine", dosage: "5mg", frequency: "Once daily", duration: "30 days" }
        ],
        instructions: "Reduce salt intake. Regular blood pressure monitoring. Follow-up in 3 months."
      }
    ]
  }
];

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Check if user was previously logged in
  useEffect(() => {
    const savedUser = localStorage.getItem('gramcare_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to parse saved user data:", error);
        localStorage.removeItem('gramcare_user');
      }
    }
  }, []);

  const login = (username, password) => {
    // Find user in mock data
    const user = mockUsers.find(
      u => u.username === username && u.password === password
    );

    if (user) {
      // Remove password from stored user data for security
      const { password, ...secureUserData } = user;
      setCurrentUser(secureUserData);
      setIsAuthenticated(true);
      setLoginError('');
      setShowLoginModal(false);
      
      // Save to localStorage for persistence
      localStorage.setItem('gramcare_user', JSON.stringify(secureUserData));
      return true;
    } else {
      setLoginError('Invalid username or password');
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('gramcare_user');
  };

  const toggleLoginModal = () => {
    setShowLoginModal(!showLoginModal);
    if (showLoginModal) {
      setLoginError('');
    }
  };

  const value = {
    currentUser,
    isAuthenticated,
    login,
    logout,
    showLoginModal,
    toggleLoginModal,
    loginError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
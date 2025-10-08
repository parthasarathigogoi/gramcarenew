import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

// Prescription Card Component
const PrescriptionCard = ({ prescription, translations, language }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <motion.div 
      className="bg-white border rounded-lg overflow-hidden shadow-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4 bg-blue-50 border-b flex justify-between items-center">
        <div>
          <div className="text-xs text-gray-500">{translations.prescriptionId[language]}</div>
          <div className="font-medium">{prescription.id}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">{translations.date[language]}</div>
          <div>{prescription.date}</div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-3">
          <div className="text-lg font-medium">{prescription.diagnosis}</div>
          <div className="text-sm text-gray-600">
            {translations.doctor[language]}: {prescription.doctor} | {translations.facility[language]}: {prescription.facility}
          </div>
        </div>
        
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 text-sm font-medium flex items-center"
        >
          {showDetails ? translations.hideDetails[language] : translations.viewDetails[language]}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 ml-1 transition-transform ${showDetails ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showDetails && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            <h4 className="font-medium mb-2">{translations.medications[language]}</h4>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="pb-2">{translations.name[language]}</th>
                    <th className="pb-2">{translations.dosage[language]}</th>
                    <th className="pb-2">{translations.frequency[language]}</th>
                    <th className="pb-2">{translations.duration[language]}</th>
                  </tr>
                </thead>
                <tbody>
                  {prescription.medications.map((med, idx) => (
                    <tr key={idx} className="border-t border-gray-200">
                      <td className="py-2">{med.name}</td>
                      <td className="py-2">{med.dosage}</td>
                      <td className="py-2">{med.frequency}</td>
                      <td className="py-2">{med.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {prescription.instructions && (
              <div>
                <h4 className="font-medium mb-1">{translations.instructions[language]}</h4>
                <p className="text-sm text-gray-700">{prescription.instructions}</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

const ProfilePage = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const { language, t } = useLanguage();

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  const translations = {
    profile: {
      en: 'Profile',
      hi: 'प्रोफ़ाइल'
    },
    userId: {
      en: 'User ID',
      hi: 'उपयोगकर्ता आईडी'
    },
    personalInfo: {
      en: 'Personal Information',
      hi: 'व्यक्तिगत जानकारी'
    },
    name: {
      en: 'Name',
      hi: 'नाम'
    },
    age: {
      en: 'Age',
      hi: 'उम्र'
    },
    gender: {
      en: 'Gender',
      hi: 'लिंग'
    },
    location: {
      en: 'Location',
      hi: 'स्थान'
    },
    ayushmanCard: {
      en: 'Ayushman Card',
      hi: 'आयुष्मान कार्ड'
    },
    cardNumber: {
      en: 'Card Number',
      hi: 'कार्ड नंबर'
    },
    expiryDate: {
      en: 'Expiry Date',
      hi: 'समाप्ति तिथि'
    },
    benefits: {
      en: 'Benefits',
      hi: 'लाभ'
    },
    medicalHistory: {
      en: 'Medical History',
      hi: 'चिकित्सा इतिहास'
    },
    date: {
      en: 'Date',
      hi: 'तारीख'
    },
    diagnosis: {
      en: 'Diagnosis',
      hi: 'निदान'
    },
    doctor: {
      en: 'Doctor',
      hi: 'डॉक्टर'
    },
    hospital: {
      en: 'Hospital',
      hi: 'अस्पताल'
    },
    medications: {
      en: 'Medications',
      hi: 'दवाएँ'
    },
    followUp: {
      en: 'Follow-up Date',
      hi: 'फॉलो-अप तिथि'
    },
    vaccinations: {
      en: 'Vaccinations',
      hi: 'टीकाकरण'
    },
    vaccineName: {
      en: 'Vaccine',
      hi: 'टीका'
    },
    dose: {
      en: 'Dose',
      hi: 'खुराक'
    },
    center: {
      en: 'Center',
      hi: 'केंद्र'
    },
    prescriptions: {
      en: 'Prescriptions',
      hi: 'नुस्खे'
    },
    prescriptionId: {
      en: 'Prescription ID',
      hi: 'नुस्खा आईडी'
    },
    facility: {
      en: 'Facility',
      hi: 'सुविधा'
    },
    dosage: {
      en: 'Dosage',
      hi: 'खुराक'
    },
    frequency: {
      en: 'Frequency',
      hi: 'आवृत्ति'
    },
    duration: {
      en: 'Duration',
      hi: 'अवधि'
    },
    instructions: {
      en: 'Instructions',
      hi: 'निर्देश'
    },
    viewDetails: {
      en: 'View Details',
      hi: 'विवरण देखें'
    },
    hideDetails: {
      en: 'Hide Details',
      hi: 'विवरण छिपाएं'
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6">
            <div className="flex items-center">
              <div className="h-20 w-20 rounded-full bg-white text-blue-600 flex items-center justify-center text-3xl font-bold mr-6">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{currentUser.name}</h1>
                <div className="flex items-center mt-2">
                  <span className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                    {translations.userId[language]}: {currentUser.id}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold mb-4">{translations.personalInfo[language]}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">{translations.name[language]}</p>
                <p className="font-medium">{currentUser.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{translations.age[language]}</p>
                <p className="font-medium">{currentUser.age} {language === 'en' ? 'years' : 'वर्ष'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{translations.gender[language]}</p>
                <p className="font-medium">{currentUser.gender}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{translations.location[language]}</p>
                <p className="font-medium">{currentUser.village}, {currentUser.district}, {currentUser.state}</p>
              </div>
            </div>
          </div>

          {/* Ayushman Card */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold mb-4">{translations.ayushmanCard[language]}</h2>
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-6 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs uppercase tracking-wide opacity-75 mb-1">{translations.cardNumber[language]}</div>
                  <div className="font-mono text-lg font-medium">{currentUser.ayushmanCard.cardNumber}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wide opacity-75 mb-1">{translations.expiryDate[language]}</div>
                  <div>{currentUser.ayushmanCard.expiryDate}</div>
                </div>
              </div>
              <div className="mt-8">
                <div className="text-2xl font-bold">{currentUser.name}</div>
                <div className="text-sm mt-1 opacity-75">{currentUser.village}, {currentUser.district}</div>
              </div>
              <div className="mt-6 flex justify-between items-center">
                <div className="text-xs uppercase tracking-wide opacity-75">Ayushman Bharat</div>
                <div className="text-sm font-medium">
                  {currentUser.ayushmanCard.isActive ? 
                    (language === 'en' ? 'Active' : 'सक्रिय') : 
                    (language === 'en' ? 'Inactive' : 'निष्क्रिय')}
                </div>
              </div>
            </div>
            
            <h3 className="font-medium mb-2">{translations.benefits[language]}</h3>
            <ul className="list-disc pl-5 space-y-1">
              {currentUser.ayushmanCard.benefits.map((benefit, index) => (
                <li key={index} className="text-gray-700">{benefit}</li>
              ))}
            </ul>
          </div>

          {/* Prescriptions Section */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold mb-4">{translations.prescriptions[language]}</h2>
            {currentUser.prescriptions && currentUser.prescriptions.length > 0 ? (
              <div className="space-y-4">
                {currentUser.prescriptions.map((prescription, index) => (
                  <PrescriptionCard 
                    key={index} 
                    prescription={prescription} 
                    translations={translations}
                    language={language}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                {language === 'en' ? 'No prescriptions available' : 'कोई नुस्खे उपलब्ध नहीं हैं'}
              </p>
            )}
          </div>

          {/* Medical History */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold mb-4">{translations.medicalHistory[language]}</h2>
            <div className="space-y-6">
              {currentUser.medicalHistory.map((record, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-lg">{record.diagnosis}</h3>
                    <span className="text-sm text-gray-500">{record.date}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">{translations.doctor[language]}:</span> {record.doctor}
                    </div>
                    <div>
                      <span className="text-gray-500">{translations.hospital[language]}:</span> {record.hospital}
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-gray-500">{translations.medications[language]}:</span> {record.medications.join(', ')}
                    </div>
                    <div>
                      <span className="text-gray-500">{translations.followUp[language]}:</span> {record.followUpDate}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vaccinations */}
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">{translations.vaccinations[language]}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {translations.vaccineName[language]}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {translations.date[language]}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {translations.dose[language]}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {translations.center[language]}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentUser.vaccinations.map((vaccine, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {vaccine.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vaccine.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vaccine.dose}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vaccine.center}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
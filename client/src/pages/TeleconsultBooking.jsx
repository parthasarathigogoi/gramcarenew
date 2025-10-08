import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { saveBookingToIndexedDB } from '../utils/indexedDBHelper';

const TeleconsultBooking = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const patientId = queryParams.get('patient');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    symptom: '',
    timeSlot: '',
    notificationMethod: 'whatsapp'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Generate time slots for today
  const generateTimeSlots = () => {
    const now = new Date();
    const slots = [];
    
    // Start with the next available hour
    let startHour = now.getHours() + 1;
    if (startHour > 17) {
      // If it's after 5 PM, schedule for tomorrow
      startHour = 10;
    }
    
    // Generate 3 slots, each 2 hours apart
    for (let i = 0; i < 3; i++) {
      const slotHour = (startHour + (i * 2)) % 24;
      if (slotHour >= 9 && slotHour <= 17) { // Only between 9 AM and 5 PM
        const timeString = `${slotHour}:00`;
        slots.push({
          value: timeString,
          label: new Date(now.setHours(slotHour, 0, 0, 0)).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        });
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // If patient ID is provided, fetch patient data
  useEffect(() => {
    const fetchPatientData = async () => {
      if (patientId) {
        // In a real app, this would be an API call
        // For demo purposes, we'll use mock data
        const mockPatients = {
          '1': {
            name: 'Rajesh Kumar',
            phone: '+91 9876543210',
            symptom: 'Fever for 3 days'
          },
          '2': {
            name: 'Priya Singh',
            phone: '+91 8765432109',
            symptom: 'Severe headache'
          },
          '3': {
            name: 'Amit Patel',
            phone: '+91 7654321098',
            symptom: 'Chest pain'
          },
          '4': {
            name: 'Sunita Devi',
            phone: '+91 6543210987',
            symptom: 'Cough with phlegm'
          }
        };

        const patient = mockPatients[patientId];
        if (patient) {
          setFormData(prev => ({
            ...prev,
            name: patient.name,
            phone: patient.phone,
            symptom: patient.symptom
          }));
        }
      }
    };

    fetchPatientData();
  }, [patientId]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const bookingData = {
        ...formData,
        id: Date.now().toString(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      if (isOnline) {
        // In a real app, this would be an API call
        // For demo purposes, we'll simulate a successful API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Save to IndexedDB with synced status
        await saveBookingToIndexedDB({
          ...bookingData,
          synced: true
        });
      } else {
        // Save to IndexedDB for later sync
        await saveBookingToIndexedDB({
          ...bookingData,
          synced: false
        });
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/prescription/' + bookingData.id);
      }, 2000);
    } catch (err) {
      console.error('Error booking teleconsult:', err);
      setError(t('bookingError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('bookingTitle')}</h1>
      
      {!isOnline && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700 text-sm">
            {t('offlineBookingMessage')}
          </p>
        </div>
      )}

      {success ? (
        <div className="text-center py-8">
          <div className="mb-4 text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('bookingSuccess')}</h2>
          <p className="text-gray-600 mb-4">{t('bookingConfirmation')}</p>
          <p className="text-sm text-gray-500">{t('redirectingMessage')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              {t('patientName')}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              {t('patientPhone')}
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="symptom" className="block text-sm font-medium text-gray-700 mb-1">
              {t('patientSymptom')}
            </label>
            <textarea
              id="symptom"
              name="symptom"
              value={formData.symptom}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            ></textarea>
          </div>

          <div className="mb-4">
            <label htmlFor="timeSlot" className="block text-sm font-medium text-gray-700 mb-1">
              {t('selectTimeSlot')}
            </label>
            <select
              id="timeSlot"
              name="timeSlot"
              value={formData.timeSlot}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">{t('selectTimeSlotPrompt')}</option>
              {timeSlots.map((slot, index) => (
                <option key={index} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('notificationPreference')}
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="notificationMethod"
                  value="whatsapp"
                  checked={formData.notificationMethod === 'whatsapp'}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">WhatsApp</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="notificationMethod"
                  value="sms"
                  checked={formData.notificationMethod === 'sms'}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">SMS</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('processing')}
              </span>
            ) : (
              t('bookConsult')
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default TeleconsultBooking;
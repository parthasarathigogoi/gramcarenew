import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

const AshaWorkerDashboard = () => {
  const { t } = useLanguage();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch patient data
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        // In a real app, this would be an API call
        // For demo purposes, we'll use mock data
        const mockPatients = [
          {
            id: '1',
            name: 'Rajesh Kumar',
            phone: '+91 9876543210',
            symptom: 'Fever for 3 days',
            triage: 'yellow',
            timestamp: Date.now() - 3600000 // 1 hour ago
          },
          {
            id: '2',
            name: 'Priya Singh',
            phone: '+91 8765432109',
            symptom: 'Severe headache',
            triage: 'yellow',
            timestamp: Date.now() - 7200000 // 2 hours ago
          },
          {
            id: '3',
            name: 'Amit Patel',
            phone: '+91 7654321098',
            symptom: 'Chest pain',
            triage: 'red',
            timestamp: Date.now() - 1800000 // 30 minutes ago
          },
          {
            id: '4',
            name: 'Sunita Devi',
            phone: '+91 6543210987',
            symptom: 'Cough with phlegm',
            triage: 'yellow',
            timestamp: Date.now() - 10800000 // 3 hours ago
          }
        ];

        setPatients(mockPatients);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching patients:', error);
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Format timestamp to readable time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get triage badge color
  const getTriageBadge = (triage) => {
    switch (triage) {
      case 'green':
        return 'bg-green-100 text-green-800';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800';
      case 'red':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get triage label
  const getTriageLabel = (triage) => {
    switch (triage) {
      case 'green':
        return t('greenTriage');
      case 'yellow':
        return t('yellowTriage');
      case 'red':
        return t('redTriage');
      default:
        return '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h1 className="text-2xl font-bold mb-6">{t('dashboardTitle')}</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {patients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No patients requiring attention at this time.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('patientName')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('patientPhone')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('patientSymptom')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('patientTriage')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('patientActions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map((patient) => (
                    <tr key={patient.id} className={patient.triage === 'red' ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{patient.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.symptom}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTriageBadge(patient.triage)}`}>
                          {getTriageLabel(patient.triage)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(patient.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link to={`/booking?patient=${patient.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                          Book Consult
                        </Link>
                        <Link to={`/prescription/${patient.id}`} className="text-green-600 hover:text-green-900">
                          Prescription
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AshaWorkerDashboard;
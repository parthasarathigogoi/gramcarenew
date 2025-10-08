import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

const AshaWorkerDashboard = () => {
  const { t } = useLanguage();
  const [patients, setPatients] = useState([]);
  const [villages, setVillages] = useState([]); // New state for villages
  const [loading, setLoading] = useState(true);

  // Fetch patient and village data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/patients');
        const data = await response.json();
        setPatients(data);

        // Mock village data (existing)
        const mockVillages = [
          {
            name: 'Haripur',
            totalPatients: 2,
            redTriage: 1,
            yellowTriage: 1,
            commonSymptoms: ['Fever', 'Chest pain']
          },
          {
            name: 'Shivpur',
            totalPatients: 2,
            redTriage: 1,
            yellowTriage: 1,
            commonSymptoms: ['Severe headache', 'Diarrhea']
          },
          {
            name: 'Ramnagar',
            totalTriage: 2,
            redTriage: 0,
            yellowTriage: 1,
            commonSymptoms: ['Cough', 'Body aches']
          }
        ];

        setVillages(mockVillages); // Set mock village data
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
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

  // Function to get most common symptoms
  const getCommonSymptoms = () => {
    const symptomCounts = {};
    patients.forEach(patient => {
      const symptom = patient.symptom.split(' ')[0]; // Take the first word as a simple symptom key
      symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
    });

    const sortedSymptoms = Object.entries(symptomCounts).sort(([, countA], [, countB]) => countB - countA);
    const topSymptoms = sortedSymptoms.slice(0, 3).map(([symptom]) => symptom);
    return topSymptoms.join(', ');
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
          {/* Village Health Overview */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{t('villageHealthOverview')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {villages.map((village) => (
                <div key={village.name} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-medium mb-2">{village.name}</h3>
                  <p className="text-sm text-gray-600">{t('totalPatients')}: {village.totalPatients}</p>
                  <p className="text-sm text-red-600">{t('redTriageCases')}: {village.redTriage}</p>
                  <p className="text-sm text-yellow-600">{t('yellowTriageCases')}: {village.yellowTriage}</p>
                  <p className="text-sm text-gray-600">{t('commonSymptoms')}: {village.commonSymptoms.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Health Trends Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{t('healthTrends')}</h2>
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-600">{t('mostCommonSymptoms')}: {getCommonSymptoms()}</p>
            </div>
          </div>

          {/* Patient List (existing) */}
          <h2 className="text-xl font-semibold mb-4">{t('patientsRequiringAttention')}</h2>
          {patients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('noPatientsAttention')}
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
                      {t('patientVillage')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('time')}
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.village}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(patient.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link to={`/booking?patient=${patient.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                          {t('bookConsult')}
                        </Link>
                        <Link to={`/prescription/${patient.id}`} className="text-green-600 hover:text-green-900">
                          {t('prescription')}
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
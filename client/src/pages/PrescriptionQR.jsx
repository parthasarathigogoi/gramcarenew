import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import QRCode from 'qrcode.react';

const PrescriptionQR = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redeemed, setRedeemed] = useState(false);
  const [showPharmacyView, setShowPharmacyView] = useState(false);

  // Fetch prescription data
  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        // In a real app, this would be an API call
        // For demo purposes, we'll use mock data
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
        
        // Generate mock prescription based on ID
        const mockPrescription = {
          id,
          patientName: ['Rajesh Kumar', 'Priya Singh', 'Amit Patel', 'Sunita Devi'][Math.floor(Math.random() * 4)],
          doctorName: 'Dr. Sharma',
          date: new Date().toISOString(),
          medications: [
            {
              name: 'Paracetamol',
              dosage: '500mg',
              frequency: 'Twice daily',
              duration: '5 days'
            },
            {
              name: 'Cetirizine',
              dosage: '10mg',
              frequency: 'Once daily',
              duration: '3 days'
            }
          ],
          instructions: 'Take medication after meals. Drink plenty of water.',
          redeemed: false
        };

        setPrescription(mockPrescription);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching prescription:', err);
        setError(t('prescriptionError'));
        setLoading(false);
      }
    };

    if (id) {
      fetchPrescription();
    } else {
      setError(t('invalidPrescription'));
      setLoading(false);
    }
  }, [id, t]);

  // Handle prescription redemption
  const handleRedeem = async () => {
    try {
      setLoading(true);
      
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      setRedeemed(true);
      setPrescription(prev => ({
        ...prev,
        redeemed: true
      }));
      
      setLoading(false);
    } catch (err) {
      console.error('Error redeeming prescription:', err);
      setError(t('redemptionError'));
      setLoading(false);
    }
  };

  // Generate QR code data
  const generateQRData = () => {
    if (!prescription) return '';
    
    return JSON.stringify({
      id: prescription.id,
      patientName: prescription.patientName,
      medications: prescription.medications.map(med => `${med.name} ${med.dosage} - ${med.frequency} for ${med.duration}`),
      date: prescription.date
    });
  };

  // Toggle between patient and pharmacy views
  const toggleView = () => {
    setShowPharmacyView(!showPharmacyView);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-lg mx-auto">
        <div className="text-center py-8">
          <div className="mb-4 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('errorOccurred')}</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('goBack')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{showPharmacyView ? t('pharmacyView') : t('prescriptionTitle')}</h1>
        <button
          onClick={toggleView}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showPharmacyView ? t('patientView') : t('pharmacyView')}
        </button>
      </div>

      {showPharmacyView ? (
        // Pharmacy View
        <div>
          {prescription && (
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between mb-4">
                <div>
                  <h2 className="font-semibold">{prescription.patientName}</h2>
                  <p className="text-sm text-gray-500">
                    {new Date(prescription.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{t('prescribedBy')}</p>
                  <p className="font-semibold">{prescription.doctorName}</p>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-medium mb-2">{t('medications')}</h3>
                <ul className="space-y-2">
                  {prescription.medications.map((med, index) => (
                    <li key={index} className="border-b border-gray-100 pb-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{med.name} {med.dosage}</span>
                        <span className="text-sm">{med.frequency}</span>
                      </div>
                      <p className="text-sm text-gray-600">{t('duration')}: {med.duration}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="font-medium mb-1">{t('instructions')}</h3>
                <p className="text-sm text-gray-700">{prescription.instructions}</p>
              </div>

              <div className="mt-6">
                {prescription.redeemed || redeemed ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center">
                    <p className="text-green-700 font-medium">{t('prescriptionRedeemed')}</p>
                    <p className="text-sm text-green-600">{t('redeemedOn')} {new Date().toLocaleDateString()}</p>
                  </div>
                ) : (
                  <button
                    onClick={handleRedeem}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t('processing') : t('redeemPrescription')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Patient View
        <div className="text-center">
          {prescription && (
            <>
              <div className="mb-6">
                <div className="bg-blue-50 inline-block p-4 rounded-lg">
                  <QRCode
                    value={generateQRData()}
                    size={200}
                    level="H"
                    includeMargin={true}
                    renderAs="svg"
                  />
                </div>
              </div>

              <h2 className="text-xl font-semibold mb-2">{prescription.patientName}</h2>
              <p className="text-gray-600 mb-6">
                {new Date(prescription.date).toLocaleDateString()}
              </p>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <h3 className="font-medium mb-2">{t('medications')}</h3>
                <ul className="space-y-2 text-left">
                  {prescription.medications.map((med, index) => (
                    <li key={index} className="border-b border-gray-100 pb-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{med.name} {med.dosage}</span>
                        <span className="text-sm">{med.frequency}</span>
                      </div>
                      <p className="text-sm text-gray-600">{t('duration')}: {med.duration}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                <h3 className="font-medium mb-1">{t('instructions')}</h3>
                <p className="text-sm">{prescription.instructions}</p>
              </div>

              <div className="text-sm text-gray-500">
                <p>{t('showQRToPharmacy')}</p>
                {prescription.redeemed && (
                  <p className="mt-2 text-green-600 font-medium">{t('prescriptionRedeemed')}</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PrescriptionQR;
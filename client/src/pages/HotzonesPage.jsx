import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const HotzonesPage = () => {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [symptomType, setSymptomType] = useState('all');
  const [timeWindow, setTimeWindow] = useState('24h');
  const [displayMode, setDisplayMode] = useState('area'); // 'area' or 'grid'
  const [hotzones, setHotzones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Check online status
  useEffect(() => {
    const handleOnlineStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  // Fetch hotzone data
  useEffect(() => {
    const fetchHotzones = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        const mockData = generateMockHotzones();
        setHotzones(mockData);
      } catch (error) {
        console.error('Error fetching hotzone data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotzones();
  }, [symptomType, timeWindow, displayMode]);

  // Generate mock data for demonstration
  const generateMockHotzones = () => {
    const symptoms = ['fever', 'cough', 'diarrhea', 'rash', 'injury'];
    const areas = ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur'];
    
    return Array(15).fill().map((_, i) => {
      const count = Math.floor(Math.random() * 30);
      const threshold = 10;
      const score = count / threshold;
      
      return {
        id: i + 1,
        area: areas[Math.floor(Math.random() * areas.length)],
        symptom: symptoms[Math.floor(Math.random() * symptoms.length)],
        count,
        score,
        severity: score < 1 ? 'low' : score < 2 ? 'medium' : 'high',
        lat: 26.1 + Math.random() * 0.5,
        lng: 91.7 + Math.random() * 0.5,
      };
    });
  };

  // Filter hotzones based on selected filters
  const filteredHotzones = hotzones.filter(zone => {
    if (symptomType !== 'all' && zone.symptom !== symptomType) return false;
    return true;
  });

  // Get color based on severity
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#ef4444'; // red
      case 'medium': return '#f59e0b'; // amber
      case 'low': return '#10b981'; // green
      default: return '#10b981';
    }
  };

  // Handle notify ASHA worker
  const handleNotifyAsha = (zoneId) => {
    alert(`ASHA worker notified about hotzone ${zoneId}`);
    // In a real app, this would send a notification to the ASHA worker
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">
        {t('hotzonesTitle') || 'Health Hotzones'}
      </h1>
      
      {/* Offline indicator */}
      {isOffline && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p className="text-lg">
            {t('offlineAlert') || 'You are currently offline. Some features may be limited.'}
          </p>
        </div>
      )}
      
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Symptom selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('symptomType') || 'Symptom Type'}
            </label>
            <select
              value={symptomType}
              onChange={(e) => setSymptomType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="all">{t('allSymptoms') || 'All Symptoms'}</option>
              <option value="fever">{t('fever') || 'Fever'}</option>
              <option value="cough">{t('cough') || 'Cough'}</option>
              <option value="diarrhea">{t('diarrhea') || 'Diarrhea'}</option>
              <option value="rash">{t('rash') || 'Rash'}</option>
              <option value="injury">{t('injury') || 'Injury'}</option>
            </select>
          </div>
          
          {/* Time window selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('timeWindow') || 'Time Window'}
            </label>
            <select
              value={timeWindow}
              onChange={(e) => setTimeWindow(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="24h">{t('last24Hours') || 'Last 24 Hours'}</option>
              <option value="48h">{t('last48Hours') || 'Last 48 Hours'}</option>
              <option value="72h">{t('last72Hours') || 'Last 72 Hours'}</option>
              <option value="7d">{t('lastWeek') || 'Last Week'}</option>
            </select>
          </div>
          
          {/* Display mode toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('displayMode') || 'Display Mode'}
            </label>
            <div className="flex">
              <button
                onClick={() => setDisplayMode('area')}
                className={`flex-1 py-2 px-4 text-center ${
                  displayMode === 'area'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                } rounded-l-md`}
              >
                {t('byArea') || 'By Area'}
              </button>
              <button
                onClick={() => setDisplayMode('grid')}
                className={`flex-1 py-2 px-4 text-center ${
                  displayMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                } rounded-r-md`}
              >
                {t('byGrid') || 'By Grid'}
              </button>
            </div>
          </div>
          
          {/* View mode toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('viewMode') || 'View Mode'}
            </label>
            <div className="flex">
              <button
                onClick={() => setViewMode('map')}
                className={`flex-1 py-2 px-4 text-center ${
                  viewMode === 'map'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                } rounded-l-md`}
              >
                {t('mapView') || 'Map'}
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 py-2 px-4 text-center ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                } rounded-r-md`}
              >
                {t('listView') || 'List'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading indicator */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Map View */}
          {viewMode === 'map' && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="h-96">
                <MapContainer 
                  center={[26.2006, 92.9376]} 
                  zoom={7} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {filteredHotzones.map(zone => (
                    <React.Fragment key={zone.id}>
                      <Marker position={[zone.lat, zone.lng]}>
                        <Popup>
                          <div>
                            <h3 className="font-bold">{zone.area}</h3>
                            <p>{t(zone.symptom) || zone.symptom}: {zone.count} cases</p>
                            <p>
                              {t('severity') || 'Severity'}: 
                              <span className="font-bold ml-1" style={{ color: getSeverityColor(zone.severity) }}>
                                {t(zone.severity) || zone.severity}
                              </span>
                            </p>
                            <button
                              onClick={() => handleNotifyAsha(zone.id)}
                              className="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
                            >
                              {t('notifyAsha') || 'Notify ASHA'}
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                      <Circle
                        center={[zone.lat, zone.lng]}
                        radius={zone.count * 100}
                        pathOptions={{
                          color: getSeverityColor(zone.severity),
                          fillColor: getSeverityColor(zone.severity),
                          fillOpacity: 0.5,
                        }}
                      />
                    </React.Fragment>
                  ))}
                </MapContainer>
              </div>
            </div>
          )}
          
          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {displayMode === 'area' ? (t('area') || 'Area') : (t('grid') || 'Grid ID')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('symptom') || 'Symptom'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('cases') || 'Cases'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('severity') || 'Severity'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('action') || 'Action'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHotzones.map(zone => (
                    <tr key={zone.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {zone.area}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {t(zone.symptom) || zone.symptom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {zone.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            zone.severity === 'high'
                              ? 'bg-red-100 text-red-800'
                              : zone.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {t(zone.severity) || zone.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleNotifyAsha(zone.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
                        >
                          {t('notifyAsha') || 'Notify ASHA'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* No data message */}
          {filteredHotzones.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-lg text-gray-600">
                {t('noHotzonesFound') || 'No hotzones found for the selected filters.'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HotzonesPage;
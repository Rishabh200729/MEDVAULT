import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import PatientRecords from './pages/PatientRecords';
import DoctorDashboard from './pages/DoctorDashboard';
import EmergencyView from './pages/EmergencyView';
import LabInterface from './pages/LabInterface';

function App() {
  return (
    <div className="bg-mesh" style={{ minHeight: '100vh' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/patient/records" element={<PatientRecords />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/emergency/:medicalId" element={<EmergencyView />} />
        <Route path="/lab" element={<LabInterface />} />
      </Routes>
    </div>
  );
}

export default App;

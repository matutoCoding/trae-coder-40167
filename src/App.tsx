import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import Dashboard from '@/pages/Dashboard';
import UploadPage from '@/pages/UploadPage';
import ProofreadPage from '@/pages/ProofreadPage';
import ExportPage from '@/pages/ExportPage';

export default function App() {
  return (
    <Router>
      <PageContainer>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/proofread/:meetingId" element={<ProofreadPage />} />
          <Route path="/export/:meetingId" element={<ExportPage />} />
        </Routes>
      </PageContainer>
    </Router>
  );
}

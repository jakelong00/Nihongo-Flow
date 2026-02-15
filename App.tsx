
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { FileProvider } from './contexts/FileSystemContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Vocab from './pages/Vocab';
import Kanji from './pages/Kanji';
import Grammar from './pages/Grammar';
import Review from './pages/Review';
import Settings from './pages/Settings';
import About from './pages/About';

function App() {
  return (
    <FileProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* The Review component is now the main Learning page */}
            <Route path="/learn" element={<Review />} />
            <Route path="/vocab" element={<Vocab />} />
            <Route path="/kanji" element={<Kanji />} />
            <Route path="/grammar" element={<Grammar />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Layout>
      </Router>
    </FileProvider>
  );
}

export default App;

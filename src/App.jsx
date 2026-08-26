import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Events from './pages/Events.js';
import Documents from './pages/Documents.js';
import PostsPage from "./pages/PostsPage.jsx";
import PostPage from "./pages/PostPage.jsx";
import Links from "./pages/Links.jsx";
import About from "./pages/About.jsx";
import Announcements from "./pages/Announcements.js";
import AdminAnnouncements from "./pages/AdminAnnouncements.jsx";
import Improvement from "./pages/Improvement.jsx";


function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/documents/:category" element={<Documents />} />
        <Route path="/" element={<Home />} />
        <Route path="/posts" element={<PostsPage />} />
        <Route path="/posts/:slug" element={<PostPage />} />
        <Route path="/links" element={<Links />} />
        <Route path="/about" element={<About />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/announcements/:id" element={<Announcements />} />
        <Route path="/admin/announcements" element={<AdminAnnouncements />} />
        <Route path="/improvement" element={<Improvement />} />
      </Routes>
    </Layout>
  );
}

function Home() {
  return null; // Home is your existing Layout hero content, no extra needed
}

export default App;

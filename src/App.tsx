import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Course } from './pages/Course';
import { Profile } from './pages/Profile';
import { Admin } from './pages/Admin';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="course" element={<Course />} />
        <Route path="profile" element={<Profile />} />
        <Route path="admin" element={<Admin />} />
      </Route>
    </Routes>
  );
}

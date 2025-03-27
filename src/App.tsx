import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/tasting-notes" element={<div>Tasting Notes</div>} />
        <Route path="/profile" element={<div>Profile</div>} />
      </Route>
    </Routes>
  )
}

export default App 
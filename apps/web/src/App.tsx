import { BrowserRouter, Routes, Route } from 'react-router'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Education Gestor</div>} />
      </Routes>
    </BrowserRouter>
  )
}

// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DynamicFormTemplate from "./pages/DynamicFormTemplate";
import SurveyForm from "./pages/SurveyForm";
import ReferencesAuthForm from "./pages/ReferencesAuthForm";

const App = () => (
        <Router basename="/autorizacion-acertar">
        <Routes>
            <Route path="/autorizacion/:id" element={<DynamicFormTemplate />} />
            <Route path="/encuesta/:id" element={<SurveyForm />} />
            <Route path="/autorizacion-referencias/:id" element={<ReferencesAuthForm />} />
        </Routes>
    </Router>
);

export default App;
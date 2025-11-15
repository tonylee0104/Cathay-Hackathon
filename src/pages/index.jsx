import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import NewOrder from "./NewOrder";

import CostCalculator from "./CostCalculator";

import QuotationGenerator from "./QuotationGenerator";

import Vendors from "./Vendors";

import AIAssistant from "./AIAssistant";

import FlightSchedule from "./FlightSchedule";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    NewOrder: NewOrder,
    
    CostCalculator: CostCalculator,
    
    QuotationGenerator: QuotationGenerator,
    
    Vendors: Vendors,
    
    AIAssistant: AIAssistant,
    
    FlightSchedule: FlightSchedule,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/NewOrder" element={<NewOrder />} />
                
                <Route path="/CostCalculator" element={<CostCalculator />} />
                
                <Route path="/QuotationGenerator" element={<QuotationGenerator />} />
                
                <Route path="/Vendors" element={<Vendors />} />
                
                <Route path="/AIAssistant" element={<AIAssistant />} />
                
                <Route path="/FlightSchedule" element={<FlightSchedule />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}
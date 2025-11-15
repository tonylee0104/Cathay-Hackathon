
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Package, TrendingUp, DollarSign, FileText, Plus, ArrowRight, TruckIcon, CheckCircle, Clock, XCircle, Moon, Sun, Plane } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format, parseISO } from "date-fns";
import { useCurrency } from "@/components/CurrencyProvider";

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [filterOrigin, setFilterOrigin] = useState("HKG");
  const [filterDestination, setFilterDestination] = useState("Kowloon Distribution Center");
  const [sortBy, setSortBy] = useState("cost");
  const { formatCurrency } = useCurrency();
  
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list("-created_date"),
    refetchInterval: 5000,
  });

  const { data: quotations = [] } = useQuery({
    queryKey: ['quotations'],
    queryFn: () => base44.entities.Quotation.list("-created_date"),
    refetchInterval: 5000,
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.TruckingVendor.list(),
  });

  const { data: flights = [] } = useQuery({
    queryKey: ['flights'],
    queryFn: () => base44.entities.Flight.list("-departure_date"),
    refetchInterval: 10000,
  });

  const airportDistributionMap = {
    'HKG': ['Kowloon Distribution Center', 'New Territories Warehouse', 'Hong Kong Island Hub', 'Lantau Logistics Park'],
    'LAX': ['Downtown LA Hub', 'Long Beach Distribution', 'Santa Monica Warehouse', 'Inglewood Logistics Center'],
    'JFK': ['Brooklyn Logistics Center', 'Queens Distribution Hub', 'Manhattan Warehouse', 'Bronx Distribution Park'],
    'LHR': ['Heathrow Industrial Estate', 'East London Warehouse', 'West London Hub', 'Slough Distribution Center'],
    'PVG': ['Pudong Distribution Center', 'Shanghai Free Trade Zone', 'Hongqiao Logistics Hub', 'Baoshan Warehouse'],
    'NRT': ['Tokyo Bay Warehouse', 'Narita Logistics Hub', 'Chiba Distribution Center', 'Saitama Warehouse Park'],
    'SIN': ['Changi Business Park', 'Jurong Distribution Center', 'Woodlands Logistics Hub', 'Tuas Warehouse Complex'],
    'DXB': ['Dubai Logistics City', 'Jebel Ali Warehouse', 'Al Quoz Industrial Hub', 'Dubai South Distribution'],
    'FRA': ['Frankfurt Rhine-Main Hub', 'Industrial Park West', 'Offenbach Distribution', 'Darmstadt Logistics Center'],
    'SYD': ['Sydney Port Distribution', 'Western Sydney Logistics', 'Botany Bay Hub', 'Parramatta Warehouse']
  };

  const airports = Object.keys(airportDistributionMap);
  const availableDistributionCenters = airportDistributionMap[filterOrigin] || [];

  useEffect(() => {
    if (!availableDistributionCenters.includes(filterDestination)) {
      setFilterDestination(availableDistributionCenters[0] || '');
    }
  }, [filterOrigin]);

  const [vendorAvailability, setVendorAvailability] = useState([]);

  useEffect(() => {
    const generateAvailability = () => {
      const availability = [];
      
      vendors.forEach(vendor => {
        const random = Math.random();
        let status = 'available';
        let eta = Math.floor(Math.random() * 5 + 1);
        let trucks = Math.floor(Math.random() * 8 + 2);
        
        if (random > 0.7) {
          status = 'limited';
          trucks = Math.floor(Math.random() * 3 + 1);
          eta = Math.floor(Math.random() * 3 + 3);
        } else if (random > 0.9) {
          status = 'unavailable';
          trucks = 0;
          eta = 0;
        }
        
        const baseDistance = 100 + Math.floor(Math.random() * 200);
        const estimatedWeight = 1000;
        const costPer100kg = vendor.rate_per_100kg || 40;
        const estimatedCost = (estimatedWeight / 100) * costPer100kg;
        
        availability.push({
          vendor: vendor.vendor_name,
          vendorId: vendor.id,
          origin: filterOrigin,
          destination: filterDestination,
          status,
          trucks,
          eta: status === 'unavailable' ? 0 : eta,
          cost: status === 'unavailable' ? 0 : estimatedCost,
          region: vendor.region,
          reliability: vendor.reliability_rating || 5
        });
      });
      
      setVendorAvailability(availability);
    };

    if (vendors.length > 0) {
      generateAvailability();
      const interval = setInterval(generateAvailability, 15000);
      return () => clearInterval(interval);
    }
  }, [vendors, filterOrigin, filterDestination]);

  const filteredAndSortedAvailability = [...vendorAvailability].sort((a, b) => {
    if (sortBy === 'cost') {
      return a.cost - b.cost;
    } else if (sortBy === 'eta') {
      if (a.status === 'unavailable') return 1;
      if (b.status === 'unavailable') return -1;
      return a.eta - b.eta;
    } else if (sortBy === 'reliability') {
      return b.reliability - a.reliability;
    }
    return 0;
  });

  const totalOrders = orders.length;
  const quotedOrders = orders.filter(o => o.status === 'quoted' || o.status === 'completed').length;
  const relevantQuotations = quotations.filter(q => {
    const order = orders.find(o => o.id === q.order_id);
    return order && (order.status === 'quoted' || order.status === 'completed');
  });
  const totalRevenue = relevantQuotations.reduce((sum, q) => sum + (q.final_quote_price || 0), 0);
  const avgMargin = relevantQuotations.length > 0 
    ? relevantQuotations.reduce((sum, q) => sum + (q.profit_margin_percent || 0), 0) / relevantQuotations.length 
    : 0;

  const statusColors = {
    draft: "bg-gray-100 text-gray-700",
    calculated: "bg-blue-100 text-blue-700",
    quoted: "bg-green-100 text-green-700",
    completed: "bg-purple-100 text-purple-700"
  };

  const availabilityColors = {
    available: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    limited: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
    unavailable: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle }
  };

  const flightStatusColors = {
    scheduled: "bg-blue-100 text-blue-700",
    boarding: "bg-yellow-100 text-yellow-700",
    in_flight: "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700"
  };

  // Get dispatched flights (flights with assigned shipments)
  const dispatchedFlights = flights.filter(flight => {
    const assignedOrders = orders.filter(o => o.assigned_flight_id === flight.id);
    return assignedOrders.length > 0;
  }).slice(0, 5);

  // Get pending shipments (orders without flight assignment)
  const pendingShipments = orders.filter(order => !order.assigned_flight_id).slice(0, 5);

  return (
    <div className={`p-6 md:p-8 min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Airport to Distribution Center Transportation
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              className={darkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Link to={createPageUrl("NewOrder")}>
              <Button className="bg-[#006564] hover:bg-[#00877C]">
                <Plus className="w-4 h-4 mr-2" />
                New Order
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className={`border-none shadow-md ${darkMode ? 'bg-gray-800 text-white' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Orders</p>
                  <CardTitle className="text-3xl font-bold mt-2">{totalOrders.toLocaleString()}</CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-blue-50">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className={`border-none shadow-md ${darkMode ? 'bg-gray-800 text-white' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Quoted Orders</p>
                  <CardTitle className="text-3xl font-bold mt-2">{quotedOrders.toLocaleString()}</CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-[#E8F5F4]">
                  <TrendingUp className="w-5 h-5 text-[#006564]" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className={`border-none shadow-md ${darkMode ? 'bg-gray-800 text-white' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Revenue</p>
                  <CardTitle className="text-3xl font-bold mt-2">
                    {formatCurrency(totalRevenue, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-green-50">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className={`border-none shadow-md ${darkMode ? 'bg-gray-800 text-white' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Margin</p>
                  <CardTitle className="text-3xl font-bold mt-2">{avgMargin.toFixed(1)}%</CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-purple-50">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className={`border-none shadow-md ${darkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
            <CardHeader className={`border-b ${darkMode ? 'border-gray-700' : ''}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Plane className="w-5 h-5 text-green-600" />
                  <CardTitle className={darkMode ? 'text-white' : ''}>Dispatched Flights</CardTitle>
                </div>
                <Link to={createPageUrl("FlightSchedule")}>
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {dispatchedFlights.map((flight) => {
                  const assignedOrders = orders.filter(o => o.assigned_flight_id === flight.id);
                  return (
                    <div key={flight.id} className={`p-3 border rounded-lg ${darkMode ? 'border-gray-700 bg-gray-750' : 'bg-gray-50'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-[#006564]">{flight.flight_number}</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {flight.origin_airport} → {flight.destination_airport}
                          </p>
                        </div>
                        <Badge className={flightStatusColors[flight.status]}>
                          {flight.status}
                        </Badge>
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <p>Departure: {format(parseISO(flight.departure_date), "MMM d, HH:mm")}</p>
                        <p className="mt-1">
                          <span className="font-medium text-green-600">{assignedOrders.length}</span> shipment(s) assigned
                        </p>
                      </div>
                    </div>
                  );
                })}
                {dispatchedFlights.length === 0 && (
                  <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-500'} text-sm`}>
                    No flights dispatched yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={`border-none shadow-md ${darkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
            <CardHeader className={`border-b ${darkMode ? 'border-gray-700' : ''}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  <CardTitle className={darkMode ? 'text-white' : ''}>Pending Shipments</CardTitle>
                </div>
                <Link to={createPageUrl("FlightSchedule")}>
                  <Button variant="ghost" size="sm">
                    Assign <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {pendingShipments.map((order) => (
                  <div key={order.id} className={`p-3 border rounded-lg ${darkMode ? 'border-gray-700 bg-gray-750' : 'bg-orange-50 border-orange-200'}`}>
                    <p className="font-semibold text-sm">{order.order_number}</p>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {order.origin_airport} → {order.destination_airport}
                    </p>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {order.weight_kg.toLocaleString()} kg • {order.cargo_type}
                    </p>
                  </div>
                ))}
                {pendingShipments.length === 0 && (
                  <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-500'} text-sm`}>
                    All shipments assigned to flights
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className={`border-none shadow-md ${darkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
              <CardHeader className={`border-b ${darkMode ? 'border-gray-700' : ''}`}>
                <div className="flex justify-between items-center">
                  <CardTitle className={darkMode ? 'text-white' : ''}>All Orders</CardTitle>
                  <Link to={createPageUrl("NewOrder")}>
                    <Button variant="ghost" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      New Order
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader className={`sticky top-0 ${darkMode ? 'bg-gray-800' : 'bg-white'} z-10`}>
                      <TableRow className={darkMode ? 'border-gray-700' : ''}>
                        <TableHead className={darkMode ? 'text-gray-300' : ''}>Order #</TableHead>
                        <TableHead className={darkMode ? 'text-gray-300' : ''}>Route</TableHead>
                        <TableHead className={darkMode ? 'text-gray-300' : ''}>Weight</TableHead>
                        <TableHead className={darkMode ? 'text-gray-300' : ''}>Status</TableHead>
                        <TableHead className={darkMode ? 'text-gray-300' : ''}>Date</TableHead>
                        <TableHead className={darkMode ? 'text-gray-300' : ''}></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id} className={darkMode ? 'border-gray-700' : ''}>
                          <TableCell className={`font-medium ${darkMode ? 'text-gray-300' : ''}`}>
                            {order.order_number}
                          </TableCell>
                          <TableCell className={darkMode ? 'text-gray-300' : ''}>
                            <div className="text-sm">
                              {order.origin_airport} → {order.destination_airport}
                            </div>
                          </TableCell>
                          <TableCell className={darkMode ? 'text-gray-300' : ''}>
                            {order.weight_kg?.toLocaleString() || 0} KG
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[order.status]}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {format(new Date(order.created_date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Link to={`${createPageUrl("CostCalculator")}?orderId=${order.id}`}>
                              <Button variant="ghost" size="sm">
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {orders.length === 0 && (
                    <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      No orders yet. Create your first order!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className={`border-none shadow-md ${darkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
              <CardHeader className={`border-b ${darkMode ? 'border-gray-700' : ''}`}>
                <div className="flex items-center gap-2 mb-3">
                  <TruckIcon className="w-5 h-5 text-[#006564]" />
                  <CardTitle className={darkMode ? 'text-white' : ''}>Trucking Availability</CardTitle>
                </div>
                
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>From (Airport)</Label>
                      <Select value={filterOrigin} onValueChange={setFilterOrigin}>
                        <SelectTrigger className={`h-8 text-xs ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {airports.map(airport => (
                            <SelectItem key={airport} value={airport}>{airport}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>To (DC)</Label>
                      <Select value={filterDestination} onValueChange={setFilterDestination}>
                        <SelectTrigger className={`h-8 text-xs ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDistributionCenters.map(dc => (
                            <SelectItem key={dc} value={dc}>{dc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sort By</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className={`h-8 text-xs ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cost">Cost (Low to High)</SelectItem>
                        <SelectItem value="eta">ETA (Fast to Slow)</SelectItem>
                        <SelectItem value="reliability">Reliability (High to Low)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className={darkMode ? 'bg-gray-750' : ''}>
                      <TableRow className={darkMode ? 'border-gray-700' : ''}>
                        <TableHead className={darkMode ? 'text-gray-300' : ''}>Vendor</TableHead>
                        <TableHead className={darkMode ? 'text-gray-300' : ''}>Status</TableHead>
                        <TableHead className={darkMode ? 'text-gray-300' : ''}>Cost</TableHead>
                        <TableHead className={darkMode ? 'text-gray-300' : ''}>ETA</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedAvailability.map((item, idx) => {
                        const StatusIcon = availabilityColors[item.status].icon;
                        return (
                          <TableRow key={idx} className={darkMode ? 'border-gray-700' : ''}>
                            <TableCell className={darkMode ? 'text-gray-300' : ''}>
                              <div className="text-xs font-medium">{item.vendor}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                {[...Array(item.reliability)].map((_, i) => (
                                  <span key={i} className="text-yellow-500">★</span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <StatusIcon className={`w-3 h-3 ${availabilityColors[item.status].text}`} />
                                <span className={`text-xs ${availabilityColors[item.status].text}`}>
                                  {item.trucks} trucks
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className={darkMode ? 'text-gray-300' : ''}>
                              <span className="text-xs font-semibold">
                                {item.status === 'unavailable' ? 'N/A' : formatCurrency(item.cost, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </span>
                            </TableCell>
                            <TableCell className={darkMode ? 'text-gray-300' : ''}>
                              <span className="text-xs">
                                {item.status === 'unavailable' ? 'N/A' : `${item.eta}h`}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className={`p-3 border-t ${darkMode ? 'border-gray-700 bg-gray-750' : 'bg-gray-50'}`}>
                  <div className="flex gap-3 text-xs flex-wrap">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Available</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-yellow-600" />
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Limited</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-red-600" />
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Unavailable</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

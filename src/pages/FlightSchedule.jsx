import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Plane, Package, ArrowRight, CheckCircle } from "lucide-react";
import { format, parseISO, isWithinInterval } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function FlightSchedule() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [originFilter, setOriginFilter] = useState("all");
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showFlightDialog, setShowFlightDialog] = useState(false);

  const { data: flights = [] } = useQuery({
    queryKey: ['flights'],
    queryFn: () => base44.entities.Flight.list("-departure_date"),
    refetchInterval: 10000,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list("-created_date"),
    refetchInterval: 10000,
  });

  const assignFlightMutation = useMutation({
    mutationFn: ({ orderId, flightId, flight }) => {
      const newAvailableCapacity = flight.available_capacity_kg - orders.find(o => o.id === orderId).weight_kg;
      return Promise.all([
        base44.entities.Order.update(orderId, { assigned_flight_id: flightId, status: 'completed' }),
        base44.entities.Flight.update(flightId, { available_capacity_kg: newAvailableCapacity })
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['flights'] });
      setShowFlightDialog(false);
      setSelectedOrder(null);
      toast.success("Cargo assigned to flight successfully");
    },
    onError: () => {
      toast.error("Failed to assign cargo to flight");
    }
  });

  const airports = ["HKG", "LAX", "JFK", "LHR", "PVG", "NRT", "SIN", "DXB", "FRA", "SYD"];

  const filteredFlights = flights.filter(flight => {
    const flightDate = parseISO(flight.departure_date);
    
    const dateMatch = !dateRange.from || !dateRange.to || 
      isWithinInterval(flightDate, { start: dateRange.from, end: dateRange.to });
    
    const originMatch = originFilter === "all" || flight.origin_airport === originFilter;
    const destinationMatch = destinationFilter === "all" || flight.destination_airport === destinationFilter;
    
    return dateMatch && originMatch && destinationMatch;
  });

  // Only show orders with status 'quoted' or 'completed' that haven't been assigned yet
  const pendingOrders = orders.filter(order => 
    !order.assigned_flight_id && (order.status === 'quoted' || order.status === 'completed')
  );
  
  const confirmedOrders = orders.filter(order => order.assigned_flight_id);

  const getMatchingFlights = (order) => {
    return flights.filter(flight => {
      const flightDate = parseISO(flight.departure_date);
      
      const dateMatch = !dateRange.from || !dateRange.to || 
        isWithinInterval(flightDate, { start: dateRange.from, end: dateRange.to });
      
      return flight.origin_airport === order.origin_airport &&
        flight.destination_airport === order.destination_airport &&
        flight.available_capacity_kg >= order.weight_kg &&
        flight.status === 'scheduled' &&
        dateMatch;
    });
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowFlightDialog(true);
  };

  const handleAssignFlight = (flight) => {
    if (selectedOrder) {
      assignFlightMutation.mutate({
        orderId: selectedOrder.id,
        flightId: flight.id,
        flight: flight
      });
    }
  };

  const statusColors = {
    scheduled: "bg-blue-100 text-blue-700",
    boarding: "bg-yellow-100 text-yellow-700",
    in_flight: "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700"
  };

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Plane className="w-8 h-8 text-[#006564]" />
            Flight Schedule
          </h1>
          <p className="text-gray-600 mt-1">Track cargo flights and assign shipments</p>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b">
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label>Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from && dateRange.to ? (
                        `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
                      ) : (
                        "Select date range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                {dateRange.from && dateRange.to && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setDateRange({ from: null, to: null })}
                    className="text-xs"
                  >
                    Clear dates
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Origin Airport</Label>
                <Select value={originFilter} onValueChange={setOriginFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Origins</SelectItem>
                    {airports.map(airport => (
                      <SelectItem key={airport} value={airport}>{airport}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Destination Airport</Label>
                <Select value={destinationFilter} onValueChange={setDestinationFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Destinations</SelectItem>
                    {airports.map(airport => (
                      <SelectItem key={airport} value={airport}>{airport}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b">
                <CardTitle>Scheduled Flights</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {filteredFlights.map(flight => (
                    <div key={flight.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-lg text-[#006564]">{flight.flight_number}</p>
                          <p className="text-sm text-gray-600">{flight.aircraft_type}</p>
                        </div>
                        <Badge className={statusColors[flight.status]}>
                          {flight.status}
                        </Badge>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Route</p>
                          <p className="font-medium flex items-center gap-2">
                            {flight.origin_airport} <ArrowRight className="w-4 h-4" /> {flight.destination_airport}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Departure</p>
                          <p className="font-medium">
                            {format(parseISO(flight.departure_date), "MMM d, yyyy HH:mm")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <p className="text-xs text-gray-500">Available Capacity</p>
                          <p className="font-semibold text-green-600">
                            {flight.available_capacity_kg.toLocaleString()} kg
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Total Capacity</p>
                          <p className="font-medium">
                            {flight.total_capacity_kg.toLocaleString()} kg
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredFlights.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No flights match your filters
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  Pending Assignments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {pendingOrders.map(order => (
                    <button
                      key={order.id}
                      onClick={() => handleOrderClick(order)}
                      className="w-full p-3 border rounded-lg hover:border-[#006564] hover:bg-[#E8F5F4] transition-all text-left"
                    >
                      <p className="font-semibold text-sm">{order.order_number}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {order.origin_airport} → {order.destination_airport}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {order.weight_kg.toLocaleString()} kg • {order.cargo_type}
                      </p>
                    </button>
                  ))}

                  {pendingOrders.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No shipments awaiting assignment
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Confirmed Assignments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {confirmedOrders.map(order => {
                    const assignedFlight = flights.find(f => f.id === order.assigned_flight_id);
                    return (
                      <div
                        key={order.id}
                        className="p-3 border border-green-200 bg-green-50 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold text-sm">{order.order_number}</p>
                          <Badge className="bg-green-100 text-green-700 text-xs">Dispatched</Badge>
                        </div>
                        <p className="text-xs text-gray-600">
                          {order.origin_airport} → {order.destination_airport}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {order.weight_kg.toLocaleString()} kg • {order.cargo_type}
                        </p>
                        {assignedFlight && (
                          <div className="mt-2 pt-2 border-t border-green-200">
                            <p className="text-xs text-gray-700">
                              <span className="font-medium">Flight:</span> {assignedFlight.flight_number}
                            </p>
                            <p className="text-xs text-gray-600">
                              {format(parseISO(assignedFlight.departure_date), "MMM d, HH:mm")}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {confirmedOrders.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No confirmed assignments yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showFlightDialog} onOpenChange={setShowFlightDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Flight to {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Cargo Details</p>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p>Route: {selectedOrder.origin_airport} → {selectedOrder.destination_airport}</p>
                  <p>Weight: {selectedOrder.weight_kg.toLocaleString()} kg</p>
                  <p>Type: {selectedOrder.cargo_type}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Available Flights</p>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {getMatchingFlights(selectedOrder).map(flight => (
                    <div key={flight.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-[#006564]">{flight.flight_number}</p>
                          <p className="text-xs text-gray-600">{flight.aircraft_type}</p>
                        </div>
                        <Badge className={statusColors[flight.status]}>
                          {flight.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        <p>Departure: {format(parseISO(flight.departure_date), "MMM d, yyyy HH:mm")}</p>
                        <p>Available: {flight.available_capacity_kg.toLocaleString()} kg</p>
                      </div>

                      <Button
                        onClick={() => handleAssignFlight(flight)}
                        className="w-full bg-[#006564] hover:bg-[#00877C]"
                        disabled={assignFlightMutation.isPending}
                      >
                        Assign to This Flight
                      </Button>
                    </div>
                  ))}

                  {getMatchingFlights(selectedOrder).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No matching flights available for the selected filters
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
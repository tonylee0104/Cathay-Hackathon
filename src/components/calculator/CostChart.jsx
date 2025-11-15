import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function CostChart({ costs }) {
  const data = [
    { name: "Trucking Cost", value: costs.trucking, color: "#006564" },
    { name: "Fuel Costs", value: costs.fuel, color: "#3B82F6" },
    { name: "Landing & Takeoff Fees", value: costs.landingFees, color: "#A855F7" },
    { name: "Cargo Handling", value: costs.cargoHandling, color: "#10B981" },
    { name: "Navigation Fees", value: costs.navigationFees, color: "#F59E0B" },
    { name: "Crew Costs", value: costs.crewCosts, color: "#EC4899" },
    { name: "Aircraft Leasing", value: costs.aircraftLeasing, color: "#6366F1" },
    { name: "Maintenance", value: costs.maintenance, color: "#14B8A6" },
    { name: "Insurance", value: costs.insurance, color: "#EF4444" },
    { name: "Customs & Admin", value: costs.customsFees, color: "#EAB308" },
    { name: "Fuel Taxes", value: costs.fuelTaxes, color: "#06B6D4" },
  ];

  const COLORS = data.map(item => item.color);

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="border-b">
        <CardTitle>Cost Distribution</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry) => (
                <span style={{ fontSize: '12px' }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
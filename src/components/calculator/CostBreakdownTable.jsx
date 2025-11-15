import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CostBreakdownTable({ costs }) {
  const airlineOperatingBreakdown = [
    { label: "Fuel Costs", value: costs.fuel, color: "text-blue-600" },
    { label: "Airport Landing & Takeoff Fees", value: costs.landingFees, color: "text-purple-600" },
    { label: "Cargo Handling & Ground Services", value: costs.cargoHandling, color: "text-green-600" },
    { label: "Navigation & Overflight Fees", value: costs.navigationFees, color: "text-orange-600" },
    { label: "Crew Costs (Flight & Loadmaster)", value: costs.crewCosts, color: "text-pink-600" },
    { label: "Aircraft Leasing / Depreciation", value: costs.aircraftLeasing, color: "text-indigo-600" },
    { label: "Maintenance (Flight-Hour Based)", value: costs.maintenance, color: "text-teal-600" },
    { label: "Insurance (Hull & Liability)", value: costs.insurance, color: "text-red-600" },
    { label: "Customs, Admin & Regulatory Fees", value: costs.customsFees, color: "text-yellow-600" },
    { label: "Into-Plane Fuel Fees & Taxes", value: costs.fuelTaxes, color: "text-cyan-600" },
  ];

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="border-b">
        <CardTitle>Cost Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Trucking Cost</h3>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700 font-medium">Trucking Services</span>
              <span className="text-lg font-bold text-[#006564]">
                ${costs.trucking.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Airline Operating Cost</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cost Category</TableHead>
                  <TableHead className="text-right">Amount (USD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {airlineOperatingBreakdown.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell className={`text-right font-semibold ${item.color}`}>
                      ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-blue-50 font-bold">
                  <TableCell>Total Airline Operating Cost</TableCell>
                  <TableCell className="text-right text-blue-600">
                    ${costs.airlineOperating.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="pt-4 border-t-2">
            <div className="flex justify-between items-center p-4 bg-[#E8F5F4] rounded-lg">
              <span className="text-xl font-bold text-gray-900">Total Internal Cost</span>
              <span className="text-2xl font-bold text-[#006564]">
                ${costs.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
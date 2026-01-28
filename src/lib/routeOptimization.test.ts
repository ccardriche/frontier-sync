import { describe, it, expect } from "vitest";
import {
  optimizeRouteNearestNeighbor,
  optimizeRouteWithConstraints,
  calculateTotalDistance,
  formatSavings,
  RouteStop,
} from "./routeOptimization";

describe("Route Optimization", () => {
  const currentLocation = { lat: 40.7128, lng: -74.006 }; // NYC

  describe("optimizeRouteNearestNeighbor", () => {
    it("returns empty result for no stops", () => {
      const result = optimizeRouteNearestNeighbor(currentLocation, []);
      expect(result.stops).toHaveLength(0);
      expect(result.totalDistanceKm).toBe(0);
    });

    it("returns single stop unchanged", () => {
      const stops: RouteStop[] = [
        { id: "1", lat: 40.72, lng: -74.01, type: "pickup" },
      ];
      const result = optimizeRouteNearestNeighbor(currentLocation, stops);
      expect(result.stops).toHaveLength(1);
      expect(result.stops[0].id).toBe("1");
    });

    it("optimizes multiple stops by distance", () => {
      // Create stops where optimal order is different from input order
      const stops: RouteStop[] = [
        { id: "far", lat: 40.8, lng: -74.1, type: "pickup" }, // Far
        { id: "near", lat: 40.715, lng: -74.008, type: "pickup" }, // Near
        { id: "medium", lat: 40.75, lng: -74.05, type: "pickup" }, // Medium
      ];
      
      const result = optimizeRouteNearestNeighbor(currentLocation, stops);
      
      // Nearest stop should be first
      expect(result.stops[0].id).toBe("near");
      expect(result.stops.length).toBe(3);
    });

    it("calculates savings correctly", () => {
      const stops: RouteStop[] = [
        { id: "1", lat: 40.8, lng: -74.1, type: "pickup" },
        { id: "2", lat: 40.715, lng: -74.008, type: "pickup" },
      ];
      
      const result = optimizeRouteNearestNeighbor(currentLocation, stops);
      
      expect(result.totalDistanceKm).toBeGreaterThan(0);
      expect(result.estimatedTimeMinutes).toBeGreaterThan(0);
    });
  });

  describe("optimizeRouteWithConstraints", () => {
    it("ensures pickup before dropoff for same job", () => {
      const stops: RouteStop[] = [
        { id: "d1", lat: 40.715, lng: -74.008, type: "dropoff", jobId: "job1" },
        { id: "p1", lat: 40.8, lng: -74.1, type: "pickup", jobId: "job1" },
      ];
      
      const result = optimizeRouteWithConstraints(currentLocation, stops);
      
      const pickupIndex = result.stops.findIndex(s => s.id === "p1");
      const dropoffIndex = result.stops.findIndex(s => s.id === "d1");
      
      expect(pickupIndex).toBeLessThan(dropoffIndex);
    });

    it("handles multiple jobs with constraints", () => {
      const stops: RouteStop[] = [
        { id: "d1", lat: 40.72, lng: -74.01, type: "dropoff", jobId: "job1" },
        { id: "p2", lat: 40.73, lng: -74.02, type: "pickup", jobId: "job2" },
        { id: "p1", lat: 40.74, lng: -74.03, type: "pickup", jobId: "job1" },
        { id: "d2", lat: 40.75, lng: -74.04, type: "dropoff", jobId: "job2" },
      ];
      
      const result = optimizeRouteWithConstraints(currentLocation, stops);
      
      // Check job1 constraint
      const p1Index = result.stops.findIndex(s => s.id === "p1");
      const d1Index = result.stops.findIndex(s => s.id === "d1");
      expect(p1Index).toBeLessThan(d1Index);
      
      // Check job2 constraint
      const p2Index = result.stops.findIndex(s => s.id === "p2");
      const d2Index = result.stops.findIndex(s => s.id === "d2");
      expect(p2Index).toBeLessThan(d2Index);
    });

    it("handles stops without jobId", () => {
      const stops: RouteStop[] = [
        { id: "1", lat: 40.72, lng: -74.01, type: "pickup" },
        { id: "2", lat: 40.73, lng: -74.02, type: "dropoff" },
      ];
      
      const result = optimizeRouteWithConstraints(currentLocation, stops);
      expect(result.stops).toHaveLength(2);
    });
  });

  describe("calculateTotalDistance", () => {
    it("returns 0 for empty stops", () => {
      expect(calculateTotalDistance(currentLocation, [])).toBe(0);
    });

    it("calculates distance for single stop", () => {
      const stops: RouteStop[] = [
        { id: "1", lat: 40.72, lng: -74.01, type: "pickup" },
      ];
      const distance = calculateTotalDistance(currentLocation, stops);
      expect(distance).toBeGreaterThan(0);
    });

    it("sums distances between consecutive stops", () => {
      const stops: RouteStop[] = [
        { id: "1", lat: 40.72, lng: -74.01, type: "pickup" },
        { id: "2", lat: 40.73, lng: -74.02, type: "pickup" },
        { id: "3", lat: 40.74, lng: -74.03, type: "pickup" },
      ];
      const distance = calculateTotalDistance(currentLocation, stops);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe("formatSavings", () => {
    it("returns optimal message for 0 savings", () => {
      const result = formatSavings({ distanceKm: 0, timeMinutes: 0, percentageSaved: 0 });
      expect(result).toBe("Route is already optimal");
    });

    it("formats km savings", () => {
      const result = formatSavings({ distanceKm: 5.5, timeMinutes: 10, percentageSaved: 15 });
      expect(result).toContain("5.5 km");
      expect(result).toContain("10 min");
      expect(result).toContain("15%");
    });

    it("formats meter savings for short distances", () => {
      const result = formatSavings({ distanceKm: 0.5, timeMinutes: 2, percentageSaved: 10 });
      expect(result).toContain("500 m");
    });
  });
});

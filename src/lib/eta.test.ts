import { describe, it, expect } from "vitest";
import {
  calculateDistance,
  estimateTravelTime,
  calculateETA,
  formatDistance,
  formatETA,
} from "./eta";

describe("ETA calculations", () => {
  describe("calculateDistance", () => {
    it("calculates distance between two points correctly", () => {
      // New York City to Los Angeles (approx 3935 km)
      const nyc = { lat: 40.7128, lng: -74.006 };
      const la = { lat: 34.0522, lng: -118.2437 };
      const distance = calculateDistance(nyc, la);
      expect(distance).toBeGreaterThan(3900);
      expect(distance).toBeLessThan(4000);
    });

    it("returns 0 for same location", () => {
      const point = { lat: 40.7128, lng: -74.006 };
      const distance = calculateDistance(point, point);
      expect(distance).toBe(0);
    });

    it("calculates short distances accurately", () => {
      // Two nearby points in Manhattan (~1.5 km apart)
      const point1 = { lat: 40.7484, lng: -73.9857 }; // Empire State Building
      const point2 = { lat: 40.7614, lng: -73.9776 }; // MoMA
      const distance = calculateDistance(point1, point2);
      expect(distance).toBeGreaterThan(1);
      expect(distance).toBeLessThan(2);
    });
  });

  describe("estimateTravelTime", () => {
    it("returns 0 for 0 distance", () => {
      expect(estimateTravelTime(0)).toBe(0);
    });

    it("returns 0 for negative distance", () => {
      expect(estimateTravelTime(-10)).toBe(0);
    });

    it("estimates urban distances with slower speeds", () => {
      // 3 km should take about 7-8 minutes at 25 km/h
      const time = estimateTravelTime(3);
      expect(time).toBeGreaterThan(5);
      expect(time).toBeLessThan(10);
    });

    it("estimates highway distances with faster speeds", () => {
      // 100 km at 65 km/h should be about 92 minutes
      const time = estimateTravelTime(100);
      expect(time).toBeGreaterThan(80);
      expect(time).toBeLessThan(110);
    });
  });

  describe("calculateETA", () => {
    it("returns null when driver location is null", () => {
      const destination = { lat: 40.7128, lng: -74.006 };
      const result = calculateETA(null, destination);
      expect(result).toBeNull();
    });

    it("returns null when destination is null", () => {
      const driver = { lat: 40.7128, lng: -74.006 };
      const result = calculateETA(driver, null);
      expect(result).toBeNull();
    });

    it("calculates ETA with all fields populated", () => {
      const driver = { lat: 40.7484, lng: -73.9857 }; // Empire State Building
      const destination = { lat: 40.7614, lng: -73.9776 }; // MoMA
      const result = calculateETA(driver, destination);

      expect(result).not.toBeNull();
      expect(result!.distanceKm).toBeGreaterThan(0);
      expect(result!.etaMinutes).toBeGreaterThan(0);
      expect(result!.etaTime).toBeInstanceOf(Date);
      expect(result!.formattedDistance).toMatch(/\d+(\.\d+)?\s*(km|m)/);
      expect(result!.formattedETA).toMatch(/\d+\s*(min|hr)/);
    });
  });

  describe("formatDistance", () => {
    it("formats short distances in meters", () => {
      expect(formatDistance(0.5)).toBe("500 m");
      expect(formatDistance(0.1)).toBe("100 m");
    });

    it("formats medium distances with one decimal", () => {
      expect(formatDistance(5.5)).toBe("5.5 km");
      expect(formatDistance(2.3)).toBe("2.3 km");
    });

    it("formats long distances as integers", () => {
      expect(formatDistance(25)).toBe("25 km");
      expect(formatDistance(100.7)).toBe("101 km");
    });
  });

  describe("formatETA", () => {
    it("formats very short times", () => {
      expect(formatETA(0.5)).toBe("< 1 min");
    });

    it("formats minutes under an hour", () => {
      expect(formatETA(30)).toBe("30 min");
      expect(formatETA(45)).toBe("45 min");
    });

    it("formats hours and minutes", () => {
      expect(formatETA(90)).toBe("1 hr 30 min");
      expect(formatETA(125)).toBe("2 hr 5 min");
    });

    it("formats exact hours", () => {
      expect(formatETA(60)).toBe("1 hr");
      expect(formatETA(120)).toBe("2 hr");
    });
  });
});

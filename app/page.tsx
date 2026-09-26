"use client";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useEffect, useMemo, useState } from "react";

import {
  Plane,
  Database,
  Server,
  Calculator,
  BarChart3,
  Search
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
type Route = {
  id: number;
  origin: string;
  destination: string;
  origin_iata: string;
  destination_iata: string;
  route_iata: string;
};

type PriceIndexFlight = {
  flight_no: string;
  airline: string;
  current_fare: number;
  base_fare: number | null;
  apix: number | null;
};

const navigation = [
  { name: "Dashboard", icon: "▦" },
  { name: "Price Index", icon: "↗" },
  { name: "Search Fares", icon: "⌕" },
  { name: "Route Comparison", icon: "⇄" },
  { name: "Reports", icon: "▤" },
  { name: "About Project", icon: "ⓘ" },
];

function formatINR(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

/* =========================================================
   ANIMATED COUNTER
========================================================= */
function AnimatedCounter({
  target,
  duration = 1500,
  suffix = "",
}: {
  target: number;
  duration?: number;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);

  // Initial animation: 0 → target
  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime;
      }

      const progress = Math.min(
        (currentTime - startTime) / duration,
        1
      );

      const easedProgress =
        1 - Math.pow(1 - progress, 3);

      setCount(Math.floor(easedProgress * target));

      if (progress < 1) {
        animationFrame =
          requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    animationFrame =
      requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [target, duration]);

  // After reaching target, increase by 1 every 2–5 seconds
  useEffect(() => {
    if (count !== target) return;

    let timer: ReturnType<typeof setTimeout>;

    const increaseCounter = () => {
      setCount((prev) => prev + 1);

      const nextDelay =
        Math.floor(Math.random() * 3000) + 2000;

      timer = setTimeout(
        increaseCounter,
        nextDelay
      );
    };

    // First increase after 2–5 seconds
    const firstDelay =
      Math.floor(Math.random() * 3000) + 2000;

    timer = setTimeout(
      increaseCounter,
      firstDelay
    );

    return () => {
      clearTimeout(timer);
    };
  }, [count === target]);

  return (
    <>
      {count.toLocaleString("en-IN")}
      {suffix}
    </>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard() {
  const [routeData, setRouteData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [origin, setOrigin] = useState("Delhi");
  const [destination, setDestination] = useState("Mumbai");

  const [routes, setRoutes] = useState<Route[]>([]);

  const [originSearch, setOriginSearch] =
    useState("Delhi");

  const [destinationSearch, setDestinationSearch] =
    useState("Mumbai");

  const [showOriginSuggestions, setShowOriginSuggestions] =
    useState(false);

  const [showDestinationSuggestions, setShowDestinationSuggestions] =
    useState(false);

  const [hoveredPoint, setHoveredPoint] =
    useState<any | null>(null);

  const totalRoutes = routes.length || 50;

  const totalFlightRecords = 4497930;

  const originOptions = useMemo(() => {
    const query = originSearch.trim().toLowerCase();

    return Array.from(
      new Map(
        routes.map((route) => [route.origin, route])
      ).values()
    )
      .filter((route) => {
        if (!query) return true;

        return [route.origin, route.origin_iata]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .slice(0, 8);
  }, [routes, originSearch]);

  const destinationOptions = useMemo(() => {
    const query = destinationSearch.trim().toLowerCase();

    return routes
      .filter((route) => route.origin === origin)
      .filter((route) => {
        if (!query) return true;

        return [route.destination, route.destination_iata]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .filter(
        (route, index, list) =>
          list.findIndex(
            (item) =>
              item.destination === route.destination
          ) === index
      )
      .slice(0, 8);
  }, [routes, origin, destinationSearch]);

  const selectedRoute = useMemo(() => {
    return routes.find(
      (route) =>
        route.origin === origin &&
        route.destination === destination
    );
  }, [routes, origin, destination]);

  /* -------------------------------------------------------
     LOAD ROUTES
  ------------------------------------------------------- */

  useEffect(() => {
    async function loadRoutes() {
      try {
        const response = await fetch("/api/routes");

        const json = await response.json();

        if (!response.ok || json.error) {
          throw new Error(
            json.error || "Unable to load routes"
          );
        }

        setRoutes(json.routes || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load routes"
        );
      }
    }

    loadRoutes();
  }, []);

  /* -------------------------------------------------------
     LOAD ROUTE DATA
  ------------------------------------------------------- */

  useEffect(() => {
    async function loadRouteData() {
      if (
        !origin ||
        !destination ||
        origin === destination
      ) {
        setRouteData([]);

        setError(
          origin === destination
            ? "Origin and destination must be different."
            : ""
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/route-data?origin=${encodeURIComponent(
            origin
          )}&destination=${encodeURIComponent(
            destination
          )}`
        );

        const json = await response.json();

        if (!response.ok || json.error) {
          throw new Error(
            json.error ||
              "Unable to load route data"
          );
        }

        setRouteData(json.data || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load data"
        );

        setRouteData([]);
      } finally {
        setLoading(false);
      }
    }

    loadRouteData();
  }, [origin, destination]);

  /* -------------------------------------------------------
     ROUTE CALCULATIONS
  ------------------------------------------------------- */

  const latest =
    routeData[routeData.length - 1];

  const first = routeData[0];

  const averageFare = useMemo(() => {
    if (!routeData.length) return 0;

    return (
      routeData.reduce(
        (sum, row) =>
          sum + Number(row.avg_fare),
        0
      ) / routeData.length
    );
  }, [routeData]);

  const priceChange =
    first && latest
      ? ((Number(latest.avg_fare) -
          Number(first.avg_fare)) /
          Number(first.avg_fare)) *
        100
      : 0;

  const minFare = routeData.length
    ? Math.min(
        ...routeData.map((row) =>
          Number(row.min_fare)
        )
      )
    : 0;

  const validApiX = routeData
    .map((row) => Number(row.route_apix))
    .filter((value) => Number.isFinite(value));

  const maxApiX = validApiX.length
    ? Math.max(...validApiX)
    : 0;

  /* -------------------------------------------------------
     GRAPH
  ------------------------------------------------------- */

  const chartPoints = useMemo(() => {
    if (!routeData.length) return "";

    const width = 800;
    const height = 260;

    const reversedData = [
      ...routeData,
    ].reverse();

    const min = Math.min(
      ...reversedData.map((r) =>
        Number(r.avg_fare)
      )
    );

    const max = Math.max(
      ...reversedData.map((r) =>
        Number(r.avg_fare)
      )
    );

    const range = max - min || 1;

    return reversedData
      .map((row, index) => {
        const x =
          (index /
            Math.max(
              reversedData.length - 1,
              1
            )) *
          width;

        const y =
          height -
          ((Number(row.avg_fare) - min) /
            range) *
            (height - 20) -
          10;

        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [routeData]);

  const chartArea = chartPoints
    ? `0,260 ${chartPoints} 800,260`
    : "";

  /* -------------------------------------------------------
     DASHBOARD STATS
  ------------------------------------------------------- */

  const stats = [
    {
      label: "Average Fare",

      value: averageFare
        ? formatINR(averageFare)
        : "—",

      change: `${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(
        1
      )}%`,

      positive: priceChange >= 0,
    },

    {
      label: "Route APIx",

      value: latest
        ? Number(latest.route_apix).toFixed(1)
        : "—",

      change: latest
        ? Number(latest.route_apix).toFixed(1)
        : "—",

      positive:
        latest?.route_apix !== null &&
        latest?.route_apix !== undefined
          ? Number(latest.route_apix) >= 100
          : true,
    },

    {
      label: "Dates Tracked",

      value: routeData.length.toString(),

      change: "T → T+60",

      positive: true,
    },

    {
      label: "Fare Records",

      value: routeData.length
        ? routeData
            .reduce(
              (sum, row) =>
                sum + Number(row.observations),
              0
            )
            .toLocaleString("en-IN")
        : "—",

      change: "observations",

      positive: true,
    },
  ];

  return (
    <>
      {/* PAGE HEADING */}

      <div className="page-heading">
        <div>
          <p className="eyebrow">OVERVIEW</p>

          <h1>Dashboard</h1>

          <p className="subtitle">
            Monitor airfare prices and market
            movements in one place.
          </p>
        </div>
      </div>

      {/* TOP COUNTER CARDS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: 18,
          marginBottom: 20,
        }}
      >
        <div
          className="panel"
          style={{
            padding: 22,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#64748b",
              marginBottom: 8,
            }}
          >
            TOTAL ROUTES
          </div>

          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.1,
            }}
          >
            <AnimatedCounter
              target={totalRoutes}
            />
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "#64748b",
            }}
          >
            Domestic directional routes
          </div>
        </div>

        <div
          className="panel"
          style={{
            padding: 22,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#64748b",
              marginBottom: 8,
            }}
          >
            TOTAL FLIGHT RECORDS
          </div>

          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.1,
            }}
          >
            <AnimatedCounter target={4497100} />
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "#64748b",
            }}
          >
            Fare observations in database
          </div>
        </div>
      </div>

      {/* SAME CITY WARNING */}

      {origin === destination && (
        <div
          className="panel"
          style={{
            marginBottom: 20,
            padding: 16,
          }}
        >
          Please select two different cities.
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div
          className="panel"
          style={{
            marginBottom: 20,
            padding: 16,
          }}
        >
          <strong>Data error:</strong>{" "}
          {error}
        </div>
      )}

      {/* ROUTE SELECTOR */}

      <div
        className="panel route-selector-panel"
        style={{
          marginBottom: 20,
          padding: 18,
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1fr) auto minmax(0, 1fr)",
          gap: 14,
          alignItems: "end",
        }}
      >
        <div style={{ position: "relative" }}>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Origin
          </label>

          <input
            value={originSearch}
            onChange={(e) => {
              setOriginSearch(e.target.value);
              setShowOriginSuggestions(true);
            }}
            onFocus={() =>
              setShowOriginSuggestions(true)
            }
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setShowOriginSuggestions(false);
              }
            }}
            placeholder="Search origin..."
            className="route-search-input"
          />

          {showOriginSuggestions && (
            <div className="route-suggestions">
              {originOptions.length > 0 ? (
                originOptions.map((route) => (
                  <button
                    key={route.origin}
                    type="button"
                    className="route-suggestion"
                    onClick={() => {
                      setOrigin(route.origin);

                      setOriginSearch(
                        `${route.origin} (${route.origin_iata})`
                      );

                      setShowOriginSuggestions(false);

                      const firstDestination =
                        routes.find(
                          (item) =>
                            item.origin ===
                              route.origin &&
                            item.destination !==
                              route.origin
                        );

                      if (firstDestination) {
                        setDestination(
                          firstDestination.destination
                        );

                        setDestinationSearch(
                          `${firstDestination.destination} (${firstDestination.destination_iata})`
                        );
                      }
                    }}
                  >
                    <span>
                      {route.origin}
                    </span>

                    <strong>
                      {route.origin_iata}
                    </strong>
                  </button>
                ))
              ) : (
                <div className="route-no-result">
                  No origin found
                </div>
              )}
            </div>
          )}
        </div>

        <div className="route-arrow">→</div>

        <div style={{ position: "relative" }}>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Destination
          </label>

          <input
            value={destinationSearch}
            onChange={(e) => {
              setDestinationSearch(
                e.target.value
              );

              setShowDestinationSuggestions(
                true
              );
            }}
            onFocus={() =>
              setShowDestinationSuggestions(true)
            }
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setShowDestinationSuggestions(
                  false
                );
              }
            }}
            placeholder="Search destination..."
            className="route-search-input"
          />

          {showDestinationSuggestions && (
            <div className="route-suggestions">
              {destinationOptions.length > 0 ? (
                destinationOptions.map((route) => (
                  <button
                    key={route.destination}
                    type="button"
                    className="route-suggestion"
                    onClick={() => {
                      setDestination(
                        route.destination
                      );

                      setDestinationSearch(
                        `${route.destination} (${route.destination_iata})`
                      );

                      setShowDestinationSuggestions(
                        false
                      );
                    }}
                  >
                    <span>
                      {route.destination}
                    </span>

                    <strong>
                      {route.destination_iata}
                    </strong>
                  </button>
                ))
              ) : (
                <div className="route-no-result">
                  No destination found for{" "}
                  {origin}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedRoute && (
          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              paddingTop: 2,
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: "#64748b",
              }}
            >
              Selected route:
            </span>

            <strong
              style={{ color: "#0f172a" }}
            >
              {selectedRoute.origin} →{" "}
              {selectedRoute.destination}
            </strong>

            <span
              style={{
                padding: "5px 10px",
                borderRadius: 7,
                background: "#eff6ff",
                color: "#0369a1",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {selectedRoute.route_iata}
            </span>
          </div>
        )}
      </div>

      {/* STATS */}

      <div className="stats-grid">
        {stats.map((stat) => (
          <div
            className="stat-card"
            key={stat.label}
          >
            <div className="stat-top">
              <span className="stat-label">
                {stat.label}
              </span>

              <span className="stat-menu">
                •••
              </span>
            </div>

            <div className="stat-value">
              {loading
                ? "Loading..."
                : stat.value}
            </div>

            <div className="stat-bottom">
              <span
                className={`change ${
                  stat.positive
                    ? "positive"
                    : "negative"
                }`}
              >
                {stat.positive ? "↑" : "↓"}{" "}
                {stat.change}
              </span>

              <span className="change-label">
                {origin} → {destination}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* GRAPH + SNAPSHOT */}

      <div className="content-grid">
        <div className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h2>
                Airfare Price Trend
              </h2>

              <p>
                {origin} → {destination} average fare
              </p>
            </div>
          </div>

          <div
            className="chart-area"
            style={{
              position: "relative",
            }}
          >
            <div className="y-axis">
              <span>
                {routeData.length
                  ? formatINR(
                      Math.max(
                        ...routeData.map(
                          (r) =>
                            Number(
                              r.avg_fare
                            )
                        )
                      )
                    )
                  : "₹—"}
              </span>

              <span>
                Average fare
              </span>
            </div>

            <div className="chart">
              <div className="grid-line line-1" />
              <div className="grid-line line-2" />
              <div className="grid-line line-3" />
              <div className="grid-line line-4" />
              <div className="grid-line line-5" />

              <svg
                className="chart-svg"
                viewBox="0 0 800 300"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="areaGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#1499e8"
                      stopOpacity="0.25"
                    />

                    <stop
                      offset="100%"
                      stopColor="#1499e8"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                {chartPoints && (
                  <>
                    <polyline
                      points={chartArea}
                      fill="url(#areaGradient)"
                      stroke="none"
                    />

                    <polyline
                      points={chartPoints}
                      fill="none"
                      stroke="#1499e8"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {[...routeData]
                      .reverse()
                      .map(
                        (
                          row,
                          index,
                          arr
                        ) => {
                          const width = 800;
                          const height = 260;

                          const min =
                            Math.min(
                              ...arr.map(
                                (r) =>
                                  Number(
                                    r.avg_fare
                                  )
                              )
                            );

                          const max =
                            Math.max(
                              ...arr.map(
                                (r) =>
                                  Number(
                                    r.avg_fare
                                  )
                              )
                            );

                          const range =
                            max - min || 1;

                          const x =
                            (index /
                              Math.max(
                                arr.length -
                                  1,
                                1
                              )) *
                            width;

                          const y =
                            height -
                            ((Number(
                              row.avg_fare
                            ) -
                              min) /
                              range) *
                              (height - 20) -
                            10;

                          return (
                            <circle
                              key={
                                row.point
                              }
                              cx={x}
                              cy={y}
                              r="7"
                              fill="#1499e8"
                              stroke="#ffffff"
                              strokeWidth="3"
                              style={{
                                cursor:
                                  "pointer",
                              }}
                              onMouseEnter={() =>
                                setHoveredPoint(
                                  row
                                )
                              }
                              onMouseLeave={() =>
                                setHoveredPoint(
                                  null
                                )
                              }
                            />
                          );
                        }
                      )}
                  </>
                )}
              </svg>

              {/* HOVER TOOLTIP */}

              {hoveredPoint && (
                <div
                  style={{
                    position:
                      "absolute",
                    top: 20,
                    right: 20,
                    background:
                      "#0f172a",
                    color: "#fff",
                    padding:
                      "12px 14px",
                    borderRadius: 10,
                    boxShadow:
                      "0 8px 24px rgba(0,0,0,0.18)",
                    fontSize: 13,
                    minWidth: 180,
                    zIndex: 10,
                    pointerEvents:
                      "none",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      marginBottom: 8,
                    }}
                  >
                    {hoveredPoint.point}
                  </div>

                  <div
                    style={{
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        opacity: 0.7,
                      }}
                    >
                      X:
                    </span>{" "}
                    {hoveredPoint.point}
                  </div>

                  <div
                    style={{
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        opacity: 0.7,
                      }}
                    >
                      Y:
                    </span>{" "}
                    {formatINR(
                      Number(
                        hoveredPoint.avg_fare
                      )
                    )}
                  </div>

                  <div
                    style={{
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        opacity: 0.7,
                      }}
                    >
                      APIx:
                    </span>{" "}
                    {Number(
                      hoveredPoint.route_apix
                    ).toFixed(2)}
                  </div>

                  <div>
                    <span
                      style={{
                        opacity: 0.7,
                      }}
                    >
                      Observations:
                    </span>{" "}
                    {Number(
                      hoveredPoint.observations
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROUTE SNAPSHOT */}

        <div className="panel market-panel">
          <div className="panel-header">
            <div>
              <h2>
                Route Snapshot
              </h2>

              <p>
                Current {origin} →{" "}
                {destination} conditions
              </p>
            </div>
          </div>

          <div className="market-item">
            <div className="market-icon blue">
              ↗
            </div>

            <div className="market-info">
              <strong>
                Average fare
              </strong>

              <span>
                Across tracked flight dates
              </span>
            </div>

            <b>
              {loading
                ? "—"
                : formatINR(
                    averageFare
                  )}
            </b>
          </div>

          <div className="market-item">
            <div className="market-icon purple">
              ✦
            </div>

            <div className="market-info">
              <strong>
                T+60 fare
              </strong>

              <span>
                Latest observed fare
              </span>
            </div>

            <b>
              {loading || !latest
                ? "—"
                : formatINR(
                    Number(
                      latest.avg_fare
                    )
                  )}
            </b>
          </div>

          <div className="market-item">
            <div className="market-icon green">
              ↓
            </div>

            <div className="market-info">
              <strong>
                Lowest fare
              </strong>

              <span>
                Observed in selected window
              </span>
            </div>

            <b>
              {loading
                ? "—"
                : formatINR(minFare)}
            </b>
          </div>

          <div className="market-item">
            <div className="market-icon orange">
              ↑
            </div>

            <div className="market-info">
              <strong>
                Peak Route APIx
              </strong>

              <span>
                Highest index in window
              </span>
            </div>

            <b>
              {loading
                ? "—"
                : maxApiX.toFixed(1)}
            </b>
          </div>
        </div>
      </div>

      {/* ROUTE TABLE */}

      <div className="panel routes-panel">
        <div className="panel-header">
          <div>
            <h2>
              {origin} → {destination}
            </h2>

            <p>
              Live data from the route API
            </p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>
                  Booking Point
                </th>

                <th>
                  Average Fare
                </th>

                <th>
                  Route APIx
                </th>

                <th>
                  Observations
                </th>

                <th>
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {routeData
                .filter((row) =>
                  [
                    0,
                    1,
                    7,
                    15,
                    30,
                    45,
                    60,
                  ].includes(
                    Number(
                      row.days_to_flight
                    )
                  )
                )
                .map((row) => {
                  const apix =
                    Number(
                      row.route_apix
                    );

                  const status =
                    apix > 105
                      ? "Rising"
                      : apix < 95
                      ? "Falling"
                      : "Stable";

                  const statusClass =
                    status.toLowerCase();

                  return (
                    <tr
                      key={
                        row.date_of_flight
                      }
                    >
                      <td>
                        <strong>
                          {row.point}
                        </strong>
                      </td>

                      <td>
                        {formatINR(
                          Number(
                            row.avg_fare
                          )
                        )}
                      </td>

                      <td>
                        {Number.isFinite(
                          apix
                        )
                          ? apix.toFixed(2)
                          : "N/A"}
                      </td>

                      <td>
                        {Number(
                          row.observations ||
                            0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td>
                        <span
                          className={`status ${statusClass}`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   PRICE INDEX
========================================================= */

function PriceIndex() {
  const [routes, setRoutes] =
    useState<Route[]>([]);

  const [origin, setOrigin] =
    useState("");

  const [destination, setDestination] =
    useState("");

  const [flightDate, setFlightDate] =
    useState("2026-09-30");

  const [flights, setFlights] =
    useState<PriceIndexFlight[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /* -------------------------------------------------------
     LOAD ROUTES
  ------------------------------------------------------- */

  useEffect(() => {
    async function loadRoutes() {
      try {
        const response = await fetch(
          "/api/routes"
        );

        const json = await response.json();

        if (!response.ok || json.error) {
          throw new Error(
            json.error ||
              "Unable to load routes"
          );
        }

        setRoutes(json.routes || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load routes"
        );
      }
    }

    loadRoutes();
  }, []);

  /* -------------------------------------------------------
     ORIGINS
  ------------------------------------------------------- */

  const origins = useMemo(() => {
    return [
      ...new Set(
        routes.map(
          (route) => route.origin
        )
      ),
    ].sort();
  }, [routes]);

  /* -------------------------------------------------------
     DESTINATIONS
  ------------------------------------------------------- */

  const destinations = useMemo(() => {
    if (!origin) return [];

    return [
      ...new Set(
        routes
          .filter(
            (route) =>
              route.origin === origin
          )
          .map(
            (route) =>
              route.destination
          )
      ),
    ].sort();
  }, [routes, origin]);

  /* -------------------------------------------------------
     LOAD PRICE INDEX
  ------------------------------------------------------- */

  async function showPriceIndex() {
    if (!origin || !destination) {
      setError(
        "Please select From and To."
      );

      return;
    }

    if (origin === destination) {
      setError(
        "From and To must be different."
      );

      return;
    }

    if (
      flightDate < "2026-09-30"
    ) {
      setError(
        "Flight date must be 30 September 2026 or later."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");
      setFlights([]);

      const response = await fetch(
        `/api/price-index?origin=${encodeURIComponent(
          origin
        )}&destination=${encodeURIComponent(
          destination
        )}&flightDate=${encodeURIComponent(
          flightDate
        )}`
      );

      const json = await response.json();

      if (!response.ok || json.error) {
        throw new Error(
          json.error ||
            "Unable to load Price Index"
        );
      }

      setFlights(
        json.flights || []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load Price Index"
      );
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------------------------------------
     CHART HEIGHT
  ------------------------------------------------------- */

  const maxApiXValue = Math.max(
    ...flights.map((flight) =>
      flight.apix === null
        ? 0
        : Number(flight.apix)
    ),
    100
  );

  return (
    <>
      {/* HEADER */}

      <div className="page-heading">
        <div>
          <p className="eyebrow">
            PRICE INDEX
          </p>

          <h1>
            Flight Price Index
          </h1>

          <p className="subtitle">
            Compare flight-level APIx for a
            selected domestic route and date.
          </p>
        </div>
      </div>

      {/* FILTERS */}

      <div
        className="panel"
        style={{
          marginBottom: 20,
          padding: 20,
          display: "flex",
          gap: 16,
          alignItems: "end",
          flexWrap: "wrap",
        }}
      >
        {/* FROM */}

        <div>
          <label
            style={{
              display: "block",
              marginBottom: 7,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            From
          </label>

          <select
            className="small-select"
            value={origin}
            onChange={(e) => {
              setOrigin(
                e.target.value
              );

              setDestination("");

              setFlights([]);
            }}
            style={{
              minWidth: 190,
            }}
          >
            <option value="">
              Select origin
            </option>

            {origins.map((city) => (
              <option
                key={city}
                value={city}
              >
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* ARROW */}

        <div
          style={{
            fontSize: 22,
            paddingBottom: 6,
          }}
        >
          →
        </div>

        {/* TO */}

        <div>
          <label
            style={{
              display: "block",
              marginBottom: 7,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            To
          </label>

          <select
            className="small-select"
            value={destination}
            disabled={!origin}
            onChange={(e) => {
              setDestination(
                e.target.value
              );

              setFlights([]);
            }}
            style={{
              minWidth: 190,
            }}
          >
            <option value="">
              Select destination
            </option>

            {destinations.map(
              (city) => (
                <option
                  key={city}
                  value={city}
                >
                  {city}
                </option>
              )
            )}
          </select>
        </div>

        {/* DATE */}

        <div>
          <label
            style={{
              display: "block",
              marginBottom: 7,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Flight Date
          </label>

          <input
            type="date"
            value={flightDate}
            min="2026-09-30"
            onChange={(e) => {
              setFlightDate(
                e.target.value
              );

              setFlights([]);
            }}
            style={{
              height: 38,
              border:
                "1px solid #cbd5e1",
              borderRadius: 8,
              padding:
                "0 12px",
              fontSize: 13,
              color: "#0f172a",
              background: "#fff",
            }}
          />
        </div>

        {/* BUTTON */}

        <button
          onClick={showPriceIndex}
          disabled={
            loading ||
            !origin ||
            !destination
          }
          style={{
            height: 38,
            border: "none",
            borderRadius: 8,
            padding:
              "0 18px",
            background:
              loading ||
              !origin ||
              !destination
                ? "#cbd5e1"
                : "#1499e8",
            color: "#fff",
            fontWeight: 700,
            cursor:
              loading ||
              !origin ||
              !destination
                ? "not-allowed"
                : "pointer",
          }}
        >
          {loading
            ? "Loading..."
            : "Show Price Index"}
        </button>
      </div>

      {/* DATE NOTE */}

      <div
        style={{
          marginBottom: 20,
          fontSize: 13,
          color: "#64748b",
        }}
      >
        Base date:{" "}
        <strong>
          1 August 2026
        </strong>{" "}
        · Selectable flight dates start
        from{" "}
        <strong>
          30 September 2026
        </strong>
      </div>

      {/* ERROR */}

      {error && (
        <div
          className="panel"
          style={{
            marginBottom: 20,
            padding: 16,
            color: "#b91c1c",
          }}
        >
          <strong>
            Data error:
          </strong>{" "}
          {error}
        </div>
      )}

      {/* RESULTS */}

      {flights.length > 0 && (
        <>
          {/* RESULT HEADER */}

          <div
            className="panel"
            style={{
              padding: 20,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                flexWrap:
                  "wrap",
                gap: 12,
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#64748b",
                    letterSpacing:
                      "0.08em",
                  }}
                >
                  SELECTED ROUTE
                </p>

                <h2
                  style={{
                    margin:
                      "5px 0 0",
                    fontSize: 24,
                    color: "#0f172a",
                  }}
                >
                  {origin} →{" "}
                  {destination}
                </h2>
              </div>

              <div
                style={{
                  textAlign:
                    "right",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: "#64748b",
                  }}
                >
                  Flight date
                </p>

                <strong
                  style={{
                    fontSize: 16,
                    color: "#0f172a",
                  }}
                >
                  {flightDate}
                </strong>
              </div>
            </div>
          </div>

          {/* APIX GRAPH */}

          <div
            className="panel"
            style={{
              padding: 22,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  color: "#0f172a",
                }}
              >
                Flight-wise APIx
              </h2>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  fontSize: 13,
                  color: "#64748b",
                }}
              >
                Each bar represents the
                APIx of a flight on the
                selected date.
              </p>
            </div>

            <div
              style={{
                overflowX:
                  "auto",
                paddingBottom:
                  10,
              }}
            >
              <div
                style={{
                  minWidth: Math.max(
                    flights.length *
                      115,
                    750
                  ),
                  height: 390,
                  display: "flex",
                  alignItems:
                    "flex-end",
                  gap: 25,
                  padding:
                    "20px 20px 0",
                  borderBottom:
                    "1px solid #e2e8f0",
                }}
              >
                {flights.map(
                  (flight) => {
                    const apix =
                      flight.apix;

                    const height =
                      apix !==
                      null
                        ? Math.max(
                            Math.min(
                              (Number(
                                apix
                              ) /
                                maxApiXValue) *
                                270,
                              270
                            ),
                            10
                          )
                        : 10;

                    return (
                      <div
                        key={`${flight.flight_no}-${flight.airline}`}
                        style={{
                          width: 75,
                          flexShrink: 0,
                          height:
                            "100%",
                          display:
                            "flex",
                          flexDirection:
                            "column",
                          alignItems:
                            "center",
                          justifyContent:
                            "flex-end",
                        }}
                      >
                        {/* APIx NUMBER */}

                        <div
                          style={{
                            marginBottom:
                              8,
                            fontSize:
                              13,
                            fontWeight:
                              800,
                            color:
                              "#0f172a",
                          }}
                        >
                          {apix !==
                          null
                            ? Number(
                                apix
                              ).toFixed(
                                2
                              )
                            : "N/A"}
                        </div>

                        {/* BAR */}

                        <div
                          title={
                            apix !==
                            null
                              ? `APIx: ${Number(
                                  apix
                                ).toFixed(
                                  2
                                )}`
                              : "APIx: N/A"
                          }
                          style={{
                            width: 42,
                            height,
                            minHeight: 10,
                            borderRadius:
                              "7px 7px 0 0",
                            background:
                              "#1499e8",
                            transition:
                              "height 0.4s ease",
                            cursor:
                              "pointer",
                          }}
                        />

                        {/* FLIGHT */}

                        <div
                          style={{
                            marginTop:
                              10,
                            textAlign:
                              "center",
                          }}
                        >
                          <div
                            style={{
                              fontSize:
                                12,
                              fontWeight:
                                800,
                              color:
                                "#0f172a",
                            }}
                          >
                            {
                              flight.flight_no
                            }
                          </div>

                          <div
                            style={{
                              marginTop:
                                3,
                              fontSize:
                                11,
                              color:
                                "#64748b",
                              maxWidth:
                                90,
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {
                              flight.airline
                            }
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* FLIGHT TABLE */}

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>
                  Flight Details
                </h2>

                <p>
                  All flights available
                  for the selected date
                </p>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>
                      Flight No
                    </th>

                    <th>
                      Airline
                    </th>

                    <th>
                      Current Fare
                    </th>

                    <th>
                      Base Fare
                    </th>

                    <th>
                      Airfare Price
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {flights.map(
                    (flight) => (
                      <tr
                        key={`${flight.flight_no}-${flight.airline}`}
                      >
                        <td>
                          <strong>
                            {
                              flight.flight_no
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            flight.airline
                          }
                        </td>

                        <td>
                          {formatINR(
                            Number(
                              flight.current_fare
                            )
                          )}
                        </td>

                        <td>
                          {flight.base_fare !==
                            null &&
                          flight.base_fare !==
                            undefined
                            ? formatINR(
                                Number(
                                  flight.base_fare
                                )
                              )
                            : "N/A"}
                        </td>

                        <td>
                          <strong>
                            {flight.apix !==
                              null &&
                            flight.apix !==
                              undefined
                              ? Number(
                                  flight.apix
                                ).toFixed(
                                  2
                                )
                              : "N/A"}
                          </strong>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* BEFORE SEARCH */}

      {!loading &&
        !error &&
        flights.length === 0 && (
          <div
            className="panel"
            style={{
              padding: 45,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 35,
                marginBottom: 10,
              }}
            >
              ↗
            </div>

            <h2
              style={{
                margin:
                  "0 0 8px",
                color:
                  "#0f172a",
              }}
            >
              Select a route and date
            </h2>

            <p
              style={{
                margin: 0,
                color:
                  "#64748b",
                fontSize: 14,
              }}
            >
              Choose From, To and Flight
              Date, then click Show Price
              Index.
            </p>
          </div>
        )}
    </>
  );
}
function SearchFares() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [flightDate, setFlightDate] = useState("2026-09-30");

  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState({
    flights_found: 0,
    lowest_fare: null as number | null,
    average_fare: null as number | null,
    highest_fare: null as number | null,
  });

  useEffect(() => {
    async function loadRoutes() {
      try {
        const response = await fetch("/api/routes");
        const json = await response.json();

        if (!response.ok || json.error) {
          throw new Error(
            json.error || "Unable to load routes"
          );
        }

        setRoutes(json.routes || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load routes"
        );
      }
    }

    loadRoutes();
  }, []);

  const origins = useMemo(() => {
    return [
      ...new Set(
        routes.map((route) => route.origin)
      ),
    ].sort();
  }, [routes]);

  const destinations = useMemo(() => {
    if (!origin) return [];

    return [
      ...new Set(
        routes
          .filter(
            (route) =>
              route.origin === origin
          )
          .map(
            (route) =>
              route.destination
          )
      ),
    ].sort();
  }, [routes, origin]);

  async function searchFares() {
    if (!origin || !destination) {
      setError(
        "Please select both From and To."
      );
      return;
    }

    if (!flightDate) {
      setError("Please select a flight date.");
      return;
    }

    if (origin === destination) {
      setError(
        "Origin and destination must be different."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setFlights([]);

      const response = await fetch(
        `/api/search-fares?origin=${encodeURIComponent(
          origin
        )}&destination=${encodeURIComponent(
          destination
        )}&flightDate=${encodeURIComponent(
          flightDate
        )}`
      );

      const json = await response.json();

      if (!response.ok || json.error) {
        throw new Error(
          json.error ||
            "Unable to load flight fares"
        );
      }

      setFlights(json.flights || []);

      setSummary({
        flights_found: Number(
          json.flights_found || 0
        ),
        lowest_fare:
          json.lowest_fare === null ||
          json.lowest_fare === undefined
            ? null
            : Number(json.lowest_fare),
        average_fare:
          json.average_fare === null ||
          json.average_fare === undefined
            ? null
            : Number(json.average_fare),
        highest_fare:
          json.highest_fare === null ||
          json.highest_fare === undefined
            ? null
            : Number(json.highest_fare),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load fares"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            SEARCH FARES
          </p>

          <h1>Search Fares</h1>

          <p className="subtitle">
            Search domestic flight fares by
            route and flight date.
          </p>
        </div>
      </div>

      {error && (
        <div
          className="panel"
          style={{
            marginBottom: 20,
            padding: 16,
            borderLeft:
              "4px solid #ef4444",
          }}
        >
          <strong>Data error:</strong>{" "}
          {error}
        </div>
      )}

      <div
        className="panel"
        style={{
          marginBottom: 20,
          padding: 24,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr 1fr auto",
            gap: 18,
            alignItems: "end",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: 13,
                fontWeight: 700,
                color: "#334155",
              }}
            >
              From
            </label>

            <select
              value={origin}
              onChange={(e) => {
                setOrigin(e.target.value);
                setDestination("");
                setFlights([]);
                setError("");
              }}
              style={{
                width: "100%",
                height: 48,
                padding: "0 14px",
                border:
                  "1px solid #cbd5e1",
                borderRadius: 8,
                background: "#ffffff",
                color: "#0f172a",
                fontSize: 14,
                fontWeight: 500,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="">
                Select origin
              </option>

              {origins.map((city) => (
                <option
                  key={city}
                  value={city}
                >
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: 13,
                fontWeight: 700,
                color: "#334155",
              }}
            >
              To
            </label>

            <select
              value={destination}
              onChange={(e) => {
                setDestination(
                  e.target.value
                );
                setFlights([]);
                setError("");
              }}
              disabled={!origin}
              style={{
                width: "100%",
                height: 48,
                padding: "0 14px",
                border:
                  "1px solid #cbd5e1",
                borderRadius: 8,
                background: origin
                  ? "#ffffff"
                  : "#f8fafc",
                color: "#0f172a",
                fontSize: 14,
                fontWeight: 500,
                outline: "none",
                cursor: origin
                  ? "pointer"
                  : "not-allowed",
              }}
            >
              <option value="">
                Select destination
              </option>

              {destinations.map((city) => (
                <option
                  key={city}
                  value={city}
                >
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: 13,
                fontWeight: 700,
                color: "#334155",
              }}
            >
              Flight Date
            </label>

            <input
              type="date"
              value={flightDate}
              min="2026-08-02"
              max="2026-09-30"
              onChange={(e) => {
                setFlightDate(
                  e.target.value
                );
                setFlights([]);
                setError("");
              }}
              style={{
                width: "100%",
                height: 48,
                padding: "0 14px",
                border:
                  "1px solid #cbd5e1",
                borderRadius: 8,
                background: "#ffffff",
                color: "#0f172a",
                fontSize: 14,
                fontWeight: 500,
                outline: "none",
              }}
            />
          </div>

          <button
            type="button"
            onClick={searchFares}
            disabled={
              loading ||
              !origin ||
              !destination ||
              !flightDate
            }
            style={{
              height: 48,
              padding: "0 24px",
              border: "none",
              borderRadius: 8,
              background:
                loading ||
                !origin ||
                !destination
                  ? "#94a3b8"
                  : "#0f4c81",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 700,
              cursor:
                loading ||
                !origin ||
                !destination
                  ? "not-allowed"
                  : "pointer",
              whiteSpace: "nowrap",
              boxShadow:
                "0 2px 5px rgba(15, 76, 129, 0.18)",
            }}
          >
            {loading
              ? "Searching..."
              : "Search Fares"}
          </button>
        </div>
      </div>

      {flights.length > 0 && (
        <>
          <div
            className="stats-grid"
            style={{
              marginBottom: 20,
            }}
          >
            <div className="stat-card">
              <div className="stat-label">
                Flights Found
              </div>

              <div className="stat-value">
                {summary.flights_found}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">
                Lowest Fare
              </div>

              <div className="stat-value">
                {summary.lowest_fare !== null
                  ? formatINR(
                      summary.lowest_fare
                    )
                  : "N/A"}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">
                Average Fare
              </div>

              <div className="stat-value">
                {summary.average_fare !== null
                  ? formatINR(
                      summary.average_fare
                    )
                  : "N/A"}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">
                Highest Fare
              </div>

              <div className="stat-value">
                {summary.highest_fare !== null
                  ? formatINR(
                      summary.highest_fare
                    )
                  : "N/A"}
              </div>
            </div>
          </div>

          <div className="panel">
            <div
              style={{
                padding: 20,
                borderBottom:
                  "1px solid #e2e8f0",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                }}
              >
                Flight Fare Results
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                {origin} → {destination} •{" "}
                {flightDate}
              </p>
            </div>

            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table>
                <thead>
                  <tr>
                    <th>Flight No</th>
                    <th>Airline</th>
                    <th>Departure</th>
                    <th>Arrival</th>
                    <th>Fare</th>
                  </tr>
                </thead>

                <tbody>
                  {flights.map(
                    (flight, index) => (
                      <tr
                        key={`${flight.flight_no}-${flight.airline}-${index}`}
                      >
                        <td>
                          <strong>
                            {
                              flight.flight_no
                            }
                          </strong>
                        </td>

                        <td>
                          {flight.airline}
                        </td>

                        <td>
                          {
                            flight.departure_time
                          }
                        </td>

                        <td>
                          {
                            flight.arrival_time
                          }
                        </td>

                        <td>
                          <strong>
                            {formatINR(
                              Number(
                                flight.price
                              )
                            )}
                          </strong>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading &&
        !error &&
        flights.length === 0 && (
          <div
            className="panel"
            style={{
              padding: 45,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 35,
                marginBottom: 10,
              }}
            >
              ⌕
            </div>

            <h2
              style={{
                margin: "0 0 8px",
                color: "#0f172a",
              }}
            >
              Search for flight fares
            </h2>

            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: 14,
              }}
            >
              Select From, To and Flight Date,
              then click Search Fares.
            </p>
          </div>
        )}

      <style jsx>{`
        .route-comparison-grid {
          width: 100%;
          min-width: 0;
        }

        .route-comparison-grid > div {
          min-width: 0;
        }

        .route-comparison-grid .field-label {
          display: block;
          margin-bottom: 7px;
          white-space: normal;
        }

        .route-comparison-grid .route-search-input {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        @media (max-width: 1100px) {
          .route-comparison-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .route-comparison-grid > button {
            grid-column: span 2;
            justify-self: start;
          }
        }

        @media (max-width: 700px) {
          .route-comparison-filter {
            padding: 14px !important;
          }

          .route-comparison-grid {
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 12px !important;
          }

          .route-comparison-grid > button {
            grid-column: auto;
            width: 100%;
            justify-self: stretch;
            margin-top: 2px;
          }

          .route-comparison-grid .field-label {
            font-size: 12px;
            line-height: 1.3;
            margin-bottom: 6px;
          }

          .route-comparison-grid .route-search-input {
            height: 46px !important;
            font-size: 14px;
          }
        }

        @media (max-width: 430px) {
          .route-comparison-filter {
            padding: 12px !important;
          }

          .route-comparison-grid {
            gap: 10px !important;
          }

          .route-comparison-grid .route-search-input {
            height: 44px !important;
          }
        }

        @media (max-width: 900px) {
          .panel > div:first-child {
            grid-template-columns: 1fr 1fr !important;
          }

          .panel > div:first-child button {
            width: 100%;
          }
        }

        @media (max-width: 600px) {
          .panel > div:first-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

/* =========================================================
   ROUTE COMPARISON
========================================================= */

type ComparisonRoute = {
  origin: string;
  destination: string;
};

type ComparisonData = {
  route: ComparisonRoute;
  apix: number | null;
  average_fare: number | null;
  min_fare: number | null;
  max_fare: number | null;
  flights_in_basket: number;
};

function RouteComparison() {
  const [routes, setRoutes] = useState<Route[]>([]);

  const [route1Origin, setRoute1Origin] = useState("");
  const [route1Destination, setRoute1Destination] =
    useState("");

  const [route2Origin, setRoute2Origin] = useState("");
  const [route2Destination, setRoute2Destination] =
    useState("");

  const [flightDate, setFlightDate] =
    useState("2026-09-15");

  const [results, setResults] = useState<
    ComparisonData[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRoutes() {
      try {
        const response = await fetch("/api/routes");

        if (!response.ok) {
          throw new Error("Unable to load routes");
        }

        const data = await response.json();

        setRoutes(data.routes || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load available routes.");
      }
    }

    loadRoutes();
  }, []);

  const origins = useMemo(() => {
    return Array.from(
      new Set(routes.map((route) => route.origin))
    ).sort();
  }, [routes]);

  const getDestinations = (origin: string) => {
    return routes
      .filter((route) => route.origin === origin)
      .map((route) => route.destination)
      .filter(
        (destination, index, array) =>
          array.indexOf(destination) === index
      )
      .sort();
  };

  async function compareRoutes() {
    setError("");

    if (
      !route1Origin ||
      !route1Destination ||
      !route2Origin ||
      !route2Destination ||
      !flightDate
    ) {
      setError(
        "Please select both routes and a flight date."
      );
      return;
    }

    if (
      route1Origin === route1Destination ||
      route2Origin === route2Destination
    ) {
      setError(
        "Origin and destination must be different."
      );
      return;
    }

    if (
      route1Origin === route2Origin &&
      route1Destination === route2Destination
    ) {
      setError(
        "Please select two different routes."
      );
      return;
    }

    setLoading(true);

    try {
      const selectedRoutes = [
        {
          origin: route1Origin,
          destination: route1Destination,
        },
        {
          origin: route2Origin,
          destination: route2Destination,
        },
      ];

      const responses = await Promise.all(
        selectedRoutes.map(async (route) => {
          const response = await fetch(
            `/api/route-data?origin=${encodeURIComponent(
              route.origin
            )}&destination=${encodeURIComponent(
              route.destination
            )}`
          );

          if (!response.ok) {
            throw new Error(
              `Unable to load ${route.origin} → ${route.destination}`
            );
          }

          return response.json();
        })
      );

      const comparisonResults: ComparisonData[] =
        responses.map((data, index) => {
          const selectedDay = (data.data || []).find(
            (row: any) =>
              row.date_of_flight === flightDate
          );

          return {
            route: selectedRoutes[index],
            apix: selectedDay?.route_apix ?? null,
            average_fare:
              selectedDay?.avg_fare ?? null,
            min_fare:
              selectedDay?.min_fare ?? null,
            max_fare:
              selectedDay?.max_fare ?? null,
            flights_in_basket:
              selectedDay?.flights_in_basket ?? 0,
          };
        });

      setResults(comparisonResults);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to compare routes."
      );

      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* HEADER */}
      <div
        style={{
          marginBottom: 22,
        }}
      >
        <p
          className="eyebrow"
          style={{ marginBottom: 6 }}
        >
          APIx
        </p>

        <h1
          style={{
            margin: 0,
            color: "#0f172a",
            fontSize: 28,
          }}
        >
          Route Comparison
        </h1>

        <p
          style={{
            margin: "7px 0 0",
            color: "#64748b",
            fontSize: 14,
          }}
        >
          Compare airfare levels and route APIx across
          selected domestic routes.
        </p>
      </div>

      {/* FILTER CARD */}
      <div
        className="panel route-comparison-filter"
        style={{
          padding: 22,
          marginBottom: 20,
        }}
      >
        <div
          className="route-comparison-grid"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr)) minmax(145px, 175px) auto",
            gap: 14,
            alignItems: "end",
          }}
        >
          {/* ROUTE 1 */}
          <div>
            <label className="field-label">
              Route 1 — From
            </label>

            <select
              value={route1Origin}
              onChange={(e) => {
                setRoute1Origin(e.target.value);
                setRoute1Destination("");
              }}
              className="route-search-input"
            >
              <option value="">
                Select origin
              </option>

              {origins.map((origin) => (
                <option
                  key={origin}
                  value={origin}
                >
                  {origin}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">
              Route 1 — To
            </label>

            <select
              value={route1Destination}
              onChange={(e) =>
                setRoute1Destination(e.target.value)
              }
              className="route-search-input"
              disabled={!route1Origin}
            >
              <option value="">
                Select destination
              </option>

              {getDestinations(route1Origin).map(
                (destination) => (
                  <option
                    key={destination}
                    value={destination}
                  >
                    {destination}
                  </option>
                )
              )}
            </select>
          </div>

          {/* ROUTE 2 */}
          <div>
            <label className="field-label">
              Route 2 — From
            </label>

            <select
              value={route2Origin}
              onChange={(e) => {
                setRoute2Origin(e.target.value);
                setRoute2Destination("");
              }}
              className="route-search-input"
            >
              <option value="">
                Select origin
              </option>

              {origins.map((origin) => (
                <option
                  key={origin}
                  value={origin}
                >
                  {origin}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">
              Route 2 — To
            </label>

            <select
              value={route2Destination}
              onChange={(e) =>
                setRoute2Destination(e.target.value)
              }
              className="route-search-input"
              disabled={!route2Origin}
            >
              <option value="">
                Select destination
              </option>

              {getDestinations(route2Origin).map(
                (destination) => (
                  <option
                    key={destination}
                    value={destination}
                  >
                    {destination}
                  </option>
                )
              )}
            </select>
          </div>

          {/* DATE */}
          <div>
            <label className="field-label">
              Flight Date
            </label>

            <input
              type="date"
              value={flightDate}
              min="2026-08-02"
              max="2026-09-30"
              onChange={(e) =>
                setFlightDate(e.target.value)
              }
              className="route-search-input"
            />
          </div>

          {/* BUTTON */}
          <button
            type="button"
            onClick={compareRoutes}
            disabled={loading}
            style={{
              height: 44,
              padding: "0 20px",
              border: "none",
              borderRadius: 9,
              background: "#0f4c81",
              color: "#ffffff",
              fontWeight: 700,
              cursor: loading
                ? "not-allowed"
                : "pointer",
              whiteSpace: "nowrap",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? "Comparing..."
              : "Compare Routes"}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: 15,
              padding: "11px 14px",
              borderRadius: 8,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* RESULTS */}
      {results.length > 0 && (
        <>
          {/* SUMMARY TABLE */}
          <div
            className="panel"
            style={{
              padding: 22,
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                margin: "0 0 16px",
                fontSize: 18,
                color: "#0f172a",
              }}
            >
              Route Metrics
            </h2>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Metric</th>

                    {results.map((result) => (
                      <th
                        key={`${result.route.origin}-${result.route.destination}`}
                      >
                        {result.route.origin} →{" "}
                        {result.route.destination}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td>
                      <strong>Flights in APIx Basket</strong>
                    </td>

                    {results.map((result) => (
                      <td key={result.route.origin + "1"}>
                        {result.flights_in_basket}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td>
                      <strong>Lowest Fare</strong>
                    </td>

                    {results.map((result) => (
                      <td key={result.route.origin + "2"}>
                        {result.min_fare !== null
                          ? formatINR(result.min_fare)
                          : "N/A"}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td>
                      <strong>Average Fare</strong>
                    </td>

                    {results.map((result) => (
                      <td key={result.route.origin + "3"}>
                        {result.average_fare !== null
                          ? formatINR(
                              result.average_fare
                            )
                          : "N/A"}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td>
                      <strong>Highest Fare</strong>
                    </td>

                    {results.map((result) => (
                      <td key={result.route.origin + "4"}>
                        {result.max_fare !== null
                          ? formatINR(result.max_fare)
                          : "N/A"}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td>
                      <strong>APIx</strong>
                    </td>

                    {results.map((result) => (
                      <td key={result.route.origin + "5"}>
                        <strong>
                          {result.apix !== null
                            ? result.apix.toFixed(2)
                            : "N/A"}
                        </strong>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* APIX VISUAL */}
          {/* APIX CHART */}
{/* APIX COMPARISON */}
<div
  className="panel"
  style={{
    padding: 22,
    marginBottom: 20,
  }}
>
  <h2
    style={{
      margin: "0 0 5px",
      fontSize: 18,
      color: "#0f172a",
    }}
  >
    APIx Comparison
  </h2>

  <p
    style={{
      margin: "0 0 20px",
      color: "#64748b",
      fontSize: 13,
    }}
  >
    Route-level APIx for the selected flight date.
  </p>

  {/* BOTH ROUTE APIX VALUES */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: 16,
      marginBottom: 24,
    }}
  >
    {results.map((result) => (
      <div
        key={`${result.route.origin}-${result.route.destination}`}
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 18,
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: "#64748b",
            marginBottom: 6,
          }}
        >
          {result.route.origin} → {result.route.destination}
        </div>

        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#1A9CFC",
          }}
        >
          {result.apix !== null
            ? result.apix.toFixed(2)
            : "—"}
        </div>

        <div
          style={{
            fontSize: 12,
            color: "#64748b",
            marginTop: 4,
          }}
        >
          APIx
        </div>
      </div>
    ))}
  </div>

  {/* BAR GRAPH */}
  <div
    style={{
      width: "100%",
      height: 360,
    }}
  >
    <ResponsiveContainer
      width="100%"
      height="100%"
    >
      <BarChart
        data={results.map((result) => ({
          route: `${result.route.origin} → ${result.route.destination}`,
          apix: result.apix ?? 0,
        }))}
        margin={{
          top: 10,
          right: 20,
          left: 10,
          bottom: 50,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis
          dataKey="route"
          angle={-20}
          textAnchor="end"
          interval={0}
        />

        <YAxis />

        <Tooltip
          formatter={(value) =>
            typeof value === "number"
              ? value.toFixed(2)
              : value
          }
        />

        <Bar
          dataKey="apix"
          name="APIx"
          fill="#1A9CFC"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>
        </>
      )}
    </div>
  );
}

/* =========================================================
   REPORTS
========================================================= */

function Reports() {
  const [routes, setRoutes] = useState<Route[]>([]);

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const [flightDate, setFlightDate] =
    useState("2026-09-15");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [reportData, setReportData] =
    useState<any>(null);

  useEffect(() => {
    async function loadRoutes() {
      try {
        const response =
          await fetch("/api/routes");

        if (!response.ok) {
          throw new Error(
            "Unable to load routes"
          );
        }

        const data =
          await response.json();

        setRoutes(data.routes || []);
      } catch (err) {
        console.error(err);
        setError(
          "Unable to load available routes."
        );
      }
    }

    loadRoutes();
  }, []);

  const originOptions = Array.from(
    new Set(
      routes.map(
        (route) => route.origin
      )
    )
  );

  const destinationOptions = Array.from(
    new Set(
      routes
        .filter(
          (route) =>
            !origin ||
            route.origin === origin
        )
        .map(
          (route) =>
            route.destination
        )
    )
  );

  async function generateReportData() {
    if (!origin || !destination) {
      setError(
        "Please select both origin and destination."
      );
      return;
    }

    if (origin === destination) {
      setError(
        "Origin and destination must be different."
      );
      return;
    }

    setLoading(true);
    setError("");
    setReportData(null);

    try {
      const response =
        await fetch(
          `/api/route-data?origin=${encodeURIComponent(
            origin
          )}&destination=${encodeURIComponent(
            destination
          )}`
        );

      if (!response.ok) {
        throw new Error(
          "Unable to load route data."
        );
      }

      const data =
        await response.json();

      const selected =
        (data.data || []).find(
          (item: any) =>
            item.date_of_flight ===
            flightDate
        );

      if (!selected) {
        throw new Error(
          "No data available for the selected flight date."
        );
      }

      setReportData({
        ...selected,
        origin,
        destination,
        flightDate,
        fullSeries: data.data || [],
      });
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate report."
      );
    } finally {
      setLoading(false);
    }
  }
async function generatePDF() {
  if (!reportData) return;

  try {
    const doc = new jsPDF();

    const pageWidth =
      doc.internal.pageSize.getWidth();

    const pageHeight =
      doc.internal.pageSize.getHeight();

    const money = (value: number | null) =>
      value === null
        ? "N/A"
        : `Rs. ${Number(value).toLocaleString(
            "en-IN"
          )}`;

    const routeName =
      `${reportData.origin}    ${reportData.destination}`;

    /*
    ========================================================
    PAGE 1 HEADER
    ========================================================
    */

    doc.setFillColor(
      15,
      23,
      42
    );

    doc.rect(
      0,
      0,
      pageWidth,
      40,
      "F"
    );

    doc.setTextColor(
      255,
      255,
      255
    );

    // Load the full Air Price Index logo for the PDF header.
    const loadLogoAsPng = () =>
      new Promise<string>((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || 64;
            canvas.height = img.naturalHeight || 64;

            const ctx = canvas.getContext("2d");

            if (!ctx) {
              reject(new Error("Unable to create logo canvas"));
              return;
            }

            ctx.drawImage(
              img,
              0,
              0,
              canvas.width,
              canvas.height
            );

            resolve(canvas.toDataURL("image/png"));
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () =>
          reject(new Error("Unable to load Air Price Index logo"));

        img.src = "/logo.png";
      });

    try {
      const logoDataUrl = await loadLogoAsPng();
      doc.addImage(
        logoDataUrl,
        "PNG",
        14,
        7,
        22,
        22
      );
    } catch (logoError) {
      console.warn(
        "Unable to add Air Price Index logo to PDF:",
        logoError
      );
    }

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(21);

    doc.text(
      "AIR PRICE INDEX",
      42,
      17
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(10);

    doc.text(
      "APIx Route Price Report",
      42,
      27
    );

    /*
    ========================================================
    ROUTE INFORMATION
    ========================================================
    */

    doc.setTextColor(
      15,
      23,
      42
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(16);

    // Draw the route arrow manually because the built-in Helvetica
    // font does not reliably render the Unicode → character.
    const routeOrigin = reportData.origin;
    const routeDestination = reportData.destination;
    const routeOriginWidth = doc.getTextWidth(routeOrigin);
    const routeDestinationWidth = doc.getTextWidth(routeDestination);
    const routeArrowGap = 10;
    const routeArrowX1 = 18 + routeOriginWidth + 4;
    const routeArrowX2 = routeArrowX1 + routeArrowGap;
    const routeY = 53;

    doc.text(routeOrigin, 18, routeY);
    doc.setLineWidth(0.7);
    doc.line(routeArrowX1, routeY - 5, routeArrowX2, routeY - 5);
    doc.line(routeArrowX2, routeY - 5, routeArrowX2 - 3, routeY - 7);
    doc.line(routeArrowX2, routeY - 5, routeArrowX2 - 3, routeY - 3);
    doc.text(
      routeDestination,
      routeArrowX2 + 5,
      routeY
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(9);

    doc.setTextColor(
      100,
      116,
      139
    );

    doc.text(
      `Flight Date: ${reportData.flightDate}`,
      18,
      62
    );

    doc.text(
      `Base Scrap Date: ${
        reportData.base_scrap_date ||
        "N/A"
      }`,
      18,
      69
    );

    doc.text(
      `As-of Scrap Date: ${
        reportData.as_of_scrap_date ||
        "N/A"
      }`,
      18,
      76
    );

    /*
    ========================================================
    APIX HIGHLIGHT
    ========================================================
    */

    doc.setFillColor(
      239,
      246,
      255
    );

    doc.roundedRect(
      18,
      85,
      pageWidth - 36,
      32,
      4,
      4,
      "F"
    );

    doc.setTextColor(
      37,
      99,
      235
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(10);

    doc.text(
      "ROUTE APIx",
      26,
      97
    );

    doc.setFontSize(22);

    doc.text(
      reportData.route_apix !== null
        ? Number(
            reportData.route_apix
          ).toFixed(2)
        : "N/A",
      26,
      108
    );

    /*
    ========================================================
    FARE SUMMARY CARDS
    ========================================================
    */

    const cardY = 127;

    const cardGap = 6;

    const cardWidth =
      (pageWidth -
        36 -
        cardGap * 2) /
      3;

    const cards = [
      {
        title: "Lowest Fare",
        value:
          reportData.min_fare !== null
            ? money(
                Number(
                  reportData.min_fare
                )
              )
            : "N/A",
      },
      {
        title: "Average Fare",
        value:
          reportData.avg_fare !== null
            ? money(
                Number(
                  reportData.avg_fare
                )
              )
            : "N/A",
      },
      {
        title: "Highest Fare",
        value:
          reportData.max_fare !== null
            ? money(
                Number(
                  reportData.max_fare
                )
              )
            : "N/A",
      },
    ];

    cards.forEach(
      (card, index) => {
        const x =
          18 +
          index *
            (cardWidth + cardGap);

        doc.setFillColor(
          248,
          250,
          252
        );

        doc.roundedRect(
          x,
          cardY,
          cardWidth,
          29,
          3,
          3,
          "F"
        );

        doc.setTextColor(
          100,
          116,
          139
        );

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(8);

        doc.text(
          card.title,
          x + 6,
          cardY + 9
        );

        doc.setTextColor(
          15,
          23,
          42
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(12);

        doc.text(
          card.value,
          x + 6,
          cardY + 21
        );
      }
    );

    /*
    ========================================================
    FARE COMPARISON
    ========================================================
    */

    let sectionY = 168;

    doc.setTextColor(
      15,
      23,
      42
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(12);

    doc.text(
      "Fare Comparison",
      18,
      sectionY
    );

    const fareValues = [
      {
        label: "Lowest",
        value:
          Number(
            reportData.min_fare || 0
          ),
      },
      {
        label: "Average",
        value:
          Number(
            reportData.avg_fare || 0
          ),
      },
      {
        label: "Highest",
        value:
          Number(
            reportData.max_fare || 0
          ),
      },
    ];

    const maxFare = Math.max(
      ...fareValues.map(
        (item) => item.value
      ),
      1
    );

    const barStartX = 50;
    const maxBarWidth = 112;

    fareValues.forEach(
      (item, index) => {
        const y =
          sectionY +
          12 +
          index * 14;

        const width =
          (item.value /
            maxFare) *
          maxBarWidth;

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(8);

        doc.setTextColor(
          71,
          85,
          105
        );

        doc.text(
          item.label,
          18,
          y + 4
        );

        doc.setFillColor(
          37,
          99,
          235
        );

        doc.roundedRect(
          barStartX,
          y - 2,
          width,
          7,
          2,
          2,
          "F"
        );

        doc.setTextColor(
          15,
          23,
          42
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(8);

        doc.text(
          money(item.value),
          barStartX +
            width +
            5,
          y + 4
        );
      }
    );

    /*
    ========================================================
    BASE VS CURRENT
    ========================================================
    */

    sectionY = 224;

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(12);

    doc.setTextColor(
      15,
      23,
      42
    );

    doc.text(
      "Base vs Current Basket Fare",
      18,
      sectionY
    );

    const baseFare =
      Number(
        reportData.base_basket_fare ||
          0
      );

    const currentFare =
      Number(
        reportData.current_basket_fare ||
          0
      );

    const basketMax =
      Math.max(
        baseFare,
        currentFare,
        1
      );

    [
      {
        label: "Base",
        value: baseFare,
      },
      {
        label: "Current",
        value: currentFare,
      },
    ].forEach(
      (item, index) => {
        const y =
          sectionY +
          12 +
          index * 16;

        const width =
          (item.value /
            basketMax) *
          maxBarWidth;

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(8);

        doc.setTextColor(
          71,
          85,
          105
        );

        doc.text(
          item.label,
          18,
          y + 4
        );

        doc.setFillColor(
          14,
          165,
          233
        );

        doc.roundedRect(
          barStartX,
          y - 2,
          width,
          7,
          2,
          2,
          "F"
        );

        doc.setTextColor(
          15,
          23,
          42
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.text(
          money(item.value),
          barStartX +
            width +
            5,
          y + 4
        );
      }
    );

    /*
    ========================================================
    APIX MOVEMENT GRAPH
    ========================================================
    */

    doc.addPage();

    sectionY = 20;

    doc.setTextColor(
      15,
      23,
      42
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(12);

    doc.text(
      "APIx Movement",
      18,
      sectionY
    );

    const series =
      (
        reportData.fullSeries ||
        []
      )
        .filter(
          (item: any) =>
            item.route_apix !== null &&
            item.route_apix !==
              undefined &&
            Number.isFinite(
              Number(
                item.route_apix
              )
            )
        )
        .slice(0, 60);

    if (series.length > 1) {
      const graphX = 30;

      const graphY =
        sectionY + 10;

      const graphWidth =
        pageWidth - 48;

      const graphHeight = 48;

      const values =
        series.map(
          (item: any) =>
            Number(
              item.route_apix
            )
        );

      let minAPIx =
        Math.min(...values);

      let maxAPIx =
        Math.max(...values);

      /*
      Add breathing room so the line
      doesn't stick to the edges.
      */

      const padding =
        Math.max(
          (maxAPIx -
            minAPIx) *
            0.15,
          2
        );

      minAPIx -= padding;
      maxAPIx += padding;

      const range =
        maxAPIx - minAPIx;

      /*
      GRID
      */

      doc.setDrawColor(
        226,
        232,
        240
      );

      doc.setLineWidth(
        0.2
      );

      const gridRows = 4;

      for (
        let i = 0;
        i <= gridRows;
        i++
      ) {
        const y =
          graphY +
          (i /
            gridRows) *
            graphHeight;

        doc.line(
          graphX,
          y,
          graphX +
            graphWidth,
          y
        );

        const value =
          maxAPIx -
          (i /
            gridRows) *
            range;

        doc.setTextColor(
          100,
          116,
          139
        );

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(7);

        doc.text(
          value.toFixed(1),
          8,
          y + 2
        );
      }

      /*
      AXES
      */

      doc.setDrawColor(
        148,
        163,
        184
      );

      doc.setLineWidth(
        0.5
      );

      doc.line(
        graphX,
        graphY,
        graphX,
        graphY +
          graphHeight
      );

      doc.line(
        graphX,
        graphY +
          graphHeight,
        graphX +
          graphWidth,
        graphY +
          graphHeight
      );

      /*
      APIx LINE
      */

      doc.setDrawColor(
        37,
        99,
        235
      );

      doc.setLineWidth(
        1.2
      );

      for (
        let i = 1;
        i < series.length;
        i++
      ) {
        const previous =
          values[i - 1];

        const current =
          values[i];

        const x1 =
          graphX +
          ((i - 1) /
            (series.length - 1)) *
            graphWidth;

        const x2 =
          graphX +
          (i /
            (series.length - 1)) *
            graphWidth;

        const y1 =
          graphY +
          graphHeight -
          ((previous -
            minAPIx) /
            range) *
            graphHeight;

        const y2 =
          graphY +
          graphHeight -
          ((current -
            minAPIx) /
            range) *
            graphHeight;

        doc.line(
          x1,
          y1,
          x2,
          y2
        );
      }

      /*
      DATA POINTS
      */

      doc.setFillColor(
        37,
        99,
        235
      );

      series.forEach(
        (item: any, i: number) => {
          const value =
            Number(
              item.route_apix
            );

          const x =
            graphX +
            (i /
              (series.length - 1)) *
              graphWidth;

          const y =
            graphY +
            graphHeight -
            ((value -
              minAPIx) /
              range) *
              graphHeight;

          /*
          Only draw every point when
          there aren't too many points.
          */

          if (
            series.length <= 30 ||
            i === 0 ||
            i ===
              series.length - 1
          ) {
            doc.circle(
              x,
              y,
              1.2,
              "F"
            );
          }
        }
      );

      /*
      X AXIS LABELS
      */

      doc.setTextColor(
        100,
        116,
        139
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(7);

      // Display the requested horizon labels in reverse order.
      // The plotted series itself remains in chronological order.
      doc.text(
        "T+60",
        graphX,
        graphY +
          graphHeight +
          9
      );

      doc.text(
        "T+0",
        graphX +
          graphWidth,
        graphY +
          graphHeight +
          9,
        {
          align: "right",
        }
      );

      /*
      SELECTED DATE MARKER
      */

      const selectedIndex =
        series.findIndex(
          (item: any) =>
            item.date_of_flight ===
            reportData.flightDate
        );

      if (
        selectedIndex >= 0
      ) {
        const selectedValue =
          values[selectedIndex];

        const selectedX =
          graphX +
          (selectedIndex /
            (series.length - 1)) *
            graphWidth;

        const selectedY =
          graphY +
          graphHeight -
          ((selectedValue -
            minAPIx) /
            range) *
            graphHeight;

        doc.setFillColor(
          220,
          38,
          38
        );

        doc.circle(
          selectedX,
          selectedY,
          2,
          "F"
        );

        doc.setTextColor(
          220,
          38,
          38
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(7);

        doc.text(
          `Selected: ${selectedValue.toFixed(
            2
          )}`,
          selectedX,
          selectedY - 5,
          {
            align: "center",
          }
        );
      }
    } else {
      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(9);

      doc.setTextColor(
        100,
        116,
        139
      );

      doc.text(
        "Insufficient APIx observations for trend chart.",
        30,
        sectionY + 25
      );
    }

    /*
    ========================================================
    ROUTE DATA DETAILS
    ========================================================
    */

    doc.setTextColor(
      15,
      23,
      42
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(16);

    doc.text(
      "Route Data Details",
      18,
      112
    );

    autoTable(doc, {
      startY: 120,

      head: [
        [
          "Metric",
          "Value",
        ],
      ],

      body: [
        [
          "Route",
          "",
        ],
        [
          "Flight Date",
          reportData.flightDate,
        ],
        [
          "Base Scrap Date",
          reportData.base_scrap_date ||
            "N/A",
        ],
        [
          "As-of Scrap Date",
          reportData.as_of_scrap_date ||
            "N/A",
        ],
        [
          "Flights in Basket",
          String(
            reportData.flights_in_basket ??
              "N/A"
          ),
        ],
        [
          "Observations",
          String(
            reportData.observations ??
              "N/A"
          ),
        ],
        [
          "Lowest Fare",
          reportData.min_fare !==
          null
            ? money(
                Number(
                  reportData.min_fare
                )
              )
            : "N/A",
        ],
        [
          "Average Fare",
          reportData.avg_fare !==
          null
            ? money(
                Number(
                  reportData.avg_fare
                )
              )
            : "N/A",
        ],
        [
          "Highest Fare",
          reportData.max_fare !==
          null
            ? money(
                Number(
                  reportData.max_fare
                )
              )
            : "N/A",
        ],
        [
          "Base Basket Fare",
          reportData.base_basket_fare !==
          null
            ? money(
                Number(
                  reportData.base_basket_fare
                )
              )
            : "N/A",
        ],
        [
          "Current Basket Fare",
          reportData.current_basket_fare !==
          null
            ? money(
                Number(
                  reportData.current_basket_fare
                )
              )
            : "N/A",
        ],
        [
          "APIx",
          reportData.route_apix !==
          null
            ? Number(
                reportData.route_apix
              ).toFixed(2)
            : "N/A",
        ],
      ],

      theme: "grid",

      styles: {
        font: "helvetica",
        fontSize: 8.5,
        cellPadding: 4,
      },

      headStyles: {
        font: "helvetica",
        fontStyle: "bold",
        fillColor: [
          15,
          23,
          42,
        ],
        textColor: [
          255,
          255,
          255,
        ],
      },

      alternateRowStyles: {
        fillColor: [
          248,
          250,
          252,
        ],
      },

      didDrawCell: (data: any) => {
        if (
          data.section === "body" &&
          data.row.index === 0 &&
          data.column.index === 1
        ) {
          const cell = data.cell;
          const y = cell.y + cell.height / 2 + 2.8;
          const x = cell.x + 5;
          const originWidth = doc.getTextWidth(routeOrigin);
          const arrowStart = x + originWidth + 4;
          const arrowEnd = arrowStart + 9;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(51, 65, 85);
          doc.text(routeOrigin, x, y);
          doc.setLineWidth(0.55);
          doc.line(arrowStart, y - 2.5, arrowEnd, y - 2.5);
          doc.line(arrowEnd, y - 2.5, arrowEnd - 2.2, y - 4);
          doc.line(arrowEnd, y - 2.5, arrowEnd - 2.2, y - 1);
          doc.text(
            routeDestination,
            arrowEnd + 4,
            y
          );
        }
      },
    });

    const finalY =
      (doc as any)
        .lastAutoTable
        ?.finalY || 100;

    /*
    ========================================================
    METHODOLOGY
    ========================================================
    */

    // Keep methodology on a clean page so it never collides
    // with the route-detail table or footer.
    doc.addPage();

    doc.setTextColor(
      15,
      23,
      42
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(18);

    doc.text(
      "APIx Methodology",
      18,
      24
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(10);

    doc.setTextColor(
      71,
      85,
      105
    );

    const methodologyIntro =
      "APIx is a route-level airfare price index. It measures how the total fare of the selected flight basket has changed relative to the applicable base-date fare.";

    const introLines = doc.splitTextToSize(
      methodologyIntro,
      pageWidth - 36
    );

    doc.text(
      introLines,
      18,
      36
    );

    // Formula box
    doc.setFillColor(
      239,
      246,
      255
    );
    doc.setDrawColor(
      191,
      219,
      254
    );
    doc.roundedRect(
      18,
      52,
      pageWidth - 36,
      28,
      3,
      3,
      "FD"
    );

    doc.setFont(
      "helvetica",
      "bold"
    );
    doc.setFontSize(11);
    doc.setTextColor(
      37,
      99,
      235
    );

    doc.text(
      "APIx = (Current Basket Fare / Base Basket Fare) x 100",
      pageWidth / 2,
      69,
      { align: "center" }
    );

    // Method steps
    const methodSteps = [
      [
        "1. Select the flight-date basket",
        "All flights available for the selected route and flight date are included in the basket when a matching base observation exists.",
      ],
      [
        "2. Establish the base fare",
        "For the selected flight date, the applicable base observation is used: 1 August 2026 for dates through 1 October 2026; after that, the base is 60 days before the flight date.",
      ],
      [
        "3. Measure the current fare",
        "For each flight in the basket, the latest available fare observation on or before the report as-of date is used. The individual flight fares are summed to obtain the current basket fare.",
      ],
      [
        "4. Calculate and interpret APIx",
        "The current basket fare is divided by the base basket fare and multiplied by 100. APIx = 100 means no change from base; above 100 indicates a higher fare; below 100 indicates a lower fare.",
      ],
    ];

    let methodY = 94;

    for (const [title, body] of methodSteps) {
      doc.setFillColor(
        248,
        250,
        252
      );
      doc.setDrawColor(
        226,
        232,
        240
      );
      doc.roundedRect(
        18,
        methodY,
        pageWidth - 36,
        35,
        2,
        2,
        "FD"
      );

      doc.setFont(
        "helvetica",
        "bold"
      );
      doc.setFontSize(10);
      doc.setTextColor(
        15,
        23,
        42
      );
      doc.text(
        title,
        24,
        methodY + 9
      );

      doc.setFont(
        "helvetica",
        "normal"
      );
      doc.setFontSize(8.5);
      doc.setTextColor(
        71,
        85,
        105
      );

      const bodyLines = doc.splitTextToSize(
        body,
        pageWidth - 48
      );

      doc.text(
        bodyLines,
        24,
        methodY + 18
      );

      methodY += 41;
    }

    doc.setFont(
      "helvetica",
      "bold"
    );
    doc.setFontSize(10);
    doc.setTextColor(
      15,
      23,
      42
    );
    doc.text(
      "Reading the index",
      18,
      methodY + 4
    );

    doc.setFont(
      "helvetica",
      "normal"
    );
    doc.setFontSize(9);
    doc.setTextColor(
      71,
      85,
      105
    );

    const readingLines = doc.splitTextToSize(
      "Example: APIx 134.83 means the current basket fare is 34.83% higher than the applicable base basket fare for that route and flight date.",
      pageWidth - 36
    );

    doc.text(
      readingLines,
      18,
      methodY + 14
    );

    /*
    ========================================================
    FOOTER
    ========================================================
    */

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(7);

    doc.setTextColor(
      148,
      163,
      184
    );

    doc.text(
      "Air Price Index • APIx",
      18,
      pageHeight - 12
    );

    doc.text(
      `Generated: ${new Date().toLocaleDateString(
        "en-IN"
      )}`,
      pageWidth - 18,
      pageHeight - 12,
      {
        align: "right",
      }
    );

    /*
    ========================================================
    SAVE
    ========================================================
    */

    doc.save(
      `APIx_Report_${origin}_${destination}_${flightDate}.pdf`
    );
  } catch (error) {
    console.error(
      "PDF generation error:",
      error
    );

    setError(
      "Unable to generate PDF. Please try again."
    );
  }
  }

  return (
    <>
      {/* REPORT HEADER */}

      <div
        style={{
          marginBottom: 22,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#2563eb",
            marginBottom: 6,
          }}
        >
          APIx REPORTS
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 28,
            color: "#0f172a",
          }}
        >
          Generate Route Report
        </h1>

        <p
          style={{
            margin:
              "7px 0 0",
            color: "#64748b",
            fontSize: 14,
          }}
        >
          Generate a detailed PDF report with
          fare analysis and APIx charts.
        </p>
      </div>

      {/* REPORT CONTROLS */}

      <div
        className="panel"
        style={{
          padding: 22,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: 16,
          }}
        >
          {/* FROM */}

          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: "#475569",
                marginBottom: 7,
              }}
            >
              From
            </label>

            <select
              value={origin}
              onChange={(e) => {
                setOrigin(
                  e.target.value
                );
                setDestination("");
                setReportData(null);
              }}
              style={{
                width: "100%",
                height: 46,
                border:
                  "1px solid #cbd5e1",
                borderRadius: 9,
                padding:
                  "0 12px",
                fontSize: 14,
                background:
                  "#ffffff",
              }}
            >
              <option value="">
                Select origin
              </option>

              {originOptions.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>

          {/* TO */}

          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: "#475569",
                marginBottom: 7,
              }}
            >
              To
            </label>

            <select
              value={destination}
              onChange={(e) => {
                setDestination(
                  e.target.value
                );
                setReportData(null);
              }}
              style={{
                width: "100%",
                height: 46,
                border:
                  "1px solid #cbd5e1",
                borderRadius: 9,
                padding:
                  "0 12px",
                fontSize: 14,
                background:
                  "#ffffff",
              }}
            >
              <option value="">
                Select destination
              </option>

              {destinationOptions.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>

          {/* DATE */}

          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: "#475569",
                marginBottom: 7,
              }}
            >
              Flight Date
            </label>

            <input
              type="date"
              value={flightDate}
              min="2026-08-02"
              max="2026-09-30"
              onChange={(e) => {
                setFlightDate(
                  e.target.value
                );
                setReportData(null);
              }}
              style={{
                width: "100%",
                height: 46,
                border:
                  "1px solid #cbd5e1",
                borderRadius: 9,
                padding:
                  "0 12px",
                fontSize: 14,
                background:
                  "#ffffff",
              }}
            />
          </div>
        </div>

        {error && (
          <div
            style={{
              marginTop: 15,
              padding: 12,
              borderRadius: 8,
              background: "#fef2f2",
              color: "#b91c1c",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={generateReportData}
          disabled={loading}
          style={{
            marginTop: 18,
            height: 46,
            padding:
              "0 22px",
            border: "none",
            borderRadius: 9,
            background: "#2563eb",
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 700,
            cursor: loading
              ? "not-allowed"
              : "pointer",
            opacity: loading
              ? 0.7
              : 1,
          }}
        >
          {loading
            ? "Generating..."
            : "Generate Report"}
        </button>
      </div>

      {/* REPORT PREVIEW */}

      {reportData && (
        <div
          className="panel"
          style={{
            padding: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: 15,
              marginBottom: 20,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  marginBottom: 4,
                }}
              >
                Report ready
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  color: "#0f172a",
                }}
              >
                {origin} → {destination}
              </h2>
            </div>

            <button
              onClick={generatePDF}
              style={{
                height: 44,
                padding:
                  "0 20px",
                border: "none",
                borderRadius: 9,
                background:
                  "#0f172a",
                color:
                  "#ffffff",
                fontSize: 13,
                fontWeight: 700,
                cursor:
                  "pointer",
              }}
            >
              Download PDF
            </button>
          </div>

          {/* SUMMARY */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 22,
            }}
          >
            {[
              [
                "APIx",
                reportData.route_apix !==
                null
                  ? Number(
                      reportData.route_apix
                    ).toFixed(2)
                  : "N/A",
              ],
              [
                "Lowest",
                reportData.min_fare !==
                null
                  ? formatINR(
                      Number(
                        reportData.min_fare
                      )
                    )
                  : "N/A",
              ],
              [
                "Average",
                reportData.avg_fare !==
                null
                  ? formatINR(
                      Number(
                        reportData.avg_fare
                      )
                    )
                  : "N/A",
              ],
              [
                "Highest",
                reportData.max_fare !==
                null
                  ? formatINR(
                      Number(
                        reportData.max_fare
                      )
                    )
                  : "N/A",
              ],
            ].map(
              ([label, value]) => (
                <div
                  key={label}
                  style={{
                    padding: 15,
                    border:
                      "1px solid #e2e8f0",
                    borderRadius: 10,
                    background:
                      "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                    }}
                  >
                    {label}
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      fontSize: 20,
                      fontWeight: 800,
                      color:
                        label ===
                        "APIx"
                          ? "#2563eb"
                          : "#0f172a",
                    }}
                  >
                    {value}
                  </div>
                </div>
              )
            )}
          </div>

          <div
            style={{
              padding: 15,
              borderRadius: 10,
              background: "#eff6ff",
              color: "#475569",
              fontSize: 13,
            }}
          >
            Click <strong>Download PDF</strong>{" "}
            to generate the complete APIx report
            with fare charts, APIx movement and
            methodology.
          </div>
        </div>
      )}
    </>
  );
}
function AboutProject() {
  const workflow = [
  {
    icon: Plane,
    title: "Airfare Collection",
    description:
      "Collect route-level airfare observations from online airline and OTA sources."
  },
  {
    icon: Search,
    title: "Data Cleaning",
    description:
      "Clean, validate and standardize fare, route, date and flight-level records."
  },
  {
    icon: Database,
    title: "Database Storage",
    description:
      "Store structured airfare observations for historical analysis and retrieval."
  },
  {
    icon: Server,
    title: "API Layer",
    description:
      "Expose processed airfare and route data through REST API endpoints."
  },
  {
    icon: Calculator,
    title: "APIx Calculation",
    description:
      "Convert route-level airfare observations into index values for analysis."
  },
  {
    icon: BarChart3,
    title: "Dashboard & Reports",
    description:
      "Visualize price movement through dashboards, comparisons and downloadable reports."
  }
];

  const technologies = [
    "Next.js",
    "React",
    "TypeScript",
    "Python",
    "Web Scraping",
    "SQL",
    "REST API",
    "Vercel",
    "Statistics",
    "Data Visualization",
  ];

  const team = [
    {
      name: "Souhali Reang",
      role: "Team Leader · Graphic Designer & Documentation",
      photo: "/team/souhali.jpeg",
      github: "https://github.com/souhalireang-ai",
      linkedin: "https://www.linkedin.com/in/souhali-reang-652197385",
      testimonial:
        "Leading the project while maintaining its visual identity and documentation.",
      learning:
        "Leadership, visual communication, documentation and project coordination.",
    },
    {
      name: "Ashish",
      role: "Web Scraping · Automation · Statistics · SQL · Backend & Research",
      photo: "/team/ashish.jpeg",
      github: "https://github.com/ashish-accesss",
      linkedin: "https://www.linkedin.com/in/ashish-access/",
      testimonial:
        "Focused on connecting automated data collection with the complete backend workflow.",
      learning:
        "Web scraping, automation, APIs, SQL, statistics and backend development.",
    },
    {
      name: "Aman Raj",
      role: "Frontend UI · Research · Testing & Documentation",
      photo: "/team/aman.jpeg",
      github: "https://github.com/LexusR27",
      linkedin: "https://www.linkedin.com/in/aman-raj-a90158381/",
      testimonial:
        "Focused on making complex airfare information easier to understand and test.",
      learning:
        "Frontend development, responsive UI, testing, research and documentation.",
    },
    {
      name: "Shivam Singh",
      role: "Research & Methodology · Statistics",
      photo: "/team/shivam.jpeg",
      github: "https://github.com/shivamgov13-pixel",
      linkedin: "https://www.linkedin.com/in/shivam-singh-a84592381",
      testimonial:
        "Focused on the statistical and methodological foundation of the index.",
      learning:
        "Statistical analysis, index methodology and research interpretation.",
    },
    {
      name: "Vineet Lunthi",
      role: "Full Stack Developer & Optimization",
      photo: "/team/vineet.jpeg",
      github: "https://github.com/vineet1513",
      linkedin: "https://www.linkedin.com/in/vineetlunthi/",
      testimonial:
        "Focused on integrating different parts of the platform into one system.",
      learning:
        "Full-stack development, system integration and performance optimization.",
    },
    {
      name: "Satyam Singh",
      role: "Data & Database · SQL & Designing",
      photo: "/team/satyam.jpeg",
      github: "https://github.com/satyamsingh134",
      linkedin: "https://www.linkedin.com/in/satyam-singh-922799391",
      testimonial:
        "Focused on organizing airfare data and building a reliable database structure.",
      learning:
        "Database design, SQL, data organization and system structuring.",
    },
  ];

  return (
    <div className="about-project-page">
      <style jsx>{`
        .about-project-page {
          color: #0f172a;
        }

        .about-hero {
          border-radius: 22px;
          padding: 34px;
          margin-bottom: 20px;
          background: linear-gradient(
            135deg,
            #0f172a,
            #172554 55%,
            #0369a1
          );
          color: #fff;
        }

        .about-hero h1 {
          margin: 16px 0 10px;
          font-size: clamp(30px, 4vw, 48px);
        }

        .about-hero p {
          margin: 0;
          color: #dbeafe;
          line-height: 1.75;
        }

        .about-kicker {
          display: inline-flex;
          padding: 7px 11px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
        }

        .about-section {
          margin-top: 20px;
        }

        .about-heading {
          margin-bottom: 13px;
        }

        .about-heading span {
          display: block;
          color: #2563eb;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
        }

        .about-heading h2 {
          margin: 5px 0;
          font-size: 22px;
        }

        .about-grid {
          display: grid;
          grid-template-columns: 1.4fr 0.6fr;
          gap: 18px;
        }

        .about-card,
        .workflow-card,
        .team-card {
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 8px 25px rgba(15, 23, 42, 0.05);
        }

        .about-card {
          padding: 22px;
        }

        .about-card p {
          margin: 0;
          color: #475569;
          font-size: 14px;
          line-height: 1.75;
        }

        .about-points {
          display: grid;
          gap: 10px;
        }

        .about-point {
          padding: 12px;
          border-radius: 12px;
          background: #f8fafc;
        }

        .about-point strong {
          display: block;
          font-size: 13px;
        }

        .about-point small {
          color: #64748b;
          font-size: 11px;
        }

        .workflow-grid,
        .team-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 13px;
        }

        .workflow-card {
          padding: 19px;
          min-height: 130px;
        }

        .workflow-number {
          color: #2563eb;
          font-size: 11px;
          font-weight: 900;
        }

        .workflow-card h3 {
          margin: 12px 0 7px;
          font-size: 15px;
        }

        .workflow-card p {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.65;
        }

        .tech-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .tech-pill {
          padding: 9px 12px;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 700;
        }

        .team-card {
          overflow: hidden;
        }

        .team-top {
          display: flex;
          gap: 13px;
          align-items: center;
          padding: 18px;
        }

        .team-photo {
          width: 62px;
          height: 62px;
          border-radius: 16px;
          object-fit: cover;
        }

        .team-name {
          margin: 0;
          font-size: 15px;
        }

        .team-role {
          margin-top: 4px;
          color: #2563eb;
          font-size: 11px;
          font-weight: 700;
        }

        .team-body {
          padding: 0 18px 18px;
        }

        .team-quote {
          margin: 0;
          color: #475569;
          font-size: 12px;
          line-height: 1.6;
          font-style: italic;
        }

        .team-learning {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
        }

        .team-learning strong {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
        }

        .team-learning p {
          margin: 4px 0 0;
          color: #334155;
          font-size: 11px;
          line-height: 1.55;
        }

        .team-links {
          display: flex;
          gap: 8px;
          margin-top: 13px;
        }

        .team-link {
          text-decoration: none;
          padding: 7px 9px;
          border-radius: 8px;
          background: #f8fafc;
          color: #334155;
          border: 1px solid #e2e8f0;
          font-size: 10px;
          font-weight: 700;
        }

        .about-footer {
          margin-top: 20px;
          padding: 18px 20px;
          border-radius: 16px;
          background: #0f172a;
          color: #cbd5e1;
          font-size: 12px;
          line-height: 1.65;
        }

        @media (max-width: 950px) {
          .team-grid,
          .workflow-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .about-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .about-hero {
            padding: 24px 19px;
          }

          .about-hero h1 {
            font-size: 31px;
          }

          .about-grid,
          .workflow-grid,
          .team-grid {
            grid-template-columns: 1fr;
          }

          .about-card {
            padding: 18px;
          }
        }
      `}</style>

      <div className="about-hero">
        <span className="about-kicker">ABOUT THE PROJECT</span>

        <h1>Air Price Index · APIx</h1>

        <p>
          A data-driven platform designed to collect, process and analyse
          dynamic airfare information and convert route-level fare
          observations into a practical price-index workflow.
        </p>
      </div>

      <div className="about-section">
        <div className="about-heading">
          <span>PROJECT OVERVIEW</span>
          <h2>From airfare data to price intelligence</h2>
        </div>

        <div className="about-grid">
          <div className="about-card">
            <p>
              APIx brings together automated airfare collection, data
              processing, database storage, API delivery, index calculation,
              dashboards and downloadable reports in one workflow. The
              platform makes route-level airfare movement easier to observe,
              compare and analyse over time.
            </p>
          </div>

          <div className="about-card about-points">
            <div className="about-point">
              <strong>↗ Dynamic Fare Data</strong>
              <small>Route and flight-level observations</small>
            </div>

            <div className="about-point">
              <strong>Σ APIx Calculation</strong>
              <small>Basket-based route price index</small>
            </div>

            <div className="about-point">
              <strong>▤ Reports & Analytics</strong>
              <small>Charts, comparisons and PDF reports</small>
            </div>
          </div>
        </div>
      </div>

      <div className="about-section">
        <div className="about-heading">
          <span>WORKING FLOW</span>
          <h2>How the platform works</h2>
        </div>

        <div className="workflow-grid">
          {workflow.map(({ icon: Icon, title, description }) => (
  <div className="workflow-card" key={title}>
    
    <div className="workflow-icon">
      <Icon size={23} strokeWidth={2} />
    </div>

    <h3>{title}</h3>

    <p>{description}</p>

  </div>
))}
        </div>
      </div>

      <div className="about-section">
        <div className="about-heading">
          <span>TECHNOLOGY STACK</span>
          <h2>Technologies used</h2>
        </div>

        <div className="about-card">
          <div className="tech-grid">
            {technologies.map((technology) => (
              <span className="tech-pill" key={technology}>
                {technology}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="about-section">
        <div className="about-heading">
          <span>CONTRIBUTING MEMBERS</span>
          <h2>Meet the project team</h2>
        </div>

        <div className="team-grid">
          {team.map((member) => (
            <article className="team-card" key={member.name}>
              <div className="team-top">
                <img
                  className="team-photo"
                  src={member.photo}
                  alt={`${member.name} profile`}
                />

                <div>
                  <h3 className="team-name">{member.name}</h3>
                  <div className="team-role">{member.role}</div>
                </div>
              </div>

              <div className="team-body">
                <p className="team-quote">
                  “{member.testimonial}”
                </p>

                <div className="team-learning">
                  <strong>Learning</strong>
                  <p>{member.learning}</p>
                </div>

                <div className="team-links">
                  <a
                    className="team-link"
                    href={member.github}
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub ↗
                  </a>

                  <a
                    className="team-link"
                    href={member.linkedin}
                    target="_blank"
                    rel="noreferrer"
                  >
                    LinkedIn ↗
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN APP
========================================================= */

export default function Home() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <main className="app-shell">
      <style jsx global>{`
        .route-search-input {
          width: 100%;
          height: 44px;
          padding: 0 13px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          outline: none;
          background: #ffffff;
          color: #0f172a;
          font-size: 14px;
          box-sizing: border-box;
        }

        .route-search-input:focus {
          border-color: #1499e8;
          box-shadow: 0 0 0 3px rgba(20, 153, 232, 0.10);
        }

        .route-suggestions {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          z-index: 100;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.14);
          overflow: hidden;
          max-height: 280px;
          overflow-y: auto;
        }

        .route-suggestion {
          width: 100%;
          border: none;
          border-bottom: 1px solid #f1f5f9;
          background: #ffffff;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          text-align: left;
          cursor: pointer;
          color: #0f172a;
          font-size: 14px;
        }

        .route-suggestion:hover {
          background: #f8fafc;
        }

        .route-suggestion strong {
          color: #0284c7;
          font-size: 12px;
        }

        .route-no-result {
          padding: 14px;
          color: #64748b;
          font-size: 13px;
        }

        html,
        body {
          max-width: 100%;
          overflow-x: hidden;
        }

        .app-shell,
        .main-content,
        .page-content {
          min-width: 0;
          max-width: 100%;
        }

        .chart,
        .chart-area,
        .chart-panel,
        .content-grid,
        .stats-grid,
        .panel {
          min-width: 0;
        }

        .chart-svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        @media (max-width: 900px) {
          .sidebar {
            width: 220px;
          }

          .main-content {
            margin-left: 220px;
          }

          .stats-grid {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            );
          }

          .content-grid {
            grid-template-columns: 1fr;
          }
        }

        .mobile-menu-button {
          display: none;
          border: 0;
          background: transparent;
          color: #0f172a;
          width: 42px;
          height: 42px;
          border-radius: 10px;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          line-height: 1;
          cursor: pointer;
          flex: 0 0 auto;
        }

        .mobile-menu-button:hover {
          background: #f1f5f9;
        }

        .mobile-brand {
          display: none;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          color: #0f172a;
          font-size: 18px;
        }

        .mobile-brand span {
          color: #0284c7;
        }

        .mobile-menu-overlay {
          display: none;
        }

        .mobile-sidebar-close {
          display: none;
        }

        @media (max-width: 700px) {
          .sidebar {
            display: flex !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            width: min(290px, 86vw) !important;
            max-width: 290px !important;
            height: 100dvh !important;
            z-index: 1001 !important;
            transform: translateX(-105%) !important;
            transition: transform 220ms ease !important;
            overflow-y: auto !important;
            box-shadow: 18px 0 45px rgba(15, 23, 42, 0.18) !important;
          }

          .sidebar.mobile-open {
            transform: translateX(0) !important;
          }

          .mobile-sidebar-close {
            display: flex !important;
            position: absolute;
            top: 14px;
            right: 14px;
            width: 38px;
            height: 38px;
            align-items: center;
            justify-content: center;
            border: 0;
            border-radius: 10px;
            background: #f1f5f9;
            color: #0f172a;
            font-size: 18px;
            cursor: pointer;
            z-index: 2;
          }

          .mobile-menu-overlay {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 1000;
            background: rgba(15, 23, 42, 0.45);
            backdrop-filter: blur(2px);
          }

          .main-content {
            margin-left: 0 !important;
            width: 100% !important;
            min-width: 0 !important;
          }

          .topbar {
            min-height: 60px !important;
            height: auto !important;
            padding: 9px 12px !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            position: sticky !important;
            top: 0 !important;
            z-index: 900 !important;
          }

          .mobile-menu-button {
            display: flex !important;
          }

          .mobile-brand {
            display: flex !important;
            min-width: 0;
          }

          .mobile-brand span {
            font-size: 20px;
          }

          .topbar-right {
            margin-left: auto !important;
            min-width: 0 !important;
            gap: 6px !important;
          }

          .profile {
            min-width: 0 !important;
          }

          .profile > div:nth-child(2) {
            display: none !important;
          }

          .profile > span {
            display: none !important;
          }

          .page-content {
            width: 100% !important;
            max-width: 100% !important;
            padding: 16px 12px 30px !important;
            box-sizing: border-box !important;
          }

          .page-heading {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
          }

          .stats-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          .content-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          .route-selector-panel {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .route-arrow {
            display: none !important;
          }

          .chart-panel,
          .panel,
          .card,
          .table-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
            overflow-x: auto !important;
          }

          .chart-area,
          .chart {
            width: 100% !important;
            min-width: 0 !important;
            overflow: hidden !important;
          }

          .chart-area svg,
          .chart svg {
            max-width: 100% !important;
          }

          .connection {
            display: none !important;
          }

          .notification {
            display: none !important;
          }

          .navigation {
            padding-bottom: 20px !important;
          }

          .nav-item {
            min-height: 48px !important;
            width: 100% !important;
          }

          .sidebar-bottom {
            margin-top: auto !important;
            padding-bottom: 18px !important;
          }

          input,
          select,
          button {
            max-width: 100%;
          }

          table {
            min-width: 620px;
          }
        }

        @media (max-width: 430px) {
          .page-content {
            padding: 14px 10px 24px !important;
          }

          .stat-value {
            font-size: 28px;
          }

          .mobile-brand {
            font-size: 16px;
          }

          .mobile-menu-button {
            width: 40px;
            height: 40px;
            font-size: 24px;
          }

          .avatar {
            width: 34px !important;
            height: 34px !important;
          }
        }

      `}</style>

      {/* =================================================
          MOBILE MENU OVERLAY
      ================================================= */}
      {mobileMenuOpen && (
        <button
          type="button"
          className="mobile-menu-overlay"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`sidebar ${
          mobileMenuOpen ? "mobile-open" : ""
      }`}
    >
        <div className="brand">
          <div className="brand-mark">
            ✈
          </div>

          <div className="brand-name">
            APIx
          </div>

          <div className="brand-subtitle">
            INDEX
          </div>
        </div>

        <button
          type="button"
          className="mobile-sidebar-close"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
        >
          ✕
        </button>

        <div className="nav-section-label">
          MAIN MENU
        </div>

        <nav className="navigation">
          {navigation.map((item) => (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => {
                  setActivePage(item.name);
                  setMobileMenuOpen(false);
                }}
              >
                <span className="nav-icon">
                  {item.icon}
                </span>

                <span>{item.name}</span>
              </button>
            ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="live-status">
            <span className="live-dot" />

            <div>
              <strong>
                Database is Live
              </strong>

              <small>
                Connection is live ...
              </small>
            </div>
          </div>

          <div className="sidebar-version">
            APIx v1.0
          </div>
        </div>
      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <section className="main-content">
        {/* TOP BAR */}

        <header className="topbar">
          <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
          >
            ☰
          </button>
          <div className="mobile-brand">
            <span>✈</span>
            APIx
          </div>

          <div className="topbar-right">
            <div className="connection">
              <span className="connection-dot" />
              APIx Live
            </div>

            <button className="notification">
              ♧
            </button>

            <div className="profile">
              <div className="avatar">
                U
              </div>

              <div>
                <strong>
                  Algo-Rythm (NIT Agartala)
                </strong>

                <small>
                  (User)
                </small>
              </div>

              <span></span>
            </div>
          </div>
        </header>

        {/* PAGE */}

        <div className="page-content">
  {activePage === "Dashboard" && (
  <Dashboard />
)}

{activePage === "Price Index" && (
  <PriceIndex />
)}

{activePage === "Search Fares" && (
  <SearchFares />
)}

{activePage === "Route Comparison" && (
  <RouteComparison />
)}

{activePage === "Reports" && (
  <Reports />
)}
{activePage === "About Project" && (
  <AboutProject />
)}
</div>
      </section>
    </main>
  );
}
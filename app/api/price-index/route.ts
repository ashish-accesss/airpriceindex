import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const flightDate = searchParams.get("flightDate");

  if (!origin || !destination || !flightDate) {
    return NextResponse.json(
      { error: "origin, destination and flightDate are required" },
      { status: 400 }
    );
  }

  if (origin === destination) {
    return NextResponse.json(
      { error: "Origin and destination must be different" },
      { status: 400 }
    );
  }

  const selectedDate = new Date(`${flightDate}T00:00:00`);
  if (Number.isNaN(selectedDate.getTime())) {
    return NextResponse.json({ error: "Invalid flight date" }, { status: 400 });
  }

  const minimumFlightDate = new Date("2026-08-02T00:00:00");
  if (selectedDate < minimumFlightDate) {
    return NextResponse.json(
      { error: "Flight date must be 2 August 2026 or later." },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase.rpc("get_price_index", {
      p_origin: origin,
      p_destination: destination,
      p_flight_date: flightDate,
    });

    if (error) {
      console.error("Price Index RPC error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const flights = (data || []).map((row: any) => ({
      flight_no: row.flight_no,
      airline: row.airline,
      current_fare: row.current_fare == null ? null : Number(row.current_fare),
      current_scrap_date: row.current_scrap_date,
      base_fare: row.base_fare == null ? null : Number(row.base_fare),
      base_scrap_date: row.base_scrap_date,
      apix: row.apix == null ? null : Number(row.apix),
    }));

    return NextResponse.json({
      origin,
      destination,
      flight_date: flightDate,
      base_rule:
        flightDate <= "2026-10-01" ? "2026-08-01" : "flight_date - 60 days",
      flights,
    });
  } catch (error) {
    console.error("Price Index error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to calculate Price Index",
      },
      { status: 500 }
    );
  }
}

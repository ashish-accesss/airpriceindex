import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");

  if (!origin || !destination) {
    return NextResponse.json(
      { error: "origin and destination are required" },
      { status: 400 }
    );
  }

  if (origin === destination) {
    return NextResponse.json(
      { error: "Origin and destination must be different" },
      { status: 400 }
    );
  }

  const startDate = "2026-08-01";
  const endDate = "2026-09-30";
  const asOfDate = "2026-09-15";

  try {
    const { data, error } = await supabase.rpc(
      "get_route_apix_series",
      {
        p_origin: origin,
        p_destination: destination,
        p_start_date: startDate,
        p_end_date: endDate,
        p_as_of_date: asOfDate,
      }
    );

    if (error) {
      console.error("Route APIx RPC error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const result = (data || []).map((row: any) => ({
      point: row.point,
      days_to_flight: Number(row.days_to_flight),
      date_of_flight: row.date_of_flight,
      base_scrap_date: row.base_scrap_date,
      as_of_scrap_date: row.as_of_scrap_date,
      flights_in_basket: Number(row.flights_in_basket),
      base_basket_fare:
        row.base_basket_fare === null
          ? null
          : Number(row.base_basket_fare),
      current_basket_fare:
        row.current_basket_fare === null
          ? null
          : Number(row.current_basket_fare),
      avg_fare:
        row.avg_fare === null ? null : Number(row.avg_fare),
      min_fare:
        row.min_fare === null ? null : Number(row.min_fare),
      max_fare:
        row.max_fare === null ? null : Number(row.max_fare),
      observations: Number(row.observations || 0),
      route_apix:
        row.route_apix === null ? null : Number(row.route_apix),
    }));

    return NextResponse.json({
      origin,
      destination,
      start_date: startDate,
      end_date: endDate,
      as_of_date: asOfDate,
      data: result,
    });
  } catch (error) {
    console.error("Route APIx error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to calculate route APIx",
      },
      { status: 500 }
    );
  }
}

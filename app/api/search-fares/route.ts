import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const flightDate = searchParams.get("flightDate");

  if (!origin || !destination || !flightDate) {
    return NextResponse.json(
      {
        error:
          "origin, destination and flightDate are required",
      },
      { status: 400 }
    );
  }

  if (origin === destination) {
    return NextResponse.json(
      {
        error:
          "Origin and destination must be different",
      },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase.rpc(
      "search_unique_flights",
      {
        p_origin: origin,
        p_destination: destination,
        p_flight_date: flightDate,
      }
    );

    if (error) {
      console.error(
        "Search Fares RPC error:",
        error
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const flights = (data || []).map(
      (row: any) => ({
        airline: row.airline,
        flight_no: row.flight_no,
        departure_time: row.departure_time,
        arrival_time: row.arrival_time,
        price:
          row.price === null
            ? null
            : Number(row.price),
      })
    );

    const prices = flights
      .map((flight: any) => flight.price)
      .filter(
        (price: any) =>
          typeof price === "number"
      );

    const lowestFare =
      prices.length > 0
        ? Math.min(...prices)
        : null;

    const highestFare =
      prices.length > 0
        ? Math.max(...prices)
        : null;

    const averageFare =
      prices.length > 0
        ? Math.round(
            prices.reduce(
              (sum: number, price: number) =>
                sum + price,
              0
            ) / prices.length
          )
        : null;

    return NextResponse.json({
      origin,
      destination,
      flight_date: flightDate,
      flights_found: flights.length,
      lowest_fare: lowestFare,
      average_fare: averageFare,
      highest_fare: highestFare,
      flights,
    });
  } catch (error) {
    console.error(
      "Search Fares error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to search fares",
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Maps API key is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status !== "OK") {
      return NextResponse.json(
        { error: `Geocoding failed: ${data.status} - ${data.error_message || ""}` },
        { status: 400 }
      );
    }

    const result = data.results[0];
    const { lat, lng } = result.geometry.location;

    return NextResponse.json({
      lat,
      lng,
      formattedAddress: result.formatted_address,
      addressComponents: result.address_components,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

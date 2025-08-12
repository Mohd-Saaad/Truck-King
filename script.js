const map = L.map('map').setView([20.5937, 78.9629], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

let currentRouteLayer = null; // store current route polyline

async function getCoordinates(city) {
    const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`;
    const res = await fetch(geoUrl);
    const data = await res.json();
    if (!data || data.length === 0) throw new Error(`No location found for: ${city}`);
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

async function getRoute(startLat, startLon, endLat, endLon) {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson&steps=false`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes || data.routes.length === 0) {
        throw new Error("No route found");
    }
    return data.routes[0];
}

async function calculateRoute() {
    try {
        const startCity = document.getElementById("start").value.trim();
        const endCity = document.getElementById("end").value.trim();
        const fuelPrice = parseFloat(document.getElementById("fuelPrice").value);
        const fuelEfficiency = parseFloat(document.getElementById("fuelEfficiency").value);

        if (!startCity || !endCity || isNaN(fuelPrice)) {
            document.getElementById("result").innerHTML = "⚠ Please enter valid inputs.";
            return;
        }

        const [startLat, startLon] = await getCoordinates(startCity);
        const [endLat, endLon] = await getCoordinates(endCity);

        const route = await getRoute(startLat, startLon, endLat, endLon);

        const distanceKm = route.distance / 1000;
        const fuelNeeded = distanceKm / fuelEfficiency;
        const estimatedCost = fuelNeeded * fuelPrice;

        document.getElementById("result").innerHTML =
            `🚗 Distance: ${distanceKm.toFixed(2)} km<br>⛽ Estimated Fuel Cost: ₹${estimatedCost.toFixed(2)}`;

        // Remove previous route before adding new one
        if (currentRouteLayer) {
            map.removeLayer(currentRouteLayer);
        }

        const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        currentRouteLayer = L.polyline(coords, { color: 'blue', weight: 5 }).addTo(map);
        map.fitBounds(currentRouteLayer.getBounds());

    } catch (err) {
        console.error(err);
        document.getElementById("result").innerHTML = `⚠ Error: ${err.message}`;
    }
}

document.getElementById("calcBtn").addEventListener("click", calculateRoute);

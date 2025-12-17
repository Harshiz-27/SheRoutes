let map;
let directionsService;
let directionsRenderer;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 30.7333, lng: 76.7794 }, // Chandigarh
    zoom: 13,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });
}

async function findSafeRoute() {
  const response = await fetch(
    "http://127.0.0.1:8000/route?start=Sector 17&end=Sector 43"
  );
  const data = await response.json();
  console.log(data);

  directionsService.route(
    {
      origin: "Sector 17, Chandigarh",
      destination: "Sector 43, Chandigarh",
      travelMode: google.maps.TravelMode.WALKING,
    },
    (result, status) => {
      if (status === "OK") {
        directionsRenderer.setDirections(result);
      }
    }
  );
}

function openCopilot() {
  const query = encodeURIComponent(
    "Give safety tips for women traveling alone at night"
  );
  const url = `https://copilot.microsoft.com/?q=${query}`;
  window.open(url, "_blank");
}
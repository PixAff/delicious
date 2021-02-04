import axios from "axios";
import { $ } from "./bling";

const mapOptions = {
  center: { lat: 43.25, lng: -79.85 },
  zoom: 14,
};

// function loadPlaces(map, lat = 52.5, lng = 13.4) {
function loadPlaces(map, lat = 43.2, lng = -79.8) {
  axios.get(`/api/v1/stores/near?lat=${lat}&lng=${lng}`).then((res) => {
    const places = res.data;
    if (!places.length) {
      alert("Mo places found");
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    const infoWindow = new google.maps.InfoWindow();

    const markers = places.map((place) => {
      const [placeLng, placeLat] = place.location.coordinates;
      const position = { lat: placeLat, lng: placeLng };
      bounds.extend(position);
      const marker = new google.maps.Marker({ map, position });
      marker.place = place;
      return marker;
    });

    markers.forEach((marker) =>
      marker.addListener("click", function () {
        infoWindow.setContent(this.place.name);
        infoWindow.open(map, this);
      })
    );

    map.setCenter(bounds.getCenter());
    map.fitBounds(bounds);
  });
}

function makeMap(mapDiv) {
  if (!mapDiv) return;
  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);
  const input = $("[name='geolocate']");
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    loadPlaces(
      map,
      place.geometry.location.lat(),
      place.geometry.location.lng()
    );
  });
}

export default makeMap;

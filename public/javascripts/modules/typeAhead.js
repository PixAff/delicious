const axios = require("axios");

function searchResultsHTML(stores) {
  return stores
    .map((store) => {
      return `<a href="/stores/${store.slug}" class="search__result">
      <strong>${store.name}</strong></a> `;
    })
    .join("");
}

function typeAhead(search) {
  if (!search) return;
  const searchInput = search.querySelector("input[name='search']");
  const searchResults = search.querySelector(".search__results");
  searchInput.on("input", function () {
    if (!this.value) {
      searchResults.style.display = "none";
      return;
    }
    searchResults.style.display = "block";
    axios.get(`/api/v1/search?q=${this.value}`).then((res) => {
      if (res.data.length) {
        searchResults.innerHTML = searchResultsHTML(res.data);
      }
    });
  });
}

export default typeAhead;

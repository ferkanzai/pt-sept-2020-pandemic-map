// Empieza aquí ⬇️

const accessToken =
  'pk.eyJ1IjoiZmVya2FuemFpIiwiYSI6ImNraTFvZGE1azBiY24yd3Fuc3RoYjZ1N3QifQ.825dTY3GMtTjgI5M90Ujrw';

const getPlaces = (places) => places.reduce((acc, current) => [...acc, current.name], []);

const getUniquePlaces = (placesArr) => new Set(placesArr);

const places = Array.from(getUniquePlaces(getPlaces(covidData)));
// console.log(places);

const getDates = (dates) => dates.reduce((acc, current) => [...acc, current.date], []);

const getUniqueDates = (datesArr) => new Set(datesArr);

const dates = Array.from(getUniqueDates(getDates(covidData))).reverse();

// console.log(dates);

const getCoordinates = async (locations) => {
  const formattedPlaces = await locations.map(async (location) => {
    const placesUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${location}.json?types=country&access_token=${accessToken}`;

    const res = await fetch(placesUrl);
    const data = await res.json();

    // console.log(data.features[0].place_name)

    return {
      name: location,
      lat: data.features[0].center[1],
      long: data.features[0].center[0],
    };
  });
  // console.log(formattedPlaces);
  return Promise.all(formattedPlaces);
};

const getDataFromCountry = (country) =>
  covidData.filter((el) => (el.name === country ? el : false));

const getDataFromDate = (date) => covidData.filter((el) => (el.date === date ? el : false));

const chartsCountryDiv = document.querySelector('#chart-country');

const showCountryGraph = (countryName) => {
  chartsCountryDiv.innerHTML = '';

  const datesForDailyCases = getDataFromCountry(countryName).map((el) => el.date);
  const dailyCases = getDataFromCountry(countryName).map((el) => el.dailyCases);

  const countryData = {
    labels: datesForDailyCases.reverse(),
    series: [dailyCases.reverse()],
  };

  const countryChart = document.createElement('div');
  const chartLineTitle = document.createElement('h2');
  chartLineTitle.innerText = `Daily cases in ${countryName.split('_').join(' ')}`;
  countryChart.classList.add(`${countryName}-chart`);
  countryChart.classList.add(`ct-golden-section`);
  chartsCountryDiv.appendChild(chartLineTitle);
  chartsCountryDiv.appendChild(countryChart);

  new Chartist.Line(countryChart, countryData);
};

// const chartsDiv = document.querySelector('#charts');
const chartBarH2 = document.querySelector('#chart-bar');

const paintCasesPerMile = (date) => {
  const dateSpan = document.querySelector('#date');
  dateSpan.innerHTML = date;

  const countriesName = getDataFromDate(date).map((el) => el.name);
  const casePerMileData = getDataFromDate(date).map((el) => el.casesPerMile);

  const casesPerMileChartData = {
    labels: countriesName,
    series: [casePerMileData],
  };

  new Chartist.Bar(chartBarH2, casesPerMileChartData);
};

const chartPieH2 = document.querySelector('#chart-pie');

const paintTotalCases = () => {
  const totalCasesPerCountry = places.map((el) => {
    return {
      name: el,
      total: getDataFromCountry(el).reduce((acc, current) => {
        return acc + Number(current.dailyCases);
      }, 0),
    };
  });

  const totalCasesData = {
    labels: totalCasesPerCountry.map((el) => el.name),
    series: totalCasesPerCountry.map((el) => el.total),
  };

  const pieOptions = {
    donut: true,
    donutWidth: 150,
  };

  const pieChart = document.createElement('div');
  pieChart.classList.add(`ct-golden-section`);
  chartPieH2.appendChild(pieChart);

  new Chartist.Pie(pieChart, totalCasesData, pieOptions);
};

const start = async () => {
  const locations = await getCoordinates(places);
  // console.log(locations)
  const myMap = L.map('mapid').setView([53, 9], 3);

  L.tileLayer(
    'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
    {
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      id: 'mapbox/streets-v11',
      tileSize: 512,
      zoomOffset: -1,
      accessToken,
    }
  ).addTo(myMap);

  locations.forEach((location) => {
    const countryCoordinates = [location.lat, location.long];
    const name = location.name;

    L.marker(countryCoordinates)
      .bindPopup(`<b>${name.split('_').join(' ')}</b>`)
      .addTo(myMap)
      .on('click', () => showCountryGraph(name));
  });

  paintCasesPerMile(dates[dates.length - 1]);
  paintTotalCases();
};

start();

const btnNextMonth = document.querySelector('#btn-next-month');
const btnPrevMonth = document.querySelector('#btn-prev-month');

btnNextMonth.addEventListener('click', () => {
  const actualMonth = document.querySelector('#date').innerHTML;
  const pos = dates.indexOf(actualMonth);

  if (pos + 1 < dates.length) {
    paintCasesPerMile(dates[pos + 1]);
  }
});

btnPrevMonth.addEventListener('click', () => {
  const actualMonth = document.querySelector('#date').innerHTML;
  const pos = dates.indexOf(actualMonth);

  if (pos - 1 >= 0) {
    paintCasesPerMile(dates[pos - 1]);
  }
});

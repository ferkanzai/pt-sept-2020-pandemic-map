// Empieza aquí ⬇️

const accessToken =
  'pk.eyJ1IjoiZmVya2FuemFpIiwiYSI6ImNraTFvZGE1azBiY24yd3Fuc3RoYjZ1N3QifQ.825dTY3GMtTjgI5M90Ujrw';

const dates = Array.from(new Set(covidData.map((el) => el.date))).reverse();
const places = Array.from(new Set(covidData.map((el) => el.name)));

const dynamicColors = (arrLength) => {
  const colorArr = [];
  for (let i = 0; i < arrLength; i++) {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    colorArr.push(`rgb(${r}, ${g}, ${b})`);
  }
  return colorArr;
};

const pieColors = dynamicColors(places.length);

const getCoordinates = async (locations, type) => {
  const formattedPlaces = await locations.map(async (location) => {
    const placesUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${location}.json?types=${type}&access_token=${accessToken}`;

    const data = await fetch(placesUrl).then((res) => res.json());

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

const chartsCountryDiv = document.querySelector('#section-line-chart');
const countryNameSpan = document.querySelector('#country');
const countryCanvas = document.createElement('canvas');
const chartLineTitle = document.querySelector('#line-chart-title');
const map = document.querySelector('#mapid');
const removeChartBtn = document.querySelector('#remove-chart');
let chartLine;

const showCountryGraph = (countryName, destinationDiv) => {
  if (chartLine) {
    chartLine.destroy();
  }

  removeChartBtn.classList.add('visible');
  map.classList.add('map-after');

  countryCanvas.innerHTML = '';

  const labels = getDataFromCountry(countryName)
    .map((el) => el.date)
    .reverse();
  const series = getDataFromCountry(countryName)
    .map((el) => el.dailyCases)
    .reverse();

  const ctxLine = countryCanvas.getContext('2d');

  chartLine = new Chart(ctxLine, {
    // The type of chart we want to create
    type: 'line',

    // The data for our dataset
    data: {
      labels,
      datasets: [
        {
          label: `Daily cases in ${countryName.split('_').join(' ')}`,
          borderColor: 'blue',
          backgroundColor: 'transparent',
          data: series,
        },
      ],
    },

    // Configuration options go here
    options: {
      aspectRatio: 1.3,
    },
  });

  // const countryChart = document.createElement('div');
  countryNameSpan.innerText = `${countryName.split('_').join(' ')}`;
  chartLineTitle.classList.add('visible');
  // countryChart.classList.add(`${countryName}-chart`);
  // countryChart.appendChild(countryCanvas);
  destinationDiv.appendChild(countryCanvas);
};

// const chartsDiv = document.querySelector('#charts');
const chartBarH2 = document.querySelector('#chart-bar');
let chartBar;
const canvasBar = document.createElement('canvas');
const ctxBar = canvasBar.getContext('2d');

const paintCasesPerMile = (date) => {
  if (chartBar) {
    chartBar.destroy();
  }

  const dateSpan = document.querySelector('#date');
  dateSpan.innerHTML = date;

  const countriesName = getDataFromDate(date).map((el) => el.name);
  const casePerMileData = getDataFromDate(date).map((el) => el.casesPerMile);

  chartBar = new Chart(ctxBar, {
    // The type of chart we want to create
    type: 'bar',

    // The data for our dataset
    data: {
      labels: countriesName.map((el) => el.split('_').join(' ')),
      datasets: [
        {
          label: 'Cases per 1000 habitants',
          backgroundColor: 'rgb(51, 204, 51)',
          borderColor: 'rgb(51, 204, 51)',
          data: casePerMileData,
        },
      ],
    },

    // Configuration options go here
    options: {
      aspectRatio: 3,
    },
  });
};

const sectionBarChart = document.querySelector('#section-bar-chart');
sectionBarChart.appendChild(canvasBar);

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

  // const colors = dynamicColors(totalCasesPerCountry.length);
  // console.log(colors)
  // console.log(totalCasesPerCountry.map(el => el.total));

  const canvasPie = document.createElement('canvas');
  const ctxPie = canvasPie.getContext('2d');

  const chartPie = new Chart(ctxPie, {
    // The type of chart we want to create
    type: 'doughnut',

    // The data for our dataset
    data: {
      labels: totalCasesPerCountry.map((el) => el.name.split('_').join(' ')),
      datasets: [
        {
          data: totalCasesPerCountry.map((el) => el.total),
          backgroundColor: pieColors,
        },
      ],
    },

    // Configuration options go here
    options: {
      legend: {
        display: true,
      },
    },
  });

  const sectionPieChart = document.querySelector('#section-pie-chart');
  sectionPieChart.appendChild(canvasPie);
};

const start = async () => {
  const locations = await getCoordinates(places, 'country');
  // console.log(locations)
  const myMap = L.map('mapid').setView([56.02, 59.45], 3);

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
      .on('click', () => showCountryGraph(name, chartsCountryDiv));
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
  chartBar.destroy();

  if (pos + 1 < dates.length) {
    paintCasesPerMile(dates[pos + 1]);
  }
});

btnPrevMonth.addEventListener('click', () => {
  const actualMonth = document.querySelector('#date').innerHTML;
  const pos = dates.indexOf(actualMonth);
  chartBar.destroy();

  if (pos - 1 >= 0) {
    paintCasesPerMile(dates[pos - 1]);
  }
});

removeChartBtn.addEventListener('click', () => {
  if (chartLine) {
    chartLine.clear();
    chartLine.destroy();
    removeChartBtn.classList.remove('visible');
    chartLineTitle.classList.remove('visible');
    map.classList.remove('map-after');
  }
});

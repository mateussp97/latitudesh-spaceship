interface PlanetDistances {
  [key: string]: number;
}

// Distâncias entre os planetas conforme especificado na documentação.
export const planetDistances: PlanetDistances = {
  mercury_venus: 50000000,
  venus_earth: 40000000,
  earth_mars: 60000000,
  mars_jupiter: 350000000,
  jupiter_saturn: 700000000,
  saturn_uranus: 900000000,
};

// Capacidade do tanque de combustível em litros.
export const fuelTankCapacity = 90000;

// Consumo de combustível em litros por quilômetro.
export const fuelConsumptionRatio = 0.0001;

export const wormholeFuelConsumptionRatio = 0.0002;

// Lista de planetas com estações de reabastecimento.
export const refuelingStations = ["mercury", "earth", "saturn", "uranus"];

// Lista de planetas.
export const planets = [
  {
    icon: "./mercury.svg",
    name: "mercury",
    description: "mercury-description",
  },
  {
    icon: "./venus.svg",
    name: "venus",
    description: "venus-description",
  },
  {
    icon: "./earth.svg",
    name: "earth",
    description: "earth-description",
  },
  {
    icon: "./mars.svg",
    name: "mars",
    description: "mars-description",
  },
  {
    icon: "./jupiter.svg",
    name: "jupiter",
    description: "jupiter-description",
  },
  {
    icon: "./saturn.svg",
    name: "saturn",
    description: "saturn-description",
  },
  {
    icon: "./uranus.svg",
    name: "uranus",
    description: "uranus-description",
  },
];

// Lista de idiomas da aplicação.
export const languages = [
  {
    title: "portuguese",
    icon: "/brasil.png",
    value: "pt",
  },
  {
    title: "english",
    icon: "/estados-unidos.png",
    value: "en",
  },
];

export const URL = "https://latitudesh-spaceship.vercel.app/";

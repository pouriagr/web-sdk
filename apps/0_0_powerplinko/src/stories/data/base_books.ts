// Mock books for local Storybook preview — one REAL generated outcome per band
// (extracted from math-sdk/games/0_0_powerplinko library output). Each book
// is a complete round: a wheel throw, setTotalWin, finalWin. Used by the
// Wheel story to play rounds without an RGS server.
import type { Bet } from '../../game/typesBookEvent';

type MockBook = { id: number; payoutMultiplier: number; events: Bet['state'] };

const books: MockBook[] = [
  {
    "id": 0,
    "payoutMultiplier": 0,
    "events": [
      {
        "index": 0,
        "type": "wheel",
        "band": 0,
        "totalBands": 9,
        "distance": 0.0,
        "multiplier": 0.0
      },
      {
        "index": 1,
        "type": "setTotalWin",
        "amount": 0
      },
      {
        "index": 2,
        "type": "finalWin",
        "amount": 0
      }
    ]
  },
  {
    "id": 55417,
    "payoutMultiplier": 50,
    "events": [
      {
        "index": 0,
        "type": "wheel",
        "band": 1,
        "totalBands": 9,
        "distance": 0.125,
        "multiplier": 0.5
      },
      {
        "index": 1,
        "type": "setTotalWin",
        "amount": 50
      },
      {
        "index": 2,
        "type": "finalWin",
        "amount": 50
      }
    ]
  },
  {
    "id": 79417,
    "payoutMultiplier": 150,
    "events": [
      {
        "index": 0,
        "type": "wheel",
        "band": 2,
        "totalBands": 9,
        "distance": 0.25,
        "multiplier": 1.5
      },
      {
        "index": 1,
        "type": "setTotalWin",
        "amount": 150
      },
      {
        "index": 2,
        "type": "finalWin",
        "amount": 150
      }
    ]
  },
  {
    "id": 91417,
    "payoutMultiplier": 300,
    "events": [
      {
        "index": 0,
        "type": "wheel",
        "band": 3,
        "totalBands": 9,
        "distance": 0.375,
        "multiplier": 3.0
      },
      {
        "index": 1,
        "type": "setTotalWin",
        "amount": 300
      },
      {
        "index": 2,
        "type": "finalWin",
        "amount": 300
      }
    ]
  },
  {
    "id": 97417,
    "payoutMultiplier": 800,
    "events": [
      {
        "index": 0,
        "type": "wheel",
        "band": 4,
        "totalBands": 9,
        "distance": 0.5,
        "multiplier": 8.0
      },
      {
        "index": 1,
        "type": "setTotalWin",
        "amount": 800
      },
      {
        "index": 2,
        "type": "finalWin",
        "amount": 800
      }
    ]
  },
  {
    "id": 99417,
    "payoutMultiplier": 2500,
    "events": [
      {
        "index": 0,
        "type": "wheel",
        "band": 5,
        "totalBands": 9,
        "distance": 0.625,
        "multiplier": 25.0
      },
      {
        "index": 1,
        "type": "setTotalWin",
        "amount": 2500
      },
      {
        "index": 2,
        "type": "finalWin",
        "amount": 2500
      }
    ]
  },
  {
    "id": 99897,
    "payoutMultiplier": 10000,
    "events": [
      {
        "index": 0,
        "type": "wheel",
        "band": 6,
        "totalBands": 9,
        "distance": 0.75,
        "multiplier": 100.0
      },
      {
        "index": 1,
        "type": "setTotalWin",
        "amount": 10000
      },
      {
        "index": 2,
        "type": "finalWin",
        "amount": 10000
      }
    ]
  },
  {
    "id": 99987,
    "payoutMultiplier": 50000,
    "events": [
      {
        "index": 0,
        "type": "wheel",
        "band": 7,
        "totalBands": 9,
        "distance": 0.875,
        "multiplier": 500.0
      },
      {
        "index": 1,
        "type": "setTotalWin",
        "amount": 50000
      },
      {
        "index": 2,
        "type": "finalWin",
        "amount": 50000
      }
    ]
  },
  {
    "id": 99999,
    "payoutMultiplier": 500000,
    "events": [
      {
        "index": 0,
        "type": "wheel",
        "band": 8,
        "totalBands": 9,
        "distance": 1.0,
        "multiplier": 5000.0
      },
      {
        "index": 1,
        "type": "setTotalWin",
        "amount": 500000
      },
      {
        "index": 2,
        "type": "finalWin",
        "amount": 500000
      }
    ]
  }
];

export default books;

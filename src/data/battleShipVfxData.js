// Generated from the accepted battleship VFX debugger export.
// Keep values literal: the anchors are tuned against the source assets.

export const battleShipVfxData = {
  "version": 2,
  "engineTemplates": [
    {
      "id": "template-plasma",
      "name": "Red Flame",
      "emitters": [
        {
          "id": "emitter-mqos9k3d",
          "type": "flame",
          "x": 35,
          "y": 3,
          "direction": 180,
          "size": 20,
          "length": 190,
          "color": "#fa6400",
          "layer": "behind",
          "intensity": 0.8,
          "spread": 30,
          "count": 58,
          "speed": 0.15,
          "jitter": 0.65
        },
        {
          "id": "emitter-mqosztn0",
          "type": "smoke",
          "x": 18,
          "y": -13,
          "direction": 180,
          "size": 20,
          "length": 82,
          "color": "#64748b",
          "layer": "behind",
          "intensity": 0.42,
          "spread": 28,
          "count": 24,
          "speed": 0.45,
          "jitter": 0.38
        },
        {
          "id": "emitter-mqot0t8g",
          "type": "smoke",
          "x": 18,
          "y": 20,
          "direction": 180,
          "size": 20,
          "length": 82,
          "color": "#64748b",
          "layer": "behind",
          "intensity": 0.42,
          "spread": 28,
          "count": 24,
          "speed": 0.45,
          "jitter": 0.38
        },
        {
          "id": "emitter-mqot11gq",
          "type": "ember",
          "x": 14,
          "y": -3,
          "direction": 180,
          "size": 6,
          "length": 68,
          "color": "#fb7185",
          "layer": "behind",
          "intensity": 0.86,
          "spread": 24,
          "count": 24,
          "speed": 0.95,
          "jitter": 0.58
        },
        {
          "id": "emitter-mqot1byq",
          "type": "ember",
          "x": 14,
          "y": 3,
          "direction": 180,
          "size": 6,
          "length": 68,
          "color": "#fb7185",
          "layer": "behind",
          "intensity": 0.86,
          "spread": 24,
          "count": 24,
          "speed": 0.95,
          "jitter": 0.58
        },
        {
          "id": "emitter-mqot1ipf",
          "type": "ember",
          "x": 14,
          "y": 9,
          "direction": 180,
          "size": 6,
          "length": 68,
          "color": "#fb7185",
          "layer": "behind",
          "intensity": 0.86,
          "spread": 24,
          "count": 24,
          "speed": 0.95,
          "jitter": 0.58
        }
      ]
    }
  ],
  "battleShipVfxAnchors": {
    "red-battle-ship-1": {
      "color": "red",
      "variant": 1,
      "asset": "./assets/generated/battle-ships/battle-ship-red-variant-01.png",
      "assetWidth": 1196,
      "assetHeight": 524,
      "coils": [
        {
          "id": "coil-1",
          "x": 520,
          "y": 262
        }
      ],
      "engines": [
        {
          "id": "engine-1",
          "x": 0,
          "y": 267,
          "direction": 0,
          "size": 12,
          "length": 92,
          "color": "#ef4444",
          "layer": "behind",
          "templateId": "template-plasma"
        }
      ],
      "shots": [
        {
          "id": "shot-1",
          "x": 767,
          "y": 428,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.1,
          "color": "#ef4444",
          "layer": "front",
          "templateId": "template-plasma"
        },
        {
          "id": "shot-2",
          "x": 767,
          "y": 103,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.1,
          "color": "#ef4444",
          "layer": "front",
          "templateId": "template-plasma"
        }
      ]
    },
    "red-battle-ship-2": {
      "color": "red",
      "variant": 2,
      "asset": "./assets/generated/battle-ships/battle-ship-red-variant-02.png",
      "assetWidth": 1195,
      "assetHeight": 524,
      "coils": [
        {
          "id": "coil-1",
          "x": 480,
          "y": 262
        },
        {
          "id": "coil-2",
          "x": 610,
          "y": 262
        }
      ],
      "engines": [
        {
          "id": "engine-1",
          "x": 0,
          "y": 263,
          "direction": 0,
          "size": 12,
          "length": 92,
          "color": "#ef4444",
          "layer": "behind",
          "templateId": "template-plasma"
        }
      ],
      "shots": [
        {
          "id": "shot-1",
          "x": 767,
          "y": 92,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3.2,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1,
          "color": "#ef4444",
          "layer": "front",
          "templateId": "template-plasma"
        },
        {
          "id": "shot-2",
          "x": 763,
          "y": 428,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3.2,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1,
          "color": "#ef4444",
          "layer": "front",
          "templateId": "template-plasma"
        }
      ]
    },
    "red-battle-ship-3": {
      "color": "red",
      "variant": 3,
      "asset": "./assets/generated/battle-ships/battle-ship-red-variant-03.png",
      "assetWidth": 1196,
      "assetHeight": 525,
      "coils": [
        {
          "id": "coil-1",
          "x": 455,
          "y": 263
        },
        {
          "id": "coil-2",
          "x": 560,
          "y": 263
        },
        {
          "id": "coil-3",
          "x": 665,
          "y": 263
        }
      ],
      "engines": [
        {
          "id": "engine-1",
          "x": 0,
          "y": 267,
          "direction": 0,
          "size": 12,
          "length": 92,
          "color": "#ef4444",
          "layer": "behind",
          "templateId": "template-plasma"
        }
      ],
      "shots": [
        {
          "id": "shot-1",
          "x": 788,
          "y": 107,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3.2,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.3,
          "color": "#ef4444",
          "layer": "front",
          "templateId": "template-plasma"
        },
        {
          "id": "shot-2",
          "x": 778,
          "y": 421,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3.2,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.3,
          "color": "#ef4444",
          "layer": "front",
          "templateId": "template-plasma"
        }
      ]
    },
    "blue-battle-ship-1": {
      "color": "blue",
      "variant": 1,
      "asset": "./assets/generated/battle-ships/battle-ship-blue-variant-01.png",
      "assetWidth": 1196,
      "assetHeight": 524,
      "coils": [
        {
          "id": "coil-1",
          "x": 520,
          "y": 262
        }
      ],
      "engines": [
        {
          "id": "engine-1",
          "x": 34,
          "y": 262,
          "direction": 0,
          "size": 12,
          "length": 92,
          "color": "#38bdf8",
          "layer": "behind",
          "templateId": "template-plasma"
        }
      ],
      "shots": [
        {
          "id": "shot-1",
          "x": 781,
          "y": 99,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.1,
          "color": "#38bdf8",
          "layer": "front",
          "templateId": "template-plasma"
        },
        {
          "id": "shot-2",
          "x": 778,
          "y": 428,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.1,
          "color": "#38bdf8",
          "layer": "front",
          "templateId": "template-plasma"
        }
      ]
    },
    "blue-battle-ship-2": {
      "color": "blue",
      "variant": 2,
      "asset": "./assets/generated/battle-ships/battle-ship-blue-variant-02.png",
      "assetWidth": 1196,
      "assetHeight": 525,
      "coils": [
        {
          "id": "coil-1",
          "x": 480,
          "y": 263
        },
        {
          "id": "coil-2",
          "x": 610,
          "y": 263
        }
      ],
      "engines": [
        {
          "id": "engine-1",
          "x": 34,
          "y": 263,
          "direction": 0,
          "size": 12,
          "length": 92,
          "color": "#38bdf8",
          "layer": "behind",
          "templateId": "template-plasma"
        }
      ],
      "shots": [
        {
          "id": "shot-1",
          "x": 774,
          "y": 93,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.1,
          "color": "#38bdf8",
          "layer": "front",
          "templateId": "template-plasma"
        },
        {
          "id": "shot-2",
          "x": 774,
          "y": 428,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.1,
          "color": "#38bdf8",
          "layer": "front",
          "templateId": "template-plasma"
        }
      ]
    },
    "blue-battle-ship-3": {
      "color": "blue",
      "variant": 3,
      "asset": "./assets/generated/battle-ships/battle-ship-blue-variant-03.png",
      "assetWidth": 1197,
      "assetHeight": 524,
      "coils": [
        {
          "id": "coil-1",
          "x": 455,
          "y": 262
        },
        {
          "id": "coil-2",
          "x": 560,
          "y": 262
        },
        {
          "id": "coil-3",
          "x": 665,
          "y": 262
        }
      ],
      "engines": [
        {
          "id": "engine-1",
          "x": 34,
          "y": 262,
          "direction": 0,
          "size": 12,
          "length": 92,
          "color": "#38bdf8",
          "layer": "behind",
          "templateId": "template-plasma"
        }
      ],
      "shots": [
        {
          "id": "shot-1",
          "x": 781,
          "y": 99,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.1,
          "color": "#38bdf8",
          "layer": "front",
          "templateId": "template-plasma"
        },
        {
          "id": "shot-2",
          "x": 778,
          "y": 424,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.1,
          "color": "#38bdf8",
          "layer": "front",
          "templateId": "template-plasma"
        }
      ]
    },
    "yellow-battle-ship-1": {
      "color": "yellow",
      "variant": 1,
      "asset": "./assets/generated/battle-ships/battle-ship-yellow-variant-01.png",
      "assetWidth": 1195,
      "assetHeight": 524,
      "coils": [
        {
          "id": "coil-1",
          "x": 520,
          "y": 262
        }
      ],
      "engines": [
        {
          "id": "engine-1",
          "x": 34,
          "y": 262,
          "direction": 0,
          "size": 12,
          "length": 92,
          "color": "#facc15",
          "layer": "behind",
          "templateId": "template-plasma"
        }
      ],
      "shots": [
        {
          "id": "shot-1",
          "x": 780,
          "y": 96,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.1,
          "color": "#facc15",
          "layer": "front",
          "templateId": "template-plasma"
        },
        {
          "id": "shot-2",
          "x": 774,
          "y": 428,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.1,
          "color": "#facc15",
          "layer": "front",
          "templateId": "template-plasma"
        }
      ]
    },
    "yellow-battle-ship-2": {
      "color": "yellow",
      "variant": 2,
      "asset": "./assets/generated/battle-ships/battle-ship-yellow-variant-02.png",
      "assetWidth": 1195,
      "assetHeight": 524,
      "coils": [
        {
          "id": "coil-1",
          "x": 480,
          "y": 262
        },
        {
          "id": "coil-2",
          "x": 610,
          "y": 262
        }
      ],
      "engines": [
        {
          "id": "engine-1",
          "x": 34,
          "y": 262,
          "direction": 0,
          "size": 12,
          "length": 92,
          "color": "#facc15",
          "layer": "behind",
          "templateId": "template-plasma"
        }
      ],
      "shots": [
        {
          "id": "shot-1",
          "x": 784,
          "y": 106,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.1,
          "color": "#facc15",
          "layer": "front",
          "templateId": "template-plasma"
        },
        {
          "id": "shot-2",
          "x": 777,
          "y": 434,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.1,
          "color": "#facc15",
          "layer": "front",
          "templateId": "template-plasma"
        }
      ]
    },
    "yellow-battle-ship-3": {
      "color": "yellow",
      "variant": 3,
      "asset": "./assets/generated/battle-ships/battle-ship-yellow-variant-03.png",
      "assetWidth": 1195,
      "assetHeight": 525,
      "coils": [
        {
          "id": "coil-1",
          "x": 455,
          "y": 263
        },
        {
          "id": "coil-2",
          "x": 560,
          "y": 263
        },
        {
          "id": "coil-3",
          "x": 665,
          "y": 263
        }
      ],
      "engines": [
        {
          "id": "engine-1",
          "x": 34,
          "y": 263,
          "direction": 0,
          "size": 12,
          "length": 92,
          "color": "#facc15",
          "layer": "behind",
          "templateId": "template-plasma"
        }
      ],
      "shots": [
        {
          "id": "shot-1",
          "x": 777,
          "y": 99,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.1,
          "color": "#facc15",
          "layer": "front",
          "templateId": "template-plasma"
        },
        {
          "id": "shot-2",
          "x": 784,
          "y": 421,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.1,
          "color": "#facc15",
          "layer": "front",
          "templateId": "template-plasma"
        }
      ]
    },
    "green-battle-ship-1": {
      "color": "green",
      "variant": 1,
      "asset": "./assets/generated/battle-ships/battle-ship-green-variant-01.png",
      "assetWidth": 1195,
      "assetHeight": 524,
      "coils": [
        {
          "id": "coil-1",
          "x": 520,
          "y": 262
        }
      ],
      "engines": [
        {
          "id": "engine-1",
          "x": 34,
          "y": 262,
          "direction": 0,
          "size": 12,
          "length": 92,
          "color": "#4ade80",
          "layer": "behind",
          "templateId": "template-plasma"
        }
      ],
      "shots": [
        {
          "id": "shot-1",
          "x": 787,
          "y": 103,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.1,
          "color": "#4ade80",
          "layer": "front",
          "templateId": "template-plasma"
        },
        {
          "id": "shot-2",
          "x": 798,
          "y": 428,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.1,
          "color": "#4ade80",
          "layer": "front",
          "templateId": "template-plasma"
        }
      ]
    },
    "green-battle-ship-2": {
      "color": "green",
      "variant": 2,
      "asset": "./assets/generated/battle-ships/battle-ship-green-variant-02.png",
      "assetWidth": 1196,
      "assetHeight": 525,
      "coils": [
        {
          "id": "coil-1",
          "x": 480,
          "y": 263
        },
        {
          "id": "coil-2",
          "x": 610,
          "y": 263
        }
      ],
      "engines": [
        {
          "id": "engine-1",
          "x": 34,
          "y": 263,
          "direction": 0,
          "size": 12,
          "length": 92,
          "color": "#4ade80",
          "layer": "behind",
          "templateId": "template-plasma"
        }
      ],
      "shots": [
        {
          "id": "shot-1",
          "x": 788,
          "y": 103,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.1,
          "color": "#4ade80",
          "layer": "front",
          "templateId": "template-plasma"
        },
        {
          "id": "shot-2",
          "x": 781,
          "y": 431,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.1,
          "color": "#4ade80",
          "layer": "front",
          "templateId": "template-plasma"
        }
      ]
    },
    "green-battle-ship-3": {
      "color": "green",
      "variant": 3,
      "asset": "./assets/generated/battle-ships/battle-ship-green-variant-03.png",
      "assetWidth": 1196,
      "assetHeight": 525,
      "coils": [
        {
          "id": "coil-1",
          "x": 455,
          "y": 263
        },
        {
          "id": "coil-2",
          "x": 560,
          "y": 263
        },
        {
          "id": "coil-3",
          "x": 665,
          "y": 263
        }
      ],
      "engines": [
        {
          "id": "engine-1",
          "x": 34,
          "y": 263,
          "direction": 0,
          "size": 12,
          "length": 92,
          "color": "#4ade80",
          "layer": "behind",
          "templateId": "template-plasma"
        }
      ],
      "shots": [
        {
          "id": "shot-1",
          "x": 781,
          "y": 100,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.1,
          "color": "#4ade80",
          "layer": "front",
          "templateId": "template-plasma"
        },
        {
          "id": "shot-2",
          "x": 781,
          "y": 431,
          "direction": 0,
          "weaponType": "plasmaMachineGun",
          "size": 17.5,
          "length": 1199,
          "speed": 3,
          "duration": 900,
          "fireRate": 12,
          "spread": 20,
          "salvoCount": 6,
          "intensity": 1.1,
          "color": "#4ade80",
          "layer": "front",
          "templateId": "template-plasma"
        }
      ]
    }
  }
};

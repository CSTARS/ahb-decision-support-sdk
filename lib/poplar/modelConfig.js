// this is a full sample of what's required to run the 3pg model.
// weather should be set via rest calls.

var config = {
  "manage": {
    "datePlanted": "2015-10-01T07:00:00.000Z",
    "dateCoppiced": "2017-10-01T07:00:00.000Z",
    "yearsPerCoppice": 2,
    "fertility": 0.7,
    "irrigFrac": 1,
    "coppice": false
  },
  "weather": {
    "0": {
      "month": 1,
      "tmin": 4.13,
      "tmax": 12.96,
      "tdmean": 4.93,
      "ppt": 106.93,
      "rad": 6.184092675464078,
      "daylight": 9.6577272415,
      "nrel": 1717.803520962244
    },
    "1": {
      "month": 2,
      "tmin": 5.41,
      "tmax": 15.57,
      "tdmean": 5.64,
      "ppt": 102.14,
      "rad": 9.575556000082976,
      "daylight": 10.5846395493,
      "nrel": 2659.8766666897154
    },
    "2": {
      "month": 3,
      "tmin": 6.78,
      "tmax": 19.65,
      "tdmean": 6.24,
      "ppt": 52.76,
      "rad": 16.473222815429207,
      "daylight": 11.8139810562,
      "nrel": 4575.895226508113
    },
    "3": {
      "month": 4,
      "tmin": 8.1,
      "tmax": 22.46,
      "tdmean": 6.61,
      "ppt": 29.47,
      "rad": 21.740109469179455,
      "daylight": 13.0903339386,
      "nrel": 6038.919296994293
    },
    "4": {
      "month": 5,
      "tmin": 11.33,
      "tmax": 27.44,
      "tdmean": 9.06,
      "ppt": 22.52,
      "rad": 25.258268483616465,
      "daylight": 14.1362047195,
      "nrel": 7016.185689893463
    },
    "5": {
      "month": 6,
      "tmin": 13.56,
      "tmax": 31.42,
      "tdmean": 10.59,
      "ppt": 3.83,
      "rad": 28.44179260186776,
      "daylight": 14.6482133865,
      "nrel": 7900.497944963267
    },
    "6": {
      "month": 7,
      "tmin": 14.62,
      "tmax": 34.38,
      "tdmean": 12.08,
      "ppt": 0.18,
      "rad": 28.160318300892396,
      "daylight": 14.3562335968,
      "nrel": 7822.310639136776
    },
    "7": {
      "month": 8,
      "tmin": 14.19,
      "tmax": 34.03,
      "tdmean": 11.56,
      "ppt": 1.34,
      "rad": 25.035703175447246,
      "daylight": 13.3887243271,
      "nrel": 6954.36199317979
    },
    "8": {
      "month": 9,
      "tmin": 13.14,
      "tmax": 31.82,
      "tdmean": 9.76,
      "ppt": 2.62,
      "rad": 20.393404917313802,
      "daylight": 12.158249855,
      "nrel": 5664.8346992538345
    },
    "9": {
      "month": 10,
      "tmin": 9.82,
      "tmax": 25.84,
      "tdmean": 6.92,
      "ppt": 22.97,
      "rad": 14.574858312813962,
      "daylight": 10.8860292435,
      "nrel": 4048.571753559434
    },
    "10": {
      "month": 11,
      "tmin": 6.52,
      "tmax": 18.19,
      "tdmean": 6.28,
      "ppt": 49.25,
      "rad": 8.803230542742114,
      "daylight": 9.8185014725,
      "nrel": 2445.341817428365
    },
    "11": {
      "month": 12,
      "tmin": 3.88,
      "tmax": 13,
      "tdmean": 4.5,
      "ppt": 102.7,
      "rad": 6.466135628143366,
      "daylight": 9.3347291946,
      "nrel": 1796.1487855953796
    }
  },
  "soil": {
    "maxAWS": 15.457423082139535,
    "swpower": 4.6,
    "swconst": 0.48
  },
  "plantation": {
    "type": "",
    "StockingDensity": 3587,
    "SeedlingMass": 0.0004,
    "pS": 0.1,
    "pF": 0,
    "pR": 0.9,
    "coppicedTree": {
      "k": 0.5,
      "fullCanAge": 1.5,
      "kG": 0.5,
      "alpha": 0.08,
      "fT": {
        "mn": 0,
        "opt": 20,
        "mx": 50
      },
      "BLcond": 0.04,
      "fAge": {
        "f0": 1,
        "f1": 0,
        "tm": 47.5,
        "n": 3.5
      },
      "fN0": 0.26,
      "SLA": {
        "f0": 19,
        "f1": 10.8,
        "tm": 5,
        "n": 2
      },
      "Conductance": {
        "mn": 0.0001,
        "mx": 0.02,
        "lai": 2.6
      },
      "Intcptn": {
        "mn": 0,
        "mx": 0.24,
        "lai": 7.3
      },
      "y": 0.47,
      "pfs": {
        "stemCnt": 2.8,
        "stemC": 0.18,
        "stemP": 2.4,
        "pfsMx": 2,
        "pfsP": -0.772,
        "pfsC": 1.3
      },
      "pR": {
        "mn": 0.17,
        "mx": 0.7,
        "m0": 0.5,
        "turnover": 0.02
      },
      "rootP": {
        "frac": 0.2,
        "LAITarget": 10,
        "efficiency": 0.7
      },
      "litterfall": {
        "f0": 0.0015,
        "f1": 0.03,
        "tm": 2,
        "n": 2.5
      }
    },
    "seedlingTree": {
      "k": 0.5,
      "fullCanAge": 1.5,
      "kG": 0.5,
      "alpha": 0.08,
      "fT": {
        "mn": 0,
        "opt": 20,
        "mx": 50
      },
      "BLcond": 0.04,
      "fAge": {
        "f0": 1,
        "f1": 0,
        "tm": 47.5,
        "n": 3.5
      },
      "fN0": 0.26,
      "SLA": {
        "f0": 19,
        "f1": 10.8,
        "tm": 5,
        "n": 2
      },
      "Conductance": {
        "mn": 0.0001,
        "mx": 0.02,
        "lai": 2.6
      },
      "Intcptn": {
        "mn": 0,
        "mx": 0.24,
        "lai": 7.3
      },
      "y": 0.47,
      "pfs": {
        "stemCnt": 1,
        "stemC": 0.18,
        "stemP": 2.4,
        "pfsMx": 2,
        "pfsP": -0.772,
        "pfsC": 1.3
      },
      "pR": {
        "mn": 0.17,
        "mx": 0.7,
        "m0": 0.5,
        "turnover": 0.02
      },
      "rootP": {
        "LAITarget": 10,
        "efficiency": 0.6,
        "frac": 0.01
      },
      "litterfall": {
        "f0": 0.0015,
        "f1": 0.03,
        "tm": 2,
        "n": 2.5
      },
      "stemsPerStump": 1
    }
  }
};

module.exports = config;

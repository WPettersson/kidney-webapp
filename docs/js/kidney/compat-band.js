function CompatBand(lowPra, highPra, intercept, multiplier = 0, isNDDCost = 1) {
  this.lowPra = +lowPra; // Convert to number with +
  this.highPra = +highPra;
  this.isNDDCost = +isNDDCost;
  if (intercept == "SPLIT") {
    this.internalProb = parseProbBands(multiplier);
  } else {
    this.intercept = +intercept;
    this.multiplier = +multiplier;
  }
}

function ProbBand(probability, lowProb, highProb) {
  this.prob = probability;
  this.lowProb = lowProb;
  this.highProb = highProb;
}

function parseProbBands(s) {
  var bandStrings = s.split(/,/g);
  var retVal = [];
  for (var i=0; i<bandStrings.length; i++) {
    var bandString = bandStrings[i];
    if (bandString) {
      var tokens = bandString.split(/-/);
      // probability, lowProb, highProb
      if (!tokens[2]) {
        tokens[2] = tokens[1];
      }
      retVal.push(new ProbBand(+tokens[0], +tokens[1], +tokens[2]));
    }
  }
  return retVal;
}

function NDDBand(prob, compatLow, compatHigh) {
  this.prob = +prob; // Convert to number with +
  this.compatLow = +compatLow;
  this.compatHigh = +compatHigh;
}

NDDBand.prototype.toString = function () {
  return "[" + this.prob + ", " + this.compatLow + ", " + this.compatHigh + "]"
}

function NDDBands(bandString) {
  var bandStrings = bandString.split(/\r\n|\r|\n/g);
  this.bands = [];
  for (var i=0; i<bandStrings.length; i++) {
    var bandString = bandStrings[i];
    if (bandString) {
      var tokens = bandString.split(/ +/);
      // probability, lowProb, highProb
      if (!tokens[2]) {
        tokens[2] = tokens[1];
      }
      this.bands.push(new NDDBand(+tokens[0], +tokens[1], +tokens[2]));
    }
  }
}

NDDBands.prototype.getAdjustment = function() {
  var r = Math.random();
  var adj = 1;
  var cumulativePraProb = 0;
  for (var i = 0; i < this.bands.length; i++) {
    var band = this.bands[i]
    cumulativePraProb += band.prob;
    if (r <= cumulativePraProb || (i === band.length - 1)) {
      var r2 = Math.random();
      adj = band.compatLow + r2 * (band.compatHigh - band.compatLow)
      break;
    }
  }
  return adj;
}

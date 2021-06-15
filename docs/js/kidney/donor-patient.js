function Patient(id) {
  this.id = id;
}

Patient.prototype.compatibleWith = function(donor) {
  return this.bt.compatibleWith(donor.bt)
        && !this.positiveCrossMatch(donor);
}

Patient.prototype.positiveCrossMatch = function(donor) {
  var prob;
  if (this.probCompat) {
    prob = this.probCompat;
  } else if (this.compatBand.internalProb) {
    // Draw a new probability that this recipient will be compatible with a
    // donor. This probability will be constant, but only indirectly related to
    // the PRA through this internalProb band.
    var r = Math.random();
    var cumulativeProb = 0;
    var i = -1;
    while ( cumulativeProb < r ) {
      if (cumulativeProb > 1) {
        throw new Error("Cumulative probability too high in positiveCrossMatch()");
      }
      i += 1;
      if (i >= this.compatBand.internalProb.length) {
        throw new Error("Past end of internal prob bands at " + i);
      }
      cumulativeProb += this.compatBand.internalProb[i].prob;
    }
    var band = this.compatBand.internalProb[i];
    if (band.highProb) {
      r = Math.random();
      this.probCompat = band.lowProb + r * (band.highProb - band.lowProb);
    } else {
      this.probCompat = band.highProb;
    }
    prob = this.probCompat;
  } else {
    prob = (this.compatBand.intercept + this.compatBand.multiplier * this.crf);
  }
  if (donor.isAltruistic && donor.probAdjustmentNDD) {
    prob *= donor.probAdjustmentNDD;
  }
  if (prob > 1) {
    var res = "";
    if (this.compatBand.internalProb) {
      res = "internal prob = " + this.probCompat;
    } else {
      res = "int = " + this.compatBand.intercept + " and multiplier = " + this.compatBand.multiplier;
    }
    throw new Error("Have prob = " + prob + " when " + res + " and PRA = " + this.crf + " and NDD cost = " + donor.probAdjustmentNDD);
  }
  return Math.random() <= prob;
}

function Donor(id, dage, bt, isAltruistic) {
  this.id = id;
  this.dage = dage;
  this.bt = bt;
  this.isAltruistic = isAltruistic;
  this.sources = [];
  this.matches = [];
}
Donor.prototype.addSource = function(source) {
  this.sources.push(source);
}
Donor.prototype.hasSource = function(source) {
  return this.sources.indexOf(source) !== -1;
}
Donor.prototype.addMatch = function(match) {
  this.matches.push(match);
}

function DPPair(id) {
  this.id = id;
}

function PatientLookup() {
  this.lookup = [];
}

PatientLookup.prototype.getOrCreate = function(id) {
  if (this.lookup[id]===undefined) {
    var newPatient = new Patient(id);
    this.lookup[id] = newPatient;
    return newPatient;
  } else {
    return this.lookup[id];
  }
};
